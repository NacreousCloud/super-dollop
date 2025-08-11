import React from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Separator } from '../components/ui/separator'
import { CheckCircle, AlertTriangle, XCircle, Copy, Eye } from 'lucide-react'
import type { DOMNodeData } from './dom-analyzer'

interface InspectorDetailProps {
  data: DOMNodeData
  onCopySelector?: (selector: string) => void
  onHighlight?: () => void
}

export function InspectorDetail({ data, onCopySelector, onHighlight }: InspectorDetailProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (score >= 40) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-3 h-3" />
    if (score >= 40) return <AlertTriangle className="w-3 h-3" />
    return <XCircle className="w-3 h-3" />
  }

  const strategies = [
    {
      name: 'Test ID',
      key: 'testid' as const,
      description: '가장 안정적인 셀렉터',
      priority: 1
    },
    {
      name: '접근성',
      key: 'accessibility' as const,
      description: 'role 기반 셀렉터',
      priority: 2
    },
    {
      name: '이름',
      key: 'name' as const,
      description: 'aria-label/텍스트 기반',
      priority: 3
    },
    {
      name: 'CSS',
      key: 'css' as const,
      description: '구조 기반 (불안정)',
      priority: 4
    }
  ]

  const sortedStrategies = strategies
    .filter(strategy => data.selectorStrategies[strategy.key].available)
    .sort((a, b) => data.selectorStrategies[b.key].score - data.selectorStrategies[a.key].score)

  return (
    <div className="space-y-3">
      {/* Element Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>선택된 요소</span>
            {onHighlight && (
              <Button size="sm" variant="ghost" onClick={onHighlight}>
                <Eye className="w-3 h-3" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {data.tag}
            </Badge>
            {data.role && (
              <Badge variant="secondary" className="text-xs">
                {data.role}
              </Badge>
            )}
            {data.hasAccessibilityIssues && (
              <Badge variant="destructive" className="text-xs">
                접근성 이슈
              </Badge>
            )}
          </div>
          
          {data.accessibleName && (
            <div className="text-sm">
              <strong>접근 가능한 이름:</strong> {data.accessibleName}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selector Strategies */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">셀렉터 전략</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedStrategies.map((strategy) => {
            const strategyData = data.selectorStrategies[strategy.key]
            return (
              <div key={strategy.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{strategy.name}</span>
                    <Badge 
                      className={`text-xs ${getScoreColor(strategyData.score)}`}
                    >
                      {getScoreIcon(strategyData.score)}
                      {strategyData.score}점
                    </Badge>
                  </div>
                  {onCopySelector && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onCopySelector(strategyData.selector)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {strategy.description}
                </div>
                <code className="text-xs bg-muted p-1 rounded block break-all">
                  {strategyData.selector}
                </code>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Accessibility Improvements */}
      {data.labelingImprovements && data.labelingImprovements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              접근성 개선사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {data.labelingImprovements.map((improvement, index) => (
                <div key={index} className="text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                  💡 {improvement}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attributes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">속성</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-32 overflow-auto">
            {Object.entries(data.attributes).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="font-mono text-blue-600">{key}</span>
                <span className="text-muted-foreground">: </span>
                <span className="text-gray-700">"{value}"</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 