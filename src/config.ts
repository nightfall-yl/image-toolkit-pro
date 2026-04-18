export const APP_NAME = "ImgBox Pro";
export const APP_VERSION = "2026.3";
export const APP_TITLE = `${APP_NAME}  ${APP_VERSION}`;

// Debug mode — replaces the old VERBOSE module variable and attachFlowDebug setting
let _debugMode = false;

function setDebugMode(value: boolean = false) {
	_debugMode = value;
}

function isDebugMode(): boolean {
	return _debugMode;
}

export { isDebugMode, setDebugMode };

export const SUPPORTED_OS = {"win":"win32","unix":"linux,darwin,freebsd,openbsd"};

export const USER_AGENT =
'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82  Safari/537.36';

export const HTML_EMBED =
//html embedded image
/(?<htmlem>\[{0,1}\<img.+?(?<src>src=.+?)\>)/gm

export const ANCHOR_S = /(?<anchor>.+)\|(?<size>[0-9]+)/g

export const MD_SEARCH_PATTERN =
[
//file link
/\!\[(?<anchor>(.{0}|(?!^file\:\/)+?))\]\((?<link>((file\:\/)[^\!]+?(\.{1}.{3,4}\) {0,1}|\)$|\)\n|\)])))/gm,
//hypertext link
///\!\[(?<anchor>(.{0}|[^\[]+?))\]\((?<link>((http(s){0,1}).+?(\) |\..{3,4}\)|\)$|\)\n|\)\]|\)\[)))/gm,
 
/\!\[(?<anchor>([^\]]*))\]\((?<link>((http(s){0,1}).+?(\) |\..{3,4}\)|\)$|\)\n|\)\]|\)\[)))/gm,

//Base64 encoded data
/\!\[[^\[](?<anchor>(.{0}|[^\[]+?))\]\((?<link>((data\:.+?base64\,).+?(\) |\..{3,4}\)|\)$|\)\n|\)\]|\)\[)))/gm,
/\!\[(?<anchor>(.{0}|[^\[]+?))\]\((?<link>((http(s){0,1}|(data\:.+?base64\,)).+?\)))/gm
]


export const MD_LINK = 
/\http(s){0,1}.+?( {1}|\)\n)/g;


export const ANY_URL_PATTERN =
/[a-zA-Z\d]+:\/\/(\w+:\w+@)?([a-zA-Z\d.-]+\.[A-Za-z]{2,4})(:\d+)?(\/.*)?/i;

export const ATT_SIZE_ACHOR = 
/(^(?<attdesc>.{1,})\|(?<attsize>[0-9]{2,4})$)|(?<attsize2>^[0-9]{2,4}$)/gm



// Looks like timeouts in Obsidian API are set in milliseconds
export const NOTICE_TIMEOUT = 5 * 1000;
export const TIMEOUT_LIKE_INFINITY = 24 * 60 * 60 * 1000;
export const FORBIDDEN_SYMBOLS_FILENAME_PATTERN = /\s+/g;

export interface ISettings {
  // ---- 通用 ----
  showNotifications: boolean;
  showBatchCommands: boolean;
  showCleanupRibbon: boolean;
  autoProcess: boolean;
  autoProcessInterval: number;
  processNewMarkdown: boolean;
  processNewAttachments: boolean;
  useTimestampNaming: boolean;
  // ---- 开发者选项 ----
  includePattern: string;
  includePatternRegex: string;
  debugMode: boolean;

  // ---- 图片本地化 ----
  downloadRetryCount: number;
  downloadUnknownTypes: boolean;
  compressImage: boolean;
  compressionFormat: string;
  compressionQuality: number;
  minFileSizeKB: number;
  excludedExtensions: string;
  preserveCaptions: boolean;
  appendOriginalName: boolean;
  linkPathFormat: string;
  dateFormat: string;
  attachmentSaveLocation: string;
  syncMediaFolder: boolean;
  mediaFolderPath: string;
  skipObsidianFolderCreation: boolean;

  // ---- 图片清理 ----
  deleteDestination: string;
  showOperationLogs: boolean;
  excludeSubfolders: boolean;
  excludedFolders: string;
  excludedFoldersRegexp: string;

  // ---- 图片预览 ----
  clickPreviewEnabled: boolean;
  previewAdaptiveRatio: number;
  dragResizeEnabled: boolean;
  dragResizeStep: number;
}

export const DEFAULT_SETTINGS: ISettings = {
  // 通用
  showNotifications: true,
  showBatchCommands: true,
  showCleanupRibbon: true,
  autoProcess: true,
  autoProcessInterval: 3,
  processNewMarkdown: true,
  processNewAttachments: true,
  useTimestampNaming: true,
  // 开发者选项
  includePattern: "md|canvas",
  includePatternRegex: "(?<md>.*\\.md)|(?<canvas>.*\\.canvas)",
  debugMode: false,

  // 图片本地化
  downloadRetryCount: 2,
  downloadUnknownTypes: false,
  compressImage: true,
  compressionFormat: "image/jpeg",
  compressionQuality: 80,
  minFileSizeKB: 0,
  excludedExtensions: "cnt|php|htm|html",
  preserveCaptions: true,
  appendOriginalName: true,
  linkPathFormat: "fullDirPath",
  dateFormat: "YYYY MM DD",
  attachmentSaveLocation: "obsFolder",
  syncMediaFolder: true,
  mediaFolderPath: "_resources/${notename}",
  skipObsidianFolderCreation: false,

  // 图片清理
  deleteDestination: ".trash",
  showOperationLogs: true,
  excludeSubfolders: false,
  excludedFolders: "",
  excludedFoldersRegexp: "",

  // 图片预览
  clickPreviewEnabled: false,
  previewAdaptiveRatio: 0.9,
  dragResizeEnabled: true,
  dragResizeStep: 0,
};
