# Image Toolkit Pro

> An image management toolkit for Obsidian

`Image Toolkit Pro` is an Obsidian desktop plugin for managing images and attachments. It combines media localization, attachment cleanup, and preview interaction enhancements in a single plugin.

## Highlights

- Image localization: download web images, handle pasted / dragged media, save base64 images
- Attachment organization: multiple save locations, link styles, timestamp naming, deduplication
- Attachment cleanup: unused images, unused attachments, and unlinked attachments in the current note folder
- Image interaction: context menu, click-to-preview, drag-to-resize, navigator highlight
- Source-note jump: image navigator or image-tab context menu supports `Go to Source Note`

## Integrated Components

This version is built on `obsidian-local-images-plus` and integrates:

- `oz-clear-unused-images-obsidian`
- `AttachFlow`

It also includes:

- top-navigation settings UI: `General / Localize / Cleanup / Preview`
- settings-page language switching: `Simplified Chinese / English`
- a cleanup `Ribbon` shortcut
- the command palette as the full entry point

## Common Commands

Command palette entries are intentionally kept in English.

- `Localize attachments for the current note (plugin folder)`
- `Localize attachments for the current note (Obsidian folder)`
- `Localize attachments for all your notes (plugin folder)`
- `Clear Unused Images in Vault`
- `Clear Unused Attachments in Vault`
- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)`
- `Delete Current Note and Its Attachments`

Notes:

- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)` is only available in “next to note” mode, and the folder pattern must end with `${notename}` and must not contain `${date}`
- the image navigator or image-tab context menu provides: `Go to Source Note`

## Ribbon

The plugin provides one left cleanup `Ribbon` action:

- Chinese UI: `清理未使用图片`
- Other UI languages: `Clear unused images`

It triggers:

- `Clear Unused Images in Vault`

## Settings

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

| Format | Detect | Save | Included in unused-image cleanup | Compression output |
|---|---|---:|---:|---:|
| `jpg` / `jpeg` | Yes | Yes | Yes | No |
| `png` | Yes | Yes | Yes | Yes, can be converted to `jpeg` / `webp` |
| `gif` | Yes | Yes | Yes | No |
| `svg` | Yes | Yes | Yes | No |
| `bmp` | Yes | Yes | Yes | No |
| `webp` | Yes | Yes | Yes | Yes |
| `avif` | Yes | Yes | Yes | No |

Notes:

- `webp` and `avif` are recognized, saved, and cleaned correctly
- image compression currently mainly targets `png`

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

## Notes

- Back up your vault before batch processing, cleanup, or large-scale link rewriting
- `Clear Unused Images in Vault` and `Clear Unused Attachments in Vault` scan the whole vault
- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)` only targets the current note’s attachment folder

Known compatibility notes from the original project:

- `Paste Image Rename`
- `Pretty BibTex`

## Credits

This plugin is based on `obsidian-local-images-plus` and further integrates the core ideas of `clear-unused-images` and `AttachFlow`.

- [Sergei-Korneev/obsidian-local-images-plus](https://github.com/Sergei-Korneev/obsidian-local-images-plus)
- [aleksey-rezvov/obsidian-local-images](https://github.com/aleksey-rezvov/obsidian-local-images)
- [niekcandaele/obsidian-local-images](https://github.com/niekcandaele/obsidian-local-images)
- [ozntel/oz-clear-unused-images-obsidian](https://github.com/ozntel/oz-clear-unused-images-obsidian)
- [elf004-star/Obsidian-AttachFlow](https://github.com/elf004-star/Obsidian-AttachFlow)
- [Yaozhuwa/AttachFlow](https://github.com/Yaozhuwa/AttachFlow)

## License

Using this plugin means you accept the project license terms. See:

- `LICENSE`
