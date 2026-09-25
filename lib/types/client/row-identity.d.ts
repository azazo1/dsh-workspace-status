import type { SessionSummary } from './model.ts';
/**
 * 会话行的 `data-row-key` 是宿主自己维护的行身份, 会话 id 就在 `session:` 之后.
 * 只在行键里的会话确实存在于当前列表快照, 且不是尚未产生内容的占位会话时标记,
 * 不按标题猜测. 没有行键或行键不是会话行的元素 (搜索结果, workspace 分组行)
 * 一律返回 undefined, 避免标到其他行.
 */
export declare function rowSessionId(element: Element, sessions: Readonly<Record<string, SessionSummary | undefined>>): string | undefined;
