import type { RuntimeMessage } from './types'
import { DOMAnalyzer, type DOMNodeData } from './dom-analyzer'

type StartInspectMsg = { type: 'START_INSPECT' }
type StopInspectMsg = { type: 'STOP_INSPECT' }
type QueryElementMsg = { type: 'QUERY_ELEMENT'; selector: string }
type ClickElementMsg = { type: 'CLICK_ELEMENT'; selector: string }
type InputElementMsg = { type: 'INPUT_ELEMENT'; selector: string; value: string }
type AssertElementMsg = { type: 'ASSERT_ELEMENT'; selector: string; assertion: any }

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
  if (msg.type === 'START_INSPECT') {
    startInspect()
    sendResponse({ ok: true })
  }
  else if (msg.type === 'STOP_INSPECT') {
    stopInspect()
    sendResponse({ ok: true })
  }
  else if (msg.type === 'PING') {
    sendResponse({ ok: true })
  }
  else if (msg.type === 'QUERY_ELEMENT') {
    const { selector } = msg as QueryElementMsg
    try {
      const element = document.querySelector(selector)
      if (element) {
        sendResponse({ 
          ok: true, 
          found: true, 
          element: {
            tagName: element.tagName?.toLowerCase() || 'unknown',
            textContent: element.textContent?.trim() || '',
            value: (element as HTMLInputElement).value || '',
            attributes: Array.from(element.attributes).map(attr => ({
              name: attr.name,
              value: attr.value
            }))
          }
        })
      } else {
        sendResponse({ ok: true, found: false })
      }
    } catch (error) {
      sendResponse({ 
        ok: false, 
        error: error instanceof Error ? error.message : String(error) 
      })
    }
  }
  else if (msg.type === 'CLICK_ELEMENT') {
    const { selector } = msg as ClickElementMsg
    try {
      const element = document.querySelector(selector) as HTMLElement
      if (element) {
        element.click()
        sendResponse({ ok: true, clicked: true })
      } else {
        sendResponse({ ok: false, error: '요소를 찾을 수 없습니다' })
      }
    } catch (error) {
      sendResponse({ 
        ok: false, 
        error: error instanceof Error ? error.message : String(error) 
      })
    }
  }
  else if (msg.type === 'INPUT_ELEMENT') {
    const { selector, value } = msg as InputElementMsg
    try {
      const element = document.querySelector(selector) as HTMLInputElement
      if (element) {
        element.value = value
        element.dispatchEvent(new Event('input', { bubbles: true }))
        element.dispatchEvent(new Event('change', { bubbles: true }))
        sendResponse({ ok: true, inputted: true })
      } else {
        sendResponse({ ok: false, error: '요소를 찾을 수 없습니다' })
      }
    } catch (error) {
      sendResponse({ 
        ok: false, 
        error: error instanceof Error ? error.message : String(error) 
      })
    }
  }
  else if (msg.type === 'ASSERT_ELEMENT') {
    const { selector, assertion } = msg as AssertElementMsg
    try {
      const element = document.querySelector(selector)
      if (!element) {
        sendResponse({ 
          ok: true, 
          success: false, 
          message: '요소를 찾을 수 없습니다',
          actual: null
        })
        return
      }

      let success = false
      let message = ''
      let actual: any = null

      switch (assertion.type) {
        case 'element_exists':
          success = true
          message = '요소가 존재합니다'
          actual = true
          break
        case 'text_equals':
          const text = element.textContent?.trim() || ''
          actual = text
          success = text === assertion.expected
          message = success ? '텍스트가 일치합니다' : `텍스트가 일치하지 않습니다. 예상: "${assertion.expected}", 실제: "${text}"`
          break
        case 'text_contains':
          const content = element.textContent?.trim() || ''
          actual = content
          success = content.includes(assertion.expected)
          message = success ? '텍스트를 포함합니다' : `텍스트를 포함하지 않습니다. 예상: "${assertion.expected}", 실제: "${content}"`
          break
        case 'value_equals':
          const value = (element as HTMLInputElement).value || ''
          actual = value
          success = value === assertion.expected
          message = success ? '값이 일치합니다' : `값이 일치하지 않습니다. 예상: "${assertion.expected}", 실제: "${value}"`
          break
        case 'attribute_equals':
          const attrValue = element.getAttribute(assertion.attribute || '') || ''
          actual = attrValue
          success = attrValue === assertion.expected
          message = success ? '속성이 일치합니다' : `속성이 일치하지 않습니다. 예상: "${assertion.expected}", 실제: "${attrValue}"`
          break
               case 'visible':
         const isVisible = (element as HTMLElement).offsetWidth > 0 && (element as HTMLElement).offsetHeight > 0 && 
                          window.getComputedStyle(element).visibility !== 'hidden' &&
                          window.getComputedStyle(element).display !== 'none'
          actual = isVisible
          success = isVisible === assertion.expected
          message = success ? '가시성이 일치합니다' : `가시성이 일치하지 않습니다. 예상: ${assertion.expected}, 실제: ${isVisible}`
          break
        default:
          success = false
          message = `지원하지 않는 검증 타입: ${assertion.type}`
          actual = null
      }

      sendResponse({ 
        ok: true, 
        success, 
        message, 
        actual 
      })
    } catch (error) {
      sendResponse({ 
        ok: false, 
        error: error instanceof Error ? error.message : String(error) 
      })
    }
  }
  
  return true // 비동기 응답을 위해 true 반환
}) 