import type { RuntimeMessage } from './types'
import { DOMAnalyzer, type DOMNodeData } from './dom-analyzer'

type StartInspectMsg = { type: 'START_INSPECT' }
type StopInspectMsg = { type: 'STOP_INSPECT' }

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
  
  // Update overlay color based on accessibility score
  const analysis = DOMAnalyzer.analyzeElement(el)
  const score = analysis.selectorStrategies.accessibility.score + 
                analysis.selectorStrategies.name.score + 
                analysis.selectorStrategies.testid.score
  
  if (score > 180) {
    o.style.border = '2px solid #10b981' // Green for good accessibility
    o.style.background = 'rgba(16,185,129,0.15)'
  } else if (score > 120) {
    o.style.border = '2px solid #f59e0b' // Yellow for moderate
    o.style.background = 'rgba(245,158,11,0.15)'
  } else {
    o.style.border = '2px solid #ef4444' // Red for poor accessibility
    o.style.background = 'rgba(239,68,68,0.15)'
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
    
    // Use the new DOMAnalyzer for comprehensive analysis
    const analysis = DOMAnalyzer.analyzeElement(target)
    
    // Send the detailed analysis data
    chrome.runtime.sendMessage({ 
      type: 'ELEMENT_PICKED', 
      payload: {
        // Keep backward compatibility with existing interface
        role: analysis.role,
        name: analysis.accessibleName,
        selector: analysis.selectorStrategies.css.selector,
        // Add new detailed analysis
        detailedAnalysis: analysis
      }
    })
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