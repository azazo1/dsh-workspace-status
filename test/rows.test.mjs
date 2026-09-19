import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { setImmediate } from 'node:timers/promises'
import React, { act } from 'react'
import { JSDOM } from 'jsdom'

const code = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
const owner = '[data-owner="dsh-workspace-status"]'

// 独立加载发布 bundle, 仅由宿主提供 React, 不加载其他插件.
test('同名会话的任务蓝点按 ID 更新, 重排和改名不串行, 卸载清理', async t => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>')
  const { window } = dom
  const { document } = window
  const frames = new Map()
  let nextFrame = 0
  const globals = {
    window, document, MutationObserver: window.MutationObserver,
    IS_REACT_ACT_ENVIRONMENT: true,
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame },
    cancelAnimationFrame(id) { frames.delete(id) },
  }
  const old = new Map()
  for (const [key, value] of Object.entries(globals)) {
    old.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  }
  const { createRoot } = await import('react-dom/client')
  const root = createRoot(document.getElementById('root'))
  t.after(async () => {
    await act(async () => root.unmount())
    window.close()
    for (const [key, descriptor] of old) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  })
  let plugin
  window.__ModuleLoader__ = { load({ factory }) { plugin = factory(name => {
    assert.equal(name, 'react')
    return React
  }) } }
  vm.runInNewContext(code, { ...globals, console })
  let MarkerComponent
  plugin.apply({ slots: {
    inject(name, callback) { callback() },
    register(options, component) { MarkerComponent = component },
  } })
  assert.equal(typeof MarkerComponent, 'function')
  const sessions = [
    { id: 's1', displayTitle: '相同标题 (1)', blank: false },
    { id: 's2', displayTitle: '相同标题 (1)', blank: false },
  ]
  function SessionNodeItem({ node }) {
    return React.createElement('span', null,
      React.createElement('div', { role: 'treeitem', 'aria-selected': false, 'data-row': node.id },
        React.createElement('span', { className: 'slot' }),
        React.createElement('span', null, node.displayTitle),
        React.createElement('span', null, '7d')))
  }
  const marker = id => document.querySelector(`${owner}[data-session-id="${id}"]`)
  async function flush() {
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        await setImmediate()
        const callbacks = [...frames.values()]
        frames.clear()
        for (const callback of callbacks) callback()
        await setImmediate()
      })
      if (frames.size === 0) return
    }
    throw new Error('蓝点 DOM 更新未收敛')
  }
  async function render(nodes, jobsBySession, { mounted = true, known = nodes } = {}) {
    const state = { byId: Object.fromEntries(known.map(node => [node.id, node])), jobsBySession }
    const props = {
      useSessions: selector => selector(state),
      useWorkspaces: selector => selector({ items: [] }),
      useSessionPendingInteraction: selector => selector(new Map()),
    }
    await act(async () => root.render(React.createElement(React.Fragment, null,
      nodes.map(node => React.createElement(SessionNodeItem, { key: node.id, node })),
      mounted && React.createElement(MarkerComponent, { key: 'plugin', ...props }),
    )))
    await flush()
  }

  await render(sessions, { s1: [{ status: 'running' }], s2: [{ status: 'completed' }] })
  assert.equal(marker('s1').closest('[data-row]').getAttribute('data-row'), 's1')
  assert.equal(marker('s2'), null)
  const first = marker('s1')
  await render([sessions[1], { ...sessions[0], displayTitle: '改名' }], {
    s1: [{ status: 'running' }], s2: [{ status: 'stopping' }],
  })
  assert.equal(marker('s1'), first)
  assert.equal(marker('s2').closest('[data-row]').getAttribute('data-row'), 's2')
  await render(sessions, { s1: [{ status: 'failed' }], s2: [{ status: 'running' }] })
  assert.equal(marker('s1'), null)
  assert.notEqual(marker('s2'), null)
  const foreign = document.createElement('div')
  foreign.setAttribute('role', 'treeitem')
  foreign.setAttribute('aria-selected', 'false')
  foreign.innerHTML = '<span>相同标题 (1)</span>'
  document.body.append(foreign)
  await flush()
  assert.equal(foreign.querySelector(owner), null)
  await render(sessions, { s1: [{ status: 'running' }], s2: [{ status: 'running' }] }, {
    known: [{ ...sessions[0], blank: true }],
  })
  assert.equal(document.querySelectorAll(owner).length, 0)
  await render(sessions, { s1: [{ status: 'running' }], s2: [{ status: 'running' }] })
  assert.equal(document.querySelectorAll(owner).length, 2)
  await render([sessions[0]], {})
  assert.equal(document.querySelectorAll(owner).length, 0)
  await render(sessions, { s1: [{ status: 'running' }] })
  await render(sessions, {}, { mounted: false })
  assert.equal(document.querySelectorAll(owner).length, 0)
})
