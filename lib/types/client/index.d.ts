import { type JobsBySession, type PendingInteractionMap, type SessionSummary, type WorkspaceView } from './model.ts';
/** 会话列表快照中本插件读取的两块: 行摘要与后台任务镜像. */
interface SessionListState {
    byId: Readonly<Record<string, SessionSummary | undefined>>;
    jobsBySession: JobsBySession;
}
/** workspace 列表快照. */
interface WorkspaceListState {
    items: readonly WorkspaceView[];
}
interface SlotProps {
    useSessions: <Selected>(selector: (state: SessionListState) => Selected) => Selected;
    useWorkspaces: <Selected>(selector: (state: WorkspaceListState) => Selected) => Selected;
    useSessionPendingInteraction: <Selected>(selector: (state: PendingInteractionMap) => Selected) => Selected;
}
export declare const inject: string[];
export declare function apply(ctx: {
    slots: {
        inject: (name: string, callback: () => unknown) => unknown;
        register: (options: {
            name: string;
            id: string;
            order: number;
        }, component: (props: SlotProps) => unknown) => unknown;
    };
}): void;
export {};
