import type { SessionSummary } from './model.ts';
/** 本插件独立持有行蓝点, 不依赖其他插件插入的节点或属性. */
export declare const MARKER_OWNER = "dsh-workspace-status";
export interface RowMarkerSnapshot {
    readonly sessions: Readonly<Record<string, SessionSummary | undefined>>;
    readonly liveJobSessions: ReadonlySet<string>;
}
export interface RowMarkers {
    update: () => void;
    dispose: () => void;
}
/** 安装 DOM 观察和快照更新入口, 卸载时清理本插件标记. */
export declare function installRowMarkers(source: () => RowMarkerSnapshot): RowMarkers;
