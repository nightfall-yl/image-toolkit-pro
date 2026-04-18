import { App, FuzzyMatch, FuzzySuggestModal, Modal, Notice, Setting, TFile, TFolder, Vault, MarkdownView } from "obsidian";
import { EditorView } from "@codemirror/view";
import { ISettings, isDebugMode, setDebugMode } from "./config";

export interface AttachFlowHost {
  app: App;
  settings: ISettings;
  saveSettings(): Promise<void>;
}

const SUCCESS_NOTICE_TIMEOUT = 1800;

export const print = (message?: any, ...optionalParams: any[]) => {
  if (isDebugMode()) {
    console.log(message, ...optionalParams);
  }
};

export function setDebug(value: boolean) {
  setDebugMode(value);
}

export const checkReferenceInfo = (
  plugin: AttachFlowHost,
  targetFile: TFile,
  currentMd: TFile
): { state: number; mdPath: string[] } => {
  const resolvedLinks = plugin.app.metadataCache.resolvedLinks;
  const result = {
    state: 0,
    mdPath: [] as string[],
  };

  let refNum = 0;
  for (const [mdFile, links] of Object.entries(resolvedLinks)) {
    if (currentMd.path === mdFile) {
      result.mdPath.unshift(currentMd.path);
    }
    for (const [filePath, nr] of Object.entries(links)) {
      if (targetFile?.path === filePath) {
        refNum++;
        if (nr > 1) {
          result.state = 2;
          result.mdPath.push(mdFile);
          return result;
        }
        result.mdPath.push(mdFile);
      }
    }
  }
  result.state = refNum > 1 ? 1 : 0;
  return result;
};

export const getFileByBaseName = (
  plugin: AttachFlowHost,
  currentMd: TFile,
  fileBaseName: string
): TFile | undefined => {
  const resolvedLinks = plugin.app.metadataCache.resolvedLinks;
  for (const [mdFile, links] of Object.entries(resolvedLinks)) {
    if (currentMd.path !== mdFile) {
      continue;
    }
    for (const [filePath] of Object.entries(links)) {
      if (filePath.includes(fileBaseName)) {
        const attachFile = plugin.app.vault.getAbstractFileByPath(filePath);
        if (attachFile instanceof TFile) {
          return attachFile;
        }
      }
    }
  }
};

export const getFileParentFolder = (file: TFile): TFolder | undefined => {
  if (file.parent instanceof TFolder) {
    return file.parent;
  }
};

const onlyOneFileExists = (file: TFile): boolean => {
  const fileFolder = getFileParentFolder(file);
  return !!fileFolder && fileFolder.children.length === 1;
};

export const pureClearAttachment = async (plugin: AttachFlowHost, file: TFile, targetType: string) => {
  const deleteOption = plugin.settings.deleteDestination;
  const deleteFileFolder = onlyOneFileExists(file);
  const fileFolder = getFileParentFolder(file);
  const name = targetType === "img" ? "图片" : "文件";

  try {
    if (deleteOption === ".trash") {
      await plugin.app.vault.trash(file, false);
      new Notice(`${name}已移动到 Obsidian 回收站。`, SUCCESS_NOTICE_TIMEOUT);
      if (deleteFileFolder && fileFolder) {
        await plugin.app.vault.trash(fileFolder, false);
        new Notice("附件文件夹已删除。", 3000);
      }
    } else if (deleteOption === "system-trash") {
      await plugin.app.vault.trash(file, true);
      new Notice(`${name}已移动到系统回收站。`, SUCCESS_NOTICE_TIMEOUT);
      if (deleteFileFolder && fileFolder) {
        await plugin.app.vault.trash(fileFolder, true);
        new Notice("附件文件夹已删除。", 3000);
      }
    } else if (deleteOption === "permanent") {
      await plugin.app.vault.delete(file);
      new Notice(`${name}已永久删除。`, SUCCESS_NOTICE_TIMEOUT);
      if (deleteFileFolder && fileFolder) {
        await plugin.app.vault.delete(fileFolder, true);
        new Notice("附件文件夹已删除。", 3000);
      }
    }
  } catch (error) {
    console.error(error);
    new Notice(`删除${name}失败！`, SUCCESS_NOTICE_TIMEOUT);
  }
};

export const handlerDelFileNew = async (
  plugin: AttachFlowHost,
  fileBaseName: string,
  currentMd: TFile,
  targetType: string,
  targetPos: number,
  inTable: boolean,
  inCallout: boolean
) => {
  const targetFile = getFileByBaseName(plugin, currentMd, fileBaseName);
  if (!targetFile) {
    new Notice("未找到对应的附件文件。");
    return;
  }

  const refInfo = checkReferenceInfo(plugin, targetFile, currentMd);
  switch (refInfo.state) {
    case 0:
      deleteCurTargetLink(plugin, fileBaseName, targetPos, inTable, inCallout);
      await pureClearAttachment(plugin, targetFile, targetType);
      break;
    case 1:
    case 2:
      deleteCurTargetLink(plugin, fileBaseName, targetPos, inTable, inCallout);
      new Notice(
        "由于该文件仍被其他位置引用，所以只删除了当前引用链接。",
        3500
      );
      break;
    default:
      break;
  }
};

export const deleteCurTargetLink = (
  plugin: AttachFlowHost,
  fileBaseName: string,
  targetPos: number,
  inTable: boolean,
  inCallout: boolean
) => {
  const normalizedBaseName = fileBaseName.startsWith("/") ? fileBaseName.substring(1) : fileBaseName;
  const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
  const editor = activeView?.editor;
  if (!editor) {
    return;
  }

  const editorView = (editor as any).cm as EditorView;
  const targetLine = editorView.state.doc.lineAt(targetPos);

  if (!inTable && !inCallout) {
    const finds = findLinkInLine(normalizedBaseName, targetLine.text);
    if (finds.length === 1) {
      editor.replaceRange("", { line: targetLine.number - 1, ch: finds[0][0] }, { line: targetLine.number - 1, ch: finds[0][1] });
      return;
    }
    if (finds.length === 0) {
      new Notice("未找到对应链接文本，请手动删除！", 0);
      return;
    }
    new Notice("当前行中找到多个匹配链接，请手动删除！", 0);
    return;
  }

  const mode = inTable ? "表格" : "Callout";
  const startReg = inTable ? /^\s*\|/ : /^>/;
  const findsLines: number[] = [];
  const findsAll: [from: number, to: number][] = [];

  for (let i = targetLine.number; i <= editor.lineCount(); i++) {
    const lineText = editor.getLine(i - 1);
    if (!startReg.test(lineText)) {
      break;
    }
    const finds = findLinkInLine(normalizedBaseName, lineText);
    if (finds.length > 0) {
      findsLines.push(...new Array(finds.length).fill(i));
      findsAll.push(...finds);
    }
  }

  for (let i = targetLine.number - 1; i >= 1; i--) {
    const lineText = editor.getLine(i - 1);
    if (!startReg.test(lineText)) {
      break;
    }
    const finds = findLinkInLine(normalizedBaseName, lineText);
    if (finds.length > 0) {
      findsLines.push(...new Array(finds.length).fill(i));
      findsAll.push(...finds);
    }
  }

  if (findsAll.length === 1) {
    editor.replaceRange("", { line: findsLines[0] - 1, ch: findsAll[0][0] }, { line: findsLines[0] - 1, ch: findsAll[0][1] });
    editor.focus();
    return;
  }

  if (findsAll.length === 0) {
    new Notice(`未找到${mode}中的对应链接文本，请手动删除！`, 0);
    return;
  }

  new Notice(`当前${mode}中找到多个匹配链接，请手动删除！`, 0);
};

export const handlerMoveFile = async (plugin: AttachFlowHost, fileBaseName: string, currentMd: TFile) => {
  const targetFile = getFileByBaseName(plugin, currentMd, fileBaseName);
  if (!targetFile) {
    return;
  }
  new MoveFileToFolderSuggester(plugin.app, targetFile).open();
};

export const handlerRenameFile = (plugin: AttachFlowHost, fileBaseName: string, currentMd: TFile) => {
  const targetFile = getFileByBaseName(plugin, currentMd, fileBaseName);
  if (!targetFile) {
    return;
  }

  const filePath = targetFile.path;
  const fileName = targetFile.name;
  const targetFolder = filePath.substring(0, filePath.length - fileName.length);
  const fileType = fileName.split(".").pop() as string;
  new RenameModal(
    plugin.app,
    targetFolder,
    fileName.substring(0, fileName.length - fileType.length - 1),
    fileType,
    (result) => {
      if (!result || result === filePath) {
        return;
      }
      plugin.app.vault.adapter.exists(result).then((exists) => {
        if (exists) {
          new Notice(`重命名失败，${result} 已存在。`);
        } else {
          plugin.app.fileManager.renameFile(targetFile, result);
        }
      });
    }
  ).open();
};

const findLinkInLine = (fileName: string, lineText: string) => {
  const fileNameMdLink = fileName.replace(/ /g, "%20");
  const regWikiLink = /\!\[\[[^\[\]]*?\]\]/g;
  const regMdLink = /\!\[[^\[\]]*?\]\(\s*[^\[\]\{\}']*\s*\)/g;

  const searchResult: [from: number, to: number][] = [];
  if (lineText.includes(fileName)) {
    while (true) {
      const match = regWikiLink.exec(lineText);
      if (!match) {
        break;
      }
      if (match[0].includes(fileName)) {
        searchResult.push([match.index, match.index + match[0].length]);
      }
    }
  }

  if (lineText.includes(fileNameMdLink)) {
    while (true) {
      const match = regMdLink.exec(lineText);
      if (!match) {
        break;
      }
      if (match[0].includes(fileNameMdLink)) {
        searchResult.push([match.index, match.index + match[0].length]);
      }
    }
  }

  return searchResult;
};

class RenameModal extends Modal {
  result = "";
  folder: string;
  name: string;
  filetype: string;
  onSubmit: (result: string) => void;
  hasSubmitted = false;
  outsideClickHandler = (evt: MouseEvent) => {
    const target = evt.target as Node | null;
    if (!target || this.contentEl.contains(target)) {
      return;
    }

    evt.preventDefault();
    evt.stopPropagation();
    this.submitAndClose();
  };

  constructor(app: App, folder: string, name: string, filetype: string, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
    this.folder = folder;
    this.name = name;
    this.filetype = filetype;
    this.result = `${this.folder}${this.name}.${this.filetype}`;
  }

  onOpen() {
    const { contentEl } = this;
    const setting = new Setting(contentEl)
      .setName("重命名：")
      .addText((text) =>
        text.setValue(this.name).onChange((value) => {
          this.result = `${this.folder}${value}.${this.filetype}`;
        })
      );

    setTimeout(() => {
      const inputBox = setting.settingEl.querySelector('input[type="text"]') as HTMLInputElement | null;
      if (inputBox && inputBox.parentElement) {
        const folderIndicator = document.createElement("label");
        folderIndicator.innerText = this.folder;
        folderIndicator.style.marginRight = "4px";
        inputBox.parentElement.insertBefore(folderIndicator, inputBox);

        const fileTypeIndicator = document.createElement("label");
        fileTypeIndicator.innerText = `.${this.filetype}`;
        fileTypeIndicator.style.marginLeft = "4px";
        inputBox.after(fileTypeIndicator);

        const parentEl = setting.settingEl.parentElement;
        if (parentEl) {
          parentEl.style.display = "flex";
          parentEl.style.justifyContent = "center";
        }

        inputBox.select();
      }
    }, 0);

    window.setTimeout(() => {
      document.addEventListener("mousedown", this.outsideClickHandler, true);
    }, 0);

    this.scope.register([], "Enter", (evt: KeyboardEvent) => {
      if (evt.isComposing) {
        return;
      }
      this.submitAndClose();
    });
  }

  private submitAndClose() {
    if (this.hasSubmitted) {
      return;
    }

    this.hasSubmitted = true;
    this.onSubmit(this.result);
    this.close();
  }

  onClose() {
    document.removeEventListener("mousedown", this.outsideClickHandler, true);
    this.contentEl.empty();
  }
}

class MoveFileToFolderSuggester extends FuzzySuggestModal<string> {
  private folderList: Set<string>;
  targetFile: TFile;

  constructor(app: App, file: TFile) {
    super(app);
    this.folderList = this.getAllFolders(app.vault);
    this.targetFile = file;
  }

  getAllFolders(vault: Vault): Set<string> {
    const folders = new Set<string>();
    vault.getAllLoadedFiles().forEach((file) => {
      if (file instanceof TFolder) {
        folders.add(file.path);
      }
    });
    return folders;
  }

  getItems(): string[] {
    return Array.from(this.folderList).sort();
  }

  getItemText(item: string): string {
    return item;
  }

  async onChooseItem(item: string): Promise<void> {
    if (this.targetFile.parent?.path === item) {
      new Notice("文件已经在该文件夹中。", 3000);
      return;
    }

    const chosenFolder = item.endsWith("/") ? item : `${item}/`;
    const newPath = `${chosenFolder}${this.targetFile.name}`;
    this.app.vault.adapter.exists(newPath).then((exists) => {
      if (exists) {
        new Notice(`移动失败，${newPath} 已存在。`);
      } else {
        this.app.fileManager.renameFile(this.targetFile, newPath);
      }
    });
  }

  renderSuggestion(item: FuzzyMatch<string>, el: HTMLElement): void {
    el.innerText = item.item;
  }
}
