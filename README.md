# Image Toolkit Pro

> 图片管理工具

`Image Toolkit Pro` 是一个面向 Obsidian 桌面端的图片与附件管理插件。它把图片本地化、附件清理和图片预览交互整合到一个插件里，适合长期维护 Obsidian 笔记中的媒体资源。

## 插件定位

它主要解决三类问题：

- 外部图片太多：把网页、Markdown、HTML、Word/OpenOffice 等来源的图片下载到本地 vault
- 附件越来越乱：按规则保存、命名、去重、整理附件
- 图片交互不顺手：提供清理、预览、右键操作、拖拽缩放等增强功能

## 核心能力

### 1. 图片本地化

- 下载网页图片和其他可识别附件到本地
- 处理复制、粘贴、拖拽进入 Obsidian 的外部媒体
- 支持将 `file://` 本地文件复制到附件目录
- 支持将 Markdown 中的远程链接下载到本地
- 支持保存 base64 图片

### 2. 附件整理

- 支持 Obsidian 默认附件目录、自定义根目录、笔记旁边专属目录三种保存方式
- 支持相对路径、完整路径、仅文件名三种链接写法
- 支持新附件使用时间命名：`YYYYMMDD-HHmmss-随机6位`
- 保留去重能力，避免生成重复附件
- 可选择保留原始文件名或打开文件标签

### 3. 图片压缩

- 支持压缩网页图片与本地粘贴图片
- 支持输出为 `jpeg` / `webp`
- 支持自定义压缩质量

### 4. 附件清理

- 清理整个 vault 中未被引用的图片
- 清理整个 vault 中未被引用的附件
- 清理当前笔记附件目录中的未关联附件
- 支持移动到 Obsidian 回收站、系统回收站，或直接永久删除
- 左侧 `Ribbon` 提供未使用图片清理快捷入口

### 5. 图片预览与交互增强

- 图片右键菜单：复制、打开、定位、重命名、移动、删除
- 支持拖拽缩放图片与视频
- 支持单击预览图片，再次单击关闭预览
- 支持在导航中定位并高亮文件

## 本次整合升级

当前版本在 `obsidian-local-images-plus` 基础上做了完整整合与重构，主要包括：

- 整合 `oz-clear-unused-images-obsidian` 的清理能力
- 整合 `AttachFlow` 的图片交互与预览能力
- 设置页重构为顶部导航布局：
  - `通用`
  - `图片本地化`
  - `图片清理`
  - `图片预览`
- 新增设置页语言切换：`简体中文 / English`
- 保留命令面板作为完整入口
- 保留左侧清理 `Ribbon` 作为高频快捷入口
- 完成大量中文化、交互统一和 UI 调整

## 命令说明

命令面板中的命令名称统一使用英文。

### 本地化相关

- `Localize attachments for the current note (plugin folder)`
  - 处理当前笔记，并按插件设置的附件目录规则保存文件

- `Localize attachments for the current note (Obsidian folder)`
  - 处理当前笔记，并按 Obsidian 自带附件目录规则保存文件

- `Localize attachments for all your notes (plugin folder)`
  - 批量处理整个 vault 中符合规则的笔记

- `Convert selection to URI`
  - 将当前选区转换为 URI 形式

- `Convert selection from html to markdown`
  - 将选中的 HTML 转换为 Markdown

- `Set the first found # header as a note name.`
  - 用笔记中第一个一级标题作为笔记名

### 清理相关

- `Clear Unused Images in Vault`
  - 中文含义：清理库中未使用图片

- `Clear Unused Attachments in Vault`
  - 中文含义：清理库中未使用附件

- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)`
  - 中文含义：清理当前笔记附件目录中的未关联附件
  - 仅在“保存在笔记旁边的指定文件夹”模式下可用，且目录模板必须以 `${notename}` 结尾、不能包含 `${date}`

### 图片预览相关

- `Delete Current Note and Its Attachments`
  - 删除当前笔记，并按规则处理仅被该笔记引用的附件

## Ribbon 说明

插件提供一个左侧 `Ribbon` 清理按钮：

- 中文界面：`清理未使用图片`
- 其他界面：`Clear unused images`

点击后执行：

- `Clear Unused Images in Vault`

它是高频清理动作的快捷入口，不替代命令面板。  
更完整的清理操作仍建议通过命令面板执行。

## 设置概览

### 通用

- 设置页语言
- 处理通知
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

| 格式 | 网页复制 / 下载识别 | 保存到本地 | 作为“未使用图片”清理 | 可作为压缩输出 |
|---|---|---:|---:|---:|
| `jpg` / `jpeg` | 支持 | 支持 | 支持 | 否 |
| `png` | 支持 | 支持 | 支持 | 是，可转为 `jpeg` / `webp` |
| `gif` | 支持 | 支持 | 支持 | 否 |
| `svg` | 支持 | 支持 | 支持 | 否 |
| `bmp` | 支持 | 支持 | 支持 | 否 |
| `webp` | 支持 | 支持 | 支持 | 是 |
| `avif` | 支持 | 支持 | 支持 | 否 |

补充说明：

- 下载 / 保存附件时，插件会根据二进制内容和链接路径判断扩展名，因此 `webp` 与 `avif` 都可以正常识别并保存
- 图片压缩目前主要针对 `png` 生效
- `webp` 和 `avif` 当前支持保存与清理，但不会再次转码为其他格式

## 安装方式

1. 打开 Obsidian vault
2. 进入 `.obsidian/plugins/`
3. 将插件目录放入其中
4. 重启 Obsidian
5. 在“社区插件”中启用 `Image Toolkit Pro`

## 当前版本信息

- 插件名：`Image Toolkit Pro`
- 中文名称：`图片管理工具`
- 插件 ID：`image-toolkit-pro`
- 版本：`2026.4`
- 最低 Obsidian 版本：`1.0.3`
- 平台限制：仅桌面端

## 使用建议

### 批量操作前建议备份

以下操作可能批量修改笔记或附件：

- 处理整个 vault
- 清理未使用附件
- 清理未关联附件
- 批量改写链接

建议在执行前先备份 vault。

### 清理命令的区别

- `Clear Unused Images in Vault`
  - 面向整个 vault，根据引用关系扫描未使用图片

- `Clear Unused Attachments in Vault`
  - 面向整个 vault，根据引用关系扫描未使用附件

- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)`
  - 面向当前笔记附件目录
  - 仅在指定模式和目录模板下可用

### 已知兼容性提示

原项目已知与以下插件可能存在兼容问题：

- `Paste Image Rename`
- `Pretty BibTex`

## 项目来源与致谢

本插件基于 `obsidian-local-images-plus` 扩展，并进一步整合了 `clear-unused-images` 与 `AttachFlow` 的核心能力。

感谢以下项目与贡献者：

- [Sergei-Korneev/obsidian-local-images-plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)
- [aleksey-rezvov/obsidian-local-images](https://github.com/aleksey-rezvov/obsidian-local-images)
- [niekcandaele/obsidian-local-images](https://github.com/niekcandaele/obsidian-local-images)
- [ozntel/oz-clear-unused-images-obsidian](https://github.com/ozntel/oz-clear-unused-images-obsidian)
- [elf004-star/Obsidian-AttachFlow](https://github.com/elf004-star/Obsidian-AttachFlow)
- [Yaozhuwa/AttachFlow](https://github.com/Yaozhuwa/AttachFlow)

## 许可证

使用本插件即表示你接受项目许可证条款。许可证文件见：

- `LICENSE`
