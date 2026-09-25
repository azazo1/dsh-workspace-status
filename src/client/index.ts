import { createElement, useEffect, useMemo, useRef } from 'react'
import {
  sessionsWithLiveJobs,
  workspaceStatus,
  type JobsBySession,
  type SessionStatusMap,
  type SessionSummary,
  type WorkspaceView,
} from './model.ts'
import { installRowMarkers, type RowMarkerSnapshot, type RowMarkers } from './rows.ts'
import { styleSheet } from './style.ts'

/** 会话列表快照中本插件读取的行摘要与后台任务镜像. */
interface SessionListState {
  byId: Readonly<Record<string, SessionSummary | undefined>>
  ids: readonly string[]
}

interface WorkspaceListState {
  items: readonly WorkspaceView[]
}

interface SlotProps {
  useSessions: <Selected>(selector: (state: SessionListState) => Selected) => Selected
  useSessionStatus: <Selected>(selector: (state: SessionStatusMap) => Selected) => Selected
  useWorkspaces: <Selected>(selector: (state: WorkspaceListState) => Selected) => Selected
  useJobs: <Selected>(selector: (state: { rows: JobsBySession }) => Selected) => Selected
  watchRows: (sessionId: string) => () => void
}

function emptySnapshot(): RowMarkerSnapshot {
  return { sessions: {}, liveJobSessions: new Set() }
}

function WorkspaceState(props: SlotProps) {
  const workspaces = props.useWorkspaces(state => state.items)
  const sessionIds = props.useSessions(state => state.ids)
  const sessions = props.useSessions(state => state.byId)
  const sessionStatuses = props.useSessionStatus(state => state)
  const jobsBySession = props.useJobs(state => state.rows)
  const watchRows = props.watchRows

  // 任务镜像只为已订阅的会话保留行, 所以订阅要按会话增量对齐. 会话列表每次投影
  // 都会给出新的 ids 数组, 若把订阅挂在 ids 依赖上整体重建, 宿主会在每次列表
  // 变化时关掉再重开全部会话的任务流.
  const watchedRef = useRef(new Map<string, () => void>())
  useEffect(() => {
    const watched = watchedRef.current
    const wanted = new Set(sessionIds)
    for (const [sessionId, release] of watched) {
      if (wanted.has(sessionId)) continue
      watched.delete(sessionId)
      release()
    }
    for (const sessionId of wanted) {
      if (watched.has(sessionId)) continue
      watched.set(sessionId, watchRows(sessionId))
    }
  }, [sessionIds, watchRows])
  useEffect(() => () => {
    const watched = watchedRef.current
    watchedRef.current = new Map()
    for (const release of watched.values()) release()
  }, [])

  const statuses = workspaces.map(workspace => workspaceStatus(
    workspace,
    sessions,
    sessionStatuses,
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

export const inject = ['slots', 'jobs']

export function apply(ctx: {
  slots: {
    inject: (name: string, callback: () => unknown) => unknown
    register: (options: {
      name: string
      id: string
      order: number
      inject?: () => { hooks: { jobs: { getSnapshot: () => unknown; subscribe: (listener: () => void) => () => void } }; watchRows: (sessionId: string) => () => void }
    }, component: (props: SlotProps) => unknown) => unknown
  }
  jobs: {
    state: { getSnapshot: () => unknown; subscribe: (listener: () => void) => () => void }
    watchRows: (sessionId: string) => () => void
  }
}): void {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
    {
      name: 'sidebar.footer.action',
      id: 'dsh-workspace-status',
      order: 1000,
      inject: () => ({
        hooks: { jobs: ctx.jobs.state },
        watchRows: sessionId => ctx.jobs.watchRows(sessionId),
      }),
    },
    WorkspaceState,
  ))
}
