# HagiCode UAT

HagiCode 的用户验收测试仓库。

当前首条验收用例：

- 进入 `https://hagicode.com`
- 在顶部菜单栏找到 `Install Hagicode Desktop`
- 点击后成功触发桌面端安装包下载

## 本地运行

```bash
npm install
npm run playwright:install
npm run test
```

## 环境变量

- `UAT_BASE_URL`：被测地址，默认 `https://hagicode.com`
