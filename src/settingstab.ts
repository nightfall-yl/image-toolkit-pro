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
  setDebugMode,
  isDebugMode,
} from "./config"

import LocalImagesPlugin from "./main"
import safeRegex from "safe-regex"

type SettingsSection = {
  id: string
  label: string
  icon: string
}

/** Detect Obsidian's display language */
function getObsidianLang(): "zh-CN" | "en" {
  const lang = document.documentElement.lang?.toLowerCase() ?? "";
  return lang.startsWith("zh") ? "zh-CN" : "en";
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
    showNotifications: "显示通知",
    showNotificationsDesc: "处理页面后显示通知。",
    hideExtraCommands: "隐藏附加命令",
    hideExtraCommandsDesc: "重新加载插件后，从命令面板中隐藏附加命令。此设置不影响清理 Ribbon 图标。",
    showCleanupRibbon: "显示图片清理 Ribbon 图标",
    showCleanupRibbonDesc: "在左侧功能区显示图片清理快捷按钮。它是\u201cClear Unused Images in Vault\u201d的快捷入口，按钮文案会跟随 Obsidian 显示语言切换。",
    autoProcess: "自动处理",
    autoProcessDesc: "在新建、复制和粘贴时自动处理笔记。",
    autoProcessInterval: "自动处理间隔",
    autoProcessIntervalDesc: "自动处理的时间间隔，单位为秒。",
    autoProcessIntervalInvalid: "请输入 5 到 3600 之间的正整数！",
    processNewMarkdown: "处理所有新建 Markdown 文件",
    processNewMarkdownDesc: "处理新建或同步得到、且符合包含规则的 Markdown 类文件。",
    processNewAttachments: "处理所有新附件",
    processNewAttachmentsDesc: "将所有新附件从 Obsidian 默认附件目录移动到插件管理的位置。",
    useTimestampNaming: "新附件使用时间命名",
    useTimestampNamingDesc: "对新粘贴或拖入的附件使用 YYYYMMDD-HHmmss-随机6位 命名，同时保留去重能力。",
    localizeTitle: "图片本地化",
    localizeDesc: "控制附件下载、压缩、命名和保存路径。",
    downloadRetryCount: "单个附件重试次数",
    downloadRetryCountDesc: "下载附件失败时的重试次数。",
    downloadRetryCountInvalid: "请输入 1 到 6 之间的正整数！",
    downloadUnknownTypes: "下载未知文件类型",
    downloadUnknownTypesDesc: "下载未知文件类型，并以 `.unknown` 扩展名保存。",
    compressImage: "压缩图片",
    compressImageDesc: "压缩下载和粘贴得到的图片。可以减小体积，但也可能影响性能。",
    compressionFormat: "压缩格式",
    compressionFormatDesc: "选择图片压缩后的输出格式。",
    compressionQuality: "图片质量",
    compressionQualityDesc: "图片质量范围为 10 到 100。",
    compressionQualityInvalid: "请输入 10 到 100 之间的正整数！",
    minFileSizeKB: "文件大小下限（KB）",
    minFileSizeKBDesc: "不下载小于该大小的文件。设为 0 表示不限制。",
    positiveIntegerInvalid: "请输入正整数！",
    excludedExtensions: "排除扩展名",
    excludedExtensionsDesc: "插件不会下载这些扩展名的附件。",
    preserveCaptions: "保留链接标题",
    preserveCaptionsDesc: "在转换后的标签中保留媒体链接标题。",
    appendOriginalName: "添加原始文件名或打开文件标签",
    appendOriginalNameDesc: "对本地文件或拖入文件，在替换后的标签后追加原始文件名。",
    linkPathFormat: "标签中的路径写法",
    linkPathFormatDesc: "选择写入完整路径、相对路径，或仅写文件名。",
    fullPath: "完整路径",
    relativePath: "相对于笔记",
    filenameOnly: "仅文件名",
    dateFormat: "日期格式",
    dateFormatDesc: "媒体文件夹中 `${date}` 模板使用的日期格式。",
    unsafeFolderName: "文件夹名称不安全！某些字符在部分文件系统中不可用。",
    attachmentSaveLocation: "新附件保存位置",
    attachmentSaveLocationDesc: "选择所有新附件的保存位置。可使用 `_resources/${date}/${notename}` 这类模板。",
    followObsidian: "跟随 Obsidian 设置",
    saveToRoot: "保存到下方指定的根目录",
    saveNextToNote: "保存在笔记旁边的指定文件夹",
    syncMediaFolder: "同步移动、删除或重命名媒体文件夹",
    syncMediaFolderDesc: "当关联笔记发生变化时，同时移动或重命名媒体文件夹。请谨慎使用。",
    mediaFolderPath: "媒体文件夹",
    mediaFolderPathDesc: "用于存放下载媒体文件的文件夹。",
    skipObsidianFolderCreation: "不创建 Obsidian 附件文件夹",
    skipObsidianFolderCreationDesc: "用于兼容其他插件，但可能导致部分工作流行为异常。",
    cleanupTitle: "图片清理",
    cleanupDesc: "管理未使用附件清理与未关联附件移除行为。",
    deleteDestination: "删除去向",
    deleteDestinationDesc: "选择删除未使用图片、附件或笔记时的文件去向。",
    deletePermanent: "永久删除",
    deleteObsidianTrash: "移动到 Obsidian 回收站",
    deleteSystemTrash: "移动到系统回收站",
    showOperationLogs: "显示操作日志弹窗",
    showOperationLogsDesc: "操作完成后弹出包含操作详情的日志窗口。",
    excludeSubfolders: "清理时排除子文件夹",
    excludeSubfoldersDesc: "启用后，被排除的文件夹及其所有子文件夹在\u201c图片清理\u201d时都会被跳过。",
    excludedFolders: "排除文件夹",
    excludedFoldersDesc: "这些文件夹中的文件不会被自动处理，\u201c图片清理\u201d也会跳过它们。",
    excludedFoldersPlaceholder: "每行输入一个完整路径，例如 RootFolder/Subfolder",
    previewTitle: "图片预览",
    previewDesc: "右键菜单、拖拽缩放和点击看大图等图片预览增强功能。",
    showMoveFileMenu: "显示\u201c移动文件到...\u201d",
    showMoveFileMenuDesc: "在附件右键菜单中添加\u201c移动文件到...\u201d操作。",
    clickPreviewEnabled: "单击预览图片",
    clickPreviewEnabledDesc: "单击图片中间区域可打开可缩放的预览视图，再次单击可关闭预览；边缘区域保留给尺寸调整。",
    previewAdaptiveRatio: "自适应显示比例",
    previewAdaptiveRatioDesc: "当预览图片大于窗口时，按设定比例自适应缩放。",
    previewAdaptiveRatioNotice: "自适应比例",
    dragResizeEnabled: "拖拽缩放图片",
    dragResizeEnabledDesc: "在源码模式或实时预览模式下，启用图片和视频的拖拽缩放。",
    dragResizeStep: "缩放步进",
    dragResizeStepDesc: "拖拽缩放时的最小刻度。设为 0 表示不启用对齐。",
    dragResizeStepInvalid: "请输入正整数或 0。",
    advancedTitle: "开发者选项",
    advancedDesc: "开发调试与底层处理规则相关选项。",
    includePattern: "包含规则",
    includePatternDesc: "仅处理扩展名匹配该规则的文件，例如 `md|canvas`。",
    unsafeRegex: "不安全的正则！详见 https://www.npmjs.com/package/safe-regex",
    debugMode: "调试模式",
    debugModeDesc: "在控制台输出插件调试信息。",
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
    showNotifications: "Show notifications",
    showNotificationsDesc: "Show notifications after pages are processed.",
    hideExtraCommands: "Hide extra commands",
    hideExtraCommandsDesc: "Hide extra commands from the command palette after reloading the plugin. This does not affect the cleanup Ribbon icon.",
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
    useTimestampNaming: "Use timestamp names for new attachments",
    useTimestampNamingDesc: "Rename newly pasted or dropped attachments as YYYYMMDD-HHmmss-random6 while keeping deduplication.",
    localizeTitle: "Image Localization",
    localizeDesc: "Control downloading, compression, naming, and storage paths for attachments.",
    downloadRetryCount: "Retry count per attachment",
    downloadRetryCountDesc: "How many times to retry when attachment downloads fail.",
    downloadRetryCountInvalid: "Please enter an integer between 1 and 6.",
    downloadUnknownTypes: "Download unknown file types",
    downloadUnknownTypesDesc: "Download unknown file types and save them with the `.unknown` extension.",
    compressImage: "Compress images",
    compressImageDesc: "Compress downloaded and pasted images. This can reduce file size but may affect performance.",
    compressionFormat: "Compression format",
    compressionFormatDesc: "Choose the output format for image compression.",
    compressionQuality: "Image quality",
    compressionQualityDesc: "Image quality from 10 to 100.",
    compressionQualityInvalid: "Please enter an integer between 10 and 100.",
    minFileSizeKB: "File size lower limit (KB)",
    minFileSizeKBDesc: "Do not download files smaller than this value. Set 0 to disable the limit.",
    positiveIntegerInvalid: "Please enter a positive integer.",
    excludedExtensions: "Excluded extensions",
    excludedExtensionsDesc: "The plugin will not download attachments with these extensions.",
    preserveCaptions: "Preserve link captions",
    preserveCaptionsDesc: "Preserve media link captions in converted tags.",
    appendOriginalName: "Add original filename or open-file tag",
    appendOriginalNameDesc: "Append the original filename after the replaced tag for local or dropped files.",
    linkPathFormat: "Path format in tags",
    linkPathFormatDesc: "Choose whether to write full paths, relative paths, or filenames only.",
    fullPath: "Full path",
    relativePath: "Relative to note",
    filenameOnly: "Filename only",
    dateFormat: "Date format",
    dateFormatDesc: "Date format used by the `${date}` template in media folders.",
    unsafeFolderName: "Unsafe folder name. Some characters are not supported on certain file systems.",
    attachmentSaveLocation: "Save location for new attachments",
    attachmentSaveLocationDesc: "Choose where new attachments are stored. Templates like `_resources/${date}/${notename}` are supported.",
    followObsidian: "Follow Obsidian settings",
    saveToRoot: "Save to the root folder specified below",
    saveNextToNote: "Save in the specified folder next to the note",
    syncMediaFolder: "Move, delete, or rename media folder together",
    syncMediaFolderDesc: "When the related note changes, also move or rename the media folder. Use with caution.",
    mediaFolderPath: "Media folder",
    mediaFolderPathDesc: "Folder used to store downloaded media files.",
    skipObsidianFolderCreation: "Do not create Obsidian attachment folder",
    skipObsidianFolderCreationDesc: "Improves compatibility with other plugins, but may affect some workflows.",
    cleanupTitle: "Image Cleanup",
    cleanupDesc: "Manage unused attachment cleanup and unlinked attachment cleanup.",
    deleteDestination: "Delete destination",
    deleteDestinationDesc: "Choose where deleted files go when removing unused images, attachments, or notes.",
    deletePermanent: "Delete permanently",
    deleteObsidianTrash: "Move to Obsidian Trash",
    deleteSystemTrash: "Move to System Trash",
    showOperationLogs: "Show operation log modal",
    showOperationLogsDesc: "Show a log modal with details after operations complete.",
    excludeSubfolders: "Exclude subfolders during cleanup",
    excludeSubfoldersDesc: "When enabled, excluded folders and all their subfolders are skipped during image cleanup.",
    excludedFolders: "Excluded folders",
    excludedFoldersDesc: "Files inside these folders will not be processed automatically, and image cleanup will skip them too.",
    excludedFoldersPlaceholder: "Enter one full path per line, for example RootFolder/Subfolder",
    previewTitle: "Image Preview",
    previewDesc: "Enhancements for right-click menus, drag resizing, and click-to-zoom previews.",
    showMoveFileMenu: "Show \"Move file to...\"",
    showMoveFileMenuDesc: "Add the \"Move file to...\" action to the attachment right-click menu.",
    clickPreviewEnabled: "Click to preview image",
    clickPreviewEnabledDesc: "Click the center area of an image to open a zoomable preview, and click again to close it. The edges stay available for resizing.",
    previewAdaptiveRatio: "Adaptive display ratio",
    previewAdaptiveRatioDesc: "When the preview image is larger than the window, scale it adaptively.",
    previewAdaptiveRatioNotice: "Adaptive ratio",
    dragResizeEnabled: "Drag to resize images",
    dragResizeEnabledDesc: "Enable drag resizing for images and videos in source mode or live preview.",
    dragResizeStep: "Resize step",
    dragResizeStepDesc: "Minimum resize step when dragging. Set 0 to disable snapping.",
    dragResizeStepInvalid: "Please enter a positive integer or 0.",
    advancedTitle: "Developer Options",
    advancedDesc: "Developer-facing debugging and low-level processing options.",
    includePattern: "Include pattern",
    includePatternDesc: "Only process files whose extensions match this pattern, for example `md|canvas`.",
    unsafeRegex: "Unsafe regex. See https://www.npmjs.com/package/safe-regex",
    debugMode: "Debug mode",
    debugModeDesc: "Output plugin debug information to the console.",
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
        this.plugin.settings.attachmentSaveLocation === "obsFolder" ||
        this.plugin.settings.attachmentSaveLocation === "nextToNote"
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
    const lang = getObsidianLang()
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
      { id: "preview", label: t("navPreview"), icon: "image" },
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

    // ===================== 通用 =====================
    const generalEl = sectionEls.get("general")!

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
      .setName(t("hideExtraCommands"))
      .setDesc(t("hideExtraCommandsDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.hideExtraCommands)
          .onChange(async (value) => {
            this.plugin.settings.hideExtraCommands = value
            await this.plugin.saveSettings()
            this.plugin.refreshRibbonIcons()
          })
      )

    new Setting(generalEl)
      .setName(t("showCleanupRibbon"))
      .setDesc(t("showCleanupRibbonDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showCleanupRibbon)
          .onChange(async (value) => {
            this.plugin.settings.showCleanupRibbon = value
            await this.plugin.saveSettings()
            this.plugin.refreshRibbonIcons()
          })
      )

    new Setting(generalEl)
      .setName(t("autoProcess"))
      .setDesc(t("autoProcessDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoProcess)
          .onChange(async (value) => {
            this.plugin.settings.autoProcess = value
            await this.plugin.saveSettings()
            this.plugin.setupQueueInterval()
          })
      )

    this.addNumberSetting(generalEl, {
      name: t("autoProcessInterval"),
      desc: t("autoProcessIntervalDesc"),
      value: this.plugin.settings.autoProcessInterval,
      min: 5,
      max: 3600,
      integer: true,
      onValidChange: async (value) => {
        this.plugin.settings.autoProcessInterval = value
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
          .setValue(this.plugin.settings.processNewMarkdown)
          .onChange(async (value) => {
            this.plugin.settings.processNewMarkdown = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(generalEl)
      .setName(t("processNewAttachments"))
      .setDesc(t("processNewAttachmentsDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.processNewAttachments)
          .onChange(async (value) => {
            this.plugin.settings.processNewAttachments = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(generalEl)
      .setName(t("useTimestampNaming"))
      .setDesc(t("useTimestampNamingDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useTimestampNaming)
          .onChange(async (value) => {
            this.plugin.settings.useTimestampNaming = value
            await this.plugin.saveSettings()
          })
      )

    // 开发者选项（折叠区域）
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

    // ===================== 图片本地化 =====================
    const localizeEl = sectionEls.get("localize")!

    this.addNumberSetting(localizeEl, {
      name: t("downloadRetryCount"),
      desc: t("downloadRetryCountDesc"),
      value: this.plugin.settings.downloadRetryCount,
      min: 1,
      max: 6,
      integer: true,
      onValidChange: async (value) => {
        this.plugin.settings.downloadRetryCount = value
        await this.plugin.saveSettings()
      },
      invalidMessage: t("downloadRetryCountInvalid"),
    })

    new Setting(localizeEl)
      .setName(t("downloadUnknownTypes"))
      .setDesc(t("downloadUnknownTypesDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.downloadUnknownTypes)
          .onChange(async (value) => {
            this.plugin.settings.downloadUnknownTypes = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("compressImage"))
      .setDesc(t("compressImageDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.compressImage)
          .onChange(async (value) => {
            this.plugin.settings.compressImage = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("compressionFormat"))
      .setDesc(t("compressionFormatDesc"))
      .addDropdown((dropdown) => {
        dropdown
          .addOption("image/webp", "WebP")
          .addOption("image/jpeg", "JPEG")
          .setValue(this.plugin.settings.compressionFormat)
          .onChange(async (value) => {
            this.plugin.settings.compressionFormat = value
            await this.plugin.saveSettings()
          })
      })

    this.addNumberSetting(localizeEl, {
      name: t("compressionQuality"),
      desc: t("compressionQualityDesc"),
      value: this.plugin.settings.compressionQuality,
      min: 10,
      max: 100,
      integer: true,
      onValidChange: async (value) => {
        this.plugin.settings.compressionQuality = value
        await this.plugin.saveSettings()
      },
      invalidMessage: t("compressionQualityInvalid"),
    })

    this.addNumberSetting(localizeEl, {
      name: t("minFileSizeKB"),
      desc: t("minFileSizeKBDesc"),
      value: this.plugin.settings.minFileSizeKB,
      min: 0,
      integer: true,
      onValidChange: async (value) => {
        this.plugin.settings.minFileSizeKB = value
        await this.plugin.saveSettings()
      },
      invalidMessage: t("positiveIntegerInvalid"),
    })

    new Setting(localizeEl)
      .setName(t("excludedExtensions"))
      .setDesc(t("excludedExtensionsDesc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings.excludedExtensions)
          .onChange(async (value) => {
            this.plugin.settings.excludedExtensions = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("preserveCaptions"))
      .setDesc(t("preserveCaptionsDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.preserveCaptions)
          .onChange(async (value) => {
            this.plugin.settings.preserveCaptions = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("appendOriginalName"))
      .setDesc(t("appendOriginalNameDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.appendOriginalName)
          .onChange(async (value) => {
            this.plugin.settings.appendOriginalName = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("linkPathFormat"))
      .setDesc(t("linkPathFormatDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("fullDirPath", t("fullPath"))
          .addOption("onlyRelative", t("relativePath"))
          .addOption("baseFileName", t("filenameOnly"))
          .setValue(this.plugin.settings.linkPathFormat)
          .onChange(async (value) => {
            this.plugin.settings.linkPathFormat = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("dateFormat"))
      .setDesc(t("dateFormatDesc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value) => {
            if (value.match(/(\)|\(|\"|\'|\#|\]|\[|\:|\>|\<|\*|\|)/g) !== null) {
              displayError(t("unsafeFolderName"))
              return
            }
            this.plugin.settings.dateFormat = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("attachmentSaveLocation"))
      .setDesc(t("attachmentSaveLocationDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("obsFolder", t("followObsidian"))
          .addOption("inFolderBelow", t("saveToRoot"))
          .addOption("nextToNoteS", t("saveNextToNote"))
          .setValue(this.plugin.settings.attachmentSaveLocation)
          .onChange(async (value) => {
            this.plugin.settings.attachmentSaveLocation = value
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
          .setValue(this.plugin.settings.syncMediaFolder)
          .onChange(async (value) => {
            this.plugin.settings.syncMediaFolder = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("mediaFolderPath"))
      .setDesc(t("mediaFolderPathDesc"))
      .setClass("media_folder_set")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.mediaFolderPath)
          .onChange(async (value) => {
            if (value.match(/(\)|\(|\"|\'|\#|\]|\[|\:|\>|\<|\*|\|)/g) !== null) {
              displayError(t("unsafeFolderName"))
              return
            }
            this.plugin.settings.mediaFolderPath = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(localizeEl)
      .setName(t("skipObsidianFolderCreation"))
      .setDesc(t("skipObsidianFolderCreationDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.skipObsidianFolderCreation)
          .onChange(async (value) => {
            this.plugin.settings.skipObsidianFolderCreation = value
            await this.plugin.saveSettings()
          })
      )

    // ===================== 图片清理 =====================
    const cleanupEl = sectionEls.get("cleanup")!

    new Setting(cleanupEl)
      .setName(t("deleteDestination"))
      .setDesc(t("deleteDestinationDesc"))
      .addDropdown((dropdown) => {
        dropdown
          .addOption("permanent", t("deletePermanent"))
          .addOption(".trash", t("deleteObsidianTrash"))
          .addOption("system-trash", t("deleteSystemTrash"))
          .setValue(this.plugin.settings.deleteDestination)
          .onChange(async (value) => {
            this.plugin.settings.deleteDestination = value
            await this.plugin.saveSettings()
          })
      })

    new Setting(cleanupEl)
      .setName(t("showOperationLogs"))
      .setDesc(t("showOperationLogsDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showOperationLogs)
          .onChange(async (value) => {
            this.plugin.settings.showOperationLogs = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(cleanupEl)
      .setName(t("excludeSubfolders"))
      .setDesc(t("excludeSubfoldersDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.excludeSubfolders)
          .onChange(async (value) => {
            this.plugin.settings.excludeSubfolders = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(cleanupEl)
      .setName(t("excludedFolders"))
      .setDesc(t("excludedFoldersDesc"))
      .addTextArea((text) => {
        text
          .setPlaceholder(t("excludedFoldersPlaceholder"))
          .setValue(this.plugin.settings.excludedFolders)
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

              this.plugin.settings.excludedFolders = value
              this.plugin.settings.excludedFoldersRegexp = regexconverted
              await this.plugin.saveSettings()
              logError(`Excluded folders regex: ${regexconverted}`)
            }
          })

        text.inputEl.rows = 5
        text.inputEl.style.width = "100%"
      })

    // ===================== 图片预览 =====================
    const previewEl = sectionEls.get("preview")!

    new Setting(previewEl)
      .setName(t("showMoveFileMenu"))
      .setDesc(t("showMoveFileMenuDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showMoveFileMenu)
          .onChange(async (value) => {
            this.plugin.settings.showMoveFileMenu = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(previewEl)
      .setName(t("clickPreviewEnabled"))
      .setDesc(t("clickPreviewEnabledDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.clickPreviewEnabled)
          .onChange(async (value) => {
            this.plugin.settings.clickPreviewEnabled = value
            await this.plugin.saveSettings()
          })
      )

    new Setting(previewEl)
      .setName(t("previewAdaptiveRatio"))
      .setDesc(t("previewAdaptiveRatioDesc"))
      .addSlider((slider) => {
        slider
          .setLimits(0.1, 1, 0.05)
          .setValue(this.plugin.settings.previewAdaptiveRatio)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.previewAdaptiveRatio = value
            new Notice(`${t("previewAdaptiveRatioNotice")}: ${value}`)
            await this.plugin.saveSettings()
          })
      })

    new Setting(previewEl)
      .setName(t("dragResizeEnabled"))
      .setDesc(t("dragResizeEnabledDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.dragResizeEnabled)
          .onChange(async (value) => {
            this.plugin.settings.dragResizeEnabled = value
            await this.plugin.saveSettings()
          })
      )

    this.addNumberSetting(previewEl, {
      name: t("dragResizeStep"),
      desc: t("dragResizeStepDesc"),
      value: this.plugin.settings.dragResizeStep,
      min: 0,
      integer: true,
      emptyAs: 0,
      onValidChange: async (value) => {
        this.plugin.settings.dragResizeStep = value
        await this.plugin.saveSettings()
      },
      invalidMessage: t("dragResizeStepInvalid"),
    })

    // ===================== 开发者选项（折叠内容） =====================
    new Setting(advancedContentEl)
      .setName(t("includePattern"))
      .setDesc(t("includePatternDesc"))
      .addText((text) =>
        text
          .setValue(this.plugin.settings.includePattern)
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

              this.plugin.settings.includePattern = value
              this.plugin.settings.includePatternRegex = regexconverted
              logError(regexconverted)
              await this.plugin.saveSettings()
            }
          })
      )

    new Setting(advancedContentEl)
      .setName(t("debugMode"))
      .setDesc(t("debugModeDesc"))
      .addToggle((toggle) =>
        toggle
          .setValue(isDebugMode())
          .onChange(async (value) => {
            setDebugMode(value)
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
