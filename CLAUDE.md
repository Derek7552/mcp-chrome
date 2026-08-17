# Chrome MCP Server

让 AI 通过 MCP 控制你的 Chrome 浏览器（自动化、内容分析、语义搜索）。扩展直接复用日常 Chrome（登录态、配置），不需要独立浏览器进程。

## Monorepo 结构（新代码放这里）

pnpm workspace（lockfile 由 pnpm 8 生成，安装统一用 `npx pnpm@8`）

| 路径                    | 包                    | 角色                                                     |
| ----------------------- | --------------------- | -------------------------------------------------------- |
| `app/chrome-extension/` | chrome-mcp-server-pro | WXT + Vue 3 的 MV3 扩展（popup / sidepanel / offscreen） |
| `app/native-server/`    | mcp-chrome-bridge     | Node + Fastify Native Messaging host，MCP server         |
| `packages/shared/`      | chrome-mcp-shared     | 跨端共享 TS 类型 / 工具                                  |
| `packages/wasm-simd/`   | @chrome-mcp/wasm-simd | SIMD 向量加速（语义搜索）                                |

新代码按职责进对应子包，公共类型进 `packages/shared`。

## 构建 / 开发必读（本仓库踩过的坑）

- **`chrome-mcp-shared` 需先构建**：其 `main`/`types` 指向 `dist/`，任何 `tsc` / `wxt build` 之前先 `pnpm --filter chrome-mcp-shared build`，否则报 `Cannot find module 'chrome-mcp-shared'`。
- **pnpm 8 匹配 lockfile**：lockfileVersion 6.0，系统 pnpm 9 的 `--frozen-lockfile` 会拒绝；统一用 `npx pnpm@8 install --frozen-lockfile`。
- **native-server postinstall 依赖 dist/**：首次 install 报 `ELIFECYCLE`（找不到 `dist/scripts/postinstall.js`），但 node_modules 已链好，可忽略。
- **RTK hook 干扰命令输出**：本机 RTK 代理会吞掉 `pnpm` / `wxt` / `tsc` 在后台或管道下的输出；诊断用 `rtk proxy <cmd>` 拿真实退出码与日志。
- **MCP 多连接**：`@modelcontextprotocol/sdk` 每个 `Server` 实例只能连一个 transport；`native-server/src/mcp/mcp-server.ts` 的 `createMcpServer()` 是工厂（每连接新建实例），勿改回单例。
- **native-server 打包不能用 `workspace:*` 依赖**：`chrome-mcp-shared` 若声明 `workspace:*` 会随 `npm pack` 打进 tgz，npm 无法解析（`npm install -g` 静默失败）。必须用 registry 可解析版本（当前 `1.0.1`）；发布前验证 tgz 可安装。

## 发布（版本必须一致）

- 扩展版本 = `app/chrome-extension/package.json` 的 `version`，wxt 从它生成 manifest version。改版本后必须重新 `wxt zip` 再上传 release。
- 当前版本线 **1.1.1**（扩展 / native-server / 根 package.json 对齐）；`packages/shared`（1.0.1）、`packages/wasm-simd`（0.1.0）独立版本。
- 打包：`cd app/chrome-extension && wxt zip` → `.output/chrome-mcp-server-pro-<ver>-chrome.zip`。
- 扩展 ID 恒定：manifest 固定公钥（`wxt.config.ts` 的 `EXTENSION_KEY`）决定 ID = `chdmlehgmfaiegppnpehheogfpmigkkj`，与 `native-server` `constant.ts` 的 `EXTENSION_ID` 保持一致（推导：sha256(DER 公钥) 前 16 字节 → hex → 每位 `0-f` 映射到 `a-p`）。
- native-server 发布：改代码后 `cd app/native-server && npm run build && npm pack` 重建 `mcp-chrome-bridge-<ver>.tgz` → 同步 `releases/native-server/` → `gh release upload v<ver> releases/native-server/<tgz> --clobber` 重传 release 资产（derek-plugin 的 `update` 从 release 安装，资产不同步会让本机装到旧包）。

## 文档指针

- 架构：[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 工具清单：[docs/TOOLS.md](docs/TOOLS.md)
- 疑难排查：[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- 贡献：[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- 版本历史：[docs/CHANGELOG.md](docs/CHANGELOG.md)

## 工作风格

- 功能开发在独立 worktree 完成，提交后开 PR；合并后清理 worktree / 分支。
