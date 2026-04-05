# Image Toolkit Pro

> An image management toolkit for Obsidian

`Image Toolkit Pro` is an Obsidian desktop plugin for localizing external media, organizing attachments, cleaning unused files, and enhancing image preview interactions.

It is especially useful when you want to:

- paste content from the web into Obsidian and automatically download linked images
- process external media links from Word, OpenOffice, HTML, or Markdown
- save base64 images into your vault
- store attachments in the Obsidian attachment folder or in note-adjacent media folders
- rename new attachments with MD5-based filenames to reduce duplicates
- clean unused images, unused attachments, or unlinked attachments

---

## Upgrade Highlights

This version is no longer just a localization plugin. It expands `obsidian-local-images-plus` into a more complete image workflow plugin with integrated cleanup and preview features.

Major upgrades include:

- integrated the core functionality of `oz-clear-unused-images-obsidian`
- added vault-wide cleanup commands for unused images and attachments
- added a dedicated left Ribbon shortcut for `Clear Unused Images in Vault`
- made the cleanup Ribbon independently configurable from the settings page
- integrated the core interaction features of `AttachFlow`
- added image context menu actions such as move, rename, delete, copy, reveal, and open externally
- added drag-to-resize support for images and videos
- improved image preview behavior: click an image to open preview, click again to close it
- redesigned the settings UI with top navigation sections:
  `General / Localize / Cleanup / Preview / Advanced`
- added settings-page language switching for `Simplified Chinese` and `English`
- unified and polished settings text, context menu labels, modals, and notification wording
- fixed missing `.avif` support in unused-image cleanup
- kept the command palette as the full entry point while removing the old localization Ribbon and retaining only the dedicated cleanup shortcut
- standardized project metadata:
  - name: `Image Toolkit Pro`
  - id: `image-toolkit-pro`
  - version: `2026.3`
  - build output directory: `released`

---

## Main Features

### 1. Media Localization

- download web images and other recognized attachments into the local vault
- process external media from copy, paste, and drag-and-drop workflows
- support copying local `file://` files into the attachment folder
- download remote attachment links found in Markdown notes
- save embedded base64 images

### 2. Attachment Organization

- save attachments to the Obsidian attachment folder
- save attachments to a custom root folder
- save attachments to a note-adjacent media folder
- generate MD5-based filenames for attachments
- preserve original filenames or `Open file` tags
- support full path, relative path, and filename-only link styles

### 3. Image Compression

- compress downloaded images into JPEG or WebP
- handle both web images and pasted local images
- adjust image quality

### 4. Attachment Cleanup

- clean unlinked attachments from the current note's attachment folder
  only available when using the "save in the specified folder next to the note" mode, with a folder pattern ending in `${notename}` and without `${date}`
- clean unused images across the whole vault
- clean unused attachments across the whole vault
- move cleanup results to Obsidian trash, system trash, or delete them permanently
- trigger the vault-wide unused-image cleanup directly from the left Ribbon

### 5. Preview and Interaction Enhancements

- add image context menu actions
- copy image, link, or Markdown link
- reveal files in the system file manager or open them externally
- rename attachments and move them to another folder
- delete the current link or delete both the attachment and its links
- drag to resize images and videos
- click an image to open a zoomable preview, then click again to close it

---

## Supported Image Formats

Current support status for common image formats:

| Format | Detect from web / paste | Save locally | Included in unused-image cleanup | Can be used as compression output |
|---|---|---:|---:|---:|
| `jpg` / `jpeg` | Yes | Yes | Yes | No |
| `png` | Yes | Yes | Yes | Yes, can be converted to `jpeg` / `webp` |
| `gif` | Yes | Yes | Yes | No |
| `svg` | Yes | Yes | Yes | No |
| `bmp` | Yes | Yes | Yes | No |
| `webp` | Yes | Yes | Yes | Yes |
| `avif` | Yes | Yes | Yes | No |

Notes:

- the plugin detects file types using both binary content and link paths, so `webp` and `avif` are both recognized correctly
- image compression currently focuses mainly on `png`, which can be converted to `jpeg` or `webp`
- `webp` and `avif` are currently supported for saving and cleanup, but are not re-encoded into other formats

---

## Current Version

- plugin name: `Image Toolkit Pro`
- plugin id: `image-toolkit-pro`
- version: `2026.3`
- minimum Obsidian version: `1.0.3`
- desktop only: `true`

---

## Installation

### Option 1: Manual Installation

1. Open your Obsidian vault
2. Go to `.obsidian/plugins/`
3. Copy the plugin folder into it
4. Restart Obsidian
5. Enable `Image Toolkit Pro` in Community Plugins

Use the current build output directory:

- `released/`

### Option 2: Build from Source

```bash
npm install
npm run build
```

Build output:

- `released/main.js`
- `released/manifest.json`
- `released/styles.css`

---

## Usage

### Typical Workflow

The most common usage pattern is:

1. copy content from a web page, document, or another app
2. paste it into an Obsidian note
3. let the plugin download media, save attachments, and rewrite links based on your settings

If you prefer more control, you can also run commands manually from the command palette.

In practice:

- the left Ribbon is intended as a shortcut for the most common cleanup action
- the command palette remains the complete entry point for cleanup and advanced commands

---

## Commands

### Localization

- `Localize attachments for the current note (plugin folder)`
  - process the current note using the plugin-managed attachment folder rules

- `Localize attachments for the current note (Obsidian folder)`
  - process the current note using Obsidian's native attachment folder settings

- `Localize attachments for all your notes (plugin folder)`
  - batch-process all matching notes in the vault

- `Convert selection to URI`
  - convert the current selection into URI form

- `Convert selection from html to markdown`
  - convert selected HTML into Markdown

- `Set the first found # header as a note name.`
  - use the first H1 heading in the note as the note name

### Cleanup

Command palette entries are always shown in English:

- `Clear Unused Images in Vault`
  - Chinese meaning: clean unused images in the vault
  - scan the whole vault and remove unused images

- `Clear Unused Attachments in Vault`
  - Chinese meaning: clean unused attachments in the vault
  - scan the whole vault and remove unused attachments

- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)`
  - Chinese meaning: clean unlinked attachments in the current note folder
  - only available in "next to note" mode, and the folder pattern must end with `${notename}` and must not contain `${date}`
  - clean unlinked attachments from the current note's attachment folder

### Preview

- `Delete Current Note and Its Attachments`
  - delete the current note and handle attachments referenced only by that note

- image context menu
  - provides copy, open, reveal, rename, move, and delete actions

---

## Ribbon

The plugin provides a left Ribbon action:

- `Clear unused images` in non-Chinese UI
- `清理未使用图片` in Chinese UI

It triggers:

- `Clear Unused Images in Vault`

The Ribbon label follows Obsidian's display language.

This Ribbon action is a shortcut for the most common cleanup task rather than a replacement for the command palette.
If you want the full cleanup set, such as unused attachment cleanup or current-note-folder unlinked attachment cleanup, use the command palette.

You can enable or disable this Ribbon icon from the settings page.

---

## Settings

The settings page is organized into the following sections:

### General

- settings-page language: `Simplified Chinese / English`
- show notifications
- hide extra commands
- show the cleanup Ribbon icon
- automatic processing toggle and interval
- process newly created Markdown files
- process newly created attachments
- use MD5 naming for new attachments

### Localize

- retry count per attachment
- download unknown file types
- compress web images / pasted images
- compression format and quality
- minimum file size limit
- excluded extensions
- preserve link captions
- append original filenames or open-file tags
- link style: full path / relative path / filename only
- date format
- save location for new attachments
- media folder template
- sync move / delete / rename behavior for media folders
- skip creation of the default Obsidian attachment folder

### Cleanup

- deletion target for unused files
- cleanup log modal
- exclude subfolders
- permanently delete unlinked attachments in the current note folder cleanup
- excluded folder list

### Preview

- attachment deletion destination
- deletion log modal
- show `Move file to...`
- enable single-click image preview
- adaptive preview ratio
- enable drag-to-resize
- resize step
- preview debug mode

### Advanced

- include pattern
- core debug mode

---

## Notes

### 1. Back up before batch operations

The following actions may modify many notes or files at once:

- processing the whole vault
- cleaning unused attachments
- cleaning unlinked attachments
- batch link rewriting

Back up your vault before running them.

### 2. Difference Between Cleanup Commands

- `Clear Unused Images in Vault`
  - Chinese meaning: clean unused images in the vault
  - scans the whole vault
  - removes images that are not referenced anywhere

- `Clear Unused Attachments in Vault`
  - Chinese meaning: clean unused attachments in the vault
  - scans the whole vault
  - removes attachments that are not referenced anywhere

- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)`
  - Chinese meaning: clean unlinked attachments in the current note folder
  - works on the current note's attachment folder
  - only available in "next to note" mode, and the folder pattern must end with `${notename}` and must not contain `${date}`
  - is intended for note-level unlinked attachment cleanup

### 3. Large Files

For very large local files or media files, frequent batch processing may affect performance.

### 4. Compatibility Notes

The original project is known to have possible compatibility issues with:

- `Paste Image Rename`
- `Pretty BibTex`

---

## Credits

This plugin is based on `obsidian-local-images-plus`, and further integrates `clear-unused-images` and `AttachFlow` image interaction enhancements.

Thanks to these projects and contributors:

- [Sergei-Korneev/obsidian-local-images-plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)
- [aleksey-rezvov/obsidian-local-images](https://github.com/aleksey-rezvov/obsidian-local-images)
- [niekcandaele/obsidian-local-images](https://github.com/niekcandaele/obsidian-local-images)
- [ozntel/oz-clear-unused-images-obsidian](https://github.com/ozntel/oz-clear-unused-images-obsidian)
- [elf004-star/Obsidian-AttachFlow](https://github.com/elf004-star/Obsidian-AttachFlow)
- [Yaozhuwa/AttachFlow](https://github.com/Yaozhuwa/AttachFlow)

---

## License

Using this plugin means you accept the terms of the project license.

See:

- `LICENSE`
