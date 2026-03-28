import { expect, test, type Page } from '@playwright/test';

const installLinkName = /Install Hagicode Desktop|Open Desktop page/i;
const artifactUrlPattern =
  /desktop\.dl\.hagicode\.com\/.+\/Hagicode\.Desktop(?:\.Setup)?(?:[.-].+)?\.(zip|exe|dmg|appimage)$/i;
const artifactNamePattern =
  /Hagicode\.Desktop(?:\.Setup)?(?:[.-].+)?\.(zip|exe|dmg|appimage)$/i;
const desktopPagePattern = /\/desktop\/?$/i;

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

test.describe('Hagicode 官网下载入口', () => {
  test('可在菜单栏找到软件下载按钮并触发下载', async ({ page }) => {
    await gotoWithRetry(page, '/');

    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    const installLink = header.getByRole('link', { name: installLinkName }).first();
    await expect(installLink).toBeVisible();

    await expect
      .poll(async () => installLink.getAttribute('href'), {
        message: '菜单栏下载按钮应解析为安装包链接或下载页链接',
      })
      .toMatch(/desktop\.dl\.hagicode\.com|\/desktop\/?$/i);

    const href = await installLink.evaluate((node) => (node as HTMLAnchorElement).href);
    expect(href).toMatch(/desktop\.dl\.hagicode\.com|\/desktop\/?$/i);

    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 }).catch(() => null);
    const navigationPromise = page.waitForURL(desktopPagePattern, { timeout: 10_000 }).catch(() => null);

    await installLink.click();

    const download = await downloadPromise;
    if (download) {
      expect(download.url()).toMatch(artifactUrlPattern);
      expect(download.suggestedFilename()).toMatch(artifactNamePattern);
      expect(await download.failure()).toBeNull();
      expect(await download.path()).toBeTruthy();
      return;
    }

    await navigationPromise;
    await expect(page).toHaveURL(desktopPagePattern);
    await expect(page.getByRole('heading', { name: /Hagicode Desktop/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Download Installer/i }).or(page.getByRole('link', { name: /Go to download page/i })),
    ).toBeVisible();
  });
});
