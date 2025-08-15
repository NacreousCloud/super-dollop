import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './sidepanel.css'
import { useActiveTab } from './hooks'
import { ensureContentScript, isRestrictedUrl } from './utils'
import { StorageManager, type TestScenario } from './storage'
import { EventRecorder, type RecordedEvent } from './event-recorder'
import type { PickedElementMeta, RuntimeMessage, AssertionConfig, TestStep } from './types'
import { InspectorDetail } from './inspector-detail'
import { ScenarioList } from './scenario-list'
import { ReportTab } from './report-tab'
import { BuilderTab } from './builder-tab'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Switch } from '../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Save, Download, Play, Code, AlertTriangle, X, Lightbulb, Plus, Circle, Square, Mouse, Keyboard } from 'lucide-react'

function App() {
  const tab = useActiveTab()
  const tabId = tab?.id
  const tabUrl = tab?.url
  const [attached, setAttached] = useState(false)
  const [inspecting, setInspecting] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([])
  const [lastPicked, setLastPicked] = useState<PickedElementMeta | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [showJsonPreview, setShowJsonPreview] = useState(false)
  const [showAccessibilityWarning, setShowAccessibilityWarning] = useState(true)
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null)
  const [autoSave, setAutoSave] = useState(true)

  const [activeTab, setActiveTab] = useState<'record' | 'inspector' | 'builder' | 'scenario' | 'report'>('builder')

  // Load settings on mount
  useEffect(() => {
    StorageManager.load().then(data => {
      setAutoSave(data.settings.autoSave)
      setShowAccessibilityWarning(data.settings.showAccessibilityWarnings)
    })
  }, [])

  useEffect(() => {
    const onMessage = async (msg: RuntimeMessage) => {
      if (msg.type === 'ELEMENT_PICKED') {
        setLastPicked(msg.payload)
        setInspecting(false)
        setActiveTab('inspector')
        
        // Save to recent elements if detailed analysis is available
        if (msg.payload.detailedAnalysis) {
          try {
            await StorageManager.addRecentElement(msg.payload.detailedAnalysis)
          } catch (err) {
            console.error('Failed to save recent element:', err)
          }
        }
        
        // Show accessibility warning if using CSS selector or has issues
        if (msg.payload.detailedAnalysis?.hasAccessibilityIssues || 
            (!msg.payload.detailedAnalysis?.selectorStrategies.testid.available && 
             !msg.payload.detailedAnalysis?.selectorStrategies.accessibility.available)) {
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
    
    // Stop recording if active
    if (recording) {
      await stopRecording()
    }
    
    try {
      await chrome.debugger.detach({ tabId })
    } catch {
      // ignore
    }
    setAttached(false)
  }

  const startRecording = async () => {
    if (!tabId || !attached) {
      setError('먼저 디버거를 연결해주세요.')
      return
    }

    try {
      const recorder = EventRecorder.getInstance()
      await recorder.startRecording(tabId, currentScenarioId || undefined)
      setRecording(true)
      setRecordedEvents([])
      setActiveTab('record')
    } catch (err) {
      setError('기록 시작 실패: ' + (err as Error).message)
    }
  }

  const stopRecording = async () => {
    try {
      const recorder = EventRecorder.getInstance()
      const events = await recorder.stopRecording()
      setRecordedEvents(events)
      setRecording(false)
      
      // Auto-save events if enabled and scenario exists
      if (autoSave && currentScenarioId && events.length > 0) {
        await recorder.saveEventsAsSteps()
      }
    } catch (err) {
      setError('기록 중지 실패: ' + (err as Error).message)
    }
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
        console.error('메시지 전송 실패:', chrome.runtime.lastError)
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

  const createNewScenario = async () => {
    try {
      const scenario = await StorageManager.addScenario({
        name: `테스트 시나리오 ${Date.now()}`,
        description: `${tabUrl}에서 생성된 테스트`,
        steps: [],
        tags: ['web', 'accessibility'],
        status: 'draft',
        runCount: 0
      })
      setCurrentScenarioId(scenario.id)
      setActiveTab('scenario')
    } catch (err) {
      setError('시나리오 생성 실패: ' + (err as Error).message)
    }
  }

  const addElementAsStep = async () => {
    if (!lastPicked?.detailedAnalysis || !currentScenarioId) {
      if (!currentScenarioId) {
        await createNewScenario()
      }
      return
    }

    try {
      const bestSelector = getBestSelector(lastPicked.detailedAnalysis)
      await StorageManager.addStep(currentScenarioId, {
        type: 'click',
        element: {
          selector: bestSelector.selector,
          role: lastPicked.detailedAnalysis.role,
          name: lastPicked.detailedAnalysis.accessibleName,
          analysis: lastPicked.detailedAnalysis
        }
      })
    } catch (err) {
      setError('스텝 추가 실패: ' + (err as Error).message)
    }
  }

  const addAssertionAsStep = async (selector: string, assertion: AssertionConfig) => {
    let scenarioId = currentScenarioId
    if (!scenarioId) {
      await createNewScenario()
      scenarioId = currentScenarioId // Should be set by createNewScenario
      if (!scenarioId) return
    }

    try {
      // Use the existing step format from storage.ts
      const step = {
        id: Date.now().toString(),
        type: 'assert' as const,
        timestamp: Date.now(),
        element: {
          selector,
          role: lastPicked?.detailedAnalysis?.role,
          name: lastPicked?.detailedAnalysis?.accessibleName,
        },
        assertion: {
          type: assertion.type as any,
          expected: String(assertion.expected)
        }
      }

      await StorageManager.addStep(scenarioId, step)
      setError(null)
    } catch (err) {
      setError('검증 추가 실패: ' + (err as Error).message)
    }
  }

  const getBestSelector = (analysis: any) => {
    const strategies = analysis.selectorStrategies
    
    // Priority: testid > accessibility > name > css
    if (strategies.testid.available) return strategies.testid
    if (strategies.accessibility.available) return strategies.accessibility  
    if (strategies.name.available) return strategies.name
    return strategies.css
  }

  const handleSave = async () => {
    try {
      if (lastPicked?.detailedAnalysis) {
        await addElementAsStep()
      }
      // Could show success feedback here
    } catch (err) {
      setError('저장 실패: ' + (err as Error).message)
    }
  }

  const handleExport = async () => {
    try {
      const data = await StorageManager.exportScenarios()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cake-scenarios-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('내보내기 실패: ' + (err as Error).message)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'click': return <Mouse className="w-3 h-3 text-blue-600" />
      case 'input': return <Keyboard className="w-3 h-3 text-green-600" />
      case 'navigate': return <Play className="w-3 h-3 text-purple-600" />
      default: return <Mouse className="w-3 h-3 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

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
  const needsAccessibilityImprovement = lastPicked?.detailedAnalysis?.hasAccessibilityIssues || 
    (lastPicked && !lastPicked.detailedAnalysis?.selectorStrategies.testid.available && 
     !lastPicked.detailedAnalysis?.selectorStrategies.accessibility.available)

  const handleCopySelector = async (selector: string) => {
    try {
      await navigator.clipboard.writeText(selector)
      // Could show a toast here
    } catch (err) {
      console.error('Failed to copy selector:', err)
    }
  }

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
                <span className="font-medium text-sm">접근성 개선 필요</span>
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                  안정성 낮음
                </Badge>
              </div>
              <div className="text-xs">선택된 요소에 접근성 개선이 필요합니다.</div>
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
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5 mx-3 mt-2">
          <TabsTrigger value="record" className="text-xs">기록</TabsTrigger>
          <TabsTrigger value="inspector" className="text-xs">인스펙터</TabsTrigger>
          <TabsTrigger value="builder" className="text-xs">빌더</TabsTrigger>
          <TabsTrigger value="scenario" className="text-xs">시나리오</TabsTrigger>
          <TabsTrigger value="report" className="text-xs">리포트</TabsTrigger>
        </TabsList>

        <div className="flex-1 flex flex-col overflow-hidden">
          <TabsContent value="record" className="flex-1 mt-0 p-3 space-y-3 overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">이벤트 기록</h3>
              {!recording ? (
                <Button size="sm" onClick={startRecording} disabled={!attached}>
                  <Circle className="w-3 h-3 mr-1" />
                  기록 시작
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={stopRecording}>
                  <Square className="w-3 h-3 mr-1" />
                  기록 중지
                </Button>
              )}
            </div>

            {recording && (
              <Alert className="bg-red-50 border-red-200">
                <Circle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  이벤트를 기록하고 있습니다. 웹 페이지에서 상호작용하세요.
                </AlertDescription>
              </Alert>
            )}

            {recordedEvents.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  기록된 이벤트 {recordedEvents.length}개
                </div>
                {recordedEvents.map((event) => (
                  <div key={event.id} className="p-2 border rounded-lg bg-card">
                    <div className="flex items-center gap-2 mb-1">
                      {getEventIcon(event.type)}
                      <span className="text-sm font-medium capitalize">{event.type}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatTimestamp(event.timestamp)}
                      </Badge>
                    </div>
                    {event.target && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div><strong>요소:</strong> {event.target.tagName}</div>
                        {event.target.name && (
                          <div><strong>이름:</strong> {event.target.name}</div>
                        )}
                        {event.value && (
                          <div><strong>값:</strong> {event.value}</div>
                        )}
                        <code className="text-xs bg-muted p-1 rounded block break-all">
                          {event.target.selector}
                        </code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                {recording ? '상호작용을 기다리는 중...' : '기록 버튼을 눌러 이벤트 캡처를 시작하세요'}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inspector" className="flex-1 mt-0 p-3 space-y-3 overflow-auto">
            {!inspecting ? (
              <Button onClick={startInspect} disabled={tabId == null} className="w-full">
                요소 선택 시작
              </Button>
            ) : (
              <Button variant="outline" onClick={stopInspect} className="w-full">
                요소 선택 종료
              </Button>
            )}

            {lastPicked?.detailedAnalysis ? (
              <>
                <InspectorDetail 
                  data={lastPicked.detailedAnalysis} 
                  onCopySelector={handleCopySelector}
                  onAddAssertion={addAssertionAsStep}
                />
                
                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button size="sm" onClick={addElementAsStep} className="flex-1">
                    <Plus className="w-3 h-3 mr-1" />
                    스텝 추가
                  </Button>
                  <Button size="sm" variant="outline" onClick={createNewScenario}>
                    새 시나리오
                  </Button>
                </div>
              </>
            ) : lastPicked ? (
              // Fallback for basic analysis
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
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                요소를 선택하여 상세 분석을 확인하세요
              </div>
            )}
          </TabsContent>

          <TabsContent value="builder" className="flex-1 mt-0 overflow-hidden">
            <BuilderTab currentScenarioId={currentScenarioId} lastPickedElement={lastPicked} />
          </TabsContent>

          <TabsContent value="scenario" className="flex-1 mt-0 p-3 overflow-hidden">
            <ScenarioList 
              currentScenarioId={currentScenarioId}
              onScenarioSelect={(scenario: TestScenario) => setCurrentScenarioId(scenario.id)}
              onCreateNew={createNewScenario}
            />
          </TabsContent>

          <TabsContent value="report" className="flex-1 mt-0 overflow-hidden">
            <ReportTab currentScenarioId={currentScenarioId} />
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
            <Button size="sm" variant="outline" onClick={handleSave}>
              <Save className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
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