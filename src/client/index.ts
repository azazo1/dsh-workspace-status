import { createElement, useEffect, useMemo, useRef } from 'react'
import {
  sessionsWithLiveJobs,
  titleIndex,
  workspaceStatus,
  type JobsBySession,
  type PendingInteractionMap,
  type SessionSummary,
  type WorkspaceView,
} from './model.ts'
import { installRowMarkers, type RowMarkerSnapshot, type RowMarkers } from './rows.ts'
import { styleSheet } from './style.ts'

/** 会话列表快照中本插件读取的两块: 行摘要与后台任务镜像. */
interface SessionListState {
  byId: Readonly<Record<string, SessionSummary | undefined>>
  jobsBySession: JobsBySession
}

/** workspace 列表快照. */
interface WorkspaceListState {
  items: readonly WorkspaceView[]
  /** 已归档会话在列表里不渲染, 标题反查需要把它们排除. */
  archivedSessionIds: readonly string[]
}

interface SlotProps {
  useSessions: <Selected>(selector: (state: SessionListState) => Selected) => Selected
  useWorkspaces: <Selected>(selector: (state: WorkspaceListState) => Selected) => Selected
  useSessionPendingInteraction: <Selected>(selector: (state: PendingInteractionMap) => Selected) => Selected
}

/** 空快照: 尚未拿到列表数据时按 "没有后台任务" 处理. */
function emptySnapshot(): RowMarkerSnapshot {
  return { byTitle: new Map(), liveJobSessions: new Set() }
}

function WorkspaceState(props: SlotProps) {
  const workspaces = props.useWorkspaces(state => state.items)
  const archivedSessionIds = props.useWorkspaces(state => state.archivedSessionIds)
  const sessions = props.useSessions(state => state.byId)
  const jobsBySession = props.useSessions(state => state.jobsBySession)
  const pendingInteractions = props.useSessionPendingInteraction(state => state)

  const statuses = workspaces.map(workspace => workspaceStatus(
    workspace,
    sessions,
    pendingInteractions,
    jobsBySession,
  ))

  // 会话行没有官方槽位, 只能按标题反查出会话 id 再去标记 DOM.
  const byTitle = useMemo(() => titleIndex(sessions, archivedSessionIds), [sessions, archivedSessionIds])
  const liveJobSessions = useMemo(() => sessionsWithLiveJobs(jobsBySession), [jobsBySession])
  const snapshotRef = useRef<RowMarkerSnapshot>(emptySnapshot())
  snapshotRef.current = { byTitle, liveJobSessions }

  const markersRef = useRef<RowMarkers | null>(null)
  useEffect(() => {
    const markers = installRowMarkers(() => snapshotRef.current)
    markersRef.current = markers
    return () => {
      markersRef.current = null
      markers.dispose()
    }
  }, [])
  // 任务起止只改这份快照而不一定改 DOM, 需要主动对齐一次.
  useEffect(() => {
    markersRef.current?.update()
  }, [byTitle, liveJobSessions])

  return createElement('style', { 'data-dsh-workspace-status': 'true' }, styleSheet(statuses))
}

export const inject = ['slots']

export function apply(ctx: { slots: { inject: (name: string, callback: () => unknown) => unknown; register: (options: { name: string; id: string; order: number }, component: (props: SlotProps) => unknown) => unknown } }): void {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
    { name: 'sidebar.footer.action', id: 'dsh-workspace-status', order: 1000 },
    WorkspaceState,
  ))
}
