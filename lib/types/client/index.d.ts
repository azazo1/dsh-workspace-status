import { type JobsBySession, type SessionStatusMap, type SessionSummary, type WorkspaceView } from './model.ts';
/** 会话列表快照中本插件读取的行摘要与后台任务镜像. */
interface SessionListState {
    byId: Readonly<Record<string, SessionSummary | undefined>>;
    ids: readonly string[];
}
interface WorkspaceListState {
    items: readonly WorkspaceView[];
}
interface SlotProps {
    useSessions: <Selected>(selector: (state: SessionListState) => Selected) => Selected;
    useSessionStatus: <Selected>(selector: (state: SessionStatusMap) => Selected) => Selected;
    useWorkspaces: <Selected>(selector: (state: WorkspaceListState) => Selected) => Selected;
    useJobs: <Selected>(selector: (state: {
        rows: JobsBySession;
    }) => Selected) => Selected;
    watchRows: (sessionId: string) => () => void;
}
export declare const inject: string[];
export declare function apply(ctx: {
    slots: {
        inject: (name: string, callback: () => unknown) => unknown;
        register: (options: {
            name: string;
            id: string;
            order: number;
            inject?: () => {
                hooks: {
                    jobs: {
                        getSnapshot: () => unknown;
                        subscribe: (listener: () => void) => () => void;
                    };
                };
                watchRows: (sessionId: string) => () => void;
            };
        }, component: (props: SlotProps) => unknown) => unknown;
    };
    jobs: {
        state: {
            getSnapshot: () => unknown;
            subscribe: (listener: () => void) => () => void;
        };
        watchRows: (sessionId: string) => () => void;
    };
}): void;
export {};
