import { App, Modal } from "obsidian";

export class ClearUnusedLogsModal extends Modal {
  title: string;
  textToView: string;

  constructor(title: string, textToView: string, app: App) {
    super(app);
    this.title = title;
    this.textToView = textToView;
  }

  onOpen() {
    const { contentEl } = this;

    const headerWrapper = contentEl.createEl("div");
    headerWrapper.addClass("unused-images-center-wrapper");
    const headerEl = headerWrapper.createEl("h1", { text: this.title });
    headerEl.addClass("modal-title");

    const logs = contentEl.createEl("div");
    logs.addClass("unused-images-logs");
    logs.innerHTML = this.textToView;

    const buttonWrapper = contentEl.createEl("div");
    buttonWrapper.addClass("unused-images-center-wrapper");
    const closeButton = buttonWrapper.createEl("button", { text: "Close" });
    closeButton.addClass("unused-images-button");
    closeButton.addEventListener("click", () => {
      this.close();
    });
  }
}
