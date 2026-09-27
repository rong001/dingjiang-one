# GitHub Pages 持续发布

## 发布内容

站点是静态前端，入口为 `dist/index.html`。资源使用相对路径，页面使用 hash 路由，适合 GitHub Pages 的 `/<repository>/` 项目路径。工作流只上传 `dist/`，不上传 README、研究文档、本地工具或宿主平台配置。

默认分支为 `main`。推送到 `main` 或在 Actions 中手动运行 **Deploy GitHub Pages** 时，会检查入口和业务 JavaScript 语法，然后上传并发布静态文件。

## 首次设置

1. 在有权管理的 GitHub 账户中创建专用仓库，例如 `dingjiang-one`。GitHub Free 的 Pages 使用公开仓库；公开仓库只应包含本项目交付内容。
2. 提交 `dist/`、README、`docs/`、`.gitignore` 和 `.github/workflows/pages.yml`。
3. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
4. 推送 `main`，查看 **Actions → Deploy GitHub Pages**。
5. 等待绿色完成状态，打开 `github-pages` 环境的 URL，确认首页、主题、场景切换及业务操作正常。

工作流使用 GitHub 自动提供的工作流身份，以及 `contents: read`、`pages: write`、`id-token: write` 权限。无需创建或存储部署用 PAT，也不要把账号凭据放进站点源码。发布触发器不接受外部 pull request 自动部署。

## 从已有 Sites 项目发布

保留已有 `origin`，使用独立名称 `github` 添加 GitHub remote，避免覆盖另一托管服务的远端配置。

本项目原始仓库已经跟踪过 `.openai/hosting.json`；加入 `.gitignore` 不会移除已跟踪文件或历史记录。面向 GitHub 的公开交付可建立干净的发布仓库，仅复制上面列出的交付内容，再推送。这样可以保留本地 Sites 配置，同时不公开不必要的平台标识。

## 地址与持续维护

项目站点地址通常为：

```text
https://<owner>.github.io/<repository>/
```

以成功工作流输出的 `page_url` 为准，不使用未经部署验证的猜测地址。只要仓库与 Pages 配置维持可用，该地址可持续访问；它不受本地开发服务器运行时长影响，但不是不可撤销的托管承诺。

后续更新继续推送 `main` 即可。部署并发队列按顺序完成，避免在正在发布时取消任务。新增静态资源必须包含在 `dist/` 中。若引入构建工具，应在上传前增加构建步骤，最终产物仍输出到 `dist/`。

## 验证

- 页面资源返回成功，无控制台错误或缺失脚本。
- 三套场景都可打开，订单、采购、工单和凭证非空。
- 三种主题、两种密度切换后刷新仍保留偏好。
- 在一个场景处理订单，切换到另一个场景再回来，记录相互独立。
- 订单审核、发货扣库、结算入账；采购审批、收货加库存；工单推进均符合状态约束。
- 页面刷新保留当前浏览器记录，手机和另一浏览器使用自己的独立账套。

GitHub Pages 不提供服务端数据库或认证，不能据此对外宣称已具备企业生产后端。

## 官方依据

- [配置 Pages 发布源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [自定义 GitHub Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Pages 站点类型与 URL](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
