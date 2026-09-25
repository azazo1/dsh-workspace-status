import type { SessionSummary } from './model.ts'
import { rowSessionId } from './row-identity.ts'

/** 本插件独立持有行蓝点, 不依赖其他插件插入的节点或属性. */
export const MARKER_OWNER = 'dsh-workspace-status'

/**
 * 侧边栏树里带选中态的行. 搜索结果行同样是这个形状, 但只有会话行带
 * `session:` 行键, 身份判定会把搜索结果和 workspace 分组行排除掉.
 */
const ROW_SELECTOR = 'div[role="treeitem"][aria-selected]'
const MARKER_SELECTOR = `:scope > [data-owner="${MARKER_OWNER}"]`

export interface RowMarkerSnapshot {
  readonly sessions: Readonly<Record<string, SessionSummary | undefined>>
  readonly liveJobSessions: ReadonlySet<string>
}

export interface RowMarkers {
  update: () => void
  dispose: () => void
}

/** 身份已由 session id 确认, 此处只定位用于插入蓝点的直属标题 span. */
function titleElement(row: Element): Element | undefined {
  return Array.from(row.children).find(child => child.tagName === 'SPAN'
    && child.children.length === 0 && !child.hasAttribute('data-owner')
    && (child.textContent?.trim() ?? '') !== '')
}

function removeMarkers(): void {
  for (const marker of document.querySelectorAll(`[data-owner="${MARKER_OWNER}"]`)) marker.remove()
}

/** 只增删发生变化的标记, 使观察器在下一轮收敛. */
function sync(snapshot: RowMarkerSnapshot): void {
  const kept = new Set<Element>()
  if (snapshot.liveJobSessions.size > 0) {
    for (const row of document.querySelectorAll(ROW_SELECTOR)) {
      const sessionId = rowSessionId(row, snapshot.sessions)
      if (sessionId === undefined || !snapshot.liveJobSessions.has(sessionId)) continue
      const title = titleElement(row)
      if (title === undefined) continue
      let marker = row.querySelector(MARKER_SELECTOR)
      if (marker === null) {
        marker = document.createElement('span')
        marker.setAttribute('data-owner', MARKER_OWNER)
        marker.setAttribute('aria-hidden', 'true')
        title.after(marker)
      }
      marker.setAttribute('data-session-id', sessionId)
      kept.add(marker)
    }
  }
  for (const marker of document.querySelectorAll(`[data-owner="${MARKER_OWNER}"]`)) {
    if (!kept.has(marker)) marker.remove()
  }
}

/** 安装 DOM 观察和快照更新入口, 卸载时清理本插件标记. */
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
  if (document.body !== null) observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  schedule()
  return {
    update: schedule,
    dispose: () => {
      observer.disconnect()
      if (frame !== 0) cancelAnimationFrame(frame)
      frame = 0
      removeMarkers()
    },
  }
}
