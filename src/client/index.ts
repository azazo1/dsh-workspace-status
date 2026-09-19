import { createElement, useEffect, useMemo, useRef } from 'react'
import {
  sessionsWithLiveJobs,
  workspaceStatus,
  type JobsBySession,
  type PendingInteractionMap,
  type SessionSummary,
  type WorkspaceView,
} from './model.ts'
import { installRowMarkers, type RowMarkerSnapshot, type RowMarkers } from './rows.ts'
import { styleSheet } from './style.ts'

/** 会话列表快照中本插件读取的行摘要与后台任务镜像. */
interface SessionListState {
  byId: Readonly<Record<string, SessionSummary | undefined>>
  jobsBySession: JobsBySession
}

interface WorkspaceListState {
  items: readonly WorkspaceView[]
}

interface SlotProps {
  useSessions: <Selected>(selector: (state: SessionListState) => Selected) => Selected
  useWorkspaces: <Selected>(selector: (state: WorkspaceListState) => Selected) => Selected
  useSessionPendingInteraction: <Selected>(selector: (state: PendingInteractionMap) => Selected) => Selected
}

function emptySnapshot(): RowMarkerSnapshot {
  return { sessions: {}, liveJobSessions: new Set() }
}

function WorkspaceState(props: SlotProps) {
  const workspaces = props.useWorkspaces(state => state.items)
  const sessions = props.useSessions(state => state.byId)
  const jobsBySession = props.useSessions(state => state.jobsBySession)
  const pendingInteractions = props.useSessionPendingInteraction(state => state)

  const statuses = workspaces.map(workspace => workspaceStatus(
    workspace,
    sessions,
    pendingInteractions,
    jobsBySession,
  ))

  const liveJobSessions = useMemo(() => sessionsWithLiveJobs(jobsBySession), [jobsBySession])
  const snapshotRef = useRef<RowMarkerSnapshot>(emptySnapshot())
  snapshotRef.current = { sessions, liveJobSessions }

  const markersRef = useRef<RowMarkers | null>(null)
  useEffect(() => {
    const markers = installRowMarkers(() => snapshotRef.current)
    markersRef.current = markers
    return () => {
      markersRef.current = null
      markers.dispose()
    }
  }, [])
  // 任务起止可能不改 DOM, 仍需按快照主动对齐.
  useEffect(() => {
    markersRef.current?.update()
  }, [sessions, liveJobSessions])

  return createElement('style', { 'data-dsh-workspace-status': 'true' }, styleSheet(statuses))
}

export const inject = ['slots']

export function apply(ctx: { slots: { inject: (name: string, callback: () => unknown) => unknown; register: (options: { name: string; id: string; order: number }, component: (props: SlotProps) => unknown) => unknown } }): void {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
    { name: 'sidebar.footer.action', id: 'dsh-workspace-status', order: 1000 },
    WorkspaceState,
  ))
}
