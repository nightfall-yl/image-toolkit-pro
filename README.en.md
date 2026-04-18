# ImgBox Pro

> An image management toolkit for Obsidian

`ImgBox Pro` is an Obsidian desktop plugin for managing images and attachments. It combines media localization, attachment cleanup, and preview interaction enhancements in a single plugin.

## Highlights

- Image localization: download web images, handle pasted / dragged media, save base64 images
- Attachment organization: multiple save locations, link styles, `YYYYMMDD-HHmmss-md5-first-6` naming, deduplication
- Attachment cleanup: unused images, unused attachments, and unlinked attachments in the current note folder
- Image interaction: context menu, click-to-preview, drag-to-resize, navigator highlight
- Source-note jump: image navigator or image-tab context menu supports `Go to Source Note`

## Integrated Components

This version is built on `obsidian-local-images-plus` and integrates:

- `oz-clear-unused-images-obsidian`
- `AttachFlow`

It also includes:

- top-navigation settings UI: `General / Localize / Preview / Cleanup`
- settings-page language automatically follows Obsidian's system language
- a cleanup `Ribbon` shortcut
- the command palette as the full entry point

## Common Commands

Command palette entries are intentionally kept in English.

Core commands:

- `Localize attachments for the current note (plugin folder)`
- `Localize attachments for the current note (Obsidian folder)`
- `Clear Unused Images in Vault`
- `Clear Unused Attachments in Vault`
- `Delete Current Note and Its Attachments`

Optional commands:

- Batch commands (visibility can be controlled in settings)
  - `Localize attachments for all your notes (plugin folder)`
  - `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)`

Notes:

- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)` is only available in "next to note" mode, and the folder pattern must end with `${notename}` and must not contain `${date}`
- the image navigator or image-tab context menu provides: `Go to Source Note`

## Ribbon

The plugin provides one left cleanup `Ribbon` action:

- Chinese UI: `清理未使用图片`
- Other UI languages: `Clear unused images`

It triggers:

- `Clear Unused Images in Vault`

## Settings

### General

- notifications
- cleanup Ribbon visibility
- automatic processing and interval
- process newly created Markdown files
- batch commands: show batch commands
- developer options (debug mode)

### Localize

- trigger: process newly created attachments
- download retry count
- unknown file download
- image compression
- compression format and quality
- minimum file size
- excluded extensions
- naming: `YYYYMMDD-HHmmss-md5-first-6`
- path: new attachment save location and media folder template
- path: link path style
- path: date format
- other: link title preservation
- advanced options: original filename tag, media-folder sync, Obsidian attachment-folder compatibility

### Preview

- click-to-preview
- preview ratio
- drag-to-resize
- resize step
- delete current note and its attachments
- image navigator or image-tab context menu supports `Go to Source Note`

### Cleanup

- deletion target (trash / permanent delete)
- operation log modal
- excluded folder list
- exclude subfolders

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
5. Enable `ImgBox Pro` in Community Plugins

## Current Version

- plugin name: `ImgBox Pro`
- plugin id: `imgbox-pro`
- version: `26.4.4`
- minimum Obsidian version: `1.0.3`
- desktop only: `true`

## Notes

- Back up your vault before batch processing, cleanup, or large-scale link rewriting
- `Clear Unused Images in Vault` and `Clear Unused Attachments in Vault` scan the whole vault
- `Clear Unlinked Attachments in Current Note Folder (Next to Note mode)` only targets the current note's attachment folder

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
