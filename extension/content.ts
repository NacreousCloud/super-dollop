import type { RuntimeMessage } from './types'

type StartInspectMsg = { type: 'START_INSPECT' }
type StopInspectMsg = { type: 'STOP_INSPECT' }

type PickedElementMeta = {
  role: string | null
  name: string | null
  selector: string
}

let overlay: HTMLDivElement | null = null
let inspecting = false
let onMouseMove: ((e: MouseEvent) => void) | null = null
let onClickPick: ((e: MouseEvent) => void) | null = null

function ensureOverlay() {
  if (overlay) return overlay
  overlay = document.createElement('div')
  overlay.style.position = 'fixed'
  overlay.style.zIndex = '2147483647'
  overlay.style.pointerEvents = 'none'
  overlay.style.border = '2px solid #5b9cff'
  overlay.style.background = 'rgba(91,156,255,0.15)'
  overlay.style.borderRadius = '3px'
  document.documentElement.appendChild(overlay)
  return overlay
}

function removeOverlay() {
  overlay?.remove()
  overlay = null
}

function rectOf(el: Element) {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

function updateOverlay(el: Element) {
  const box = rectOf(el)
  const o = ensureOverlay()
  o.style.left = box.left + 'px'
  o.style.top = box.top + 'px'
  o.style.width = Math.max(0, box.width) + 'px'
  o.style.height = Math.max(0, box.height) + 'px'
}

function simpleRole(el: Element): string | null {
  const roleAttr = el.getAttribute('role')
  if (roleAttr) return roleAttr
  const tag = el.tagName.toLowerCase()
  if (tag === 'button') return 'button'
  if (tag === 'a' && (el as HTMLAnchorElement).href) return 'link'
  if (tag === 'input') {
    const type = (el as HTMLInputElement).type
    if (type === 'checkbox') return 'checkbox'
    if (type === 'radio') return 'radio'
    return 'textbox'
  }
  if (tag === 'select') return 'combobox'
  if (tag === 'textarea') return 'textbox'
  return null
}

function simpleName(el: Element): string | null {
  const ariaLabel = el.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel.trim() || null
  const labelledBy = el.getAttribute('aria-labelledby')
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() || '')
      .filter(Boolean)
      .join(' ')
      .trim()
    if (text) return text
  }
  const alt = (el as HTMLElement).getAttribute?.('alt')
  if (alt) return alt
  const text = (el as HTMLElement).innerText?.trim() || ''
  if (text) return text
  return null
}

function cssPath(el: Element): string {
  const parts: string[] = []
  let node: Element | null = el
  while (node && node.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
    let selector = node.nodeName.toLowerCase()
    if (node.id) {
      selector += `#${CSS.escape(node.id)}`
      parts.unshift(selector)
      break
    } else {
      let sib = node
      let nth = 1
      let ps: Element | null = sib.previousElementSibling
      while (ps) {
        if (ps.nodeName === node.nodeName) nth++
        ps = ps.previousElementSibling
      }
      selector += `:nth-of-type(${nth})`
    }
    parts.unshift(selector)
    node = node.parentElement
  }
  return parts.join(' > ')
}

function pickMeta(el: Element): PickedElementMeta {
  return {
    role: simpleRole(el),
    name: simpleName(el),
    selector: cssPath(el),
  }
}

function startInspect() {
  if (inspecting) return
  inspecting = true
  ensureOverlay()
  onMouseMove = (e: MouseEvent) => {
    const target = e.target as Element | null
    if (!target) return
    updateOverlay(target as Element)
  }
  onClickPick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const target = e.target as Element | null
    if (!target) return
    const meta = pickMeta(target)
    chrome.runtime.sendMessage({ type: 'ELEMENT_PICKED', payload: meta })
    stopInspect()
  }
  window.addEventListener('mousemove', onMouseMove, true)
  window.addEventListener('click', onClickPick, true)
  document.body.style.cursor = 'crosshair'
}

function stopInspect() {
  if (!inspecting) return
  inspecting = false
  window.removeEventListener('mousemove', onMouseMove as any, true)
  window.removeEventListener('click', onClickPick as any, true)
  onMouseMove = null
  onClickPick = null
  document.body.style.cursor = ''
  removeOverlay()
}

chrome.runtime.onMessage.addListener((msg: RuntimeMessage, _sender, sendResponse) => {
  if (msg.type === 'START_INSPECT') startInspect()
  else if (msg.type === 'STOP_INSPECT') stopInspect()
  else if (msg.type === 'PING') {
    sendResponse({ ok: true })
  }
}) 