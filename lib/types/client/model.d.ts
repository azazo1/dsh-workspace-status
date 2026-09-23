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
    /** 尚未产生内容的占位会话不标记. */
    readonly blank?: boolean;
}
/** 一个 workspace 及其归属的会话 id. */
export interface WorkspaceView {
    readonly workspaceId: string;
    readonly sessionIds: readonly string[];
}
/** 会话到运行态与待处理交互的映射 (ui-session 的状态快照). */
export type SessionStatusMap = ReadonlyMap<string, {
    readonly running?: boolean;
    readonly completionUnread?: boolean;
    readonly pendingInteraction?: {
        readonly kind: string;
    };
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
 * 有运行中或正在停止的后台任务的会话 id 集合.
 * @param jobsBySession - 每个会话可见的后台任务.
 */
export declare function sessionsWithLiveJobs(jobsBySession: JobsBySession): Set<string>;
/**
 * 聚合一个 workspace 的标记状态.
 * @param workspace - workspace 行及其会话归属.
 * @param sessions - 会话列表快照.
 * @param sessionStatuses - 会话运行态与待处理交互快照.
 * @param jobsBySession - 每个会话可见的后台任务.
 * @returns 该 workspace 行需要呈现的事实.
 */
export declare function workspaceStatus(workspace: WorkspaceView, sessions: Readonly<Record<string, SessionSummary | undefined>>, sessionStatuses: SessionStatusMap, jobsBySession: JobsBySession): WorkspaceStatus;
