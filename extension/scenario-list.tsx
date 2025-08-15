import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { ScrollArea } from '../components/ui/scroll-area'
import { Progress } from '../components/ui/progress'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible'
import { StorageManager, type TestScenario } from './storage'
import { TestRunner, type TestRunResult, type StepResult, formatTestDuration, getTestStatusBadge } from './test-runner'
import { Play, Edit, Trash2, Clock, Tag, Plus, Search, Square, AlertCircle, ChevronDown, ChevronRight, CheckCircle, XCircle, Clock as ClockIcon } from 'lucide-react'

interface ScenarioListProps {
  currentScenarioId?: string | null
  onScenarioSelect?: (scenario: TestScenario) => void
  onCreateNew?: () => void
}

export function ScenarioList({ currentScenarioId, onScenarioSelect, onCreateNew }: ScenarioListProps) {
  const [scenarios, setScenarios] = useState<TestScenario[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null)
  const [runProgress, setRunProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [runError, setRunError] = useState<string | null>(null)
  const [lastRunResult, setLastRunResult] = useState<TestRunResult | null>(null)
  const [showDetailedResults, setShowDetailedResults] = useState(false)

  useEffect(() => {
    loadScenarios()
  }, [])

  const loadScenarios = async () => {
    try {
      const data = await StorageManager.load()
      setScenarios(data.scenarios)
    } catch (error) {
      console.error('Failed to load scenarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteScenario = async (id: string) => {
    try {
      await StorageManager.deleteScenario(id)
      await loadScenarios()
    } catch (error) {
      console.error('Failed to delete scenario:', error)
    }
  }

  const runScenario = async (scenarioId: string) => {
    if (runningScenarioId) return // 이미 실행 중

    setRunningScenarioId(scenarioId)
    setRunProgress({ current: 0, total: 0 })
    setRunError(null)
    setLastRunResult(null)
    setShowDetailedResults(false)

    try {
      const testRunner = TestRunner.getInstance()
      const result = await testRunner.runScenario(
        scenarioId,
        (current, total, currentStep) => {
          setRunProgress({ current, total })
        }
      )
      
      setLastRunResult(result)
      await loadScenarios() // 시나리오 상태 업데이트 반영
    } catch (error) {
      setRunError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setRunningScenarioId(null)
      setRunProgress({ current: 0, total: 0 })
    }
  }

  const cancelRun = () => {
    if (runningScenarioId) {
      TestRunner.getInstance().cancelRun()
      setRunningScenarioId(null)
      setRunProgress({ current: 0, total: 0 })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ready': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'passed': return '성공'
      case 'failed': return '실패'
      case 'running': return '실행 중'
      case 'ready': return '준비됨'
      case 'draft': return '초안'
      default: return status
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString()
  }

  const getStepStatusIcon = (status: StepResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'skipped':
        return <ClockIcon className="w-4 h-4 text-yellow-500" />
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />
    }
  }

  const getStepStatusColor = (status: StepResult['status']) => {
    switch (status) {
      case 'passed':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'skipped':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const getStepTypeLabel = (type: string) => {
    switch (type) {
      case 'click': return '클릭'
      case 'input': return '입력'
      case 'select': return '선택'
      case 'hover': return '호버'
      case 'scroll': return '스크롤'
      case 'wait': return '대기'
      case 'assert': return '검증'
      default: return type
    }
  }

  const formatStepDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(1)}s`
  }

  const filteredScenarios = scenarios.filter(scenario =>
    scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scenario.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">시나리오를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">시나리오 목록</h3>
        <Button size="sm" onClick={onCreateNew}>
          <Plus className="w-3 h-3 mr-1" />
          새 시나리오
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <Input
          placeholder="시나리오 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-7 text-sm"
        />
      </div>

      {/* 실행 오류 표시 */}
      {runError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{runError}</AlertDescription>
        </Alert>
      )}

      {/* 실행 결과 표시 */}
      {lastRunResult && (
        <Alert variant={lastRunResult.status === 'passed' ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              시나리오 실행 {lastRunResult.status === 'passed' ? '성공' : '실패'}: {' '}
              {lastRunResult.passedSteps}/{lastRunResult.totalSteps} 스텝 통과 ({formatTestDuration(lastRunResult.duration)})
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetailedResults(!showDetailedResults)}
              className="ml-2"
            >
              {showDetailedResults ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              상세보기
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 상세 실행 결과 */}
      {lastRunResult && showDetailedResults && (
        <Card className="border-2 max-h-64 overflow-y-auto">
          <CardHeader className="pb-2 sticky top-0 bg-card border-b">
            <CardTitle className="text-sm">실행 상세 결과</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                <span className="text-muted-foreground block">총 실행 시간</span>
                <div className="font-semibold text-green-700">{formatTestDuration(lastRunResult.duration)}</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                <span className="text-muted-foreground block">성공한 스텝</span>
                <div className="font-semibold text-green-700">{lastRunResult.passedSteps}개</div>
              </div>
              <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                <span className="text-muted-foreground block">실패한 스텝</span>
                <div className="font-semibold text-red-700">{lastRunResult.failedSteps}개</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground border-b pb-1">스텝별 실행 결과</div>
              {lastRunResult.stepResults.map((stepResult, index) => (
                <div
                  key={stepResult.stepId}
                  className={`p-3 rounded-lg border text-xs ${getStepStatusColor(stepResult.status)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getStepStatusIcon(stepResult.status)}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {index + 1}. {getStepTypeLabel(stepResult.stepType)}
                        </div>
                        {stepResult.description && (
                          <div className="text-muted-foreground truncate">
                            {stepResult.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-muted-foreground font-mono">{formatStepDuration(stepResult.duration)}</span>
                      <Badge variant="outline" className={`text-xs ${getStepStatusColor(stepResult.status)}`}>
                        {stepResult.status === 'passed' ? '성공' : stepResult.status === 'failed' ? '실패' : '건너뜀'}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* 스텝 상세 정보 */}
                  <div className="mt-2 space-y-1">
                    {stepResult.selector && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">선택자:</span> 
                        <span className="font-mono text-xs break-all ml-1">{stepResult.selector}</span>
                      </div>
                    )}
                    {stepResult.assertType && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">검증 타입:</span> 
                        <span className="ml-1">{stepResult.assertType}</span>
                      </div>
                    )}
                    {stepResult.error && (
                      <div className="text-red-700 bg-red-50 p-2 rounded border border-red-200">
                        <span className="font-medium">오류:</span> 
                        <span className="ml-1 break-words">{stepResult.error}</span>
                      </div>
                    )}
                    {stepResult.assertion && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">검증 결과:</span> 
                        <span className="ml-1 break-words">{stepResult.assertion.message}</span>
                        {stepResult.assertion.actual !== undefined && (
                          <div className="mt-1 font-mono text-xs bg-muted p-1 rounded">
                            실제값: {String(stepResult.assertion.actual)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenario List */}
      <ScrollArea className="flex-1">
        {filteredScenarios.length > 0 ? (
          <div className="space-y-2">
            {filteredScenarios.map((scenario) => (
              <Card 
                key={scenario.id} 
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                  currentScenarioId === scenario.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onScenarioSelect?.(scenario)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                                    <CardTitle className="text-sm line-clamp-1 flex-1 min-w-0">
                  {scenario.name}
                </CardTitle>
                    <div className="flex gap-1 ml-2">
                      {/* 실행/취소 버튼 */}
                      {runningScenarioId === scenario.id ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-1 text-orange-600 hover:text-orange-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            cancelRun()
                          }}
                          title="실행 취소"
                        >
                          <Square className="w-3 h-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-1 text-green-600 hover:text-green-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            runScenario(scenario.id)
                          }}
                          disabled={!!runningScenarioId || scenario.steps.length === 0}
                          title={scenario.steps.length === 0 ? "스텝이 없습니다" : "시나리오 실행"}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-auto p-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Implement edit functionality
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-auto p-1 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteScenario(scenario.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scenario.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                      {scenario.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${getStatusColor(scenario.status)} flex-shrink-0`}>
                      {getStatusLabel(scenario.status)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {scenario.steps.length}개 스텝
                    </div>
                  </div>

                  {scenario.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      {scenario.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs truncate max-w-20">
                          {tag}
                        </Badge>
                      ))}
                      {scenario.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          +{scenario.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 실행 진행 상황 */}
                  {runningScenarioId === scenario.id && runProgress.total > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>실행 중: {runProgress.current}/{runProgress.total}</span>
                        <span>{Math.round((runProgress.current / runProgress.total) * 100)}%</span>
                      </div>
                      <Progress value={(runProgress.current / runProgress.total) * 100} className="h-1" />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>업데이트: {formatDate(scenario.updatedAt)}</span>
                    {scenario.runCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {scenario.runCount}회 실행
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '저장된 시나리오가 없습니다'}
            </div>
            {!searchTerm && (
              <Button size="sm" variant="outline" onClick={onCreateNew}>
                <Plus className="w-3 h-3 mr-1" />
                첫 번째 시나리오 만들기
              </Button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
} 