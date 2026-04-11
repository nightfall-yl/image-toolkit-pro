# Image Toolkit Pro

> 图片管理工具

`Image Toolkit Pro` 是一个面向 Obsidian 桌面端的图片与附件管理插件。它把图片本地化、附件清理和图片预览交互整合到一个插件里，适合长期维护包含大量媒体资源的笔记。

## 功能概览

- 图片本地化：下载网页图片、处理粘贴 / 拖拽媒体、保存 base64 图片
- 附件整理：支持多种保存位置、链接写法、新附件时间命名与去重
- 附件清理：清理未使用图片、未使用附件、当前笔记目录中的未关联附件
- 图片交互：右键菜单、单击预览、拖拽缩放、导航定位高亮
- 图片跳转：图片导航栏或图片标签页右键菜单支持“跳转到原笔记”

## 整合内容

当前版本基于 `obsidian-local-images-plus`，并整合了：

- `oz-clear-unused-images-obsidian`
- `AttachFlow`

同时提供：

- 顶部导航式设置页：`通用 / 图片本地化 / 图片清理 / 图片预览`
- 设置页语言切换：`简体中文 / English`
- 清理 `Ribbon` 快捷入口
- 命令面板完整入口

## 常用命令

命令面板中的命令名称统一使用英文。

- `Localize attachments for the current note (plugin folder)`
- `Localize attachments for the current note (Obsidian folder)`
- `Localize attachments for all your notes (plugin folder)`
- `Clear Unused Images in Vault`
- `Clear Unused Attachments in Vault`
- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)`
- `Delete Current Note and Its Attachments`

补充说明：

- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)` 仅在“保存在笔记旁边的指定文件夹”模式下可用，且目录模板必须以 `${notename}` 结尾、不能包含 `${date}`
- 图片导航栏或图片标签页右键菜单支持：`跳转到原笔记`

## Ribbon

插件提供一个左侧清理 `Ribbon` 按钮：

- 中文界面：`清理未使用图片`
- 其他界面：`Clear unused images`

点击后执行：

- `Clear Unused Images in Vault`

## 设置页

### 通用

- 设置页语言
- 通知
- 附加命令显示控制
- 清理 Ribbon 显示控制
- 自动处理与处理间隔
- 处理新建 Markdown 文件
- 处理新建附件
- 新附件时间命名
- 开发者选项

### 图片本地化

- 下载重试次数
- 未知类型下载
- 图片压缩
- 压缩格式与质量
- 文件大小限制
- 排除扩展名
- 链接标题与原始文件名保留
- 链接路径写法
- 日期格式
- 新附件保存位置与媒体目录模板

### 图片清理

- 删除目标
- 日志弹窗
- 是否排除子文件夹
- 是否彻底删除未关联附件
- 排除文件夹列表

### 图片预览

- 附件删除去向
- 删除日志弹窗
- 是否显示“移动文件到...”
- 单击预览图片
- 预览比例
- 拖拽缩放
- 缩放步进
- 预览调试模式

## 图片格式支持

| 格式 | 识别 | 保存 | 未使用图片清理 | 压缩输出 |
|---|---|---:|---:|---:|
| `jpg` / `jpeg` | 支持 | 支持 | 支持 | 否 |
| `png` | 支持 | 支持 | 支持 | 是，可转为 `jpeg` / `webp` |
| `gif` | 支持 | 支持 | 支持 | 否 |
| `svg` | 支持 | 支持 | 支持 | 否 |
| `bmp` | 支持 | 支持 | 支持 | 否 |
| `webp` | 支持 | 支持 | 支持 | 是 |
| `avif` | 支持 | 支持 | 支持 | 否 |

补充说明：

- `webp` 与 `avif` 可以正常识别、保存与清理
- 图片压缩目前主要针对 `png`

## 安装

1. 打开 Obsidian vault
2. 进入 `.obsidian/plugins/`
3. 将插件目录放入其中
4. 重启 Obsidian
5. 在“社区插件”中启用 `Image Toolkit Pro`

## 当前版本

- 插件名：`Image Toolkit Pro`
- 中文名称：`图片管理工具`
- 插件 ID：`image-toolkit-pro`
- 版本：`26.4.2`
- 最低 Obsidian 版本：`1.0.3`
- 平台限制：仅桌面端

## 使用提示

- 批量处理、批量清理、批量改写链接前，建议先备份 vault
- `Clear Unused Images in Vault` / `Clear Unused Attachments in Vault` 面向整个 vault
- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)` 面向当前笔记附件目录

原项目已知与以下插件可能存在兼容问题：

- `Paste Image Rename`
- `Pretty BibTex`

## 致谢

本插件基于 `obsidian-local-images-plus` 扩展，并进一步整合了 `clear-unused-images` 与 `AttachFlow` 的核心能力。

- [Sergei-Korneev/obsidian-local-images-plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)
- [aleksey-rezvov/obsidian-local-images](https://github.com/aleksey-rezvov/obsidian-local-images)
- [niekcandaele/obsidian-local-images](https://github.com/niekcandaele/obsidian-local-images)
- [ozntel/oz-clear-unused-images-obsidian](https://github.com/ozntel/oz-clear-unused-images-obsidian)
- [elf004-star/Obsidian-AttachFlow](https://github.com/elf004-star/Obsidian-AttachFlow)
- [Yaozhuwa/AttachFlow](https://github.com/Yaozhuwa/AttachFlow)

## 许可证

使用本插件即表示你接受项目许可证条款。许可证文件见：

- `LICENSE`
