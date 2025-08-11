import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './sidepanel.css'
import { useActiveTab } from './hooks'
import { ensureContentScript, isRestrictedUrl } from './utils'
import type { PickedElementMeta, RuntimeMessage } from './types'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Switch } from '../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Save, Download, Play, Code, AlertTriangle, X, Lightbulb } from 'lucide-react'

function App() {
  const tab = useActiveTab()
  const tabId = tab?.id
  const tabUrl = tab?.url
  const [attached, setAttached] = useState(false)
  const [inspecting, setInspecting] = useState(false)
  const [lastPicked, setLastPicked] = useState<PickedElementMeta | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [showJsonPreview, setShowJsonPreview] = useState(false)
  const [showAccessibilityWarning, setShowAccessibilityWarning] = useState(true)

  const [activeTab, setActiveTab] = useState<'record' | 'inspector' | 'builder' | 'scenario' | 'report'>('builder')

  useEffect(() => {
    const onMessage = (msg: RuntimeMessage) => {
      if (msg.type === 'ELEMENT_PICKED') {
        setLastPicked(msg.payload)
        setInspecting(false)
        setActiveTab('inspector')
        // Show accessibility warning if using CSS selector
        if (msg.payload.selector && !msg.payload.selector.includes('data-testid') && !msg.payload.role) {
          setShowAccessibilityWarning(true)
        }
      }
    }
    chrome.runtime.onMessage.addListener(onMessage)
    return () => chrome.runtime.onMessage.removeListener(onMessage)
  }, [])

  const attachable = useMemo(() => {
    if (!tabUrl) return false
    try {
      const u = new URL(tabUrl)
      const httpish = u.protocol === 'http:' || u.protocol === 'https:'
      return httpish && !isRestrictedUrl(u)
    } catch {
      return false
    }
  }, [tabUrl])

  const attach = async () => {
    if (tabId == null) return
    if (!attachable) {
      setError('해당 페이지에서는 동작하지 않습니다. 일반 웹 페이지(https://)에서 다시 시도하세요.')
      return
    }
    try {
      await chrome.debugger.attach({ tabId }, '1.3')
      setAttached(true)
      setError(null)
    } catch (e: any) {
      setError(`attach 실패: ${e?.message ?? '알 수 없는 오류'}`)
    }
  }

  const detach = async () => {
    if (tabId == null) return
    try {
      await chrome.debugger.detach({ tabId })
    } catch {
      // ignore
    }
    setAttached(false)
  }

  const startInspect = async () => {
    if (tabId == null) return
    if (!attachable) {
      setError('해당 페이지에서는 동작하지 않습니다. 일반 웹 페이지(https://)에서 다시 시도하세요.')
      return
    }
    const ok = await ensureContentScript(tabId)
    if (!ok) {
      setError('콘텐츠 스크립트를 주입/확인할 수 없습니다. 페이지를 새로고침하거나 다른 사이트에서 다시 시도하세요.')
      return
    }
    chrome.tabs.sendMessage(tabId, { type: 'START_INSPECT' }, () => {
      if (chrome.runtime.lastError) {
        setError('메시지 전송 실패: 콘텐츠 스크립트가 응답하지 않습니다.')
      } else {
        setError(null)
        setInspecting(true)
        setActiveTab('inspector')
      }
    })
  }

  const stopInspect = () => {
    if (tabId == null) return
    chrome.tabs.sendMessage(tabId, { type: 'STOP_INSPECT' })
    setInspecting(false)
  }

  const statusText = useMemo(() => {
    if (tabId == null) return '활성 탭 없음'
    if (!attachable) return '지원 불가 탭(웹스토어/내부 페이지 등)'
    if (!attached) return '디버거 미연결'
    return '디버거 연결됨'
  }, [tabId, attachable, attached])

  const mockJsonPreview = {
    scenario: "접근성 기반 테스트",
    steps: [
      { action: "click", selector: lastPicked?.selector || "[data-testid='example']" },
      { action: "assert", type: "accessible", name: lastPicked?.name || "버튼" }
    ],
    accessibility: {
      role: lastPicked?.role || "button",
      name: lastPicked?.name || "확인"
    }
  }

  // Check if current picked element needs accessibility improvement
  const needsAccessibilityImprovement = lastPicked && 
    (!lastPicked.role || !lastPicked.name || 
     (lastPicked.selector && !lastPicked.selector.includes('data-testid')))

  return (
    <div className="w-[360px] h-[720px] bg-background border-r flex flex-col">
      {/* Header */}
      <div className="sp-header">
        <div className="sp-header-title">Cake</div>
        <div className="sp-header-sub">E2E Testing Tool</div>
      </div>

      {/* Accessibility Warning */}
      {showAccessibilityWarning && needsAccessibilityImprovement && (
        <Alert className="m-3 bg-amber-50 border-amber-200 relative">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 pr-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">CSS 셀렉터 기반 요소 발견</span>
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                  안정성 낮음
                </Badge>
              </div>
              <div className="text-xs">CSS 셀렉터는 페이지 구조 변경 시 쉽게 깨질 수 있습니다.</div>
              <div className="flex items-start gap-1">
                <Lightbulb className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-600">•</span>
                    <span>data-testid 속성 추가</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-amber-600">•</span>
                    <span>aria-label 또는 role 추가</span>
                  </div>
                </div>
              </div>
            </div>
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-auto p-1 text-amber-600 hover:text-amber-800"
            onClick={() => setShowAccessibilityWarning(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Alert>
      )}

      {/* Status and Connection */}
      <div className="flex items-center justify-between p-3 border-b">
        <Badge variant={attached ? "default" : "outline"} className="text-xs">
          {statusText}
        </Badge>
        {!attached ? (
          <Button size="sm" onClick={attach} disabled={tabId == null || !attachable}>
            연결
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={detach}>
            해제
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5 mx-3 mt-2">
          <TabsTrigger value="record" className="text-xs">기록</TabsTrigger>
          <TabsTrigger value="inspector" className="text-xs">인스펙터</TabsTrigger>
          <TabsTrigger value="builder" className="text-xs">빌더</TabsTrigger>
          <TabsTrigger value="scenario" className="text-xs">시나리오</TabsTrigger>
          <TabsTrigger value="report" className="text-xs">리포트</TabsTrigger>
        </TabsList>

        <div className="flex-1 flex flex-col overflow-hidden">
          <TabsContent value="record" className="flex-1 mt-0 p-3">
            <p className="text-sm text-muted-foreground">기록 탭은 이벤트 캡처를 표시합니다. (모형 UI)</p>
          </TabsContent>

          <TabsContent value="inspector" className="flex-1 mt-0 p-3 space-y-3">
            {!inspecting ? (
              <Button onClick={startInspect} disabled={tabId == null} className="w-full">
                요소 선택 시작
              </Button>
            ) : (
              <Button variant="outline" onClick={stopInspect} className="w-full">
                요소 선택 종료
              </Button>
            )}

            {lastPicked && (
              <div className="space-y-2 p-3 border rounded-lg bg-card">
                <div className="text-sm">
                  <strong>역할(role):</strong> 
                  <Badge variant="secondary" className="ml-2">
                    {lastPicked.role ?? '알 수 없음'}
                  </Badge>
                </div>
                <div className="text-sm">
                  <strong>이름(name):</strong> {lastPicked.name ?? '알 수 없음'}
                </div>
                <div className="text-sm">
                  <strong>셀렉터:</strong>
                  <code className="text-xs bg-muted p-1 rounded ml-2 block mt-1 break-all">
                    {lastPicked.selector}
                  </code>
                </div>
                {needsAccessibilityImprovement && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                    💡 이 요소는 접근성 개선이 필요합니다. data-testid나 ARIA 속성 추가를 권장합니다.
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="builder" className="flex-1 mt-0 p-3">
            <p className="text-sm text-muted-foreground">빌더 탭은 모델 기반 테스트 구성을 제공합니다. (모형 UI)</p>
          </TabsContent>

          <TabsContent value="scenario" className="flex-1 mt-0 p-3">
            <p className="text-sm text-muted-foreground">시나리오 목록과 실행을 관리합니다. (모형 UI)</p>
          </TabsContent>

          <TabsContent value="report" className="flex-1 mt-0 p-3">
            <p className="text-sm text-muted-foreground">테스트 리포트 요약을 확인합니다. (모형 UI)</p>
          </TabsContent>
        </div>
      </Tabs>

      {/* JSON Preview */}
      {showJsonPreview && (
        <div className="border-t p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">JSON 미리보기</label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowJsonPreview(false)}
            >
              ✕
            </Button>
          </div>
          <div className="bg-muted rounded p-2 text-xs font-mono overflow-auto max-h-32">
            <pre>{JSON.stringify(mockJsonPreview, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="border-t p-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="json-toggle" className="text-xs">JSON</label>
            <Switch
              id="json-toggle"
              checked={showJsonPreview}
              onCheckedChange={setShowJsonPreview}
            />
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline">
              <Save className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="outline">
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button className="flex-1" size="sm">
            <Play className="w-3 h-3 mr-1" />
            테스트 실행
          </Button>
          <Button size="sm" variant="outline">
            <Code className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {!attachable && (
        <div className="p-3 bg-yellow-50 border-t border-yellow-200 text-yellow-800 text-xs">
          이 페이지에서는 동작하지 않습니다. 크롬 웹스토어/내부 페이지(chrome://) 등은 제한됩니다.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border-t border-red-200 text-red-800 text-xs">
          {error}
        </div>
      )}
    </div>
  )
}

const container = document.getElementById('root')!
createRoot(container).render(<App />) 