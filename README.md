# Image Toolkit Pro

> 图片管理工具

`Image Toolkit Pro` 是一个面向 Obsidian 的桌面端插件，也可以理解为一款“图片管理工具”，用来把笔记中的外部媒体资源本地化，并提供附件整理、清理与预览增强能力。

它适合这些场景：

- 从网页复制内容到 Obsidian 后，自动下载图片并改写链接
- 处理来自 Word / OpenOffice / HTML / Markdown 的外部媒体链接
- 将 base64 图片保存到 vault
- 按规则把附件保存到 Obsidian 默认附件目录，或保存到笔记旁边的专属目录
- 基于 MD5 为新附件命名，减少重名与重复文件
- 清理未使用图片、未使用附件，或清理未关联附件

---

## 本次升级点

当前版本不再只是原始的本地化插件，而是在 `obsidian-local-images-plus` 的基础上做了完整整合与界面升级，主要包括：

- 整合 `oz-clear-unused-images-obsidian` 的核心能力
- 新增全库级未使用文件清理命令
- 新增左侧功能区清理按钮，作为 `Clear Unused Images in Vault` 的快捷入口
- 清理按钮可在设置页中单独控制显示或隐藏
- 整合 `AttachFlow` 的核心交互能力
- 支持图片右键操作、移动文件、重命名、删除附件及对应链接
- 支持图片拖拽缩放与单击打开预览
- 优化图片预览行为：单击图片打开预览，再次单击同样可以关闭预览
- 设置页重构为顶部导航式布局，分为“通用 / 图片本地化 / 图片清理 / 图片预览 / 高级”
- 新增设置页语言切换，支持 `简体中文` 与 `English`
- 整体设置项、右键菜单、弹窗与通知文案完成中文化与统一润色
- 修复未使用图片清理对 `.avif` 的遗漏，当前可正常识别并清理 `.avif`
- 保留命令面板作为完整功能入口，同时移除旧的本地化 Ribbon，仅保留专门的清理快捷按钮
- 插件名称、ID、版本与发布目录已统一为当前项目形态：
  - 名称：`Image Toolkit Pro`
  - ID：`image-toolkit-pro`
  - 版本：`2026.3`
  - 构建输出目录：`released`

---

## 主要功能

### 1. 媒体本地化

- 下载网页图片和其他可识别附件到本地 vault
- 处理复制 / 粘贴 / 拖拽进入 Obsidian 的外部媒体
- 支持将 `file://` 本地文件复制到附件目录
- 支持将 Markdown 中的远程附件链接下载到本地
- 支持保存 base64 嵌入图片

### 2. 附件整理

- 支持将附件保存到 Obsidian 默认附件目录
- 支持将附件保存到自定义根目录
- 支持将附件保存到当前笔记旁边的专属目录
- 支持为附件生成 MD5 文件名
- 支持保留原始文件名或“Open file”链接
- 支持相对路径、完整路径、仅文件名三种写法

### 3. 图片压缩

- 支持将下载图片压缩为 JPEG / WebP
- 支持处理网页图片与本地粘贴图片
- 支持调整压缩质量

### 4. 附件清理

- 清理当前笔记附件目录中的未关联附件
  仅在使用“保存在笔记旁边的指定文件夹”且目录模板以 `${notename}` 结尾、并且不包含 `${date}` 时可用
- 清理整个 vault 中未被引用的图片
- 清理整个 vault 中未被引用的附件
- 支持将清理结果移动到 Obsidian 回收站、系统回收站，或直接永久删除
- 支持通过左侧 Ribbon 一键执行未使用图片清理

### 5. 图片预览与交互增强

- 支持图片右键菜单操作
- 支持复制图片、复制链接、复制 Markdown 链接
- 支持在系统文件管理器中显示、在外部程序中打开
- 支持重命名附件、移动附件到指定目录
- 支持删除当前链接，或删除附件及其对应链接
- 支持拖拽缩放图片和视频
- 支持单击图片打开可缩放预览，再次单击关闭预览

---

## 图片格式支持清单

当前版本对常见图片格式的支持情况如下：

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

- 下载 / 保存附件时，插件会根据二进制内容和链接路径判断扩展名，因此 `webp` 与 `avif` 都可以正常识别并保存。
- 图片压缩功能目前主要针对 `png` 生效，可转成 `jpeg` 或 `webp`。
- `webp` 和 `avif` 当前支持“保存”和“清理”，但不会被再次转码压缩成其他格式。

---

## 当前版本信息

- 插件名：`Image Toolkit Pro`
- 中文名称：`图片管理工具`
- 插件 ID：`image-toolkit-pro`
- 版本：`2026.3`
- 最低 Obsidian 版本：`1.0.3`
- 平台限制：仅桌面端

---

## 安装方式

### 方式一：手动安装

1. 打开你的 Obsidian vault
2. 进入 `.obsidian/plugins/`
3. 将插件目录放入其中
4. 重启 Obsidian
5. 在“社区插件”中启用 `Image Toolkit Pro`

建议使用当前构建产物目录：

- `released/`

### 方式二：源码构建后安装

如果你需要自行构建：

```bash
npm install
npm run build
```

构建结果会输出到：

- `released/main.js`
- `released/manifest.json`
- `released/styles.css`

---

## 如何使用

### 日常使用方式

最常见的用法是：

1. 从网页、文档或其他应用复制内容
2. 直接粘贴到 Obsidian 笔记
3. 插件根据设置自动下载媒体、保存附件并改写链接

如果你不想完全依赖自动处理，也可以通过命令面板手动执行。

其中：

- 左侧 `Ribbon` 更适合作为高频清理动作的快捷入口
- 命令面板保留完整的清理与处理命令，适合低频或进阶操作

---

## 命令列表

### 本地化相关

- `Localize attachments for the current note (plugin folder)`
  - 处理当前笔记
  - 按插件设置的附件目录规则保存文件

- `Localize attachments for the current note (Obsidian folder)`
  - 处理当前笔记
  - 使用 Obsidian 自带附件目录设置保存文件

- `Localize attachments for all your notes (plugin folder)`
  - 批量处理整个 vault 中符合规则的笔记

- `Convert selection to URI`
  - 将当前选区转换为 URI 形式

- `Convert selection from html to markdown`
  - 将选中的 HTML 转换为 Markdown

- `Set the first found # header as a note name.`
  - 用笔记中第一个一级标题作为笔记名

### 清理相关

命令面板中的命令名称统一使用英文：

- `Clear Unused Images in Vault`
  - 中文含义：清理库中未使用图片
  - 扫描整个 vault，清理未被引用的图片

- `Clear Unused Attachments in Vault`
  - 中文含义：清理库中未使用附件
  - 扫描整个 vault，清理未被引用的附件

- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)`
  - 中文含义：清理当前笔记附件目录中的未关联附件
  - 仅在“保存在笔记旁边的指定文件夹”模式下可用，且目录模板必须以 `${notename}` 结尾，不能包含 `${date}`
  - 清理当前笔记附件目录中的未关联附件

### 图片预览相关

- `Delete Current Note and Its Attachments`
  - 删除当前笔记，并按规则处理仅被该笔记引用的附件

- 图片右键菜单
  - 提供复制、打开、定位、重命名、移动、删除等交互操作

---

## Ribbon 功能区

插件提供一个左侧功能区按钮：

- 中文界面：`清理未使用图片`
- 其他界面语言：`Clear unused images`

点击后会执行：

- `Clear Unused Images in Vault`

按钮文案会跟随 Obsidian 的显示语言切换。

这个 `Ribbon` 按钮是高频清理动作的快捷入口，不替代命令面板。
如果你需要执行完整的清理功能，例如清理未使用附件或清理当前笔记附件目录中的未关联附件，请使用命令面板。

你可以在设置页中关闭或开启这个 Ribbon 图标。

---

## 设置说明

当前设置页分为以下几个区域：

### 通用

- 设置页语言切换：`简体中文 / English`
- 是否显示处理通知
- 是否隐藏附加命令
- 是否显示左侧图片清理功能区按钮
- 自动处理开关与自动处理间隔
- 是否处理新建 Markdown 文件
- 是否处理新建附件
- 是否对新附件使用 MD5 命名

### 图片本地化

- 单个附件重试次数
- 是否下载未知类型文件
- 是否压缩网页图片 / 粘贴图片
- 压缩格式与压缩质量
- 最小文件大小限制
- 排除扩展名
- 是否保留链接标题
- 是否追加原始文件名或打开文件标签
- 链接写法：完整路径 / 相对路径 / 仅文件名
- 日期格式
- 新附件保存位置
- 媒体目录模板
- 是否同步移动、删除、重命名媒体目录
- 是否跳过创建 Obsidian 默认附件目录

### 图片清理

- 未使用文件删除目标
- 是否显示清理日志弹窗
- 是否排除子文件夹
- 是否彻底删除当前笔记附件目录中的未关联附件
- 排除文件夹列表

### 图片预览

- 附件删除去向
- 是否显示删除日志弹窗
- 是否显示“移动文件到...”
- 是否启用单击预览图片
- 自适应显示比例
- 是否启用拖拽缩放图片
- 缩放步进
- 预览调试模式

### 高级

- 包含规则
- 核心调试模式

---

## 重要提示

### 1. 批量处理前建议备份

以下操作都可能批量修改你的笔记或附件：

- 处理整个 vault
- 清理未使用附件
- 清理未关联附件
- 批量改写链接

建议在执行前做好 vault 备份。

### 2. 清理命令的区别

- `Clear Unused Images in Vault`
  - 中文含义：清理库中未使用图片
  - 面向整个 vault
  - 根据引用关系扫描未使用图片

- `Clear Unused Attachments in Vault`
  - 中文含义：清理库中未使用附件
  - 面向整个 vault
  - 根据引用关系扫描未使用附件

- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)`
  - 中文含义：清理当前笔记附件目录中的未关联附件
  - 面向当前笔记的附件目录
  - 仅在“保存在笔记旁边的指定文件夹”模式下可用，且目录模板必须以 `${notename}` 结尾，不能包含 `${date}`
  - 用于清理当前笔记附件目录中的未关联附件

### 3. 大文件处理需谨慎

对于特别大的本地文件或媒体文件，不建议频繁批量处理，可能影响体验或性能。

### 4. 兼容性提示

原项目已知与以下插件可能存在兼容问题：

- `Paste Image Rename`
- `Pretty BibTex`

---

## 项目来源与致谢

本插件基于原有 `obsidian-local-images-plus` 能力扩展，并进一步整合了 `clear-unused-images` 与 `AttachFlow` 图片交互增强能力。

感谢以下项目与贡献者：

- [Sergei-Korneev/obsidian-local-images-plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)
- [aleksey-rezvov/obsidian-local-images](https://github.com/aleksey-rezvov/obsidian-local-images)
- [niekcandaele/obsidian-local-images](https://github.com/niekcandaele/obsidian-local-images)
- [ozntel/oz-clear-unused-images-obsidian](https://github.com/ozntel/oz-clear-unused-images-obsidian)
- [elf004-star/Obsidian-AttachFlow](https://github.com/elf004-star/Obsidian-AttachFlow)
- [Yaozhuwa/AttachFlow](https://github.com/Yaozhuwa/AttachFlow)

---

## 许可证

使用本插件即表示你接受项目许可证条款。许可证文件见：

- `LICENSE`
