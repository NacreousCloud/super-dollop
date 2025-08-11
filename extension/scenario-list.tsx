import React, { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { ScrollArea } from '../components/ui/scroll-area'
import { StorageManager, type TestScenario } from './storage'
import { Play, Edit, Trash2, Clock, Tag, Plus, Search } from 'lucide-react'

interface ScenarioListProps {
  currentScenarioId?: string | null
  onScenarioSelect?: (scenario: TestScenario) => void
  onCreateNew?: () => void
}

export function ScenarioList({ currentScenarioId, onScenarioSelect, onCreateNew }: ScenarioListProps) {
  const [scenarios, setScenarios] = useState<TestScenario[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

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
                    <CardTitle className="text-sm line-clamp-1">
                      {scenario.name}
                    </CardTitle>
                    <div className="flex gap-1 ml-2">
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
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {scenario.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(scenario.status)}`}>
                      {getStatusLabel(scenario.status)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {scenario.steps.length}개 스텝
                    </div>
                  </div>

                  {scenario.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="w-3 h-3 text-muted-foreground" />
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