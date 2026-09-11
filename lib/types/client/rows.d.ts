/**
 * 会话行标记: 会话列表行没有官方槽位, 只能在 DOM 上注入.
 *
 * 行上没有会话 id, 唯一可用的对应关系是显示标题, 因此标题重复的会话一律
 * 不标记: 宁可漏, 不可错. 标记元素由本模块自己插入与移除, 走 data-owner
 * 属性自我标识, 不触碰 React 管理的子节点内容.
 */
/** 标记元素的 data-owner 值, 同时也是样式表的定位锚点. */
export declare const MARKER_OWNER = "dsh-workspace-status";
/** 行标记需要的事实. */
export interface RowMarkerSnapshot {
    /** 显示标题到会话 id 的反查表. */
    readonly byTitle: ReadonlyMap<string, readonly string[]>;
    /** 有运行中或正在停止的后台任务的会话 id. */
    readonly liveJobSessions: ReadonlySet<string>;
}
/** 安装后的句柄: 数据变化时主动对齐一次, 卸载时停止观察并清除标记. */
export interface RowMarkers {
    /** 按当前快照重算标记; React 重渲染不改 DOM 时 MutationObserver 不会触发, 需要主动调用. */
    update: () => void;
    /** 停止观察并清除本插件插入的全部标记. */
    dispose: () => void;
}
/**
 * 安装会话行标记: 观察 DOM 变化并按快照对齐.
 *
 * 标记只在真的需要插入或移除时改动 DOM, 因此一次变更触发的那一轮重算会
 * 立即收敛, 不会自我激励成逐帧循环.
 * @param source - 读取当前快照的函数, 供观察回调按需取值.
 */
export declare function installRowMarkers(source: () => RowMarkerSnapshot): RowMarkers;
