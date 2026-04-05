import {
  Notice,
  Plugin,
  TFile,
  Editor,
  htmlToMarkdown,
  MarkdownView,
  TFolder,
} from "obsidian"

import SettingTab from "./settingstab"

import {
  imageTagProcessor,
  getMDir,
  getRDir,
} from "./contentProcessor"

import {
  replaceAsync,
  cFileName,
  md5Sig,
  generateTimestampRandomName,
  trimAny,
  logError,
  showBalloon,
  displayError,
  encObsURI,
  pathJoin,
  blobToJpegArrayBuffer,
  getFileExt,
  readFromDiskB
} from "./utils"

import {
  APP_NAME,
  APP_TITLE,
  ISettings,
  DEFAULT_SETTINGS,
  MD_SEARCH_PATTERN,
  NOTICE_TIMEOUT,
  TIMEOUT_LIKE_INFINITY,

} from "./config"

import { UniqueQueue } from "./uniqueQueue"
import path from "path"
import { ModalW1 } from "./modal"
import { ClearUnusedLogsModal } from "./clearUnusedModal"
import { deleteFilesInTheList, getFormattedDate, getUnusedAttachments } from "./clearUnusedUtils"
import { getAllLinkMatchesInFile } from "./clearUnusedLinkDetector"
import { AttachFlowFeature } from "./attachflowFeature"
const fs = require('fs').promises;






//import { count, log } from "console"

export default class LocalImagesPlugin extends Plugin {
  settings: ISettings
  modifiedQueue = new UniqueQueue<TFile>()
  intervalId = 0
  newfProcInt: number
  newfCreated: Array<string> = []
  noteModified: Array<TFile> = []
  newfMoveReq: boolean = true
  newfCreatedByDownloader: Array<string> = []
  clearUnusedRibbonIconEl: HTMLElement | undefined = undefined
  attachFlowFeature: AttachFlowFeature | undefined = undefined
  latestCreatedMarkdownFile: TFile | null = null

  private getDefaultSettingsLanguage(): string {
    const displayLanguage =
      document.documentElement.lang ||
      navigator.language ||
      "en"

    return displayLanguage.toLowerCase().startsWith("zh") ? "zh-CN" : "en"
  }

  private async getCurrentNoteAttachmentBaseNames(noteFile: TFile): Promise<Set<string>> {
    const attachmentNames = new Set<string>()
    const fileCache = this.app.metadataCache.getFileCache(noteFile)
    const embeds = fileCache?.embeds ?? []
    const links = fileCache?.links ?? []

    for (const embed of embeds) {
      attachmentNames.add(path.basename(embed.link))
    }

    for (const link of links) {
      attachmentNames.add(path.basename(link.link))
    }

    if (fileCache?.frontmatter) {
      for (const value of Object.values(fileCache.frontmatter)) {
        if (typeof value !== "string") {
          continue
        }

        const bannerMatch = value.match(/!\[\[(.*?)\]\]/)
        if (bannerMatch?.[1]) {
          attachmentNames.add(path.basename(bannerMatch[1]))
          continue
        }

        if (/\.(jpe?g|png|gif|svg|bmp|webp|avif)(\?.*)?$/i.test(value)) {
          attachmentNames.add(path.basename(value))
        }
      }
    }

    const linkMatches = await getAllLinkMatchesInFile(noteFile, this.app)
    for (const linkMatch of linkMatches) {
      attachmentNames.add(path.basename(linkMatch.linkText))
    }

    return attachmentNames
  }

  private async findDuplicateAttachmentByHash(folderPath: string, hash: string): Promise<TFile | null> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath)
    if (!(folder instanceof TFolder)) {
      return null
    }

    for (const child of folder.children) {
      if (!(child instanceof TFile)) {
        continue
      }

      const fileHash = md5Sig(await this.app.vault.adapter.readBinary(child.path))
      if (fileHash === hash) {
        return child
      }
    }

    return null
  }

  private async buildTimestampedAttachmentPath(folderPath: string, extension: string): Promise<string> {
    let candidatePath = ""
    do {
      candidatePath = pathJoin([folderPath, generateTimestampRandomName(extension)])
    } while (await this.app.vault.adapter.exists(candidatePath))

    return candidatePath
  }

  async onload() {

    await this.loadSettings()

    this.addCommand({
      id: "download-images",
      name: "Localize attachments for the current note (plugin folder)",
      callback: this.processActivePage(false),
    })


    this.addCommand({
      id: "download-images-def",
      name: "Localize attachments for the current note (Obsidian folder)",
      callback: this.processActivePage(true),
    })

    this.addCommand({
      id: "clear-unused-images",
      name: "Clear Unused Images in Vault",
      callback: () => this.clearUnusedAttachments("image"),
    })

    this.addCommand({
      id: "clear-unused-attachments",
      name: "Clear Unused Attachments in Vault",
      callback: () => this.clearUnusedAttachments("all"),
    })

    this.refreshRibbonIcons()

    if (!this.settings.disAddCom) {

      this.addCommand({
        id: "set-title-as-name",
        name: "Set the first found # header as a note name.",
        callback: this.setTitleAsName,
      })

      this.addCommand({
        id: "download-images-all",
        name: "Localize attachments for all your notes (plugin folder)",
        callback: this.openProcessAllModal,
      })

      this.addCommand({
        id: "convert-selection-to-URI",
        name: "Convert selection to URI",
        callback: this.convertSelToURI,
      })

      this.addCommand({
        id: "convert-selection-to-md",
        name: "Convert selection from html to markdown",
        callback: this.convertSelToMD,
      })

      this.addCommand({
        id: "clear-unlinked-attachments-current-note-folder",
        name: "Clear Unlinked Attachments in Current Note Folder (Next to Note mode)",
        callback: () => { this.removeOrphans("plugin")() },
      })
    }





    // Some file has been created

    this.app.vault.on('create', async (file: TFile) => {
      
      logError("New file created: " + file.path)

      if (this.ExemplaryOfMD(file.path) && !this.ThePathExcluded(String(file.parent?.path))){
        this.onMdCreateFunc(file)
      } else{
        this.onFCreateFunc(file)
      }

    })


    // Some file has been deleted

    this.app.vault.on('delete', async (file: TFile) => {
 
      if (!file ||
        !(file instanceof TFile) ||
        !(this.ExemplaryOfMD(file.path)) ||
        !this.settings.removeMediaFolder ||
        this.settings.saveAttE != "nextToNoteS") {
        return
      }


      let rootdir = this.settings.mediaRootDir
      const useSysTrash = (this.app.vault.getConfig("trashOption") === "system")
    
      if (path.basename(rootdir).includes("${notename}") &&
        !rootdir.includes("${date}")) {

        rootdir = rootdir.replace("${notename}", file.basename)

        if (this.settings.saveAttE == "nextToNoteS") {
          rootdir = pathJoin([path.dirname(file?.path || ""), rootdir])
        }

        try {
          if (this.app.vault.getAbstractFileByPath(rootdir) instanceof TFolder) {
            this.app.vault.trash(app.vault.getAbstractFileByPath(rootdir), useSysTrash)
            showBalloon("Attachment folder " + rootdir + " was moved to trash can.", this.settings.showNotifications)
          }
        } catch (e) {
          logError(e)
          return
        };
      }
    })



    this.app.vault.on('rename', async (file: TFile, oldPath: string) => {
     
      if (!file ||
        !(file instanceof TFile) ||
        !this.ExemplaryOfMD(file.path) ||
        this.ThePathExcluded(String(file.parent?.path)) ||
        !this.settings.removeMediaFolder ||
        this.settings.saveAttE != "nextToNoteS" ||
        this.settings.pathInTags != "onlyRelative") {
        return
      }

      let oldRootdir = this.settings.mediaRootDir

      if (path.basename(oldRootdir).includes("${notename}") &&
        !oldRootdir.includes("${date}")) {

        oldRootdir = oldRootdir.replace("${notename}", path.parse(oldPath)?.name)
        let newRootDir = oldRootdir.replace(path.parse(oldPath)?.name, path.parse(file.path)?.name)
        let newRootDir_ = newRootDir
        let oldRootdir_ = oldRootdir

        oldRootdir_ = pathJoin([(path.dirname(oldPath) || ""), oldRootdir])
        newRootDir_ = pathJoin([(path.dirname(file.path) || ""), newRootDir])


        try {
          if (this.app.vault.getAbstractFileByPath(oldRootdir_) instanceof TFolder) {
            await this.ensureFolderExists(path.dirname(newRootDir_))
            //await this.app.fileManager.renameFile(app.vault.getAbstractFileByPath(oldRootdir),newRootDir)
            await this.app.vault.adapter.rename(oldRootdir_, newRootDir_)
            showBalloon("Attachment folder was renamed to " + newRootDir_, this.settings.showNotifications)
          }
        } catch (e) {
          showBalloon("Cannot move attachment folder: \r\n" + e, this.settings.showNotifications)
          logError(e)
          return
        };
        let content = await this.app.vault.cachedRead(file)
        content = content
          .replaceAll("](" + encodeURI(oldRootdir), "](" + encodeURI(newRootDir))
          .replaceAll("[" + oldRootdir, "[" + newRootDir)
        this.app.vault.modify(file, content)

      }
    })



    // Some file has been modified

    this.app.vault.on('modify', async (file: TFile) => {
      if (!this.newfMoveReq)
        return
      logError("File modified: " + file.path , false)
 
      if (!file ||
        !(file instanceof TFile) ||
        this.ThePathExcluded(String(file.parent?.path)) ||
        !this.ExemplaryOfMD(file.path)) {
        return
      } else {
        if (this.settings.processAll) {
          if (!this.noteModified.includes(file)) {
            this.noteModified.push(file)
          }
          this.setupNewMdFilesProcInterval()
        }


      }

    })




    this.app.workspace.on(

      "editor-paste",
      (evt: ClipboardEvent, editor: Editor, info: MarkdownView) => {
        this.onPasteFunc(evt, editor, info)

      }
    )

    this.setupQueueInterval()
    this.attachFlowFeature = new AttachFlowFeature(this)
    await this.attachFlowFeature.onload()
    this.addSettingTab(new SettingTab(this.app, this))

  }

  refreshRibbonIcons = () => {
    this.clearUnusedRibbonIconEl?.remove()

    if (this.settings.clearUnusedRibbonIcon) {
      const displayLang = document.documentElement.lang?.toLowerCase() ?? ""
      const ribbonTitle = displayLang.startsWith("zh")
        ? "清理未使用图片"
        : "Clear unused images"

      this.clearUnusedRibbonIconEl = this.addRibbonIcon("image-file", ribbonTitle, () => {
        this.clearUnusedAttachments("image")
      })
    }
  }

  clearUnusedAttachments = async (type: "all" | "image") => {
    const unusedAttachments: TFile[] = await getUnusedAttachments(this.app, type)
    const len = unusedAttachments.length

    if (len <= 0) {
      new Notice(`All ${type === "image" ? "images" : "attachments"} are used. Nothing was deleted.`)
      return
    }

    let logs = `[+] ${getFormattedDate()}: Clearing started.</br>`
    const { deletedImages, textToView } = await deleteFilesInTheList(unusedAttachments, this.settings, this.app)
    logs += textToView
    logs += `[+] ${deletedImages.toString()} ${type === "image" ? "image(s)" : "attachment(s)"} in total deleted.</br>`
    logs += `[+] ${getFormattedDate()}: Clearing completed.`

    if (deletedImages === 0) {
      new Notice("No files were deleted. All unused files are inside excluded folders.")
      return
    }

    if (this.settings.clearUnusedLogsModal) {
      const modalTitle = type === "image" ? "Clear Unused Images - Logs" : "Clear Unused Attachments - Logs"
      const modal = new ClearUnusedLogsModal(modalTitle, logs, this.app)
      modal.open()
    } else {
      new Notice(`Deleted ${deletedImages} unused ${type === "image" ? "image(s)" : "attachment(s)"}.`)
    }
  }





  setupQueueInterval() {
    if (this.intervalId) {
      const intervalId = this.intervalId
      this.intervalId = 0
      window.clearInterval(intervalId)
    }
    if (
      this.settings.realTimeUpdate &&
      this.settings.realTimeUpdateInterval > 0
    ) {
      this.intervalId = window.setInterval(
        this.processModifiedQueue,
        this.settings.realTimeUpdateInterval * 1000
      )
      this.registerInterval(this.intervalId)
    }
  }


  private getCurrentNote(): TFile | null {
    try {
      const noteFile = this.app.workspace.getActiveViewOfType(MarkdownView)?.file ?? null
      return noteFile
    } catch (e) {
      showBalloon("Cannot get current note! ", this.settings.showNotifications)

    }
    return null

  }


  private async processPage(file: TFile, defaultdir: boolean = false): Promise<any> {
    
 
    if (file == null ) {return null}

    const content = await this.app.vault.cachedRead(file)
    if (content.length == 0) {return null}
      

    const fixedContent = await replaceAsync(
      content,
      MD_SEARCH_PATTERN,
      imageTagProcessor(this,
        file,
        this.settings,
        defaultdir
      )
    )





    if (content != fixedContent[0] && fixedContent[1] === false) {
      this.modifiedQueue.remove(file)
      await this.app.vault.modify(file, fixedContent[0])

      fixedContent[2].forEach((element: string) => {
        this.newfCreatedByDownloader.push(element)
      })

      showBalloon(`Attachments for "${file.path}" were processed.`, this.settings.showNotifications)

    }

    else if (content != fixedContent[0] && fixedContent[1] === true) {

      this.modifiedQueue.remove(file)
      await this.app.vault.modify(file, fixedContent[0])

      fixedContent[2].forEach((element: string) => {
        this.newfCreatedByDownloader.push(element)
      })

      showBalloon(`WARNING!\r\nAttachments for "${file.path}" were processed, but some attachments were not downloaded/replaced...`, this.settings.showNotifications)
    }
    else {
      if (this.settings.showNotifications) {
        showBalloon(`Page "${file.path}" has been processed, but nothing was changed.`, this.settings.showNotifications)
      }
    }
  }

  // using arrow syntax for callbacks to correctly pass this context

  processActivePage = (defaultdir: boolean = false) => async () => {
    logError("processActivePage")
    try {
      const activeFile = this.getCurrentNote()
      await this.processPage(activeFile, defaultdir)
    } catch (e) {
      showBalloon(`Please select a note or click inside selected note in canvas.`, this.settings.showNotifications)
      return
    }
  }

  processAllPages = async () => {
    const files = this.app.vault.getMarkdownFiles()
 
    const pagesCount = files.length

    const notice = this.settings.showNotifications

      ? new Notice(
        APP_NAME + `\nStart processing. Total ${pagesCount} pages. `,
        TIMEOUT_LIKE_INFINITY
      )
      : null

    for (const [index, file] of files.entries()) {
      if (this.ExemplaryOfMD(file.path)) {
        if (notice) {
          //setMessage() is undeclared but factically existing, so ignore the TS error  //@ts-expect-error
          notice.setMessage(
            APP_NAME + `\nProcessing \n"${file.path}" \nPage ${index} of ${pagesCount}`
          )
        }
        await this.processPage(file)
      }
    }
    if (notice) {
      // dum @ts-expect-error
      notice.setMessage(APP_NAME + `\n${pagesCount} pages were processed.`)

      setTimeout(() => {
        notice.hide()
      }, NOTICE_TIMEOUT)
    }
  }




  private async onPasteFunc(evt: ClipboardEvent = undefined, editor: Editor = undefined, info: MarkdownView = undefined) {

    if (evt === undefined) { return }

    if (!this.settings.realTimeUpdate) { return }

    try {
      const activeFile = this.getCurrentNote()
      const fItems = evt.clipboardData.files
      const tItems = evt.clipboardData.items
 
      if (fItems.length != 0 || this.ThePathExcluded(String(activeFile.parent?.path))) { return }
      
      for (const key in tItems) {

        // Check if it was a text/html
        if (tItems[key].kind == "string") {
          
          if (this.settings.realTimeUpdate) {
            
            const cont = htmlToMarkdown(evt.clipboardData.getData("text/html")) +
            
            htmlToMarkdown(evt.clipboardData.getData("text"))
            



            for (const reg_p of MD_SEARCH_PATTERN) {
              if (reg_p.test(cont)) {
                logError("content: " + cont)
                showBalloon("Media links were found, processing...", this.settings.showNotifications)

                this.enqueueActivePage(activeFile)
                this.setupQueueInterval()
                break
              }
            }
          }
          return
        }

      }




    } catch (e) {
      showBalloon(`Please select a note or click inside selected note in canvas.`, this.settings.showNotifications)
      return
    }



  }




  private removeOrphans = (type: string = undefined,
    filesToRemove: Array<TFile> = undefined,
    noteFile: TFile = undefined) => async () => {

      let oldRootdir = this.settings.mediaRootDir

      if (type == "plugin") {
        const orphanedAttachments: TFile[] = []
        if (this.settings.saveAttE != "nextToNoteS" ||
          !path.basename(oldRootdir).endsWith("${notename}") ||
          oldRootdir.includes("${date}")) {
          showBalloon("This command requires the settings 'Next to note in the folder specified below' and pattern '${notename}' at the end to be enabled, also the path cannot contain ${date} pattern.\nPlease, change settings first!\r\n", this.settings.showNotifications)
          return
        }
         
        if (!noteFile) {
          noteFile = this.getCurrentNote()
          if (!noteFile) {
            showBalloon("Please, select a note or click inside a note in canvas!", this.settings.showNotifications)
            return
          }

        }


        if (this.ExemplaryOfMD(noteFile.path)) {

          oldRootdir = oldRootdir.replace("${notename}", path.parse(noteFile.path)?.name)
          oldRootdir = trimAny(pathJoin([path.parse(noteFile.path)?.dir, oldRootdir]), ["\/"])
          if (! await this.app.vault.exists(oldRootdir)) {
            showBalloon("The attachment folder " + oldRootdir + " does not exist!", this.settings.showNotifications)
            return
          }
          const allAttachments = await this.app.vault.getAbstractFileByPath(oldRootdir)?.children
          const referencedAttachmentNames = await this.getCurrentNoteAttachmentBaseNames(noteFile)
          if (allAttachments) {
            for (const attach of allAttachments) {
              if (attach instanceof TFile && !referencedAttachmentNames.has(attach.name)) {
                logError("orph: " + attach.basename)
                orphanedAttachments.push(attach)
              }
            }
          }


          if (orphanedAttachments.length > 0) {
            const mod = new ModalW1(this.app)
            mod.messg = "Confirm clearing " + orphanedAttachments.length + " unlinked attachment(s) from '" + oldRootdir + "'\r\n\r\n      "
            mod.plugin = this
            mod.callbackFunc = this.removeOrphans("execremove", orphanedAttachments)
            mod.open()
          } else {
            showBalloon("No unlinked attachments found!", this.settings.showNotifications)
          }

        }


      }


      if (type == "execremove") {
        const useSysTrash = (this.app.vault.getConfig("trashOption") === "system")
        const remcompl = this.settings.removeOrphansCompl
        let msg = "";

        if (filesToRemove) {

          filesToRemove.forEach((el: TFile) => {

            if (remcompl) {
              msg = "were deleted completely."
              this.app.vault.delete(el, true)
            } else {
              if (useSysTrash) {
                msg = "were moved to the system garbage can."
              } else {
                msg = "were moved to the Obsidian garbage can."
              }
              this.app.vault.trash(el, useSysTrash)
            }

          })
        }

        showBalloon(filesToRemove.length + " unlinked attachment(s) " + msg, this.settings.showNotifications)

      }

    }




  private openProcessAllModal = () => {
    const mod = new ModalW1(this.app)
    mod.messg = "Confirm processing all pages.\r\n "
    mod.plugin = this
    mod.callbackFunc = this.processAllPages
    mod.open()
  }
 



  private async onMdCreateFunc(file: TFile) {

 
    if (!file ||
      !(file instanceof TFile) ||
      !(this.settings.processCreated) ||
      !this.ExemplaryOfMD(file.path)
       )
      return


    const timeGapMs = Math.abs(Date.now() - file.stat.ctime)

    if (timeGapMs > 1000)
      return

    logError("func onMdCreateFunc: " + file.path)
    logError(file,true)
 

    var cont = await this.app.vault.cachedRead(file)
 
    logError(cont)
  
        this.latestCreatedMarkdownFile = file
        this.enqueueActivePage(file)
        this.setupQueueInterval()
        this.setupNewMdFilesProcInterval()
 
    
  }

  private async onFCreateFunc(file: TFile) {
 
    if (!file ||
      !(file instanceof TFile) ||
      this.ExemplaryOfMD(file.path)||
      this.ExemplaryOfCANVAS(file.path)||
      !(this.settings.processAll))
      return

    if (!file.stat.ctime)
      return

    const timeGapMs = Math.abs(Date.now() - file.stat.mtime)

    if (timeGapMs > 1000)
      return

    this.newfCreated.push(file.path)
    this.newfMoveReq = true
    const activeMarkdownFile = this.app.workspace.getActiveFile()
    const targetMarkdownFile =
      activeMarkdownFile && this.ExemplaryOfMD(activeMarkdownFile.path)
        ? activeMarkdownFile
        : this.latestCreatedMarkdownFile

    if (targetMarkdownFile && !this.noteModified.includes(targetMarkdownFile)) {
      this.noteModified.push(targetMarkdownFile)
    }
    this.setupNewMdFilesProcInterval()
    logError("file created  ")
  }


  private ExemplaryOfMD(pat: string){
    const includeRegex = new RegExp(this.settings.includepattern, "i")
    return (pat.match(includeRegex)?.groups?.md != undefined)
  }


  private ExemplaryOfCANVAS(pat: string){
    const includeRegex = new RegExp(this.settings.includepattern, "i")
    return (pat.match(includeRegex)?.groups?.canvas != undefined)
  }


  private ThePathExcluded(pat: string){
    const includeRegex = new RegExp(this.settings.ExcludedFoldersListRegexp, "i")
    logError(pat.match(includeRegex))
    // if (pat.match(includeRegex) != null && trimAny(this.settings.ExcludedFoldersList, [" "]).length != 0){
    //    showBalloon("The path " + pat + " is excluded in your settings. ", true)}
    return (pat.match(includeRegex) != null && trimAny(this.settings.ExcludedFoldersList, [" "]).length != 0)
  }

  private processMdFilesOnTimer = async () => {

    const th = this
    function onRet() {
      th.newfCreated = []
      th.newfCreatedByDownloader = []
      th.noteModified = []
      th.newfMoveReq = false
      window.clearInterval(th.newfProcInt)
      th.newfProcInt = 0
    }

    logError("func processMdFilesOnTimer:\r\n")
    logError(this.noteModified, true)

    try {


      window.clearInterval(this.newfProcInt)
      this.newfProcInt = 0
      this.newfMoveReq = false
      let itemcount = 0
      const useMdLinks = this.app.vault.getConfig("useMarkdownLinks")



      for (let note of this.noteModified) {

        const metaCache = this.app.metadataCache.getFileCache(note)
        let filedata = await this.app.vault.cachedRead(note)
        

        let pr = false
        for (const reg_p of MD_SEARCH_PATTERN) {
          if (reg_p.test(filedata)) {
            pr = true
            break
          }
        }

 

        const mdir = await getMDir(this.app, note, this.settings)
        const obsmdir = await getMDir(this.app, note, this.settings, true)
        let embeds = metaCache?.embeds



        if (obsmdir != "" && ! await this.app.vault.adapter.exists(obsmdir)) {
         if ( ! this.settings.DoNotCreateObsFolder){
          this.ensureFolderExists(obsmdir)
          showBalloon("You obsidian media folder set to '" + obsmdir + "', and has been created by the plugin. Please, try again. ", this.settings.showNotifications)
          onRet()
        }
          return
        }



        if (embeds || pr) {


          await this.ensureFolderExists(mdir)

          for (let el of embeds) {

            logError(el)

            let oldpath = pathJoin([obsmdir, path.basename(el.link)])
            let oldtag = el["original"];
            logError(useMdLinks)



            logError(this.newfCreated)
            
            if ((this.newfCreated.indexOf(el.link) != -1 || (obsmdir != "" && (this.newfCreated.includes(oldpath) || this.newfCreated.includes(el.link)))) &&
              !this.newfCreatedByDownloader.includes(oldtag)) {


              if (! await this.app.vault.adapter.exists(oldpath)) {
                logError("Cannot find " + el.link + " skipping...")
                continue
              }


              let newpath = pathJoin([mdir, cFileName(path.basename(el.link))])
              let newlink: Array<string> = await getRDir(note, this.settings, newpath)

              logError(el.link)

              //let newBinData: Buffer | null = null

              let newBinData: ArrayBuffer | null = null
              let newMD5: string | null = null
              const oldBinData = await readFromDiskB(pathJoin([this.app.vault.adapter.basePath, oldpath]), 5000)
              const oldMD5 = md5Sig(oldBinData)
              const fileExt = await getFileExt(oldBinData, oldpath)

              logError("oldbindata: " + oldBinData)
              logError("oldext: " + fileExt)
           
              if (this.settings.PngToJpegLocal && fileExt == "png") {


                let compType = "image/jpg";
                let compExt = ".jpg";

                if (this.settings.ImgCompressionType == "image/webp") {
                   compType = "image/webp";
                   compExt = ".webp";
                }

                logError("Compressing image to ")

                const blob = new Blob([new Uint8Array(await this.app.vault.adapter.readBinary(oldpath))]);
                newBinData = await blobToJpegArrayBuffer(blob, this.settings.JpegQuality*0.01, compType)
                
                newMD5 = md5Sig(newBinData)
                logError(newBinData)
                if (newBinData != null) {
                  const duplicateFile = await this.findDuplicateAttachmentByHash(mdir, newMD5)

                  if (duplicateFile) {
                    newpath = duplicateFile.path
                  } else if (this.settings.useTimestampNameForNewAtt) {
                    newpath = await this.buildTimestampedAttachmentPath(mdir, compExt)
                  } else {
                    newpath = pathJoin([mdir, cFileName(path.parse(el.link)?.name + compExt)])
                  }
                  newlink = await getRDir(note, this.settings, newpath)
                }

              } else if (this.settings.useTimestampNameForNewAtt) {
                const duplicateFile = await this.findDuplicateAttachmentByHash(mdir, oldMD5)
                if (duplicateFile) {
                  newpath = duplicateFile.path
                } else {
                  newpath = await this.buildTimestampedAttachmentPath(mdir, path.extname(el.link))
                }
                newlink = await getRDir(note, this.settings, newpath)

              } else if (!this.settings.useTimestampNameForNewAtt) {
                newpath = pathJoin([mdir, cFileName(path.basename(el.link))])
                newlink = await getRDir(note, this.settings, newpath)
              }



              if (await this.app.vault.adapter.exists(newpath)) {

                let newFMD5
                if (newBinData != null) {
                  newFMD5 = md5Sig(await this.app.vault.adapter.readBinary(newpath))
                } else {
                  newFMD5 = md5Sig(await readFromDiskB(pathJoin([this.app.vault.adapter.basePath, newpath]), 5000))
                }


                if (newMD5 === newFMD5 || (oldMD5 === newFMD5 && oldpath != newpath)) {

                  logError(path.dirname(oldpath))
                  logError("Deleting duplicate file: " + oldpath)
                  await this.app.vault.adapter.remove(oldpath)

                } else if (oldpath != newpath) {

                  logError("Renaming existing: " + oldpath)
                  let inc = 1
                  while (await this.app.vault.adapter.exists(newpath)) {
                    newpath = pathJoin([mdir, `(${inc}) ` + cFileName(path.basename(el.link))])
                    inc++
                  }

                  newlink = await getRDir(note, this.settings, newpath)
                  await this.app.vault.adapter.rename(oldpath, newpath)
                }

              } else {
                logError(`renaming  ${oldpath}  to  ${newpath}`)
                try {
                  if (newBinData != null) {
                    await this.app.vault.adapter.writeBinary(newpath, newBinData).then(
                    ); {
                      await this.app.vault.adapter.remove(oldpath)
                    }

                  } else {
                    await this.app.vault.adapter.rename(oldpath, newpath)
                  }

                } catch (error) {
                  logError(error)
                }


              }


              let addName = "";
              if (this.settings.addNameOfFile) {
                if (useMdLinks) {
                  addName = `[Open: ${path.basename(el.link)}](${newlink[1]})\r\n`
                } else {
                  addName = `[[${newlink[0]}|Open: ${path.basename(el.link)}]]\r\n`
                }

              }


              let newtag = addName + oldtag.replace(el.link, newlink[0])

              if (useMdLinks) {
                newtag = addName + oldtag.replace(encObsURI(el.link), newlink[1])
              }


              filedata = filedata.replaceAll(oldtag, newtag)
              itemcount++
            }
          }


        }
        if (itemcount > 0) {
          await this.app.vault.modify(note, filedata)
          showBalloon(itemcount + " attachments for note " + note.path + " were processed.", this.settings.showNotifications)
          itemcount = 0
        }
      }
    } catch (e) {
      logError(e)
      onRet()
    }
    onRet()

  }





  private setTitleAsName = async () => {
    try {
      const noteFile = this.getCurrentNote()
      const fileData = await this.app.vault.cachedRead(noteFile)
      const title = fileData.match(/^#{1,6} .+?($|\n)/gm)
      var ind = 0
      if (title !== null) {
        const newName = cFileName(trimAny(title[0].toString(), ["#", " "])).slice(0, 200)
        var fullPath = pathJoin([noteFile.parent.path, newName + ".md"])
        var fExist = await this.app.vault.exists(fullPath)
        if (trimAny(noteFile.path, ["\\", "/"]) != trimAny(fullPath, ["\\", "/"])) {
          while (fExist) {
            ind++
            var fullPath = pathJoin([noteFile.parent.path, newName + " (" + ind + ")" + ".md"])
            var fExist = await this.app.vault.exists(fullPath)
          }
          await this.app.vault.rename(noteFile, fullPath)

          showBalloon(`The note was renamed to ` + fullPath, this.settings.showNotifications)

        }
      }

    } catch (e) {
      showBalloon(`Cannot rename.`, this.settings.showNotifications)
      return
    }
  }





  setupNewMdFilesProcInterval() {
    logError("func setupNewFilesProcInterval: \r\n")
    window.clearInterval(this.newfProcInt)
    this.newfProcInt = 0
    this.newfProcInt = window.setInterval(
      this.processMdFilesOnTimer,
      this.settings.realTimeUpdateInterval * 1000
    )
    this.registerInterval(this.newfProcInt)
  }

  private convertSelToURI = async () => {
    const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor
    if (!editor) {
      showBalloon("Cannot access the active editor.", this.settings.showNotifications)
      return
    }

    editor.replaceSelection(encObsURI(editor.getSelection()))
  }

  private convertSelToMD = async () => {
    const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor
    if (!editor) {
      showBalloon("Cannot access the active editor.", this.settings.showNotifications)
      return
    }

    editor.replaceSelection(htmlToMarkdown(editor.getSelection()))
  }



  processModifiedQueue = async () => {
    const iteration = this.modifiedQueue.iterationQueue();
    for (const page of iteration) {
      this.processPage(page, false);
    }
  };

  enqueueActivePage(activeFile: TFile) {
    this.modifiedQueue.push(
      activeFile,
      1//this.settings.realTim3AttemptsToProcess
    )
  }




  // ------------  Load / Save settings -----------------



  async onunload() {
    this.attachFlowFeature?.onunload()
    this.app.workspace.off("editor-drop", null)
    this.app.workspace.off("editor-paste", null)
    this.app.workspace.off('file-menu', null)
    //this.app.vault.off("create",  null)
    logError(" unloaded.")
  }

  async loadSettings() {
    const savedSettings = (await this.loadData()) ?? {}
    this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings)

    if (
      typeof this.settings.useTimestampNameForNewAtt !== "boolean" &&
      typeof savedSettings.useMD5ForNewAtt === "boolean"
    ) {
      this.settings.useTimestampNameForNewAtt = savedSettings.useMD5ForNewAtt
    }

    if (typeof savedSettings.language !== "string" || !savedSettings.language.trim()) {
      this.settings.language = this.getDefaultSettingsLanguage()
    }

    this.setupQueueInterval()
  }

  async saveSettings() {
    try {
      await this.saveData(this.settings)
    } catch (error) {
      displayError(error)
    }
  }

  async ensureFolderExists(folderPath: string) {
    try {
      await this.app.vault.createFolder(folderPath)
      return
    } catch (e) {
      logError(e)
      return
    }
  }
}
