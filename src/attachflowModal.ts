import { Modal, TFile } from "obsidian";
import type { AttachFlowHost } from "./attachflowUtil";
import { deleteAllAttachs, getReferencedLinkCount } from "./attachflowDeleteAll";
import { deleteFile } from "./attachflowDelete";

export class DeleteAllLogsModal extends Modal {
  note: TFile;
  plugin: AttachFlowHost;

  constructor(note: TFile, plugin: AttachFlowHost) {
    super(plugin.app);
    this.note = note;
    this.plugin = plugin;
  }

  getLog(): string {
    const targetText =
      this.plugin.settings.deleteDestination === ".trash"
        ? "Obsidian 回收站"
        : this.plugin.settings.deleteDestination === "system-trash"
          ? "系统回收站"
          : "永久删除";
    return `确认要删除“${this.note.basename}.md”吗？\n\n删除后的文件将进入：${targetText}。`;
  }

  showLogs() {
    const logs = this.contentEl.createEl("div");
    logs.addClass("attachment-flow-log");
    logs.setText(this.getLog());
  }

  private isChineseDisplayLanguage() {
    const displayLang = document.documentElement.lang?.toLowerCase() ?? "";
    return displayLang.startsWith("zh");
  }

  onOpen() {
    const { contentEl } = this;
    const headerWrapper = contentEl.createEl("div");
    headerWrapper.addClass("attachment-flow-center-wrapper");
    this.showLogs();

    const referencedMessageWrapper = contentEl.createEl("span");
    referencedMessageWrapper.style.color = "red";
    referencedMessageWrapper.append(
      this.isChineseDisplayLanguage()
        ? `当前有 [${getReferencedLinkCount(this.plugin, this.note)}] 个仅被本笔记引用的附件会一起被处理。`
        : `[${getReferencedLinkCount(this.plugin, this.note)}] attachment(s) referenced only by this note will be processed as well.`
    );

    const buttonWrapper = contentEl.createEl("div");
    buttonWrapper.addClass("attachment-flow-center-wrapper");
    const headerEl = headerWrapper.createEl("h1", {
      text: this.isChineseDisplayLanguage() ? "删除笔记及其附件" : "Delete Current Note and Its Attachments",
    });
    headerEl.addClass("modal-title");
    this.showConfirmButton(buttonWrapper);
    this.showCancelBtn(buttonWrapper);
  }

  showCancelBtn(buttonWrapper: HTMLDivElement) {
    const closeButton = buttonWrapper.createEl("button", {
      text: this.isChineseDisplayLanguage() ? "取消" : "Cancel",
    });
    closeButton.setAttribute("aria-label", this.isChineseDisplayLanguage() ? "取消本次操作" : "Cancel this action");
    closeButton.addEventListener("click", () => {
      this.close();
    });
  }

  showConfirmButton(buttonWrapper: HTMLDivElement) {
    const removeLinkButton = buttonWrapper.createEl("button", {
      text: this.isChineseDisplayLanguage() ? "确认删除" : "Delete",
    });
    removeLinkButton.setAttribute(
      "aria-label",
      this.isChineseDisplayLanguage()
        ? "继续删除当前文件及其所有未被其他笔记重复引用的附件"
        : "Continue deleting the current file and its attachments that are not referenced by other notes"
    );
    removeLinkButton.addClass("mod-warning");
    removeLinkButton.addEventListener("click", async () => {
      await deleteFile(this.note, this.plugin);
      await deleteAllAttachs(this.plugin, this.note);
      this.close();
    });
  }
}
