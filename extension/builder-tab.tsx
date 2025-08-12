import React, { useState, useEffect } from 'react'
import { StorageManager, type TestScenario } from './storage'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ScrollArea } from '../components/ui/scroll-area'
import { Alert, AlertDescription } from '../components/ui/alert'
import { 
  Plus, 
  Circle, 
  Square, 
  Diamond, 
  GitBranch,
  ArrowRight,
  Target,
  Mouse,
  Keyboard,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'

interface BuilderTabProps {
  currentScenarioId?: string | null
  lastPickedElement?: any
}

interface StateNode {
  id: string
  name: string
  type: 'action' | 'assertion' | 'condition' | 'start' | 'end'
  x: number
  y: number
  elementData?: any
  stepData?: any
  connections: string[]
}

export function BuilderTab({ currentScenarioId, lastPickedElement }: BuilderTabProps) {
  const [nodes, setNodes] = useState<StateNode[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [scenario, setScenario] = useState<TestScenario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScenario()
  }, [currentScenarioId])

  const loadScenario = async () => {
    if (!currentScenarioId) {
      setLoading(false)
      return
    }

    try {
      const loadedScenario = await StorageManager.getScenario(currentScenarioId)
      setScenario(loadedScenario)
      
      if (loadedScenario) {
        convertStepsToNodes(loadedScenario)
      }
    } catch (error) {
      console.error('Failed to load scenario:', error)
    } finally {
      setLoading(false)
    }
  }

  const convertStepsToNodes = (scenario: TestScenario) => {
    const newNodes: StateNode[] = []
    
    // 시작 노드 추가
    newNodes.push({
      id: 'start',
      name: '시작',
      type: 'start',
      x: 50,
      y: 50,
      connections: scenario.steps.length > 0 ? [scenario.steps[0].id] : []
    })

    // 스텝들을 노드로 변환
    scenario.steps.forEach((step, index) => {
      const nodeType = step.type === 'assert' ? 'assertion' : 'action'
      const nextStepId = index < scenario.steps.length - 1 ? scenario.steps[index + 1].id : 'end'
      
      newNodes.push({
        id: step.id,
        name: getStepDisplayName(step),
        type: nodeType,
        x: 50 + (index + 1) * 150,
        y: 50,
        elementData: step.element,
        stepData: step,
        connections: nextStepId === 'end' ? ['end'] : [nextStepId]
      })
    })

    // 종료 노드 추가
    if (scenario.steps.length > 0) {
      newNodes.push({
        id: 'end',
        name: '종료',
        type: 'end',
        x: 50 + (scenario.steps.length + 1) * 150,
        y: 50,
        connections: []
      })
    }

    setNodes(newNodes)
  }

  const getStepDisplayName = (step: any) => {
    switch (step.type) {
      case 'click':
        return `클릭: ${step.element?.name || step.element?.selector || '요소'}`
      case 'input':
        return `입력: ${step.value || ''}`
      case 'assert':
        return `검증: ${step.assertion?.type || '조건'}`
      default:
        return `${step.type}: ${step.element?.name || '요소'}`
    }
  }

  const addElementAsNode = () => {
    if (!lastPickedElement || !currentScenarioId) return

    const newNode: StateNode = {
      id: Date.now().toString(),
      name: `새 액션: ${lastPickedElement.name || lastPickedElement.role || '요소'}`,
      type: 'action',
      x: 50 + nodes.length * 150,
      y: 150,
      elementData: lastPickedElement,
      connections: []
    }

    setNodes(prev => [...prev, newNode])
  }

  const getNodeIcon = (type: StateNode['type']) => {
    switch (type) {
      case 'start': return <Circle className="w-4 h-4 text-green-600" />
      case 'end': return <Square className="w-4 h-4 text-red-600" />
      case 'action': return <Mouse className="w-4 h-4 text-blue-600" />
      case 'assertion': return <CheckCircle className="w-4 h-4 text-purple-600" />
      case 'condition': return <Diamond className="w-4 h-4 text-yellow-600" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const getNodeColor = (type: StateNode['type']) => {
    switch (type) {
      case 'start': return 'bg-green-100 border-green-200 text-green-800'
      case 'end': return 'bg-red-100 border-red-200 text-red-800'
      case 'action': return 'bg-blue-100 border-blue-200 text-blue-800'
      case 'assertion': return 'bg-purple-100 border-purple-200 text-purple-800'
      case 'condition': return 'bg-yellow-100 border-yellow-200 text-yellow-800'
      default: return 'bg-gray-100 border-gray-200 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">빌더를 불러오는 중...</div>
      </div>
    )
  }

  if (!currentScenarioId) {
    return (
      <div className="p-3">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            시나리오를 선택하거나 생성하여 플로우 빌더를 사용하세요.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 border-b">
        <div>
          <h3 className="text-sm font-medium">플로우 빌더</h3>
          {scenario && (
            <p className="text-xs text-muted-foreground">{scenario.name}</p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={addElementAsNode}
            disabled={!lastPickedElement}
            title={!lastPickedElement ? "Inspector에서 요소를 선택하세요" : "선택된 요소를 노드로 추가"}
          >
            <Plus className="w-3 h-3 mr-1" />
            요소 추가
          </Button>
        </div>
      </div>

      {/* 플로우 캔버스 */}
      <div className="flex-1 p-3">
        {nodes.length > 0 ? (
          <ScrollArea className="h-full">
            <div className="relative bg-gray-50 rounded-lg p-4 min-h-[400px]">
              {/* 노드들 */}
              {nodes.map((node) => (
                <div key={node.id} className="absolute">
                  <div
                    style={{ left: node.x, top: node.y }}
                    className={`
                      relative w-32 p-2 rounded-lg border-2 cursor-pointer transition-all
                      ${getNodeColor(node.type)}
                      ${selectedNode === node.id ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {getNodeIcon(node.type)}
                      <span className="text-xs font-medium truncate">{node.name}</span>
                    </div>
                    
                    {node.elementData && (
                      <div className="text-xs text-muted-foreground">
                        {node.elementData.role && (
                          <div>Role: {node.elementData.role}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 연결선 */}
                  {node.connections.map((targetId) => {
                    const targetNode = nodes.find(n => n.id === targetId)
                    if (!targetNode) return null
                    
                    return (
                      <svg
                        key={`${node.id}-${targetId}`}
                        className="absolute pointer-events-none"
                        style={{
                          left: node.x + 128,
                          top: node.y + 20,
                          width: targetNode.x - node.x - 128,
                          height: Math.abs(targetNode.y - node.y) + 40
                        }}
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2={targetNode.x - node.x - 128}
                          y2={targetNode.y - node.y}
                          stroke="#666"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                        <defs>
                          <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                          >
                            <polygon
                              points="0 0, 10 3.5, 0 7"
                              fill="#666"
                            />
                          </marker>
                        </defs>
                      </svg>
                    )
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                이 시나리오에는 아직 스텝이 없습니다
              </div>
              <div className="text-xs text-muted-foreground">
                Inspector에서 요소를 선택하고 "요소 추가" 버튼을 눌러 플로우를 시작하세요
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 선택된 노드 상세 정보 */}
      {selectedNode && (
        <div className="border-t p-3">
          {(() => {
            const node = nodes.find(n => n.id === selectedNode)
            if (!node) return null

            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getNodeIcon(node.type)}
                  <h4 className="text-sm font-medium">{node.name}</h4>
                  <Badge variant="outline" className="text-xs">
                    {node.type}
                  </Badge>
                </div>

                {node.elementData && (
                  <div className="space-y-1 text-xs">
                    <div className="font-medium">요소 정보:</div>
                    <div className="text-muted-foreground">
                      <div>Role: {node.elementData.role || '없음'}</div>
                      <div>Name: {node.elementData.name || '없음'}</div>
                      {node.elementData.selector && (
                        <div className="mt-1">
                          <code className="bg-muted p-1 rounded text-xs">
                            {node.elementData.selector}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {node.stepData && (
                  <div className="space-y-1 text-xs">
                    <div className="font-medium">스텝 정보:</div>
                    <div className="text-muted-foreground">
                      <div>Type: {node.stepData.type}</div>
                      {node.stepData.value && (
                        <div>Value: {node.stepData.value}</div>
                      )}
                      {node.stepData.assertion && (
                        <div>Assertion: {node.stepData.assertion.type}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
} 