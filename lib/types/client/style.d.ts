/**
 * 侧边栏 workspace 树的状态样式表: 基础动画与兜底规则常驻, 每个 workspace
 * 分组再按推导出的状态追加一条覆盖规则.
 */
import type { WorkspaceStatus } from './model.ts';
/**
 * 一个 workspace 分组行需要追加的规则: 行状态取 pending, active, unread 中
 * 优先级最高者, 后台任务角标独立叠加.
 * @param index - workspace 在列表快照中的下标.
 * @param status - 该 workspace 推导出的状态.
 * @returns 该分组行的 CSS 规则文本, 无状态时为空串.
 */
export declare function workspaceRules(index: number, status: WorkspaceStatus): string;
/**
 * 组装完整的注入样式表.
 * @param statuses - 按 workspace 列表顺序排列的状态.
 */
export declare function styleSheet(statuses: readonly WorkspaceStatus[]): string;
