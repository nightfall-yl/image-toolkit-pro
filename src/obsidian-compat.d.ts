import "obsidian";
import type {
  Editor,
  TAbstractFile,
  TFile,
} from "obsidian";

export {};

declare module "obsidian" {
  interface Plugin {
    ensureFolderExists(folderPath: string): Promise<void>;
  }

  interface Vault {
    getConfig(key: string): any;
    exists(path: string): Promise<boolean>;
  }

  interface Workspace {
    activeEditor: {
      file: TFile | null;
      editor: Editor;
      getSelection(): string;
    };
  }

  interface DataAdapter {
    basePath: string;
    exists(path: string, sensitive?: boolean): Promise<boolean>;
    readBinary(path: string): Promise<ArrayBuffer>;
  }

  interface TAbstractFile {
    children?: TAbstractFile[];
  }

  interface App {
    internalPlugins: {
      getEnabledPluginById(id: string): {
        revealInFolder(file: TAbstractFile): void;
      } | null;
    };
  }
}
