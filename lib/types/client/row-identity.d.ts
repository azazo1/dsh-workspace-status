import type { SessionSummary } from './model.ts';
/**
 * DSH 会话行的 React key 与 node/result.id 都是 session id.
 * DOM 暂无公开的行 ID, 只在这两项和会话快照一致时标记, 不按标题猜测.
 * 宿主更换挂载结构后返回 undefined, 避免标到其他会话.
 */
export declare function rowSessionId(element: Element, sessions: Readonly<Record<string, SessionSummary | undefined>>): string | undefined;
