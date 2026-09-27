# 发布前检查记录

检查日期：2026-09-27。此记录为当时工作树的检查快照，不代替后续改动后的最终发布验证。

## 凭据检查

对仓库工作树的 JavaScript、JSON、Markdown、YAML、CSS、HTML、文本及常见凭据文件扩展进行模式扫描，并检查敏感文件名。扫描器仅输出文件位置和匹配类型，不输出任何凭据内容。

- 未命中 GitHub token、OpenAI key、AWS access key ID、私钥 PEM 头、URL 内嵌用户名密码或常见凭据赋值模式。
- 未发现 `.env`、`.pem`、`.key`、`id_rsa`、`id_ed25519` 或凭据文件名。
- 对 Git 可达历史中的 9 个文本 blob 复查主要密钥模式，未命中。
- `.openai/hosting.json` 已存在于历史跟踪中；它属于宿主托管平台元数据，应从 GitHub 的公开交付范围排除。`.gitignore` 不会移除已跟踪文件或历史。

这些结果表示未发现所检查的常见模式，不是对所有可能秘密的穷尽证明。发布 GitHub 时建议只复制明确列出的交付文件到干净仓库。

## 资产体积

当时 `dist/` 共 17 个文件，总计 **6,898,886 字节（约 6.58 MiB）**。以下为主要体积来源：

| 资产 | 字节 | 说明 |
| --- | ---: | --- |
| `assets/ui-midnight.png` | 1,469,920 | 深海主题预览 |
| `assets/ui-indigo.png` | 1,349,550 | 靛蓝主题预览 |
| `assets/ui-graphite.png` | 1,317,596 | 石墨主题预览 |
| `vendor/echarts.min.js` | 1,034,102 | 图表库 |
| `assets/logo.png` | 914,017 | 品牌图形 |
| `vendor/fonts/tabler-icons.woff2` | 462,200 | 图标字体 |
| `vendor/tabler-icons.min.css` | 211,022 | 图标样式 |

三张主题预览图合计约 3.95 MiB。Logo 原始文件约 0.87 MiB，对导航中的小尺寸图形偏大。可在后续优化中压缩 PNG / 转换现代图片格式或延迟加载主题预览；本次检查没有修改资产。

图表库保留 Apache 2.0 许可头，图标库随附 `TABLER-LICENSE.txt`。当时未见 ECharts 的独立 LICENSE / NOTICE 文件；公开分发时应核对完整许可文件清单。

## 本次范围

以上为初次检查快照，后续修复和实际发布结果见下方最终补充检查。

## 最终补充检查

- 已附带 ECHARTS-LICENSE.txt 和 ECHARTS-NOTICE.txt。
- 业务测试 30 / 30 通过，视觉验收 passed，浏览器控制台无 error / warn。
- GitHub 发布副本使用全新历史，仅包含 dist、docs、.github、README 与 .gitignore，不包含宿主元数据。
- 当前发布状态：2026-09-27 已部署至 [GitHub Pages](https://rong001.github.io/dingjiang-one/)，[首次成功发布记录](https://github.com/rong001/dingjiang-one/actions/runs/36291559038)。公开地址 HTTP 200，包含场景和完整工作空间模块。
- 三个主题缩略图已替换为经过验收的真实浏览器截图，主题选择与实际界面一致。
- 最终 `dist/` 共 21 个文件，3,192,993 字节（约 3.05 MiB）；许可文件已补齐。
