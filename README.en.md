# Image Toolkit Pro

> An image management toolkit for Obsidian

`Image Toolkit Pro` is an Obsidian desktop plugin for managing images and attachments. It combines media localization, attachment cleanup, and preview interaction enhancements in a single plugin, making it easier to maintain media-heavy notes over time.

## What It Solves

The plugin mainly targets three problems:

- too many external images: download images from web pages, Markdown, HTML, Word, and OpenOffice into your local vault
- messy attachments: save, rename, deduplicate, and organize attachments using consistent rules
- awkward image interactions: add cleanup, preview, context menu, and drag-to-resize enhancements

## Core Capabilities

### 1. Image Localization

- download web images and other recognized attachments into the local vault
- process external media from copy, paste, and drag-and-drop workflows
- copy local `file://` files into the attachment folder
- download remote attachment links found in Markdown notes
- save embedded base64 images

### 2. Attachment Organization

- support the Obsidian attachment folder, a custom root folder, or a note-adjacent media folder
- support full-path, relative-path, and filename-only link styles
- support timestamp-based naming for new attachments: `YYYYMMDD-HHmmss-random6`
- keep deduplication behavior to avoid repeated files
- optionally preserve original filenames or open-file tags

### 3. Image Compression

- compress downloaded web images and pasted local images
- output `jpeg` or `webp`
- adjust compression quality

### 4. Attachment Cleanup

- clean unused images across the whole vault
- clean unused attachments across the whole vault
- clean unlinked attachments in the current note's attachment folder
- move cleanup results to Obsidian trash, system trash, or delete them permanently
- provide a left Ribbon shortcut for unused-image cleanup

### 5. Preview and Interaction Enhancements

- image context menu actions: copy, open, reveal, rename, move, delete
- drag-to-resize support for images and videos
- single-click preview, click again to close
- reveal and highlight files in the navigator

## Integrated Upgrade Highlights

This version expands `obsidian-local-images-plus` into a more complete image workflow plugin.

Major integrations and upgrades include:

- integration of `oz-clear-unused-images-obsidian` cleanup features
- integration of `AttachFlow` preview and interaction features
- redesigned settings UI with top navigation:
  - `General`
  - `Localize`
  - `Cleanup`
  - `Preview`
- language switching for the settings page: `Simplified Chinese / English`
- command palette retained as the full entry point
- cleanup Ribbon retained as a high-frequency shortcut
- broad UI cleanup, Chinese localization, and interaction polishing

## Commands

Command palette entries are intentionally kept in English.

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

- `Clear Unused Images in Vault`
  - Chinese meaning: clean unused images in the vault

- `Clear Unused Attachments in Vault`
  - Chinese meaning: clean unused attachments in the vault

- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)`
  - Chinese meaning: clean unlinked attachments in the current note folder
  - only available when using the “next to note” storage mode and a folder pattern that ends with `${notename}` and does not contain `${date}`

### Preview

- `Delete Current Note and Its Attachments`
  - delete the current note and handle attachments referenced only by that note

## Ribbon

The plugin provides one left Ribbon action:

- Chinese UI: `清理未使用图片`
- Other UI languages: `Clear unused images`

It triggers:

- `Clear Unused Images in Vault`

This Ribbon action is a shortcut for the most common cleanup task rather than a replacement for the command palette.

## Settings Overview

### General

- settings-page language
- notifications
- extra command visibility
- cleanup Ribbon visibility
- automatic processing and interval
- process newly created Markdown files
- process newly created attachments
- timestamp naming for new attachments
- developer options

### Localize

- download retry count
- unknown file download
- image compression
- compression format and quality
- file size limit
- excluded extensions
- link title and original filename preservation
- link path style
- date format
- new attachment save location and media folder template

### Cleanup

- deletion target
- log modal
- whether to exclude subfolders
- whether to fully delete unlinked attachments
- excluded folder list

### Preview

- attachment deletion destination
- deletion log modal
- “Move file to...” visibility
- click-to-preview
- preview ratio
- drag-to-resize
- resize step
- preview debug mode

## Supported Image Formats

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

- file types are detected using both binary content and link paths, so `webp` and `avif` are recognized correctly
- image compression currently mainly targets `png`
- `webp` and `avif` are supported for saving and cleanup, but are not re-encoded into other formats

## Installation

1. Open your Obsidian vault
2. Go to `.obsidian/plugins/`
3. Copy the plugin folder into it
4. Restart Obsidian
5. Enable `Image Toolkit Pro` in Community Plugins

## Current Version

- plugin name: `Image Toolkit Pro`
- plugin id: `image-toolkit-pro`
- version: `26.4.2`
- minimum Obsidian version: `1.0.3`
- desktop only: `true`

## Usage Notes

### Back Up Before Batch Operations

The following actions may modify many notes or attachments at once:

- processing the whole vault
- cleaning unused attachments
- cleaning unlinked attachments
- batch rewriting links

Backing up your vault first is strongly recommended.

### Cleanup Command Differences

- `Clear Unused Images in Vault`
  - scans the whole vault for unused images

- `Clear Unused Attachments in Vault`
  - scans the whole vault for unused attachments

- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)`
  - targets the current note's attachment folder only
  - requires the specific folder mode and template constraints described above

### Known Compatibility Notes

The original project reports possible compatibility issues with:

- `Paste Image Rename`
- `Pretty BibTex`

## Credits

This plugin is based on `obsidian-local-images-plus` and further integrates the core ideas of `clear-unused-images` and `AttachFlow`.

Thanks to the following projects and contributors:

- [Sergei-Korneev/obsidian-local-images-plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)
- [aleksey-rezvov/obsidian-local-images](https://github.com/aleksey-rezvov/obsidian-local-images)
- [niekcandaele/obsidian-local-images](https://github.com/niekcandaele/obsidian-local-images)
- [ozntel/oz-clear-unused-images-obsidian](https://github.com/ozntel/oz-clear-unused-images-obsidian)
- [elf004-star/Obsidian-AttachFlow](https://github.com/elf004-star/Obsidian-AttachFlow)
- [Yaozhuwa/AttachFlow](https://github.com/Yaozhuwa/AttachFlow)

## License

Using this plugin means you accept the project license terms. See:

- `LICENSE`
