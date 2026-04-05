import { Notice, TFile, TFolder } from "obsidian";
import type { AttachFlowHost } from "./attachflowUtil";

const SUCCESS_NOTICE_TIMEOUT = 1800;

export const deleteFile = async (file: TFile | TFolder, plugin: AttachFlowHost) => {
  const deleteOption = plugin.settings.attachFlowDeleteOption;
  try {
    if (deleteOption === ".trash") {
      await plugin.app.vault.trash(file, false);
    } else if (deleteOption === "system-trash") {
      await plugin.app.vault.trash(file, true);
    } else if (deleteOption === "permanent") {
      await plugin.app.vault.delete(file);
    }
  } catch (error) {
    console.error(error);
    new Notice("删除文件或文件夹失败！", SUCCESS_NOTICE_TIMEOUT);
  }
};
