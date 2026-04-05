# Task Plan: Integrate clear-unused-images into local-images-plus

## Goal
将 `oz-clear-unused-images-obsidian-1.1.1` 的未使用图片清理能力整合进 `obsidian-local-images-plus-0.16.4`，并在后者中提供功能区按钮触发入口，最终只保留 `obsidian-local-images-plus` 这个插件即可使用。

## Current Phase
Phase 4

## Phases
### Phase 1: Requirements & Discovery
- [x] 理解用户目标与约束
- [x] 梳理两个插件的入口、设置、核心逻辑
- [x] 记录关键发现
- **Status:** complete

### Phase 2: Planning & Structure
- [x] 确定移植范围与最小改动方案
- [x] 确定 UI 入口与设置复用/新增方案
- [x] 记录关键决策
- **Status:** complete

### Phase 3: Implementation
- [x] 将清理逻辑迁入 `obsidian-local-images-plus`
- [x] 增加功能区按钮与命令入口对接
- [x] 保持原插件现有功能不回退
- **Status:** complete

### Phase 4: Testing & Verification
- [x] 完成构建
- [x] 检查 manifest / settings / 入口是否一致
- [x] 记录验证结果与剩余风险
- **Status:** complete

### Phase 5: Delivery
- [x] 汇总改动与使用方式
- [x] 说明未覆盖风险
- [ ] 交付用户
- **Status:** in_progress

## Key Questions
1. `clear-unused-images` 的删除与扫描逻辑能否直接迁入而不引入过多耦合？
2. 功能区按钮是直接触发清理，还是触发原命令并复用同一实现？
3. 原插件的设置项、日志弹窗、删除目标配置是否需要一并保留？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 保留 `local-images-plus` 原有 orphan 清理逻辑，同时新增 vault 级 unused 清理逻辑 | 两者语义不同，直接替换会导致原插件能力回退 |
| `clear-unused-images` 入口做成 `local-images-plus` 内的新命令和独立 ribbon 图标 | 满足用户“从功能区点击触发”的目标，同时保留命令面板入口 |
| 复用 `ExcludedFoldersList` 作为 cleanup 排除目录来源，额外新增“是否递归子目录”设置 | 减少重复配置，兼容原插件已有排除目录概念 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `npm run build` 失败，提示 `rollup: command not found` | 1 | 安装项目依赖：`npm install` |
| `rollup` 构建时 `cp -u` 在 macOS 上报 `illegal option -- u` | 1 | 构建完成后手动复制更新后的 `styles.css` 到产物目录 |

## Notes
- 优先复用 `obsidian-local-images-plus` 现有结构。
- 若存在重复能力，保留单一实现入口，避免双份逻辑长期分叉。
