import { App, Editor, EditorPosition, FileSystemAdapter } from "obsidian";

const loadImageBlobTimeout = 3000;

export interface ElectronWindow extends Window {
  WEBVIEW_SERVER_URL: string;
}

export interface EditorInternalApi extends Editor {
  posAtMouse(event: MouseEvent): EditorPosition;
  getClickableTokenAt(position: EditorPosition): { text: string } | null;
}

export interface FileSystemAdapterWithInternalApi extends FileSystemAdapter {
  open(path: string): Promise<void>;
}

export interface AppWithDesktopInternalApi extends App {
  openWithDefaultApp(path: string): Promise<void>;
  showInFolder(path: string): Promise<void>;
}

export interface Listener {
  (this: Document, ev: Event): any;
}

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  avif: "image/avif",
};

export function withTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  const timeout = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(`timed out after ${ms} ms`);
    }, ms);
  });

  return Promise.race([promise, timeout]) as Promise<T>;
}

export async function loadImageBlob(imgSrc: string, retryCount = 0): Promise<Blob> {
  const loadImageBlobCore = () => {
    return new Promise<Blob>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }
        ctx.drawImage(image, 0, 0);
        canvas.toBlob((blob: Blob | null) => {
          if (!blob) {
            reject(new Error("Failed to create image blob"));
            return;
          }
          resolve(blob);
        });
      };
      image.onerror = async () => {
        if (retryCount < 3) {
          try {
            await fetch(image.src, { mode: "no-cors" });
            const blob = await loadImageBlob(
              `https://api.allorigins.win/raw?url=${encodeURIComponent(imgSrc)}`,
              retryCount + 1
            );
            resolve(blob);
          } catch {
            reject(new Error("Failed to load image"));
          }
        } else {
          reject(new Error("Unable to retrieve the image data after 3 retries."));
        }
      };
      image.src = imgSrc;
    });
  };

  return withTimeout(loadImageBlobTimeout, loadImageBlobCore());
}

export function getImageMimeTypeFromExtension(extension: string): string {
  return IMAGE_MIME_BY_EXTENSION[extension.toLowerCase()] ?? "application/octet-stream";
}

async function blobToImageElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode image blob."));
    };
    image.src = objectUrl;
  });
}

export async function convertImageBlobToPng(blob: Blob): Promise<Blob> {
  const image = await blobToImageElement(blob);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  ctx.drawImage(image, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((pngBlob) => {
      if (!pngBlob) {
        reject(new Error("Failed to convert image blob to PNG."));
        return;
      }
      resolve(pngBlob);
    }, "image/png");
  });
}

export async function normalizeImageBlobForClipboard(
  blob: Blob,
  mimeType: string
): Promise<{ blob: Blob; mimeType: string; convertedToPng: boolean }> {
  if (mimeType === "image/png") {
    return { blob, mimeType, convertedToPng: false };
  }

  const pngBlob = await convertImageBlobToPng(blob);
  return { blob: pngBlob, mimeType: "image/png", convertedToPng: true };
}

export function onElement(
  el: Document,
  event: keyof HTMLElementEventMap,
  selector: string,
  listener: Listener,
  options?: { capture?: boolean }
) {
  const delegatedListener = (ev: Event) => {
    const target = ev.target as HTMLElement;
    if (!target || typeof target.matches !== "function") {
      return;
    }

    let matchedElement: HTMLElement | null = null;
    try {
      if (target.matches(selector)) {
        matchedElement = target;
      } else {
        matchedElement = target.closest(selector);
      }
    } catch (e) {
      console.error("[AttachFlow] Error matching selector:", selector, e);
      return;
    }

    if (matchedElement) {
      listener.call(el, ev);
    }
  };

  el.addEventListener(event, delegatedListener, options);
  return () => el.removeEventListener(event, delegatedListener, options);
}
