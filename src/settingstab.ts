import {
  App,
  Notice,
  PluginSettingTab,
  Setting,
  setIcon,
} from "obsidian"

import {
  displayError,
  logError,
  trimAny,
} from "./utils"

import {
  APP_NAME,
  setDebug,
  VERBOSE,
} from "./config"

import LocalImagesPlugin from "./main"
import safeRegex from "safe-regex"

type SettingsSection = {
  id: string
  label: string
  icon: string
}

const LOCALE_TEXT: Record<string, Record<string, string>> = {
  "zh-CN": {
    subtitle: "统一管理附件本地化、未使用文件清理和图片预览交互增强。",
    navGeneral: "通用",
    navLocalize: "图片本地化",
    navCleanup: "图片清理",
    navPreview: "图片预览",
    navAdvanced: "开发者选项",
    generalTitle: "通用",
    generalDesc: "插件显示与自动处理相关选项。",
    language: "语言",
    languageDesc: "设置页面显示语言。",
    languageZh: "中文",
    languageEn: "English",
    showNotifications: "显示通知",
    showNotificationsDesc: "处理页面后显示通知。",
    disableCommands: "禁用附加命令",
    disableCommandsDesc: "重新加载插件后，从命令面板中隐藏附加命令。此设置不影响清理 Ribbon 图标。",
    showCleanupRibbon: "显示图片清理 Ribbon 图标",
    showCleanupRibbonDesc: "在左侧功能区显示图片清理快捷按钮。它是“Clear Unused Images in Vault”的快捷入口，按钮文案会跟随 Obsidian 显示语言切换。",
    autoProcess: "自动处理",
    autoProcessDesc: "在新建、复制和粘贴时自动处理笔记。",
    autoProcessInterval: "自动处理间隔",
    autoProcessIntervalDesc: "自动处理的时间间隔，单位为秒。",
    autoProcessIntervalInvalid: "请输入 5 到 3600 之间的正整数！",
    processNewMarkdown: "处理所有新建 Markdown 文件",
    processNewMarkdownDesc: "处理新建或同步得到、且符合包含规则的 Markdown 类文件。",
    processNewAttachments: "处理所有新附件",
    processNewAttachmentsDesc: "将所有新附件从 Obsidian 默认附件目录移动到插件管理的位置。",
    md5ForNew: "新附件使用时间命名",
    md5ForNewDesc: "对新粘贴或拖入的附件使用 YYYYMMDD-HHmmss-随机6位 命名，同时保留去重能力。",
    localizeTitle: "图片本地化",
    localizeDesc: "控制附件下载、压缩、命名和保存路径。",
    retryCount: "单个附件重试次数",
    retryCountDesc: "下载附件失败时的重试次数。",
    retryCountInvalid: "请输入 1 到 6 之间的正整数！",
    downloadUnknown: "下载未知文件类型",
    downloadUnknownDesc: "下载未知文件类型，并以 `.unknown` 扩展名保存。",
    compressWeb: "压缩图片（网络图片）",
    compressWebDesc: "压缩下载得到的图片。可以减小体积，但也可能影响性能。",
    compressPaste: "压缩图片（粘贴图片）",
    compressPasteDesc: "压缩粘贴得到的图片。可以减小体积，但也可能影响性能。",
    compressionType: "压缩格式",
    compressionTypeDesc: "选择图片压缩后的输出格式。",
    imageQuality: "图片质量",
    imageQualityDesc: "图片质量范围为 10 到 100。",
    imageQualityInvalid: "请输入 10 到 100 之间的正整数！",
    fileSizeLimit: "文件大小下限（KB）",
    fileSizeLimitDesc: "不下载小于该大小的文件。设为 0 表示不限制。",
    positiveIntegerInvalid: "请输入正整数！",
    excludedExt: "排除扩展名",
    excludedExtDesc: "插件不会下载这些扩展名的附件。",
    preserveCaption: "保留链接标题",
    preserveCaptionDesc: "在转换后的标签中保留媒体链接标题。",
    appendOriginalName: "添加原始文件名或打开文件标签",
    appendOriginalNameDesc: "对本地文件或拖入文件，在替换后的标签后追加原始文件名。",
    pathMode: "标签中的路径写法",
    pathModeDesc: "选择写入完整路径、相对路径，或仅写文件名。",
    fullPath: "完整路径",
    relativePath: "相对于笔记",
    filenameOnly: "仅文件名",
    dateFormat: "日期格式",
    dateFormatDesc: "媒体文件夹中 `${date}` 模板使用的日期格式。",
    unsafeFolderName: "文件夹名称不安全！某些字符在部分文件系统中不可用。",
    saveFolder: "新附件保存位置",
    saveFolderDesc: "选择所有新附件的保存位置。可使用 `_resources/${date}/${notename}` 这类模板。",
    followObsidian: "跟随 Obsidian 设置",
    saveToRoot: "保存到下方指定的根目录",
    saveNextToNote: "保存在笔记旁边的指定文件夹",
    syncMediaFolder: "同步移动、删除或重命名媒体文件夹",
    syncMediaFolderDesc: "当关联笔记发生变化时，同时移动或重命名媒体文件夹。请谨慎使用。",
    mediaFolder: "媒体文件夹",
    mediaFolderDesc: "用于存放下载媒体文件的文件夹。",
    skipCreateObsidianFolder: "不创建 Obsidian 附件文件夹",
    skipCreateObsidianFolderDesc: "用于兼容其他插件，但可能导致部分工作流行为异常。",
    cleanupTitle: "图片清理",
    cleanupDesc: "管理未使用附件清理与未关联附件移除行为。",
    deleteDestination: "已删除文件的去向",
    deleteDestinationDesc: "选择执行全库清理时，未使用图片或附件的删除去向。",
    deletePermanent: "永久删除",
    deleteObsidianTrash: "移动到 Obsidian 回收站",
    deleteSystemTrash: "移动到系统回收站",
    cleanupLogs: "显示清理日志弹窗",
    cleanupLogsDesc: "全库未使用文件清理完成后，弹出包含删除路径的日志窗口。",
    excludeSubfolders: "清理时排除子文件夹",
    excludeSubfoldersDesc: "启用后，被排除的文件夹及其所有子文件夹在“图片清理”时都会被跳过。",
    deleteCompletely: "彻底删除文件",
    deleteCompletelyDesc: "执行“Clear Unlinked Attachments in Current Note Folder (Next to Note mode)”时，不再将文件移动到回收站。",
    excludedFolders: "排除文件夹",
    excludedFoldersDesc: "这些文件夹中的文件不会被自动处理，“图片清理”也会跳过它们。",
    excludedFoldersPlaceholder: "每行输入一个完整路径，例如 RootFolder/Subfolder",
    previewTitle: "图片预览",
    previewDesc: "右键菜单、拖拽缩放和点击看大图等图片预览增强功能。",
    attachDeleteDestination: "附件删除去向",
    attachDeleteDestinationDesc: "选择通过右键菜单删除附件时的去向。",
    attachDeleteLogs: "显示删除日志弹窗",
    attachDeleteLogsDesc: "通过 AttachFlow 命令删除当前笔记及其附件后，弹出详细日志窗口。",
    moveFileMenu: "显示“移动文件到...”",
    moveFileMenuDesc: "在附件右键菜单中添加“移动文件到...”操作。",
    clickPreview: "单击预览图片",
    clickPreviewDesc: "单击图片中间区域可打开可缩放的预览视图，再次单击可关闭预览；边缘区域保留给尺寸调整。",
    adaptiveRatio: "自适应显示比例",
    adaptiveRatioDesc: "当预览图片大于窗口时，按设定比例自适应缩放。",
    adaptiveRatioNotice: "自适应比例",
    dragResize: "拖拽缩放图片",
    dragResizeDesc: "在源码模式或实时预览模式下，启用图片和视频的拖拽缩放。",
    resizeStep: "缩放步进",
    resizeStepDesc: "拖拽缩放时的最小刻度。设为 0 表示不启用对齐。",
    resizeStepInvalid: "请输入正整数或 0。",
    previewDebug: "预览调试模式",
    previewDebugDesc: "在控制台输出图片预览相关的调试信息。",
    advancedTitle: "开发者选项",
    advancedDesc: "开发调试与底层处理规则相关选项。",
    includePattern: "包含规则",
    includePatternDesc: "仅处理扩展名匹配该规则的文件，例如 `md|canvas`。",
    unsafeRegex: "不安全的正则！详见 https://www.npmjs.com/package/safe-regex",
    coreDebug: "核心调试模式",
    coreDebugDesc: "在控制台输出 Image Toolkit Pro 核心调试信息。",
  },
  en: {
    subtitle: "Manage attachment localization, unused file cleanup, and preview Image interactions in one place.",
    navGeneral: "General",
    navLocalize: "Localize",
    navCleanup: "Cleanup",
    navPreview: "Preview",
    navAdvanced: "Developer Options",
    generalTitle: "General",
    generalDesc: "Plugin display and automatic processing options.",
    language: "Language",
    languageDesc: "Choose the display language for the settings page.",
    languageZh: "中文",
    languageEn: "English",
    showNotifications: "Show notifications",
    showNotificationsDesc: "Show notifications after pages are processed.",
    disableCommands: "Disable extra commands",
    disableCommandsDesc: "Hide extra commands from the command palette after reloading the plugin. This does not affect the cleanup Ribbon icon.",
    showCleanupRibbon: "Show cleanup Ribbon icon",
    showCleanupRibbonDesc: "Show the cleanup shortcut in the left Ribbon. It is a shortcut for \"Clear Unused Images in Vault\", and its label follows Obsidian's display language.",
    autoProcess: "Automatic processing",
    autoProcessDesc: "Automatically process notes on create, copy, and paste.",
    autoProcessInterval: "Automatic processing interval",
    autoProcessIntervalDesc: "The interval for automatic processing, in seconds.",
    autoProcessIntervalInvalid: "Please enter an integer between 5 and 3600.",
    processNewMarkdown: "Process all new Markdown files",
    processNewMarkdownDesc: "Process newly created or synced Markdown-like files that match the include pattern.",
    processNewAttachments: "Process all new attachments",
    processNewAttachmentsDesc: "Move new attachments from the default Obsidian attachment folder into the plugin-managed location.",
    md5ForNew: "Use timestamp names for new attachments",
    md5ForNewDesc: "Rename newly pasted or dropped attachments as YYYYMMDD-HHmmss-random6 while keeping deduplication.",
    localizeTitle: "Image Localization",
    localizeDesc: "Control downloading, compression, naming, and storage paths for attachments.",
    retryCount: "Retry count per attachment",
    retryCountDesc: "How many times to retry when attachment downloads fail.",
    retryCountInvalid: "Please enter an integer between 1 and 6.",
    downloadUnknown: "Download unknown file types",
    downloadUnknownDesc: "Download unknown file types and save them with the `.unknown` extension.",
    compressWeb: "Compress images (web images)",
    compressWebDesc: "Compress downloaded images. This can reduce file size but may affect performance.",
    compressPaste: "Compress images (pasted images)",
    compressPasteDesc: "Compress pasted images. This can reduce file size but may affect performance.",
    compressionType: "Compression format",
    compressionTypeDesc: "Choose the output format for image compression.",
    imageQuality: "Image quality",
    imageQualityDesc: "Image quality from 10 to 100.",
    imageQualityInvalid: "Please enter an integer between 10 and 100.",
    fileSizeLimit: "File size lower limit (KB)",
    fileSizeLimitDesc: "Do not download files smaller than this value. Set 0 to disable the limit.",
    positiveIntegerInvalid: "Please enter a positive integer.",
    excludedExt: "Excluded extensions",
    excludedExtDesc: "The plugin will not download attachments with these extensions.",
    preserveCaption: "Preserve link captions",
    preserveCaptionDesc: "Preserve media link captions in converted tags.",
    appendOriginalName: "Add original filename or open-file tag",
    appendOriginalNameDesc: "Append the original filename after the replaced tag for local or dropped files.",
    pathMode: "Path format in tags",
    pathModeDesc: "Choose whether to write full paths, relative paths, or filenames only.",
    fullPath: "Full path",
    relativePath: "Relative to note",
    filenameOnly: "Filename only",
    dateFormat: "Date format",
    dateFormatDesc: "Date format used by the `${date}` template in media folders.",
    unsafeFolderName: "Unsafe folder name. Some characters are not supported on certain file systems.",
    saveFolder: "Save location for new attachments",
    saveFolderDesc: "Choose where new attachments are stored. Templates like `_resources/${date}/${notename}` are supported.",
    followObsidian: "Follow Obsidian settings",
    saveToRoot: "Save to the root folder specified below",
    saveNextToNote: "Save in the specified folder next to the note",
    syncMediaFolder: "Move, delete, or rename media folder together",
    syncMediaFolderDesc: "When the related note changes, also move or rename the media folder. Use with caution.",
    mediaFolder: "Media folder",
    mediaFolderDesc: "Folder used to store downloaded media files.",
    skipCreateObsidianFolder: "Do not create Obsidian attachment folder",
    skipCreateObsidianFolderDesc: "Improves compatibility with other plugins, but may affect some workflows.",
    cleanupTitle: "Image Cleanup",
    cleanupDesc: "Manage unused attachment cleanup and unlinked attachment cleanup.",
    deleteDestination: "Deleted file destination",
    deleteDestinationDesc: "Choose where unused images or attachments go during vault-wide cleanup.",
    deletePermanent: "Delete permanently",
    deleteObsidianTrash: "Move to Obsidian Trash",
    deleteSystemTrash: "Move to System Trash",
    cleanupLogs: "Show cleanup log modal",
    cleanupLogsDesc: "Show a log modal with deleted paths after vault-wide cleanup finishes.",
    excludeSubfolders: "Exclude subfolders during cleanup",
    excludeSubfoldersDesc: "When enabled, excluded folders and all their subfolders are skipped during image cleanup.",
    deleteCompletely: "Delete files permanently",
    deleteCompletelyDesc: "Do not move unlinked attachments to the trash when running \"Clear Unlinked Attachments in Current Note Folder (Next to Note mode)\".",
    excludedFolders: "Excluded folders",
    excludedFoldersDesc: "Files inside these folders will not be processed automatically, and image cleanup will skip them too.",
    excludedFoldersPlaceholder: "Enter one full path per line, for example RootFolder/Subfolder",
    previewTitle: "Image Preview",
    previewDesc: "Enhancements for right-click menus, drag resizing, and click-to-zoom previews.",
    attachDeleteDestination: "Attachment delete destination",
    attachDeleteDestinationDesc: "Choose where attachments go when removed from the right-click menu.",
    attachDeleteLogs: "Show delete log modal",
    attachDeleteLogsDesc: "Show a detailed log modal after deleting the current note and its attachments via AttachFlow.",
    moveFileMenu: "Show “Move file to...”",
    moveFileMenuDesc: "Add the “Move file to...” action to the attachment right-click menu.",
    clickPreview: "Click to preview image",
    clickPreviewDesc: "Click the center area of an image to open a zoomable preview, and click again to close it. The edges stay available for resizing.",
    adaptiveRatio: "Adaptive display ratio",
    adaptiveRatioDesc: "When the preview image is larger than the window, scale it adaptively.",
    adaptiveRatioNotice: "Adaptive ratio",
    dragResize: "Drag to resize images",
    dragResizeDesc: "Enable drag resizing for images and videos in source mode or live preview.",
    resizeStep: "Resize step",
    resizeStepDesc: "Minimum resize step when dragging. Set 0 to disable snapping.",
    resizeStepInvalid: "Please enter a positive integer or 0.",
    previewDebug: "Preview debug mode",
    previewDebugDesc: "Output preview-related debug information to the console.",
    advancedTitle: "Developer Options",
    advancedDesc: "Developer-facing debugging and low-level processing options.",
    includePattern: "Include pattern",
    includePatternDesc: "Only process files whose extensions match this pattern, for example `md|canvas`.",
    unsafeRegex: "Unsafe regex. See https://www.npmjs.com/package/safe-regex",
    coreDebug: "Core debug mode",
    coreDebugDesc: "Output Image Toolkit Pro core debug information to the console.",
  },
}

export default class SettingTab extends PluginSettingTab {
  plugin: LocalImagesPlugin

  constructor(app: App, plugin: LocalImagesPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  private toggleMediaFolderSettings(sectionEl: HTMLElement): void {
    sectionEl.findAll(".setting-item").forEach((el: HTMLElement) => {
      if (!el.getAttr("class")?.includes("media_folder_set")) {
        return
      }

      if (
        this.plugin.settings.saveAttE === "obsFolder" ||
        this.plugin.settings.saveAttE === "nextToNote"
      ) {
        el.hide()
      } else {
        el.show()
      }
    })
  }

  private addNumberSetting(
    containerEl: HTMLElement,
    options: {
      name: string
      desc: string
      value: number
      min?: number
      max?: number
      integer?: boolean
      emptyAs?: number | null
      onValidChange: (value: number) => Promise<void>
      invalidMessage: string
    }
  ) {
    new Setting(containerEl)
      .setName(options.name)
      .setDesc(options.desc)
      .addText((text) =>
        text
          .setValue(String(options.value))
          .onChange(async (value: string) => {
            const trimmed = value.trim()
            if (trimmed === "" && options.emptyAs !== undefined) {
              await options.onValidChange(options.emptyAs ?? 0)
              return
            }

            const numberValue = Number(trimmed)
            const isInteger = options.integer ?? true
            const min = options.min ?? Number.NEGATIVE_INFINITY
            const max = options.max ?? Number.POSITIVE_INFINITY

            if (
              Number.isNaN(numberValue) ||
              (isInteger && !Number.isInteger(numberValue)) ||
              numberValue < min ||
              numberValue > max
            ) {
              displayError(options.invalidMessage)
              return
            }

            await options.onValidChange(numberValue)
          })
      )
  }

  display(): void {
    const { containerEl } = this
    containerEl.empty()
    containerEl.addClass("lip-settings-root")
    const lang = this.plugin.settings.language === "en" ? "en" : "zh-CN"
    const t = (key: string) => LOCALE_TEXT[lang][key] ?? key

    containerEl.createEl("h1", { text: APP_NAME })
    containerEl.createEl("p", {
      cls: "lip-settings-subtitle",
      text: t("subtitle"),
    })
    const sections: SettingsSection[] = [
      { id: "general", label: t("navGeneral"), icon: "settings-2" },
      { id: "localize", label: t("navLocalize"), icon: "panel-left" },
      { id: "cleanup", label: t("navCleanup"), icon: "list" },
      { id: "attachflow", label: t("navPreview"), icon: "image" },
    ]

    const navEl = containerEl.createDiv({ cls: "lip-settings-nav" })
    const contentEl = containerEl.createDiv({ cls: "lip-settings-content" })
    const sectionEls = new Map<string, HTMLElement>()
    const navButtons = new Map<string, HTMLButtonElement>()

    const setActiveSection = (sectionId: string) => {
      sectionEls.forEach((sectionEl, id) => {
        sectionEl.toggleClass("is-active", id === sectionId)
      })
      navButtons.forEach((button, id) => {
        button.toggleClass("is-active", id === sectionId)
      })
    }

    sections.forEach((section, index) => {
      const button = navEl.createEl("button", {
        cls: "lip-settings-nav-btn",
        attr: { type: "button" },
      })
      const iconEl = button.createSpan({ cls: "lip-settings-nav-icon" })
      setIcon(iconEl, section.icon)
      button.createSpan({ text: section.label })
      button.addEventListener("click", () => setActiveSection(section.id))
      navButtons.set(section.id, button)

      const sectionEl = contentEl.createDiv({ cls: "lip-settings-section" })
      sectionEls.set(section.id, sectionEl)
      if (index === 0) {
        sectionEl.addClass("is-active")
        button.addClass("is-active")
      }
    })

    const generalEl = sectionEls.get("general")!

    new Setting(generalEl)
      .setName(t("language"))
      .setDesc(t("languageDesc"))
      .then((setting) => {
        setting.controlEl.empty()
        const switcherEl = setting.controlEl.createDiv({ cls: "lip-language-switcher" })
        const options = [
          { value: "zh-CN", label: t("languageZh") },
          { value: "en", label: t("languageEn") },
        ]

        options.forEach((option) => {
          const button = switcherEl.createDiv({
            cls: "lip-language-option",
            text: option.label,
          })
          button.tabIndex = 0
          button.setAttribute("role", "button")

          if ((this.plugin.settings.language ?? "zh-CN") === option.value) {
            button.addClass("is-active")
          }

          button.addEventListener("click", async () => {
            this.plugin.settings.language = option.value
            await this.plugin.saveSettings()
            this.display()
          })

          button.addEventListener("keydown", async (evt: KeyboardEvent) => {
            if (evt.key !== "Enter" && evt.key !== " ") {
              return
            }
            evt.preventDefault()
            this.plugin.settings.language = option.value
            await this.plugin.saveSettings()
            this.display()
          })
        })
      })

    new Setting(generalEl)
      .setName(t("showNotifications"))
      .setDesc(t("showNotificationsDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showNotifications)
          .onChange(async (value) => {
            this.plugin.settings.showNotifications = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(generalEl)
      .setName(t("disableCommands"))
      .setDesc(t("disableCommandsDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.disAddCom)
          .onChange(async (value) => {
            this.plugin.settings.disAddCom = value
            await this.plugin.saveSettings()
            this.plugin.refreshRibbonIcons()
          })
      )

    new Setting(generalEl)
      .setName(t("showCleanupRibbon"))
      .setDesc(t("showCleanupRibbonDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.clearUnusedRibbonIcon)
          .onChange(async (value) => {
            this.plugin.settings.clearUnusedRibbonIcon = value
            await this.plugin.saveSettings()
            this.plugin.refreshRibbonIcons()
          })
      )

    new Setting(generalEl)
      .setName(t("autoProcess"))
      .setDesc(t("autoProcessDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.realTimeUpdate)
          .onChange(async (value) => {
            this.plugin.settings.realTimeUpdate = value
            await this.plugin.saveSettings()
            this.plugin.setupQueueInterval()
          })
      )

    this.addNumberSetting(generalEl, {
      name: t("autoProcessInterval"),
      desc: t("autoProcessIntervalDesc"),
      value: this.plugin.settings.realTimeUpdateInterval,
      min: 5,
      max: 3600,
      integer: true,
      onValidChange: async (value) => {
        this.plugin.settings.realTimeUpdateInterval = value
        await this.plugin.saveSettings()
        this.plugin.setupQueueInterval()
      },
      invalidMessage: t("autoProcessIntervalInvalid"),
    })

    new Setting(generalEl)
      .setName(t("processNewMarkdown"))
      .setDesc(t("processNewMarkdownDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.processCreated)
          .onChange(async (value) => {
            this.plugin.settings.processCreated = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(generalEl)
      .setName(t("processNewAttachments"))
      .setDesc(t("processNewAttachmentsDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.processAll)
          .onChange(async (value) => {
            this.plugin.settings.processAll = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(generalEl)
      .setName(t("md5ForNew"))
      .setDesc(t("md5ForNewDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useTimestampNameForNewAtt)
          .onChange(async (value) => {
            this.plugin.settings.useTimestampNameForNewAtt = value
            await this.plugin.saveSettings()
          })
      )

    const advancedDetailsEl = generalEl.createDiv({
      cls: "lip-settings-collapsible",
    })
    const advancedSummaryEl = advancedDetailsEl.createDiv({
      cls: "lip-settings-collapsible-summary",
      attr: {
        role: "button",
        tabindex: "0",
        "aria-expanded": "false",
      },
    })
    const advancedSummaryCopy = advancedSummaryEl.createDiv({
      cls: "lip-settings-collapsible-copy",
    })
    advancedSummaryCopy.createSpan({
      cls: "lip-settings-collapsible-title",
      text: t("advancedTitle"),
    })
    advancedSummaryCopy.createEl("p", {
      cls: "lip-settings-collapsible-desc",
      text: t("advancedDesc"),
    })
    const advancedContentEl = advancedDetailsEl.createDiv({
      cls: "lip-settings-collapsible-content",
    })
    advancedContentEl.hide()

    const localizeEl = sectionEls.get("localize")!

    this.addNumberSetting(localizeEl, {
      name: t("retryCount"),
      desc: t("retryCountDesc"),
      value: this.plugin.settings.tryCount,
      min: 1,
      max: 6,
      integer: true,
      onValidChange: async (value) => {
        this.plugin.settings.tryCount = value
        await this.plugin.saveSettings()
      },
      invalidMessage: t("retryCountInvalid"),
    })

    new Setting(localizeEl)
      .setName(t("downloadUnknown"))
      .setDesc(t("downloadUnknownDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.downUnknown)
          .onChange(async (value) => {
            this.plugin.settings.downUnknown = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("compressWeb"))
      .setDesc(t("compressWebDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.PngToJpeg)
          .onChange(async (value) => {
            this.plugin.settings.PngToJpeg = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("compressPaste"))
      .setDesc(t("compressPasteDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.PngToJpegLocal)
          .onChange(async (value) => {
            this.plugin.settings.PngToJpegLocal = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("compressionType"))
      .setDesc(t("compressionTypeDesc"))
      .addDropdown((dropdown) => {
        dropdown
          .addOption("image/webp", "WebP")
          .addOption("image/jpeg", "JPEG")
          .setValue(this.plugin.settings.ImgCompressionType)
          .onChange(async (value) => {
            this.plugin.settings.ImgCompressionType = value
            await this.plugin.saveSettings()
          })
      })

    this.addNumberSetting(localizeEl, {
      name: t("imageQuality"),
      desc: t("imageQualityDesc"),
      value: this.plugin.settings.JpegQuality,
      min: 10,
      max: 100,
      integer: true,
      onValidChange: async (value) => {
        this.plugin.settings.JpegQuality = value
        await this.plugin.saveSettings()
      },
      invalidMessage: t("imageQualityInvalid"),
    })

    this.addNumberSetting(localizeEl, {
      name: t("fileSizeLimit"),
      desc: t("fileSizeLimitDesc"),
      value: this.plugin.settings.filesizeLimit,
      min: 0,
      integer: true,
      onValidChange: async (value) => {
        this.plugin.settings.filesizeLimit = value
        await this.plugin.saveSettings()
      },
      invalidMessage: t("positiveIntegerInvalid"),
    })

    new Setting(localizeEl)
      .setName(t("excludedExt"))
      .setDesc(t("excludedExtDesc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings.ignoredExt)
          .onChange(async (value) => {
            this.plugin.settings.ignoredExt = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("preserveCaption"))
      .setDesc(t("preserveCaptionDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useCaptions)
          .onChange(async (value) => {
            this.plugin.settings.useCaptions = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("appendOriginalName"))
      .setDesc(t("appendOriginalNameDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.addNameOfFile)
          .onChange(async (value) => {
            this.plugin.settings.addNameOfFile = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("pathMode"))
      .setDesc(t("pathModeDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("fullDirPath", t("fullPath"))
          .addOption("onlyRelative", t("relativePath"))
          .addOption("baseFileName", t("filenameOnly"))
          .setValue(this.plugin.settings.pathInTags)
          .onChange(async (value) => {
            this.plugin.settings.pathInTags = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("dateFormat"))
      .setDesc(t("dateFormatDesc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings.DateFormat)
          .onChange(async (value) => {
            if (value.match(/(\)|\(|\"|\'|\#|\]|\[|\:|\>|\<|\*|\|)/g) !== null) {
              displayError(t("unsafeFolderName"))
              return
            }
            this.plugin.settings.DateFormat = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("saveFolder"))
      .setDesc(t("saveFolderDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("obsFolder", t("followObsidian"))
          .addOption("inFolderBelow", t("saveToRoot"))
          .addOption("nextToNoteS", t("saveNextToNote"))
          .setValue(this.plugin.settings.saveAttE)
          .onChange(async (value) => {
            this.plugin.settings.saveAttE = value
            await this.plugin.saveSettings()
            this.toggleMediaFolderSettings(localizeEl)
          })
      )

    new Setting(localizeEl)
      .setName(t("syncMediaFolder"))
      .setDesc(t("syncMediaFolderDesc"))
      .setClass("media_folder_set")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.removeMediaFolder)
          .onChange(async (value) => {
            this.plugin.settings.removeMediaFolder = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("mediaFolder"))
      .setDesc(t("mediaFolderDesc"))
      .setClass("media_folder_set")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.mediaRootDir)
          .onChange(async (value) => {
            if (value.match(/(\)|\(|\"|\'|\#|\]|\[|\:|\>|\<|\*|\|)/g) !== null) {
              displayError(t("unsafeFolderName"))
              return
            }
            this.plugin.settings.mediaRootDir = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("skipCreateObsidianFolder"))
      .setDesc(t("skipCreateObsidianFolderDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.DoNotCreateObsFolder)
          .onChange(async (value) => {
            this.plugin.settings.DoNotCreateObsFolder = value
            await this.plugin.saveSettings()
          })
      )

    const cleanupEl = sectionEls.get("cleanup")!

    new Setting(cleanupEl)
      .setName(t("deleteDestination"))
      .setDesc(t("deleteDestinationDesc"))
      .addDropdown((dropdown) => {
        dropdown
          .addOption("permanent", t("deletePermanent"))
          .addOption(".trash", t("deleteObsidianTrash"))
          .addOption("system-trash", t("deleteSystemTrash"))
          .setValue(this.plugin.settings.clearUnusedDeleteOption)
          .onChange(async (value) => {
            this.plugin.settings.clearUnusedDeleteOption = value
            await this.plugin.saveSettings()
          })
      })

    new Setting(cleanupEl)
      .setName(t("cleanupLogs"))
      .setDesc(t("cleanupLogsDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.clearUnusedLogsModal)
          .onChange(async (value) => {
            this.plugin.settings.clearUnusedLogsModal = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(cleanupEl)
      .setName(t("excludeSubfolders"))
      .setDesc(t("excludeSubfoldersDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.clearUnusedExcludeSubfolders)
          .onChange(async (value) => {
            this.plugin.settings.clearUnusedExcludeSubfolders = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(cleanupEl)
      .setName(t("deleteCompletely"))
      .setDesc(t("deleteCompletelyDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.removeOrphansCompl)
          .onChange(async (value) => {
            this.plugin.settings.removeOrphansCompl = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(cleanupEl)
      .setName(t("excludedFolders"))
      .setDesc(t("excludedFoldersDesc"))
      .addTextArea((text) => {
        text
          .setPlaceholder(t("excludedFoldersPlaceholder"))
          .setValue(this.plugin.settings.ExcludedFoldersList)
          .onChange(async (value) => {
            const foldersArray = value.split(/\r?\n|\r|\n/g)
            if (foldersArray.length >= 1) {
              const regexconverted = trimAny(
                foldersArray
                  .map((folderPath) => {
                    const cleaned = trimAny(folderPath, [" ", "|", "/", "\\"])
                    if (cleaned !== "") {
                      return `(^${cleaned}$)`
                    }
                    return ""
                  })
                  .join("|")
                  .replace("\\", "/"),
                [" ", "|", "/", "\\"]
              )

              this.plugin.settings.ExcludedFoldersList = value
              this.plugin.settings.ExcludedFoldersListRegexp = regexconverted
              await this.plugin.saveSettings()
              logError(`Excluded folders regex: ${regexconverted}`)
            }
          })

        text.inputEl.rows = 5
        text.inputEl.style.width = "100%"
      })

    const attachFlowEl = sectionEls.get("attachflow")!

    new Setting(attachFlowEl)
      .setName(t("attachDeleteDestination"))
      .setDesc(t("attachDeleteDestinationDesc"))
      .addDropdown((dropdown) => {
        dropdown
          .addOption("permanent", t("deletePermanent"))
          .addOption(".trash", t("deleteObsidianTrash"))
          .addOption("system-trash", t("deleteSystemTrash"))
          .setValue(this.plugin.settings.attachFlowDeleteOption)
          .onChange(async (value) => {
            this.plugin.settings.attachFlowDeleteOption = value
            await this.plugin.saveSettings()
          })
      })

    new Setting(attachFlowEl)
      .setName(t("attachDeleteLogs"))
      .setDesc(t("attachDeleteLogsDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.attachFlowLogsModal)
          .onChange(async (value) => {
            this.plugin.settings.attachFlowLogsModal = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(attachFlowEl)
      .setName(t("moveFileMenu"))
      .setDesc(t("moveFileMenuDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.attachFlowMoveFileMenu)
          .onChange(async (value) => {
            this.plugin.settings.attachFlowMoveFileMenu = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(attachFlowEl)
      .setName(t("clickPreview"))
      .setDesc(t("clickPreviewDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.attachFlowClickView)
          .onChange(async (value) => {
            this.plugin.settings.attachFlowClickView = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(attachFlowEl)
      .setName(t("adaptiveRatio"))
      .setDesc(t("adaptiveRatioDesc"))
      .addSlider((slider) => {
        slider
          .setLimits(0.1, 1, 0.05)
          .setValue(this.plugin.settings.attachFlowAdaptiveRatio)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.attachFlowAdaptiveRatio = value
            new Notice(`${t("adaptiveRatioNotice")}: ${value}`)
            await this.plugin.saveSettings()
          })
      })

    new Setting(attachFlowEl)
      .setName(t("dragResize"))
      .setDesc(t("dragResizeDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.attachFlowDragResize)
          .onChange(async (value) => {
            this.plugin.settings.attachFlowDragResize = value
            await this.plugin.saveSettings()
          })
      )

    this.addNumberSetting(attachFlowEl, {
      name: t("resizeStep"),
      desc: t("resizeStepDesc"),
      value: this.plugin.settings.attachFlowResizeInterval,
      min: 0,
      integer: true,
      emptyAs: 0,
      onValidChange: async (value) => {
        this.plugin.settings.attachFlowResizeInterval = value
        await this.plugin.saveSettings()
      },
      invalidMessage: t("resizeStepInvalid"),
    })

    new Setting(attachFlowEl)
      .setName(t("previewDebug"))
      .setDesc(t("previewDebugDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.attachFlowDebug)
          .onChange(async (value) => {
            this.plugin.settings.attachFlowDebug = value
            this.plugin.attachFlowFeature?.refreshDebug()
            await this.plugin.saveSettings()
          })
      )

    new Setting(advancedContentEl)
      .setName(t("includePattern"))
      .setDesc(t("includePatternDesc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings.includeps)
          .onChange(async (value) => {
            const extArray = value.split("|")
            if (extArray.length >= 1) {
              const regexconverted = trimAny(
                extArray
                  .map((extension) => {
                    const cleaned = trimAny(extension, [" ", "|"])
                    if (cleaned !== "") {
                      return `(?<${cleaned}>.*\\.${cleaned})`
                    }
                    return ""
                  })
                  .join("|"),
                [" ", "|"]
              )

              if (!safeRegex(value)) {
                displayError(t("unsafeRegex"))
                return
              }

              this.plugin.settings.includeps = value
              this.plugin.settings.includepattern = regexconverted
              logError(regexconverted)
              await this.plugin.saveSettings()
            }
          })
      )

    new Setting(advancedContentEl)
      .setName(t("coreDebug"))
      .setDesc(t("coreDebugDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(VERBOSE)
          .onChange(async (value) => {
            setDebug(value)
            await this.plugin.saveSettings()
          })
      )

    advancedSummaryEl.addEventListener("click", () => {
      const isOpen = !advancedDetailsEl.hasClass("is-open")
      advancedDetailsEl.toggleClass("is-open", isOpen)
      advancedSummaryEl.toggleClass("is-open", isOpen)
      advancedSummaryEl.setAttr("aria-expanded", isOpen ? "true" : "false")
      if (isOpen) {
        advancedContentEl.show()
      } else {
        advancedContentEl.hide()
      }
    })
    advancedSummaryEl.addEventListener("keydown", (evt) => {
      if (evt.key !== "Enter" && evt.key !== " ") {
        return
      }
      evt.preventDefault()
      advancedSummaryEl.click()
    })

    this.toggleMediaFolderSettings(localizeEl)
  }
}
