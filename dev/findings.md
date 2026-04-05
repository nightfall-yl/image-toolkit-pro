# Findings

## Source Plugins
- `oz-clear-unused-images-obsidian-1.1.1`
- `obsidian-local-images-plus-0.16.4`

## Notes
- `oz-clear-unused-images` 的核心能力分成四块：
  - `src/main.ts`：注册命令、可选 ribbon 图标、触发清理流程。
  - `src/util.ts`：扫描 vault 中所有附件、从 `resolvedLinks` / frontmatter / canvas / 手工链接扫描得到已使用附件集合，并执行删除。
  - `src/linkDetector.ts`：补充解析 wiki link / markdown link / transclusion。
  - `src/modals.ts`：删除完成后的日志弹窗。
- `local-images-plus` 当前已有 ribbon 图标，但用途是“本地化当前页面附件”，图标为 `dice`。
- `local-images-plus` 当前已有“Remove all orphaned attachments”命令，但逻辑是从某个附件目录里找“没有被当前扫描到的文件名”，不等同于全 vault 的“unused attachments”扫描。
- `local-images-plus` 设置项中已存在：
  - `ExcludedFoldersList` / `ExcludedFoldersListRegexp`：用于排除自动处理目录。
  - `removeOrphansCompl`：控制孤儿附件是否永久删除。
  - `showNotifications`：基础通知。
- 计划中的整合方向：
  - 保留 `local-images-plus` 现有 orphan 清理逻辑，不替换。
  - 新增一套“clear unused attachments”逻辑，直接移植并适配到 `local-images-plus`。
  - 新增功能区按钮，点击后触发“Clear Unused Images”。
  - 尽量复用现有设置页，但需要补充 `deleteOption` / `logsModal` / `excludeSubfolders` / ribbon 开关或直接常驻 ribbon。

## Implementation Results
- 已在 `obsidian-local-images-plus-0.16.4/src/main.ts` 中新增：
  - `clear-unused-images`
  - `clear-unused-attachments`
  - `refreshRibbonIcons()`
  - `clearUnusedAttachments()`
- 已新增源码模块：
  - `src/clearUnusedUtils.ts`
  - `src/clearUnusedLinkDetector.ts`
  - `src/clearUnusedModal.ts`
- 已在设置页补充：
  - 清理 ribbon 开关
  - 删除目标
  - 删除日志弹窗
  - 清理时递归排除子目录
- 已确认构建产物 `obsidian_local_images_plus_latest/main.js` 中包含：
  - `clear-unused-images`
  - `Clear Unused Images`
  - `clearUnusedDeleteOption`
  - `image-file` ribbon 图标注册

## Verification Notes
- `npm install` 后，`npm run build` 成功生成新的 `main.js`。
- 项目原本就存在一批旧的 TypeScript 类型警告，`tsc --noEmit` 仍然会失败，但失败点集中在原插件旧代码与旧 typings 的兼容问题，不是本次新增模块独有的问题。
- `rollup.config.js` 中的 `cp -u` 在 macOS 不兼容，因此构建后手动同步了 `styles.css` 到产物目录。
