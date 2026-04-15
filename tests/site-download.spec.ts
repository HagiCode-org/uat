import { expect, test, type Download, type Locator, type Page } from '@playwright/test';

const segmentedControlSelector = '[data-action-group="segmented"]';
const primaryActionGroupSelector = '[data-segment-role="primary-actions"]';
const primaryActionLinkSelector = `${primaryActionGroupSelector} a[href]`;
const toggleSelector = '[data-segment-role="toggle"][aria-haspopup="menu"]';
const menuItemSelector = '[role="menuitem"][href]';

const toggleButtonNamePattern = /Choose other versions|选择其他版本/i;
const menuNamePattern = /Choose download version|选择下载版本/i;
const relativeDesktopPagePattern = /^\/(?:en\/|zh-CN\/)?desktop\/?$/i;
const desktopPagePattern = /^https?:\/\/[^/]+\/(?:en\/|zh-CN\/)?desktop\/?$/i;
const desktopHistoryPattern = /^https?:\/\/index\.hagicode\.com\/desktop\/history\/?$/i;
const artifactHrefPattern =
  /^https?:\/\/(?:desktop\.dl\.hagicode\.com\/.+\/Hagicode\.Desktop(?:\.Setup)?(?:[.-].+)?\.(?:zip|exe|dmg|appimage)|github\.com\/.+\/releases\/download\/.+\/Hagicode\.Desktop(?:\.Setup)?(?:[.-].+)?\.(?:zip|exe|dmg|appimage))$/i;
const artifactNamePattern =
  /Hagicode\.Desktop(?:\.Setup)?(?:[.-].+)?\.(zip|exe|dmg|appimage)$/i;
const desktopContentPattern = /Hagicode Desktop|Download Installer|下载安装包|Go to download page|前往下载页面/i;
const versionHistoryHeadingPattern = /Desktop 版本历史|Desktop History|Version History/i;
const versionHistoryContentPattern = /HagiCode Desktop 版本历史|Desktop History|Version History/i;

function isAcceptedArtifactUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host === 'desktop.dl.hagicode.com' || host === 'github.com') {
      return artifactHrefPattern.test(url);
    }

    if (host === 'release-assets.githubusercontent.com') {
      const disposition = parsed.searchParams.get('response-content-disposition') ?? parsed.searchParams.get('rscd') ?? '';
      return artifactNamePattern.test(decodeURIComponent(disposition));
    }

    return false;
  } catch {
    return false;
  }
}

function isAcceptedPrimaryTarget(href: string | null): boolean {
  if (!href) {
    return false;
  }

  return artifactHrefPattern.test(href)
    || relativeDesktopPagePattern.test(href)
    || desktopPagePattern.test(href)
    || desktopHistoryPattern.test(href);
}

function isAcceptedFallbackUrl(url: string): boolean {
  return desktopPagePattern.test(url) || desktopHistoryPattern.test(url);
}

async function gotoWithRetry(page: Page, url: string): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 3) {
        throw error;
      }

      await page.waitForTimeout(1_500 * attempt);
    }
  }

  throw lastError;
}

async function locateHeaderDownloadControl(page: Page): Promise<{
  control: Locator;
  primaryAction: Locator;
  toggle: Locator;
}> {
  const header = page.locator('header').first();
  await expect(header).toBeVisible();

  const control = header.locator(segmentedControlSelector).first();
  await expect(control).toBeVisible();

  const toggle = control.locator(toggleSelector).first();
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-haspopup', 'menu');
  await expect(toggle).toHaveAttribute('aria-label', toggleButtonNamePattern);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  const primaryActionGroup = control.locator(primaryActionGroupSelector);
  const groupedPrimaryActions = primaryActionGroup.locator('a[href]');
  const groupedPrimaryCount = await groupedPrimaryActions.count();
  if (groupedPrimaryCount > 0) {
    await expect(primaryActionGroup).toBeVisible();
  }

  const primaryAction = groupedPrimaryCount > 0 ? groupedPrimaryActions.first() : control.locator('a[href]').first();
  await expect(primaryAction).toBeVisible();
  await expect
    .poll(async () => {
      const href = await primaryAction.getAttribute('href');
      return isAcceptedPrimaryTarget(href);
    }, {
      message: '首页 header 主下载动作应指向桌面端安装包或支持的回退页',
    })
    .toBe(true);

  return { control, primaryAction, toggle };
}

async function assertDownload(download: Download): Promise<void> {
  expect(isAcceptedArtifactUrl(download.url())).toBe(true);
  expect(download.suggestedFilename()).toMatch(artifactNamePattern);
  expect(await download.failure()).toBeNull();
  expect(await download.path()).toBeTruthy();
}

async function assertFallbackPage(page: Page): Promise<void> {
  const currentUrl = page.url();
  expect(isAcceptedFallbackUrl(currentUrl)).toBe(true);

  if (desktopPagePattern.test(currentUrl)) {
    await expect(page.getByRole('heading', { name: /Hagicode Desktop/i })).toBeVisible();
    await expect(page.getByText(desktopContentPattern).first()).toBeVisible();
    return;
  }

  await expect(page.getByRole('heading', { name: versionHistoryHeadingPattern })).toBeVisible();
  await expect(page.getByText(versionHistoryContentPattern).first()).toBeVisible();
}

async function waitForPrimaryOutcome(page: Page, primaryAction: Locator): Promise<void> {
  const downloadPromise = page.waitForEvent('download', { timeout: 12_000 }).catch(() => null);
  const navigationPromise = page
    .waitForURL((url) => isAcceptedFallbackUrl(url.toString()), { timeout: 12_000 })
    .then(() => true)
    .catch(() => false);

  await primaryAction.click();

  const download = await downloadPromise;
  if (download) {
    await assertDownload(download);
    return;
  }

  const navigated = await navigationPromise;
  if (navigated || isAcceptedFallbackUrl(page.url())) {
    await assertFallbackPage(page);
    return;
  }

  throw new Error(`Primary action did not trigger a desktop download or a supported fallback page. Current URL: ${page.url()}`);
}

async function findSupportedMenuAction(menu: Locator): Promise<{ item: Locator; href: string } | null> {
  const items = menu.locator(menuItemSelector);
  const count = await items.count();

  for (let index = 0; index < count; index += 1) {
    const item = items.nth(index);
    const href = await item.getAttribute('href');
    if (href && isAcceptedPrimaryTarget(href)) {
      return { item, href };
    }
  }

  return null;
}

async function assertDropdownActions(page: Page, toggle: Locator): Promise<void> {
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  const menu = page.getByRole('menu', { name: menuNamePattern });
  await expect(menu).toBeVisible();

  await expect
    .poll(async () => {
      const supportedItem = await findSupportedMenuAction(menu);
      return Boolean(supportedItem);
    }, {
      message: '下载菜单应至少暴露一个可执行的备用下载或回退入口',
    })
    .toBe(true);

  const supportedItem = await findSupportedMenuAction(menu);
  expect(supportedItem).not.toBeNull();
  await expect(supportedItem!.item).toBeVisible();
  expect(supportedItem!.href).not.toBe('');
}

test.describe('Hagicode 官网下载入口', () => {
  test('首页 header 下载控件符合当前分段按钮契约', async ({ page }) => {
    await gotoWithRetry(page, '/');

    const { primaryAction, toggle } = await locateHeaderDownloadControl(page);

    await assertDropdownActions(page, toggle);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: menuNamePattern })).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await waitForPrimaryOutcome(page, primaryAction);
  });
});
