interface SessionSummary {
    running?: boolean;
    completed?: boolean;
    pendingInteraction?: 'approval' | 'plan-review' | 'question';
}
interface SessionListState {
    byId: Record<string, SessionSummary | undefined>;
}
interface WorkspaceView {
    workspaceId: string;
    sessionIds: readonly string[];
}
interface WorkspaceListState {
    items: readonly WorkspaceView[];
}
interface SlotProps {
    useSessions: <Selected>(selector: (state: SessionListState) => Selected) => Selected;
    useWorkspaces: <Selected>(selector: (state: WorkspaceListState) => Selected) => Selected;
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
