import { Editor, MarkdownView, Menu, MenuItem, Notice, Platform, TFile } from "obsidian";
import { EditorView } from "@codemirror/view";
import LocalImagesPlugin from "./main";
import {
  AppWithDesktopInternalApi,
  getImageMimeTypeFromExtension,
  loadImageBlob,
  normalizeImageBlobForClipboard,
  onElement,
} from "./attachflowHelpers";
import { getMouseEventTarget } from "./attachflowEvent";
import { DeleteAllLogsModal } from "./attachflowModal";
import {
  deleteCurTargetLink,
  handlerDelFileNew,
  handlerMoveFile,
  handlerRenameFile,
  print,
  setDebug,
} from "./attachflowUtil";

interface MatchedLinkInLine {
  old_link: string;
  new_link: string;
  from_ch: number;
  to_ch: number;
}

export class AttachFlowFeature {
  plugin: LocalImagesPlugin;
  edgeSize = 20;
  observer?: MutationObserver;
  watcher?: VideoDivWidthChangeWatcher;
  highlightedExplorerPath: string | null = null;
  explorerHighlightSuppressTimer: number | null = null;
  imageExtensions = new Set(["png", "jpg", "jpeg", "gif", "bmp", "svg", "webp", "avif"]);

  constructor(plugin: LocalImagesPlugin) {
    this.plugin = plugin;
  }

  private isChineseDisplayLanguage() {
    const displayLang = document.documentElement.lang?.toLowerCase() ?? "";
    return displayLang.startsWith("zh");
  }

  private isImageFile(file: TFile) {
    return this.imageExtensions.has(file.extension.toLowerCase());
  }

  private getReferencingMarkdownNotes(file: TFile) {
    const refs: TFile[] = [];
    const resolvedLinks = this.plugin.app.metadataCache.resolvedLinks;

    for (const [sourcePath, linkedPaths] of Object.entries(resolvedLinks)) {
      if (!linkedPaths[file.path]) {
        continue;
      }
      const sourceFile = this.plugin.app.vault.getAbstractFileByPath(sourcePath);
      if (!(sourceFile instanceof TFile) || !sourceFile.path.endsWith(".md")) {
        continue;
      }
      refs.push(sourceFile);
    }

    refs.sort((a, b) => a.path.localeCompare(b.path));
    return refs;
  }

  private async openSourceNoteForImage(file: TFile) {
    const notes = this.getReferencingMarkdownNotes(file);
    if (notes.length === 0) {
      new Notice(this.isChineseDisplayLanguage() ? "没有找到引用这张图片的笔记。" : "No note references this image.");
      return;
    }

    await this.plugin.app.workspace.getLeaf(true).openFile(notes[0]);

    if (notes.length > 1) {
      new Notice(
        this.isChineseDisplayLanguage()
          ? `找到了多个引用笔记，已打开第一个：${notes[0].basename}`
          : `Multiple notes reference this image. Opened the first one: ${notes[0].basename}`
      );
    }
  }

  private isInsidePreviewClickZone(target: HTMLImageElement, evt: MouseEvent) {
    const rect = target.getBoundingClientRect();
    const edgeSize = Math.min(this.edgeSize, rect.width / 4, rect.height / 4);
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;

    return x > edgeSize && y > edgeSize && x < rect.width - edgeSize && y < rect.height - edgeSize;
  }

  async onload() {
    this.registerDocument(document);

    this.plugin.registerEvent(
      this.plugin.app.workspace.on("window-open", (workspaceWindow, window) => {
        this.registerDocument(window.document);
      })
    );

    this.plugin.registerEvent(
      this.plugin.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFile)) {
          return;
        }

        if (file.path.endsWith(".md")) {
          menu.addItem((item: MenuItem) => {
            item
              .setTitle(this.isChineseDisplayLanguage() ? "删除文件及其附件" : "Delete Current Note and Its Attachments")
              .setIcon("trash-2")
              .setSection("danger")
              .onClick(() => {
                new DeleteAllLogsModal(file, this.plugin).open();
              });
          });
          return;
        }

        if (!this.isImageFile(file) || this.getReferencingMarkdownNotes(file).length === 0) {
          return;
        }

        menu.addItem((item: MenuItem) => {
          item
            .setTitle(this.isChineseDisplayLanguage() ? "跳转到原笔记" : "Go to Source Note")
            .setIcon("file-input")
            .onClick(async () => {
              await this.openSourceNoteForImage(file);
            });
        });
      })
    );

    this.plugin.addCommand({
      id: "attachflow-clear-all-attachments-in-current-file",
      name: "Delete Current Note and Its Attachments",
      callback: async () => {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!activeFile) {
          new Notice(this.isChineseDisplayLanguage() ? "当前没有活动笔记。" : "There is no active note.");
          return;
        }
        new DeleteAllLogsModal(activeFile, this.plugin).open();
      },
    });

    this.plugin.registerDomEvent(document, "click", async (evt: MouseEvent) => {
      if (!this.plugin.settings.clickPreviewEnabled) {
        return;
      }
      const target = evt.target as HTMLElement;
      if (target.tagName !== "IMG") {
        this.removeZoomedImage();
        return;
      }
      if (!this.isInsidePreviewClickZone(target as HTMLImageElement, evt)) {
        return;
      }
      if (document.getElementById("af-zoomed-image")) {
        evt.preventDefault();
        this.removeZoomedImage();
        return;
      }
      evt.preventDefault();
      createZoomMask();
      const { zoomedImage, originalWidth, originalHeight } = await createZoomedImage(
        (target as HTMLImageElement).src,
        this.plugin.settings.previewAdaptiveRatio
      );
      const scaleDiv = createZoomScaleDiv(zoomedImage, originalWidth, originalHeight);
      zoomedImage.addEventListener("wheel", (e) =>
        handleZoomMouseWheel(e, zoomedImage, originalWidth, originalHeight, scaleDiv)
      );
      zoomedImage.addEventListener("contextmenu", (e) =>
        handleZoomContextMenu(e, zoomedImage, originalWidth, originalHeight, scaleDiv)
      );
      zoomedImage.addEventListener("mousedown", (e) => handleZoomDragStart(e, zoomedImage));
      zoomedImage.addEventListener("dblclick", () => {
        adaptivelyDisplayImage(
          zoomedImage,
          originalWidth,
          originalHeight,
          this.plugin.settings.previewAdaptiveRatio
        );
        updateZoomScaleDiv(scaleDiv, zoomedImage, originalWidth, originalHeight);
      });
    });

    this.plugin.registerDomEvent(document, "keydown", (evt: KeyboardEvent) => {
      if (evt.key === "Escape") {
        this.removeZoomedImage();
      }
    });

    this.initMutationObserver();
    window.setTimeout(() => {
      this.watcher = new VideoDivWidthChangeWatcher();
    }, 1000);

    this.plugin.registerEvent(
      this.plugin.app.workspace.on("file-open", () => {
        this.watcher?.disconnect();
        this.watcher = new VideoDivWidthChangeWatcher();
      })
    );

    setDebug(this.plugin.settings.debugMode);
  }

  onunload() {
    this.observer?.disconnect();
    this.watcher?.disconnect();
    if (this.explorerHighlightSuppressTimer !== null) {
      window.clearTimeout(this.explorerHighlightSuppressTimer);
      this.explorerHighlightSuppressTimer = null;
    }
    document.body.classList.remove("af-suppress-file-explorer-flash");
    this.clearFileExplorerHighlight();
  }

  refreshDebug() {
    setDebug(this.plugin.settings.debugMode);
  }

  initMutationObserver() {
    const targetNode = document.querySelector(".workspace");
    if (!targetNode) {
      return;
    }

    const config = { childList: true, subtree: true };
    const callback = (mutationsList: MutationRecord[]) => {
      for (const mutation of mutationsList) {
        if (!mutation.addedNodes.length) {
          continue;
        }
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) {
            return;
          }
          const videos = node.querySelectorAll("video");
          videos.forEach((video) => {
            const parentDiv = video.closest(".internal-embed.media-embed.video-embed.is-loaded");
            if (parentDiv && parentDiv.getAttribute("width")) {
              video.style.width = `${parentDiv.getAttribute("width")}px`;
            }
          });

          this.applyFileExplorerHighlight();
        });
      }
    };

    this.observer = new MutationObserver(callback);
    this.observer.observe(targetNode, config);
  }

  removeZoomedImage() {
    const zoomedImage = document.getElementById("af-zoomed-image");
    if (zoomedImage) {
      document.body.removeChild(zoomedImage);
    }
    const scaleDiv = document.getElementById("af-scale-div");
    if (scaleDiv) {
      document.body.removeChild(scaleDiv);
    }
    const mask = document.getElementById("af-mask");
    if (mask) {
      document.body.removeChild(mask);
    }
  }

  private getEscapedSelectorPath(filePath: string) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(filePath);
    }

    return filePath.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  private clearFileExplorerHighlight() {
    document
      .querySelectorAll(".af-file-explorer-highlight, .af-file-explorer-highlight-label")
      .forEach((element) => {
        element.classList.remove("af-file-explorer-highlight", "af-file-explorer-highlight-label");
      });
  }

  private clearNativeFileExplorerActiveState() {
    document
      .querySelectorAll('.workspace-leaf-content[data-type="file-explorer"] .is-active, .workspace-leaf-content[data-type="file-explorer"] .mod-active')
      .forEach((element) => {
        element.classList.remove("is-active", "mod-active");
      });

    document
      .querySelectorAll('.workspace-leaf-content[data-type="file-explorer"] [aria-selected="true"]')
      .forEach((element) => {
        element.setAttribute("aria-selected", "false");
      });
  }

  private applyFileExplorerHighlight() {
    this.clearNativeFileExplorerActiveState();
    this.clearFileExplorerHighlight();

    if (!this.highlightedExplorerPath) {
      return;
    }

    const escapedPath = this.getEscapedSelectorPath(this.highlightedExplorerPath);
    const candidates = document.querySelectorAll(
      `.workspace-leaf-content[data-type="file-explorer"] [data-path="${escapedPath}"]`
    );

    candidates.forEach((element) => {
      const container = element.closest(".tree-item-self") ?? element;
      container.classList.add("af-file-explorer-highlight");
      if (container instanceof HTMLElement) {
        container.scrollIntoView({ block: "nearest" });
      }

      const label =
        element.matches(".nav-file-title, .tree-item-self")
          ? element
          : element.querySelector(".nav-file-title") ?? container.querySelector(".nav-file-title");

      label?.classList.add("af-file-explorer-highlight-label");
    });
  }

  private locateFileInExplorer(file: TFile) {
    const abstractFilePath = this.plugin.app.vault.getAbstractFileByPath(file.path);
    document.body.classList.add("af-suppress-file-explorer-flash");
    if (this.explorerHighlightSuppressTimer !== null) {
      window.clearTimeout(this.explorerHighlightSuppressTimer);
    }

    (this.plugin.app as any).internalPlugins.getEnabledPluginById("file-explorer").revealInFolder(abstractFilePath);
    this.highlightedExplorerPath = file.path;
    window.requestAnimationFrame(() => {
      this.clearNativeFileExplorerActiveState();
      this.applyFileExplorerHighlight();
    });
    window.setTimeout(() => {
      this.clearNativeFileExplorerActiveState();
      this.applyFileExplorerHighlight();
    }, 24);
    window.setTimeout(() => {
      this.clearNativeFileExplorerActiveState();
      this.applyFileExplorerHighlight();
    }, 96);
    window.setTimeout(() => {
      this.clearNativeFileExplorerActiveState();
      this.applyFileExplorerHighlight();
    }, 180);
    this.explorerHighlightSuppressTimer = window.setTimeout(() => {
      document.body.classList.remove("af-suppress-file-explorer-flash");
      this.explorerHighlightSuppressTimer = null;
    }, 180);
  }

  registerDocument(doc: Document) {
    this.plugin.register(
      onElement(
        doc,
        "contextmenu" as keyof HTMLElementEventMap,
        "img, iframe, video, div.file-embed-title, audio",
        this.onRightClickMenu.bind(this),
        { capture: true }
      )
    );

    this.plugin.register(
      onElement(doc, "mousedown", "img, video", (event: MouseEvent) => {
        if (!this.plugin.settings.dragResizeEnabled) {
          return;
        }
        const currentMd = this.plugin.app.workspace.getActiveFile();
        if (!currentMd || currentMd.name.endsWith(".canvas")) {
          return;
        }
        const inPreview = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.getMode() === "preview";
        if (inPreview) {
          return;
        }

        if (event.button === 0) {
          event.preventDefault();
        }
        const img = event.target as HTMLImageElement | HTMLVideoElement;
        if (img.id === "af-zoomed-image") {
          return;
        }

        const editor = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        const editorView = (editor as any)?.cm as EditorView;
        if (!editorView) {
          return;
        }
        const targetPos = editorView.posAtDOM(img);
        const inTable = img.closest("table") != null;
        const inCallout = img.closest(".callout") != null;

        const preventEvent = (evt: MouseEvent) => {
          evt.preventDefault();
          evt.stopPropagation();
        };

        const rect = img.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const edgeSize = this.edgeSize;

        if (x < edgeSize || y < edgeSize || x > rect.width - edgeSize || y > rect.height - edgeSize) {
          const startX = event.clientX;
          const startWidth = img.clientWidth;
          const startHeight = img.clientHeight;
          let lastUpdateX = startX;
          let lastUpdate = 1;
          let updatedWidth = startWidth;
          let lastMoveTime = Date.now();

          const onMouseMove = (moveEvent: MouseEvent) => {
            img.addEventListener("click", preventEvent);
            const currentX = moveEvent.clientX;
            lastUpdate = currentX - lastUpdateX === 0 ? lastUpdate : currentX - lastUpdateX;
            let newWidth = startWidth + (currentX - startX);
            const aspectRatio = startWidth / startHeight;
            newWidth = Math.max(Math.round(newWidth), 100);
            const newHeight = Math.round(newWidth / aspectRatio);
            updatedWidth = newWidth;

            img.classList.add("image-in-drag-resize");
            img.style.width = `${newWidth}px`;

            const now = Date.now();
            if (now - lastMoveTime < 100) {
              return;
            }
            lastMoveTime = now;
            this.updateImageLinkWithNewSize(img, targetPos, newWidth, newHeight);
            lastUpdateX = moveEvent.clientX;
          };

          const allowOtherEvent = () => {
            img.removeEventListener("click", preventEvent);
          };

          const onMouseUp = (upEvent: MouseEvent) => {
            window.setTimeout(allowOtherEvent, 100);
            upEvent.preventDefault();
            img.classList.remove("image-in-drag-resize", "image-ready-click-view");
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);

            if (this.plugin.settings.dragResizeStep > 1) {
              const resizeInterval = this.plugin.settings.dragResizeStep;
              const widthOffset = lastUpdate > 0 ? resizeInterval : 0;
              if (updatedWidth % resizeInterval !== 0) {
                updatedWidth = Math.floor(updatedWidth / resizeInterval) * resizeInterval + widthOffset;
              }
              img.style.width = `${updatedWidth}px`;
              this.updateImageLinkWithNewSize(img, targetPos, updatedWidth, 0);
            }
          };

          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        }
      })
    );

    this.plugin.register(
      onElement(doc, "mouseover", "img, video", (event: MouseEvent) => {
        const currentMd = this.plugin.app.workspace.getActiveFile();
        if (!currentMd || currentMd.name.endsWith(".canvas")) {
          return;
        }
        const inPreview = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.getMode() === "preview";
        const img = event.target as HTMLImageElement | HTMLVideoElement;
        const edgeSize = this.edgeSize;
        if (img.id === "af-zoomed-image") {
          return;
        }

        let lastMove = 0;
        const mouseOverHandler = (moveEvent: MouseEvent) => {
          if (moveEvent.buttons !== 0) {
            return;
          }
          const now = Date.now();
          if (now - lastMove < 100) {
            return;
          }
          lastMove = now;

          const rect = img.getBoundingClientRect();
          const x = moveEvent.clientX - rect.left;
          const y = moveEvent.clientY - rect.top;

          if ((x >= rect.width - edgeSize || x <= edgeSize || y >= rect.height - edgeSize || y <= edgeSize)) {
            if (this.plugin.settings.dragResizeEnabled && !inPreview) {
              img.classList.remove("image-ready-click-view");
              img.classList.add("image-ready-resize");
            } else if (inPreview && this.plugin.settings.clickPreviewEnabled) {
              img.classList.add("image-ready-click-view");
              img.classList.remove("image-ready-resize");
            }
          } else if (this.plugin.settings.clickPreviewEnabled) {
            img.classList.add("image-ready-click-view");
            img.classList.remove("image-ready-resize");
          } else {
            img.classList.remove("image-ready-click-view", "image-ready-resize");
          }
        };
        this.plugin.registerDomEvent(img, "mousemove", mouseOverHandler);
      })
    );

    this.plugin.register(
      onElement(doc, "mouseout", "img, video", (event: MouseEvent) => {
        const currentMd = this.plugin.app.workspace.getActiveFile();
        if (!currentMd || currentMd.name.endsWith(".canvas")) {
          return;
        }
        if (event.buttons !== 0) {
          return;
        }
        const img = event.target as HTMLImageElement | HTMLVideoElement;
        if (this.plugin.settings.clickPreviewEnabled || this.plugin.settings.dragResizeEnabled) {
          img.classList.remove("image-ready-click-view", "image-ready-resize");
        }
      })
    );

    this.plugin.register(
      onElement(doc, "mousedown", "img", this.externalImageContextMenuCall.bind(this))
    );
  }

  registerEscapeButton(menu: Menu, doc: Document = document) {
    menu.register(
      onElement(doc, "keydown" as keyof HTMLElementEventMap, "*", (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          menu.hide();
        }
      })
    );
  }

  updateImageLinkWithNewSize = (
    img: HTMLImageElement | HTMLVideoElement,
    targetPos: number,
    newWidth: number,
    newHeight: number
  ) => {
    const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    const inTable = img.closest("table") != null;
    const inCallout = img.closest(".callout") != null;
    const isExcalidraw = img.classList.contains("excalidraw-embedded-img");
    if (!activeView) {
      return;
    }

    let imageName = img.getAttribute("src");
    if (imageName?.startsWith("http")) {
      updateExternalLink(activeView, img, targetPos, newWidth, newHeight, inTable, inCallout);
    } else if (isExcalidraw) {
      const drawBaseName = getExcalidrawBaseName(img as HTMLImageElement);
      img.style.maxWidth = "none";
      updateInternalLink(activeView, targetPos, drawBaseName, newWidth, inTable, inCallout);
    } else {
      imageName = img.closest(".internal-embed")?.getAttribute("src") as string;
      updateInternalLink(activeView, targetPos, imageName, newWidth, inTable, inCallout);
    }
  };

  externalImageContextMenuCall(event: MouseEvent) {
    const img = event.target as HTMLImageElement;
    const inTable = img.closest("table") != null;
    const inCallout = img.closest(".callout") != null;
    if (img.id === "af-zoomed-image" || !img.src.startsWith("http") || event.button !== 2) {
      return;
    }

    event.preventDefault();
    this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor?.blur();
    img.classList.remove("image-ready-click-view", "image-ready-resize");
    const menu = new Menu();
    const inPreview = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.getMode() === "preview";
    if (inPreview) {
      this.addExternalImageMenuPreviewMode(menu, img);
    } else {
      this.addExternalImageMenuSourceMode(menu, img, inTable, inCallout);
    }

    this.registerEscapeButton(menu);

    let offset = 0;
    if (!inPreview && (inTable || inCallout)) {
      offset = -138;
    }
    menu.showAtPosition({ x: event.pageX, y: event.pageY + offset });
    this.plugin.app.workspace.trigger("AttachFlow:contextmenu", menu);
  }

  addMenuExtendedSourceMode = (
    menu: Menu,
    fileBaseName: string,
    currentMd: TFile,
    targetType: string,
    targetPos: number,
    inTable: boolean,
    inCallout: boolean
  ) => {
    this.addMenuExtendedPreviewMode(menu, fileBaseName, currentMd);
    menu.addItem((item: MenuItem) =>
      item.setIcon("pencil").setTitle("重命名").onClick(() => {
        handlerRenameFile(this.plugin, fileBaseName, currentMd);
      })
    );

    if (this.plugin.settings.showMoveFileMenu) {
      menu.addItem((item: MenuItem) =>
        item.setIcon("folder-tree").setTitle("移动文件到...").onClick(() => {
          handlerMoveFile(this.plugin, fileBaseName, currentMd);
        })
      );
    }

    menu.addItem((item: MenuItem) =>
      item.setIcon("trash-2").setTitle("删除文件及对应链接").onClick(async () => {
        await handlerDelFileNew(this.plugin, fileBaseName, currentMd, targetType, targetPos, inTable, inCallout);
      })
    );
  };

  addMenuExtendedPreviewMode = (menu: Menu, fileBaseName: string, currentMd: TFile) => {
    const file = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.app.metadataCache.getFirstLinkpathDest(fileBaseName, currentMd.path)?.path ?? fileBaseName
    ) as TFile | null;
    if (!(file instanceof TFile)) {
      return;
    }

    menu.addItem((item: MenuItem) =>
      item.setIcon("copy").setTitle("复制图片到剪贴板").onClick(async () => {
        try {
          const sourceMimeType = getImageMimeTypeFromExtension(file.extension);
          const sourceBlob = new Blob([await file.vault.readBinary(file)], {
            type: sourceMimeType,
          });
          const { blob, mimeType, convertedToPng } = await normalizeImageBlobForClipboard(sourceBlob, sourceMimeType);
          await navigator.clipboard.write([new ClipboardItem({ [mimeType]: blob })]);
          new Notice(convertedToPng ? "已复制到剪贴板（已自动转换为 PNG）" : "已复制到剪贴板");
        } catch (error) {
          console.error("Failed to copy image:", error);
          new Notice("复制文件失败！");
        }
      })
    );

    menu.addItem((item: MenuItem) =>
      item.setIcon("arrow-up-right").setTitle("使用默认应用打开").onClick(() => {
        (this.plugin.app as AppWithDesktopInternalApi).openWithDefaultApp(file.path);
      })
    );
    menu.addItem((item: MenuItem) =>
      item
        .setIcon("arrow-up-right")
        .setTitle(Platform.isMacOS ? "在 Finder 中显示" : "在系统资源管理器中显示")
        .onClick(() => {
          (this.plugin.app as AppWithDesktopInternalApi).showInFolder(file.path);
        })
    );
    menu.addItem((item: MenuItem) =>
      item.setIcon("folder").setTitle("在导航中定位文件").onClick(() => {
        this.locateFileInExplorer(file);
      })
    );
  };

  addExternalImageMenuPreviewMode = (menu: Menu, img: HTMLImageElement) => {
    menu.addItem((item: MenuItem) =>
      item.setIcon("copy").setTitle("复制图片到剪贴板").onClick(async () => {
        try {
          const blob = await loadImageBlob(img.src);
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          new Notice("已复制到剪贴板");
        } catch {
          new Notice("复制图片失败！");
        }
      })
    );

    menu.addItem((item: MenuItem) =>
      item.setIcon("link").setTitle("复制图片链接").onClick(async () => {
        navigator.clipboard.writeText(img.src);
      })
    );
    menu.addItem((item: MenuItem) =>
      item.setIcon("link").setTitle("复制 Markdown 链接").onClick(async () => {
        navigator.clipboard.writeText(`![](${img.src})`);
      })
    );
    menu.addItem((item: MenuItem) =>
      item.setIcon("external-link").setTitle("在外部浏览器中打开").onClick(async () => {
        window.open(img.src, "_blank");
      })
    );
  };

  addExternalImageMenuSourceMode = (menu: Menu, img: HTMLImageElement, inTable: boolean, inCallout: boolean) => {
    this.addExternalImageMenuPreviewMode(menu, img);
    menu.addItem((item: MenuItem) =>
      item.setIcon("trash-2").setTitle("删除图片链接").onClick(() => {
        const editor = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        const editorView = (editor as any)?.cm as EditorView;
        if (!editorView) {
          return;
        }
        const targetPos = editorView.posAtDOM(img);
        deleteCurTargetLink(this.plugin, img.src, targetPos, inTable, inCallout);
      })
    );
  };

  onRightClickMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const target = getMouseEventTarget(event);
    const curTargetType = target.localName;
    if (target.id === "af-zoomed-image") {
      return;
    }

    const currentMd = this.plugin.app.workspace.getActiveFile();
    if (!currentMd) {
      return;
    }
    const inCanvas = currentMd.name.endsWith(".canvas");
    const supportedTargetType = ["img", "iframe", "video", "div", "audio"];
    if (!supportedTargetType.includes(curTargetType)) {
      return;
    }

    const menu = new Menu();
    const inTable = target.closest("table") != null;
    const inCallout = target.closest(".callout") != null;
    const inPreview = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.getMode() === "preview";
    const isExcalidraw = target.classList.contains("excalidraw-embedded-img");

    let targetName = target.getAttribute("src") as string;
    if (targetName && targetName.startsWith("http")) {
      return;
    }

    if (inCanvas) {
      if (target.parentElement?.classList.contains("canvas-node-content")) {
        return;
      }
      return;
    }

    target.classList.remove("image-ready-click-view", "image-ready-resize");

    if (isExcalidraw) {
      targetName = getExcalidrawBaseName(target as HTMLImageElement).replace(/^(\.\.\/)+/g, "");
    } else {
      targetName = (target.closest(".internal-embed")?.getAttribute("src") as string)?.replace(/^(\.\.\/)+/g, "");
      const pdfMatch = targetName?.match(/.*\.pdf/);
      targetName = pdfMatch ? pdfMatch[0] : targetName;
      if (curTargetType === "img" && pdfMatch) {
        return;
      }
    }

    if (!targetName) {
      return;
    }

    if (inPreview) {
      this.addMenuExtendedPreviewMode(menu, targetName, currentMd);
    } else {
      const editor = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
      const editorView = (editor as any)?.cm as EditorView;
      if (!editorView) {
        return;
      }
      const targetPos = editorView.posAtDOM(target);
      this.addMenuExtendedSourceMode(menu, targetName, currentMd, curTargetType, targetPos, inTable, inCallout);
    }

    this.registerEscapeButton(menu);

    const isLinux = navigator.userAgent.toLowerCase().includes("linux");
    let offset = isLinux ? -138 : -163;
    if (this.plugin.settings.showMoveFileMenu) {
      offset -= 25;
    }
    if (inTable && !inPreview) {
      menu.showAtPosition({ x: event.pageX, y: event.pageY + offset });
    } else {
      menu.showAtPosition({ x: event.pageX, y: event.pageY });
    }
    this.plugin.app.workspace.trigger("AttachFlow:contextmenu", menu);
  }
}

function updateInternalLink(
  activeView: MarkdownView,
  targetPos: number,
  imageName: string,
  newWidth: number,
  inTable: boolean,
  inCallout: boolean
): void {
  const editor = activeView.editor;
  const editorView = (editor as any).cm as EditorView;
  const targetLine = editorView.state.doc.lineAt(targetPos);

  if (!inCallout && !inTable) {
    const matched = matchLineWithInternalLink(targetLine.text, imageName, newWidth, inTable);
    if (matched.length === 1) {
      editorView.dispatch({
        changes: {
          from: targetLine.from + matched[0].from_ch,
          to: targetLine.from + matched[0].to_ch,
          insert: matched[0].new_link,
        },
      });
    } else if (matched.length > 1) {
      new Notice("当前行中找到多个相同图片链接，请手动调整缩放。");
    }
    return;
  }

  updateGroupedLink(activeView, targetLine.number, imageName, newWidth, inTable ? /^\s*\|/ : /^>/, "internal", inTable);
}

function updateExternalLink(
  activeView: MarkdownView,
  target: HTMLImageElement | HTMLVideoElement,
  targetPos: number,
  newWidth: number,
  newHeight: number,
  inTable: boolean,
  inCallout: boolean
): void {
  const editor = activeView.editor;
  const editorView = (editor as any).cm as EditorView;
  const targetLine = editorView.state.doc.lineAt(targetPos);
  const link = target.getAttribute("src") as string;
  const altText = target.getAttribute("alt") as string;

  if (!inCallout && !inTable) {
    const matched = matchLineWithExternalLink(targetLine.text, link, altText, newWidth, inTable);
    if (matched.length === 1) {
      editorView.dispatch({
        changes: {
          from: targetLine.from + matched[0].from_ch,
          to: targetLine.from + matched[0].to_ch,
          insert: matched[0].new_link,
        },
      });
    } else if (matched.length > 1) {
      new Notice("当前行中找到多个相同图片链接，请手动调整缩放。");
    }
    return;
  }

  updateGroupedLink(activeView, targetLine.number, link, newWidth, inTable ? /^\s*\|/ : /^>/, "external", inTable, altText);
}

function updateGroupedLink(
  activeView: MarkdownView,
  startLineNumber: number,
  targetName: string,
  newWidth: number,
  startReg: RegExp,
  kind: "internal" | "external",
  inTable: boolean,
  altText?: string
) {
  const editor = activeView.editor;
  const editorView = (editor as any).cm as EditorView;
  const matchedResults: MatchedLinkInLine[] = [];
  const matchedLines: number[] = [];

  for (let i = startLineNumber; i <= editor.lineCount(); i++) {
    const line = editorView.state.doc.line(i);
    if (!startReg.test(line.text)) {
      break;
    }
    const matched =
      kind === "internal"
        ? matchLineWithInternalLink(line.text, targetName, newWidth, inTable)
        : matchLineWithExternalLink(line.text, targetName, altText ?? "", newWidth, inTable);
    matchedResults.push(...matched);
    matchedLines.push(...new Array(matched.length).fill(i));
  }

  for (let i = startLineNumber - 1; i >= 1; i--) {
    const line = editorView.state.doc.line(i);
    if (!startReg.test(line.text)) {
      break;
    }
    const matched =
      kind === "internal"
        ? matchLineWithInternalLink(line.text, targetName, newWidth, inTable)
        : matchLineWithExternalLink(line.text, targetName, altText ?? "", newWidth, inTable);
    matchedResults.push(...matched);
    matchedLines.push(...new Array(matched.length).fill(i));
  }

  if (matchedResults.length === 1) {
    const targetLine = editorView.state.doc.line(matchedLines[0]);
    if (inTable) {
      const oldText = targetLine.text;
      const newLineText =
        oldText.substring(0, matchedResults[0].from_ch) +
        matchedResults[0].new_link +
        oldText.substring(matchedResults[0].to_ch);
      editorView.dispatch({
        changes: {
          from: targetLine.from,
          to: targetLine.from + oldText.length,
          insert: newLineText,
        },
      });
    } else {
      editorView.dispatch({
        changes: {
          from: targetLine.from + matchedResults[0].from_ch,
          to: targetLine.from + matchedResults[0].to_ch,
          insert: matchedResults[0].new_link,
        },
      });
    }
  } else if (matchedResults.length === 0) {
    new Notice("未找到当前图片链接，请手动调整缩放。");
  } else {
    new Notice("找到多个相同图片链接，请手动调整缩放。");
  }
}

function matchLineWithInternalLink(lineText: string, targetName: string, newWidth: number, inTable: boolean): MatchedLinkInLine[] {
  const regWikiLink = /\!\[\[[^\[\]]*?\]\]/g;
  const regMdLink = /\!\[[^\[\]]*?\]\(\s*[^\[\]\{\}']*\s*\)/g;
  const targetNameMdLink = targetName.replace(/ /g, "%20");
  if (!lineText.includes(targetName) && !lineText.includes(targetNameMdLink)) {
    return [];
  }

  const result: MatchedLinkInLine[] = [];
  while (true) {
    const wikiMatch = regWikiLink.exec(lineText);
    if (!wikiMatch) {
      break;
    }
    const matchedLink = wikiMatch[0];
    if (matchedLink.includes(targetName)) {
      const normalLink = inTable ? matchedLink.replace(/\\\|/g, "|") : matchedLink;
      const linkMatch = normalLink.match(/!\[\[(.*?)(\||\]\])/);
      const linkText = linkMatch ? linkMatch[1] : "";

      const altMatch = matchedLink.match(/!\[\[.*?(\|(.*?))\]\]/);
      const altText = altMatch ? altMatch[1] : "";
      const altTextList = altText.split("|");
      let altTextWithoutSize = "";
      for (const alt of altTextList) {
        if (!/^\d+$/.test(alt) && !/^\s*$/.test(alt)) {
          altTextWithoutSize = `${altTextWithoutSize}|${alt}`;
        }
      }
      let newAltText = newWidth !== 0 ? `${altTextWithoutSize}|${newWidth}` : altTextWithoutSize;
      newAltText = inTable ? newAltText.replace(/\|/g, "\\|") : newAltText;
      const newWikiLink = linkMatch ? `![[${linkText}${newAltText}]]` : `![[${targetName}${newAltText}]]`;

      result.push({
        old_link: matchedLink,
        new_link: newWikiLink,
        from_ch: wikiMatch.index,
        to_ch: wikiMatch.index + matchedLink.length,
      });
    }
  }

  while (true) {
    const match = regMdLink.exec(lineText);
    if (!match) {
      break;
    }
    const matchedLink = match[0];
    if (matchedLink.includes(targetNameMdLink)) {
      const altTextMatch = matchedLink.match(/\[.*?\]/g) as string[];
      const altText = altTextMatch[0].substring(1, altTextMatch[0].length - 1);
      let pureAlt = altText.replace(/\|\d+(\|\d+)?$/g, "");
      if (inTable) {
        pureAlt = altText.replace(/\\\|\d+(\|\d+)?$/g, "");
      }
      const linkText = matchedLink.substring(altTextMatch[0].length + 2, matchedLink.length - 1);
      let newMdLink = inTable ? `![${pureAlt}\\|${newWidth}](${linkText})` : `![${pureAlt}|${newWidth}](${linkText})`;
      if (/^\d*$/.test(altText)) {
        newMdLink = `![${newWidth}](${linkText})`;
      }
      result.push({
        old_link: matchedLink,
        new_link: newMdLink,
        from_ch: match.index,
        to_ch: match.index + matchedLink.length,
      });
    }
  }

  return result;
}

function matchLineWithExternalLink(
  lineText: string,
  link: string,
  altText: string,
  newWidth: number,
  inTable: boolean
): MatchedLinkInLine[] {
  const result: MatchedLinkInLine[] = [];
  const regMdLink = /\!\[[^\[\]]*?\]\(\s*[^\[\]\{\}']*\s*\)/g;
  if (!lineText.includes(link)) {
    return [];
  }

  while (true) {
    const match = regMdLink.exec(lineText);
    if (!match) {
      break;
    }
    const matchedLink = match[0];
    if (matchedLink.includes(link)) {
      const altTextMatch = matchedLink.match(/\[.*?\]/g) as string[];
      const altTextInLink = altTextMatch[0].substring(1, altTextMatch[0].length - 1);
      let pureAlt = altTextInLink.replace(/\|\d+(\|\d+)?$/g, "");
      if (inTable) {
        pureAlt = altTextInLink.replace(/\\\|\d+(\|\d+)?$/g, "");
      }
      if (/^\d*$/.test(altTextInLink)) {
        pureAlt = "";
      }
      const linkText = matchedLink.substring(altTextMatch[0].length + 2, matchedLink.length - 1);
      const newExternalLink = inTable ? `![${pureAlt}\\|${newWidth}](${linkText})` : `![${pureAlt}|${newWidth}](${linkText})`;

      result.push({
        old_link: matchedLink,
        new_link: newExternalLink,
        from_ch: match.index,
        to_ch: match.index + matchedLink.length,
      });
    }
  }

  return result;
}

function createZoomMask(): HTMLDivElement {
  const mask = document.createElement("div");
  mask.id = "af-mask";
  mask.style.position = "fixed";
  mask.style.top = "0";
  mask.style.left = "0";
  mask.style.width = "100%";
  mask.style.height = "100%";
  mask.style.background = "rgba(0, 0, 0, 0.5)";
  mask.style.zIndex = "9998";
  document.body.appendChild(mask);
  return mask;
}

async function createZoomedImage(
  src: string,
  adaptiveRatio: number
): Promise<{ zoomedImage: HTMLImageElement; originalWidth: number; originalHeight: number }> {
  const zoomedImage = document.createElement("img");
  zoomedImage.id = "af-zoomed-image";
  zoomedImage.src = src;
  zoomedImage.style.position = "fixed";
  zoomedImage.style.zIndex = "9999";
  zoomedImage.style.top = "50%";
  zoomedImage.style.left = "50%";
  zoomedImage.style.transform = "translate(-50%, -50%)";
  document.body.appendChild(zoomedImage);

  const originalWidth = zoomedImage.naturalWidth;
  const originalHeight = zoomedImage.naturalHeight;
  adaptivelyDisplayImage(zoomedImage, originalWidth, originalHeight, adaptiveRatio);

  return { zoomedImage, originalWidth, originalHeight };
}

function createZoomScaleDiv(zoomedImage: HTMLImageElement, originalWidth: number, originalHeight: number): HTMLDivElement {
  const scaleDiv = document.createElement("div");
  scaleDiv.id = "af-scale-div";
  scaleDiv.classList.add("af-scale-div");
  scaleDiv.style.zIndex = "10000";
  updateZoomScaleDiv(scaleDiv, zoomedImage, originalWidth, originalHeight);
  document.body.appendChild(scaleDiv);
  return scaleDiv;
}

function updateZoomScaleDiv(
  scaleDiv: HTMLDivElement,
  zoomedImage: HTMLImageElement,
  originalWidth: number,
  originalHeight: number
) {
  const width = zoomedImage.offsetWidth;
  const height = zoomedImage.offsetHeight;
  const scalePercent = (width / originalWidth) * 100;
  scaleDiv.innerText = `${width}×${height} (${scalePercent.toFixed(1)}%)`;
}

function handleZoomMouseWheel(
  e: WheelEvent,
  zoomedImage: HTMLImageElement,
  originalWidth: number,
  originalHeight: number,
  scaleDiv: HTMLDivElement
) {
  e.preventDefault();
  const mouseX = e.clientX;
  const mouseY = e.clientY;
  const scale = e.deltaY > 0 ? 0.95 : 1.05;
  const newWidth = scale * zoomedImage.offsetWidth;
  const newHeight = scale * zoomedImage.offsetHeight;
  const newLeft = mouseX - (mouseX - zoomedImage.offsetLeft) * scale;
  const newTop = mouseY - (mouseY - zoomedImage.offsetTop) * scale;
  zoomedImage.style.width = `${newWidth}px`;
  zoomedImage.style.height = `${newHeight}px`;
  zoomedImage.style.left = `${newLeft}px`;
  zoomedImage.style.top = `${newTop}px`;
  updateZoomScaleDiv(scaleDiv, zoomedImage, originalWidth, originalHeight);
}

function handleZoomContextMenu(
  e: MouseEvent,
  zoomedImage: HTMLImageElement,
  originalWidth: number,
  originalHeight: number,
  scaleDiv: HTMLDivElement
) {
  e.preventDefault();
  zoomedImage.style.width = `${originalWidth}px`;
  zoomedImage.style.height = `${originalHeight}px`;
  zoomedImage.style.left = "50%";
  zoomedImage.style.top = "50%";
  updateZoomScaleDiv(scaleDiv, zoomedImage, originalWidth, originalHeight);
}

function adaptivelyDisplayImage(
  zoomedImage: HTMLImageElement,
  originalWidth: number,
  originalHeight: number,
  adaptiveRatio: number
) {
  zoomedImage.style.left = "50%";
  zoomedImage.style.top = "50%";
  const screenRatio = adaptiveRatio;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  if (originalWidth > screenWidth || originalHeight > screenHeight) {
    if (originalWidth / screenWidth > originalHeight / screenHeight) {
      zoomedImage.style.width = `${screenWidth * screenRatio}px`;
      zoomedImage.style.height = "auto";
    } else {
      zoomedImage.style.height = `${screenHeight * screenRatio}px`;
      zoomedImage.style.width = "auto";
    }
  } else {
    zoomedImage.style.width = `${originalWidth}px`;
    zoomedImage.style.height = `${originalHeight}px`;
  }
}

function handleZoomDragStart(e: MouseEvent, zoomedImage: HTMLImageElement) {
  e.preventDefault();
  let clickX = e.clientX;
  let clickY = e.clientY;

  const updatePosition = (moveEvt: MouseEvent) => {
    const moveX = moveEvt.clientX - clickX;
    const moveY = moveEvt.clientY - clickY;
    zoomedImage.style.left = `${zoomedImage.offsetLeft + moveX}px`;
    zoomedImage.style.top = `${zoomedImage.offsetTop + moveY}px`;
    clickX = moveEvt.clientX;
    clickY = moveEvt.clientY;
  };

  document.addEventListener("mousemove", updatePosition);
  document.addEventListener(
    "mouseup",
    function listener() {
      document.removeEventListener("mousemove", updatePosition);
      document.removeEventListener("mouseup", listener);
    },
    { once: true }
  );
}

function getExcalidrawBaseName(target: HTMLImageElement): string {
  let targetName = target.getAttribute("filesource") as string;
  let fileBaseName = targetName;
  if (fileBaseName.includes("/")) {
    const tempArr = fileBaseName.split("/");
    fileBaseName = tempArr[tempArr.length - 1];
  } else if (fileBaseName.includes("\\")) {
    const tempArr = fileBaseName.split("\\");
    fileBaseName = tempArr[tempArr.length - 1];
  }
  fileBaseName = fileBaseName.endsWith(".md") ? fileBaseName.substring(0, fileBaseName.length - 3) : fileBaseName;
  return fileBaseName;
}

class VideoDivWidthChangeWatcher {
  private observer: MutationObserver;

  constructor() {
    this.observer = new MutationObserver(this.observerCallback);
    const divs = document.querySelectorAll(".internal-embed.media-embed.video-embed.is-loaded");
    divs.forEach((div) => this.observeDiv(div));
  }

  private observeDiv(div: Element) {
    this.observer.observe(div, {
      attributes: true,
      attributeFilter: ["width"],
    });
  }

  private observerCallback = (mutationsList: MutationRecord[]) => {
    for (const mutation of mutationsList) {
      const target = mutation.target as Element;
      if (mutation.type === "attributes" && mutation.attributeName === "width") {
        const video = target.querySelector("video");
        const width = target.getAttribute("width");
        if (video && width) {
          (video as HTMLVideoElement).style.width = `${width}px`;
        }
      }
    }
  };

  disconnect() {
    this.observer.disconnect();
  }
}
