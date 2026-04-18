import { App, TFile } from "obsidian";
import { ISettings } from "./config";
import { getAllLinkMatchesInFile, LinkMatch } from "./clearUnusedLinkDetector";

const imageRegex = /.*(jpe?g|png|gif|svg|bmp|webp|avif)/i;
const bannerRegex = /!\[\[(.*?)\]\]/i;
const imageExtensions: Set<string> = new Set(["jpeg", "jpg", "png", "gif", "svg", "bmp", "webp", "avif"]);

export const getUnusedAttachments = async (app: App, type: "image" | "all") => {
  const allAttachmentsInVault = getAttachmentsInVault(app, type);
  const unusedAttachments: TFile[] = [];
  const usedAttachmentsSet = await getAttachmentPathSetForVault(app);

  allAttachmentsInVault.forEach((attachment) => {
    if (!usedAttachmentsSet.has(attachment.path)) {
      unusedAttachments.push(attachment);
    }
  });

  return unusedAttachments;
};

const getAttachmentsInVault = (app: App, type: "image" | "all"): TFile[] => {
  const allFiles = app.vault.getFiles();
  const attachments: TFile[] = [];

  for (let i = 0; i < allFiles.length; i++) {
    if (!["md", "canvas"].includes(allFiles[i].extension)) {
      if (imageExtensions.has(allFiles[i].extension.toLowerCase())) {
        attachments.push(allFiles[i]);
      } else if (type === "all") {
        attachments.push(allFiles[i]);
      }
    }
  }

  return attachments;
};

const getAttachmentPathSetForVault = async (app: App): Promise<Set<string>> => {
  const attachmentsSet: Set<string> = new Set();
  const resolvedLinks = app.metadataCache.resolvedLinks;

  if (resolvedLinks) {
    for (const [mdFile, links] of Object.entries(resolvedLinks)) {
      for (const filePath of Object.keys(links ?? {})) {
        if (!filePath.endsWith(".md")) {
          attachmentsSet.add(filePath);
        }
      }
    }
  }

  const allFiles = app.vault.getFiles();
  for (let i = 0; i < allFiles.length; i++) {
    const obsFile = allFiles[i];

    if (obsFile.extension === "md") {
      const fileCache = app.metadataCache.getFileCache(obsFile);
      if (fileCache?.frontmatter) {
        const frontmatter = fileCache.frontmatter;
        for (const key of Object.keys(frontmatter)) {
          if (typeof frontmatter[key] === "string") {
            if (frontmatter[key].match(bannerRegex)) {
              const fileName = frontmatter[key].match(bannerRegex)?.[1];
              if (!fileName) {
                continue;
              }

              const file = app.metadataCache.getFirstLinkpathDest(fileName, obsFile.path);
              if (file) {
                addToSet(attachmentsSet, file.path);
              }
            } else if (pathIsAnImage(frontmatter[key])) {
              addToSet(attachmentsSet, frontmatter[key]);
            }
          }
        }
      }

      const linkMatches: LinkMatch[] = await getAllLinkMatchesInFile(obsFile, app);
      for (const linkMatch of linkMatches) {
        addToSet(attachmentsSet, linkMatch.linkText);
      }
    } else if (obsFile.extension === "canvas") {
      const fileRead = await app.vault.cachedRead(obsFile);
      const canvasData = JSON.parse(fileRead);
      if (canvasData.nodes && canvasData.nodes.length > 0) {
        for (const node of canvasData.nodes) {
          if (node.type === "file") {
            addToSet(attachmentsSet, node.file);
          } else if (node.type === "text") {
            const linkMatches: LinkMatch[] = await getAllLinkMatchesInFile(obsFile, app, node.text);
            for (const linkMatch of linkMatches) {
              addToSet(attachmentsSet, linkMatch.linkText);
            }
          }
        }
      }
    }
  }

  return attachmentsSet;
};

const pathIsAnImage = (path: string) => {
  return path.match(imageRegex);
};

export const deleteFilesInTheList = async (
  fileList: TFile[],
  settings: ISettings,
  app: App
): Promise<{ deletedImages: number; textToView: string }> => {
  const deleteOption = settings.deleteDestination;
  let deletedImages = 0;
  let textToView = "";

  for (const file of fileList) {
    if (fileIsInExcludedFolder(file, settings)) {
      continue;
    }

    if (deleteOption === ".trash") {
      await app.vault.trash(file, false);
      textToView += `[+] Moved to Obsidian Trash: ${file.path}</br>`;
    } else if (deleteOption === "system-trash") {
      await app.vault.trash(file, true);
      textToView += `[+] Moved to System Trash: ${file.path}</br>`;
    } else if (deleteOption === "permanent") {
      await app.vault.delete(file);
      textToView += `[+] Deleted Permanently: ${file.path}</br>`;
    }

    deletedImages++;
  }

  return { deletedImages, textToView };
};

const fileIsInExcludedFolder = (file: TFile, settings: ISettings): boolean => {
  const excludedFoldersSettings = settings.excludedFolders;
  const excludeSubfolders = settings.excludeSubfolders;

  if (excludedFoldersSettings.trim() === "") {
    return false;
  }

  const excludedFolderPaths = new Set(
    excludedFoldersSettings
      .split(/\r?\n|\r|\n|,/g)
      .map((folderPath) => folderPath.trim())
      .filter(Boolean)
  );

  if (excludeSubfolders) {
    for (const excludedFolderPath of excludedFolderPaths) {
      const escapedPath = excludedFolderPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pathRegex = new RegExp(`^${escapedPath}(?:\\/.*)?$`);
      if (pathRegex.test(file.parent?.path ?? "")) {
        return true;
      }
    }
  } else if (excludedFolderPaths.has(file.parent?.path ?? "")) {
    return true;
  }

  return false;
};

export const getFormattedDate = () => {
  const dt = new Date();
  return dt.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const addToSet = (setObj: Set<string>, value: string) => {
  if (!setObj.has(value)) {
    setObj.add(value);
  }
};
