/**
 * 侧边栏 workspace 树的状态样式表: 基础动画与兜底规则常驻, 每个 workspace
 * 分组再按推导出的状态追加一条覆盖规则.
 */
import type { WorkspaceStatus } from './model.ts'
import { MARKER_OWNER } from './rows.ts'

/**
 * workspace 分组行的选择器基元.
 *
 * 会话行同样是树里的 treeitem, 也挂在同一个分组 section 之下, 所以只靠
 * 首个 span 里有没有 svg 是区分不开的: 会话行首个 span 的状态指示器同样是
 * svg. 分组行是树里唯一带 aria-expanded 的行, 用它把会话行和平铺列表排除掉.
 */
const GROUP_ROW = 'div[role="treeitem"][aria-expanded]'

/** 与 workspace 树结构绑定的常量样式: 动画定义与按会话行状态推导的兜底. */
const BASE_STYLE = `
@keyframes dsh-workspace-status-pulse {
  0%, 100% { color: var(--ds-accent, #4f9cff); filter: drop-shadow(0 0 0 transparent); transform: scale(1); }
  50% { color: color-mix(in srgb, var(--ds-accent, #4f9cff) 72%, white); filter: drop-shadow(0 0 5px currentColor); transform: scale(1.14); }
}

@keyframes dsh-workspace-status-pending {
  0%, 100% { opacity: 0.68; filter: drop-shadow(0 0 1px currentColor); transform: scale(1); }
  50% { opacity: 1; filter: drop-shadow(0 0 6px currentColor); transform: scale(1.08); }
}

[role="tree"] > div:has([data-state="warning"]) > * > ${GROUP_ROW} > span:first-child {
  color: var(--ds-warning, #d99a22);
  animation: dsh-workspace-status-pending 2s ease-in-out infinite;
  transform-origin: center;
}

[role="tree"] > div:has([data-state="warning"]) > * > ${GROUP_ROW} > span:first-child svg {
  color: var(--ds-warning, #d99a22);
}

[role="tree"] > div:has([data-state="ongoing"]) > * > ${GROUP_ROW} > span:first-child {
  animation: dsh-workspace-status-pulse 1.6s ease-in-out infinite;
  transform-origin: center;
}

[role="tree"] > div:has([data-state="ongoing"]) > * > ${GROUP_ROW} > span:first-child svg {
  color: var(--ds-accent, #4f9cff);
}

[role="tree"] > div:has([data-state="done"]):not(:has([data-state="ongoing"])) > * > ${GROUP_ROW} > span:first-child {
  color: var(--ds-success, #22a06b);
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--ds-success, #22a06b) 55%, transparent));
}

/* 会话行的后台任务蓝点: 行内标题占满剩余宽度, 所以这个 flex item 自然落在
   时间左侧, 与行首的状态点互不干扰. */
[data-owner="${MARKER_OWNER}"] {
  flex: none;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 50%;
  background: var(--dsw-static-deepseek-450, #4f9cff);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  [role="tree"] > div:has([data-state="warning"]) > * > ${GROUP_ROW} > span:first-child,
  [role="tree"] > div:has([data-state="ongoing"]) > * > ${GROUP_ROW} > span:first-child {
    animation: none;
    filter: none;
    transform: none;
  }
}
`

/**
 * 后台任务角标: 目录图标右上角的小圆点, 与三种行状态并存.
 * 图标槽从行内边距 8px 开始, 宽 16px; 行高 34px 中图标高 20px, 因此
 * 图标右上角落在 (24px, 7px), 圆点向左上各留 1px 到 2px 压住它的边缘.
 * 挂在目录行而非图标槽上, 这样悬停切换文件夹与展开箭头时角标不会消失.
 */
const JOBS_BADGE = `content:'';position:absolute;left:19px;top:5px;width:6px;height:6px;border-radius:50%;background:var(--dsw-static-deepseek-450,#4f9cff);pointer-events:none`

/**
 * 第 index 个 workspace 分组行的选择器.
 *
 * 分组行被 HoverCard 的 span 包了一层, 因此比叶子会话行多一级; 行本身只认
 * {@link GROUP_ROW}, 免得第 index 条会话行被当成分组行.
 * @param index - workspace 在列表快照中的下标, 与树中分组行的顺序一致.
 */
function rowSelector(index: number): string {
  return `[role="tree"] > div:nth-child(${index + 1}) > * > ${GROUP_ROW}`
}

/**
 * 一个 workspace 分组行需要追加的规则: 行状态取 pending, active, unread 中
 * 优先级最高者, 后台任务角标独立叠加.
 * @param index - workspace 在列表快照中的下标.
 * @param status - 该 workspace 推导出的状态.
 * @returns 该分组行的 CSS 规则文本, 无状态时为空串.
 */
export function workspaceRules(index: number, status: WorkspaceStatus): string {
  const row = rowSelector(index)
  const icon = `${row} > span:first-child`
  const rules: string[] = []
  if (status.pending) {
    rules.push(`${icon}{color:var(--ds-warning,#d99a22);animation:dsh-workspace-status-pending 2s ease-in-out infinite;transform-origin:center}`)
  } else if (status.active) {
    rules.push(`${icon}{animation:dsh-workspace-status-pulse 1.6s ease-in-out infinite;transform-origin:center;color:var(--ds-accent,#4f9cff)}`)
  } else if (status.unread) {
    rules.push(`${icon}{color:var(--ds-success,#22a06b);filter:drop-shadow(0 0 4px color-mix(in srgb,var(--ds-success,#22a06b) 55%,transparent))}`)
  }
  if (status.liveJobs > 0) {
    rules.push(`${row}{position:relative}`)
    rules.push(`${row}::after{${JOBS_BADGE}}`)
  }
  return rules.join('')
}

/**
 * 组装完整的注入样式表.
 * @param statuses - 按 workspace 列表顺序排列的状态.
 */
export function styleSheet(statuses: readonly WorkspaceStatus[]): string {
  const rules = statuses.map((status, index) => workspaceRules(index, status)).join('')
  return `${BASE_STYLE}${rules}`
}
