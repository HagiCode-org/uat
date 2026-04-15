# HagiCode UAT

HagiCode 的用户验收测试仓库。

当前首条验收用例：

- 进入 `https://hagicode.com`
- 在顶部菜单栏定位首页 header 的分段式 Desktop 下载控件
- 校验控件包含主下载动作和独立的版本/来源下拉开关
- 打开下拉菜单并确认至少存在一个可执行的备用下载或回退入口
- 点击主下载动作后，接受以下任一结果：
  - 直接触发 Hagicode Desktop 安装包下载
  - 跳转到官网 `Desktop` 页面或 `Index` 版本历史页作为回退

该用例需要与 `repos/site/src/components/home/InstallButton.tsx` 的当前实现保持对齐；如果官网下载控件结构、菜单语义或回退策略发生变化，UAT 断言也要同步更新。

## 本地运行

```bash
npm install
npm run playwright:install
npm run test
```

只运行首页下载场景：

```bash
npm test -- tests/site-download.spec.ts --project=chromium
```

## 环境变量

- `UAT_BASE_URL`：被测地址，默认 `https://hagicode.com`

## 当前假设

- 默认目标站点是英文首页 `https://hagicode.com`
- Header 下载控件使用 `data-action-group="segmented"`、独立 toggle 按钮和 `role="menu"` 菜单语义
- 合法主动作结果包括直接下载，或回退到 `/desktop/` / `https://index.hagicode.com/desktop/history/`
- GitHub 主下载在浏览器侧可能重定向到 `release-assets.githubusercontent.com`，这仍属于合法桌面包下载结果
- 菜单中的可执行入口至少要提供一个桌面下载源或版本历史回退链接；仅有占位或容器入口不算通过
