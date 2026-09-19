import type { SessionSummary } from './model.ts'

/** 只描述定位会话所需的 React 内部字段, 不修改 Fiber. */
interface RowFiber {
  key: string | null
  memoizedProps: {
    node?: { id?: string }
    result?: { id?: string }
  } | null
  return: RowFiber | null
}

/**
 * DSH 会话行的 React key 与 node/result.id 都是 session id.
 * DOM 暂无公开的行 ID, 只在这两项和会话快照一致时标记, 不按标题猜测.
 * 宿主更换挂载结构后返回 undefined, 避免标到其他会话.
 */
export function rowSessionId(
  element: Element,
  sessions: Readonly<Record<string, SessionSummary | undefined>>,
): string | undefined {
  const key = Object.keys(element).find(name => name.startsWith('__reactFiber$'))
  if (key === undefined) return undefined
  let fiber = (element as unknown as Record<string, RowFiber | null>)[key]
  while (fiber) {
    const id = fiber.key
    const props = fiber.memoizedProps
    if (typeof id === 'string' && (props?.node?.id === id || props?.result?.id === id)) {
      const session = sessions[id]
      return session === undefined || session.blank === true ? undefined : id
    }
    fiber = fiber.return
  }
  return undefined
}
