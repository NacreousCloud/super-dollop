import React, { useState, useEffect } from 'react'
import { StorageManager, type TestScenario } from './storage'
import { type TestRunResult, formatTestDuration, getTestStatusBadge } from './test-runner'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ScrollArea } from '../components/ui/scroll-area'
import { Progress } from '../components/ui/progress'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  BarChart3,
  Activity,
  Target,
  Zap
} from 'lucide-react'

interface ReportTabProps {
  currentScenarioId?: string | null
}

interface ScenarioStats {
  total: number
  passed: number
  failed: number
  draft: number
  running: number
  ready: number
  totalSteps: number
  avgExecutionTime: number
  lastRunTime?: number
}

export function ReportTab({ currentScenarioId }: ReportTabProps) {
  const [scenarios, setScenarios] = useState<TestScenario[]>([])
  const [stats, setStats] = useState<ScenarioStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await StorageManager.load()
      setScenarios(data.scenarios)
      calculateStats(data.scenarios)
    } catch (error) {
      console.error('Failed to load report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (scenarios: TestScenario[]) => {
    const stats: ScenarioStats = {
      total: scenarios.length,
      passed: scenarios.filter(s => s.status === 'passed').length,
      failed: scenarios.filter(s => s.status === 'failed').length,
      draft: scenarios.filter(s => s.status === 'draft').length,
      running: scenarios.filter(s => s.status === 'running').length,
      ready: scenarios.filter(s => s.status === 'ready').length,
      totalSteps: scenarios.reduce((sum, s) => sum + s.steps.length, 0),
      avgExecutionTime: 0,
      lastRunTime: Math.max(...scenarios.map(s => s.lastRun || 0).filter(t => t > 0))
    }

    // 실행된 시나리오들의 평균 실행 시간 계산 (모킹된 데이터)
    const executedScenarios = scenarios.filter(s => s.runCount > 0)
    if (executedScenarios.length > 0) {
      // 실제로는 실행 시간 데이터가 있어야 하지만 현재는 추정값 사용
      stats.avgExecutionTime = executedScenarios.reduce((sum, s) => sum + s.steps.length * 1000, 0) / executedScenarios.length
    }

    setStats(stats)
  }

  const getSuccessRate = () => {
    if (!stats || stats.total === 0) return 0
    const completedScenarios = stats.passed + stats.failed
    if (completedScenarios === 0) return 0
    return Math.round((stats.passed / completedScenarios) * 100)
  }

  const getRecentScenarios = () => {
    return scenarios
      .filter(s => s.lastRun)
      .sort((a, b) => (b.lastRun || 0) - (a.lastRun || 0))
      .slice(0, 5)
  }

  const formatLastRun = (timestamp?: number) => {
    if (!timestamp) return '미실행'
    const now = new Date()
    const lastRun = new Date(timestamp)
    const diffMs = now.getTime() - lastRun.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${diffDays}일 전`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">리포트를 불러오는 중...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">리포트 데이터를 불러올 수 없습니다</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">테스트 리포트</h3>
        <Button size="sm" variant="outline" onClick={loadData}>
          새로고침
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="scenarios">시나리오</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* 전체 통계 카드들 */}
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">총 시나리오</p>
                    <p className="text-lg font-bold">{stats.total}</p>
                  </div>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">성공률</p>
                    <p className="text-lg font-bold text-green-600">{getSuccessRate()}%</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">총 스텝</p>
                    <p className="text-lg font-bold">{stats.totalSteps}</p>
                  </div>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">평균 실행시간</p>
                    <p className="text-lg font-bold">{formatTestDuration(stats.avgExecutionTime)}</p>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 상태별 분포 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">상태별 분포</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    성공
                  </span>
                  <span>{stats.passed}개</span>
                </div>
                <Progress value={stats.total > 0 ? (stats.passed / stats.total) * 100 : 0} className="h-1" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-600" />
                    실패
                  </span>
                  <span>{stats.failed}개</span>
                </div>
                <Progress value={stats.total > 0 ? (stats.failed / stats.total) * 100 : 0} className="h-1" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-600" />
                    초안
                  </span>
                  <span>{stats.draft}개</span>
                </div>
                <Progress value={stats.total > 0 ? (stats.draft / stats.total) * 100 : 0} className="h-1" />
              </div>
            </CardContent>
          </Card>

          {/* 최근 실행 결과 */}
          {getRecentScenarios().length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">최근 실행</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getRecentScenarios().map((scenario) => (
                    <div key={scenario.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Badge className={`text-xs ${getStatusColor(scenario.status)}`}>
                          {getStatusLabel(scenario.status)}
                        </Badge>
                        <span className="truncate">{scenario.name}</span>
                      </div>
                      <span className="text-muted-foreground">{formatLastRun(scenario.lastRun)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          {/* 시나리오별 상세 정보 */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {scenarios.length > 0 ? scenarios.map((scenario) => (
                <Card key={scenario.id} className={currentScenarioId === scenario.id ? 'ring-2 ring-primary' : ''}>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{scenario.name}</h4>
                          {scenario.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{scenario.description}</p>
                          )}
                        </div>
                        <Badge className={`text-xs ${getStatusColor(scenario.status)}`}>
                          {getStatusLabel(scenario.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>스텝: {scenario.steps.length}개</div>
                        <div>실행: {scenario.runCount}회</div>
                        <div>최근: {formatLastRun(scenario.lastRun)}</div>
                      </div>

                      {scenario.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {scenario.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {scenario.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{scenario.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center py-8">
                  <div className="text-sm text-muted-foreground">저장된 시나리오가 없습니다</div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 유틸리티 함수들
function getStatusColor(status: string) {
  switch (status) {
    case 'passed': return 'bg-green-100 text-green-800 border-green-200'
    case 'failed': return 'bg-red-100 text-red-800 border-red-200'
    case 'running': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'ready': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'passed': return '성공'
    case 'failed': return '실패'
    case 'running': return '실행 중'
    case 'ready': return '준비됨'
    case 'draft': return '초안'
    default: return status
  }
} 