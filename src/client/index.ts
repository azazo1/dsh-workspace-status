import { createElement } from 'react'

interface SessionSummary {
  running?: boolean
  completed?: boolean
  pendingInteraction?: 'approval' | 'plan-review' | 'question'
}

interface SessionListState {
  byId: Record<string, SessionSummary | undefined>
}

interface WorkspaceView {
  workspaceId: string
  sessionIds: readonly string[]
}

interface WorkspaceListState {
  items: readonly WorkspaceView[]
}

interface SlotProps {
  useSessions: <Selected>(selector: (state: SessionListState) => Selected) => Selected
  useWorkspaces: <Selected>(selector: (state: WorkspaceListState) => Selected) => Selected
}

const style = `
@keyframes dsh-workspace-status-pulse {
  0%, 100% { color: var(--ds-accent, #4f9cff); filter: drop-shadow(0 0 0 transparent); transform: scale(1); }
  50% { color: color-mix(in srgb, var(--ds-accent, #4f9cff) 72%, white); filter: drop-shadow(0 0 5px currentColor); transform: scale(1.14); }
}

@keyframes dsh-workspace-status-pending {
  0%, 100% { opacity: 0.68; filter: drop-shadow(0 0 1px currentColor); transform: scale(1); }
  50% { opacity: 1; filter: drop-shadow(0 0 6px currentColor); transform: scale(1.08); }
}

[role="tree"] > div:has([data-state="warning"]) > * > [role="treeitem"] > span:first-child,
[data-dsh-workspace-status-pending="true"] {
  color: var(--ds-warning, #d99a22);
  animation: dsh-workspace-status-pending 2s ease-in-out infinite;
  transform-origin: center;
}

[role="tree"] > div:has([data-state="warning"]) > * > [role="treeitem"] > span:first-child svg {
  color: var(--ds-warning, #d99a22);
}

[role="tree"] > div:has([data-state="ongoing"]) > * > [role="treeitem"] > span:first-child {
  animation: dsh-workspace-status-pulse 1.6s ease-in-out infinite;
  transform-origin: center;
}

[role="tree"] > div:has([data-state="ongoing"]) > * > [role="treeitem"] > span:first-child svg {
  color: var(--ds-accent, #4f9cff);
}

[role="tree"] > div:has([data-state="done"]):not(:has([data-state="ongoing"])) > * > [role="treeitem"] > span:first-child,
[data-dsh-workspace-status-unread="true"] {
  color: var(--ds-success, #22a06b);
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--ds-success, #22a06b) 55%, transparent));
}

@media (prefers-reduced-motion: reduce) {
  [role="tree"] > div:has([data-state="warning"]) > * > [role="treeitem"] > span:first-child,
  [role="tree"] > div:has([data-state="ongoing"]) > * > [role="treeitem"] > span:first-child {
    animation: none;
    filter: none;
    transform: none;
  }
}
`

function WorkspaceState(props: SlotProps) {
  const workspaces = props.useWorkspaces(state => state.items)
  const sessions = props.useSessions(state => state.byId)
  const rules: string[] = []

  workspaces.forEach((workspace, index) => {
    let pending = false
    let active = false
    let unread = false
    workspace.sessionIds.forEach(sessionId => {
      const session = sessions[sessionId]
      if (session?.pendingInteraction !== undefined) pending = true
      if (session?.running === true) active = true
      if (session?.completed === true) unread = true
    })
    const row = `[role="tree"] > div:nth-child(${index + 1}) > * > [role="treeitem"] > span:first-child`
    if (pending) {
      rules.push(`${row}{color:var(--ds-warning,#d99a22);animation:dsh-workspace-status-pending 2s ease-in-out infinite;transform-origin:center}`)
    } else if (active) {
      rules.push(`${row}{animation:dsh-workspace-status-pulse 1.6s ease-in-out infinite;transform-origin:center;color:var(--ds-accent,#4f9cff)}`)
    } else if (unread) {
      rules.push(`${row}{color:var(--ds-success,#22a06b);filter:drop-shadow(0 0 4px color-mix(in srgb,var(--ds-success,#22a06b) 55%,transparent))}`)
    }
  })

  return createElement('style', { 'data-dsh-workspace-status': 'true' }, `${style}\n${rules.join('')}`)
}

export const inject = ['slots']

export function apply(ctx: { slots: { inject: (name: string, callback: () => unknown) => unknown; register: (options: { name: string; id: string; order: number }, component: (props: SlotProps) => unknown) => unknown } }): void {
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register(
    { name: 'sidebar.footer.action', id: 'dsh-workspace-status', order: 1000 },
    WorkspaceState,
  ))
}
