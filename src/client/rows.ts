/**
 * 会话行标记: 会话列表行没有官方槽位, 只能在 DOM 上注入.
 *
 * 行上没有会话 id, 唯一可用的对应关系是显示标题, 因此标题重复的会话一律
 * 不标记: 宁可漏, 不可错. 标记元素由本模块自己插入与移除, 走 data-owner
 * 属性自我标识, 不触碰 React 管理的子节点内容.
 */

/** 标记元素的 data-owner 值, 同时也是样式表的定位锚点. */
export const MARKER_OWNER = 'dsh-workspace-status'

/**
 * 会话行选择器. 会话行是树里的 `div[role="treeitem"]`, 搜索结果是同 role
 * 的 button, 且布局不同, 因此只认 div.
 */
const ROW_SELECTOR = `div[role="treeitem"][aria-selected]`

/** 行直属的标记元素, 用来判断这一行当前是否已经标记过. */
const MARKER_SELECTOR = `:scope > [data-owner="${MARKER_OWNER}"]`

/** 行标记需要的事实. */
export interface RowMarkerSnapshot {
  /** 显示标题到会话 id 的反查表. */
  readonly byTitle: ReadonlyMap<string, readonly string[]>
  /** 有运行中或正在停止的后台任务的会话 id. */
  readonly liveJobSessions: ReadonlySet<string>
}

/** 安装后的句柄: 数据变化时主动对齐一次, 卸载时停止观察并清除标记. */
export interface RowMarkers {
  /** 按当前快照重算标记; React 重渲染不改 DOM 时 MutationObserver 不会触发, 需要主动调用. */
  update: () => void
  /** 停止观察并清除本插件插入的全部标记. */
  dispose: () => void
}

/**
 * 在行内定位承载标题的元素.
 *
 * 标题元素的类名带构建期哈希, 不能按类名找; 按文本匹配则只认完全等于某个
 * 已知标题的 span, 命中不了就放弃这一行.
 */
function findTitleElement(
  row: Element,
  byTitle: ReadonlyMap<string, readonly string[]>,
): { element: Element; sessionId: string } | undefined {
  const spans = row.querySelectorAll('span')
  for (const span of spans) {
    const text = span.textContent?.trim() ?? ''
    if (text === '') continue
    const ids = byTitle.get(text)
    if (ids === undefined) continue
    // 同名会话无法判断是哪一行, 直接放弃这行而不是猜一个.
    if (ids.length !== 1) return undefined
    return { element: span, sessionId: ids[0] as string }
  }
  return undefined
}

/** 移除全部标记元素. */
function removeMarkers(): void {
  for (const marker of document.querySelectorAll(`[data-owner="${MARKER_OWNER}"]`)) marker.remove()
}

/**
 * 使页面上的标记与快照一致.
 * @param snapshot - 标题反查表与有后台任务的会话集合.
 */
function sync(snapshot: RowMarkerSnapshot): void {
  // 没有活跃任务时不必反查标题, 只需撤掉可能残留的标记.
  if (snapshot.liveJobSessions.size === 0) {
    removeMarkers()
    return
  }
  for (const row of document.querySelectorAll(ROW_SELECTOR)) {
    const existing = row.querySelector(MARKER_SELECTOR)
    const resolved = findTitleElement(row, snapshot.byTitle)
    const needed = resolved !== undefined && snapshot.liveJobSessions.has(resolved.sessionId)
    if (needed && existing === null) {
      const marker = document.createElement('span')
      marker.setAttribute('data-owner', MARKER_OWNER)
      marker.setAttribute('aria-hidden', 'true')
      resolved.element.after(marker)
    } else if (!needed && existing !== null) {
      existing.remove()
    }
  }
}

/**
 * 安装会话行标记: 观察 DOM 变化并按快照对齐.
 *
 * 标记只在真的需要插入或移除时改动 DOM, 因此一次变更触发的那一轮重算会
 * 立即收敛, 不会自我激励成逐帧循环.
 * @param source - 读取当前快照的函数, 供观察回调按需取值.
 */
export function installRowMarkers(source: () => RowMarkerSnapshot): RowMarkers {
  let frame = 0
  const schedule = (): void => {
    if (frame !== 0) return
    frame = requestAnimationFrame(() => {
      frame = 0
      sync(source())
    })
  }
  const observer = new MutationObserver(schedule)
  if (document.body !== null) observer.observe(document.body, { childList: true, subtree: true })
  schedule()
  return {
    // 走同一套节流: 流式输出期间快照引用每帧都变, 同步重算会把反查成本翻倍.
    update: schedule,
    dispose: () => {
      observer.disconnect()
      if (frame !== 0) cancelAnimationFrame(frame)
      frame = 0
      removeMarkers()
    },
  }
}
