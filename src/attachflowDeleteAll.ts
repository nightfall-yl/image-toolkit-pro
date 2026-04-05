import { Notice, TFile, TFolder } from "obsidian";
import type { AttachFlowHost } from "./attachflowUtil";
import { getFileParentFolder } from "./attachflowUtil";
import { deleteFile } from "./attachflowDelete";

export const deleteAllAttachs = async (plugin: AttachFlowHost, noteFile?: TFile | null) => {
  const targetMd = noteFile ?? (plugin.app.workspace.getActiveFile() as TFile | null);
  if (!targetMd) {
    return;
  }

  const resolvedLinks = plugin.app.metadataCache.resolvedLinks;
  for (const [mdFile, links] of Object.entries(resolvedLinks)) {
    if (targetMd.path !== mdFile) {
      continue;
    }

    let fileCount = 0;
    let folderHandled = false;
    for (const [filePath] of Object.entries(links)) {
      if (filePath.match(/.*\.md$/m)) {
        continue;
      }
      if (isReferencedByOtherNotes(plugin, filePath, targetMd)) {
        continue;
      }

      try {
        const attachFile = plugin.app.vault.getAbstractFileByPath(filePath) as TFile;
        if (attachFile instanceof TFile) {
          await deleteFile(attachFile, plugin);
        }

        const parentFolder = getFileParentFolder(attachFile) as TFolder | undefined;
        if (parentFolder && !folderHandled) {
          fileCount = parentFolder.children.length;
          folderHandled = true;
        }
        fileCount = fileCount - 1;
        if (parentFolder && fileCount === 0) {
          await deleteFile(parentFolder, plugin);
          new Notice("所有附件及其父文件夹都已删除。", 3000);
        }
      } catch (error) {
        console.warn(error);
      }
    }
  }
};

const isReferencedByOtherNotes = (plugin: AttachFlowHost, attachPath: string, currentMd: TFile): boolean => {
  const resolvedLinks = plugin.app.metadataCache.resolvedLinks;

  for (const [mdFile, links] of Object.entries(resolvedLinks)) {
    if (mdFile === currentMd.path) {
      continue;
    }
    for (const [filePath] of Object.entries(links)) {
      if (filePath === attachPath) {
        return true;
      }
    }
  }

  return false;
};

export const getReferencedLinkCount = (plugin: AttachFlowHost, noteFile?: TFile | null): number => {
  const targetMd = noteFile ?? (plugin.app.workspace.getActiveFile() as TFile | null);
  if (!targetMd) {
    return 0;
  }

  const resolvedLinks = plugin.app.metadataCache.resolvedLinks;
  const attachPaths: string[] = [];
  for (const [mdFile, links] of Object.entries(resolvedLinks)) {
    if (targetMd.path !== mdFile) {
      continue;
    }
    for (const [filePath] of Object.entries(links)) {
      if (filePath.match(/.*\.md$/m)) {
        continue;
      }
      if (isReferencedByOtherNotes(plugin, filePath, targetMd)) {
        continue;
      }
      attachPaths.push(filePath);
    }
  }

  return attachPaths.length;
};
