/**
 * workspace 状态推导: 把会话列表, 待处理交互与后台任务三类事实聚合成每个
 * workspace 目录行需要呈现的标记.
 */
/** 后台任务在控件流上可见的生命周期状态. */
export type JobStatus = 'running' | 'stopping' | 'completed' | 'killed' | 'failed';
/** 本插件用到的后台任务字段子集. */
export interface JobSummary {
    readonly status: JobStatus;
}
/** 会话列表行中本插件用到的字段子集. */
export interface SessionSummary {
    readonly running?: boolean;
    readonly completed?: boolean;
    /** 会话的显示标题; 行与会话只能靠它反查, 未投影出来前无法对应. */
    readonly displayTitle?: string;
    /** 尚未产生内容的占位会话, 行上显示的是本地化的 New Session 文案. */
    readonly blank?: boolean;
    /** subagent 子会话不会在列表里渲染成行, 不参与标题反查. */
    readonly origin?: 'subagent';
}
/** 一个 workspace 及其归属的会话 id. */
export interface WorkspaceView {
    readonly workspaceId: string;
    readonly sessionIds: readonly string[];
}
/** 会话到待处理交互的映射 (ui-session 的 pending interaction 快照). */
export type PendingInteractionMap = ReadonlyMap<string, {
    readonly kind: string;
} | undefined>;
/** 会话到后台任务列表的映射 (session-controller 的 jobsBySession 镜像). */
export type JobsBySession = Readonly<Record<string, readonly JobSummary[] | undefined>>;
/** 一个 workspace 目录行需要呈现的全部事实. */
export interface WorkspaceStatus {
    /** 有会话在等待用户处理: 审核, 提权确认或回答. */
    pending: boolean;
    /** 有会话正在运行. */
    active: boolean;
    /** 有已结束但未读的会话. */
    unread: boolean;
    /** 仍在运行或正在停止的后台任务数量. */
    liveJobs: number;
}
/** 运行中与正在停止都算 "任务还没结束", 其余状态都已落定. */
export declare function isLiveJob(job: JobSummary): boolean;
/**
 * 会话显示标题到会话 id 的反查表, 供会话行 DOM 标记定位使用.
 *
 * 行上没有会话 id, 标题是唯一的对应关系, 因此这里只收录 "真的会渲染成一行"
 * 的会话, 与列表的可见性规则保持一致:
 *
 * - 空白会话行显示本地化文案而不是标题, 不参与;
 * - subagent 子会话不在列表里成行, 不参与;
 * - 已归档会话不渲染, 不参与.
 *
 * 后两类若收录进来, 一个与父会话同名的子会话 (子会话继承的还是同一个项目
 * 目录名) 就会把父会话的行一起挡掉, 而它们自己压根没有行需要标记.
 *
 * 收录进来的会话仍然允许同名: 那种情况下对应多个渲染行, 无法判断哪一行是
 * 哪一个, 由使用者放弃标记.
 * @param sessions - 会话列表快照.
 * @param archivedSessionIds - 已归档会话, 它们在列表里不渲染.
 */
export declare function titleIndex(sessions: Readonly<Record<string, SessionSummary | undefined>>, archivedSessionIds: readonly string[]): Map<string, string[]>;
/**
 * 有运行中或正在停止的后台任务的会话 id 集合.
 * @param jobsBySession - 每个会话可见的后台任务.
 */
export declare function sessionsWithLiveJobs(jobsBySession: JobsBySession): Set<string>;
/**
 * 聚合一个 workspace 的标记状态.
 * @param workspace - workspace 行及其会话归属.
 * @param sessions - 会话列表快照.
 * @param pendingInteractions - 等待用户处理的交互快照.
 * @param jobsBySession - 每个会话可见的后台任务.
 * @returns 该 workspace 行需要呈现的事实.
 */
export declare function workspaceStatus(workspace: WorkspaceView, sessions: Readonly<Record<string, SessionSummary | undefined>>, pendingInteractions: PendingInteractionMap, jobsBySession: JobsBySession): WorkspaceStatus;
