import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { toast } from "sonner@2.0.3";
import { 
  Plus, 
  GitBranch, 
  Code, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  Mouse,
  Keyboard,
  ArrowRight,
  Circle,
  Square,
  Diamond,
  Target
} from 'lucide-react';
import { useState } from 'react';

interface StateNode {
  id: string;
  name: string;
  type: 'question' | 'followup' | 'closed';
  x: number;
  y: number;
  isSelected?: boolean;
  assertions?: StateAssertion[];
}

interface StateAssertion {
  id: string;
  type: 'visible' | 'notVisible' | 'text' | 'attribute';
  selector: {
    by: 'role' | 'name' | 'css';
    value: string;
  };
  expectedValue?: string;
}

interface StateEdge {
  id: string;
  from: string;
  to: string;
  label: 'clickGood' | 'clickBad' | 'close';
  event?: TestEvent;
}

interface TestEvent {
  id: string;
  type: 'click' | 'type' | 'wait';
  selector: {
    by: 'role' | 'name' | 'css';
    value: string;
  };
  value?: string;
  then?: string[];
}

const mockNodes: StateNode[] = [
  { 
    id: '1', 
    name: '질문', 
    type: 'question', 
    x: 40, 
    y: 60,
    assertions: [
      {
        id: 'a1',
        type: 'visible',
        selector: { by: 'role', value: 'dialog' }
      }
    ]
  },
  { 
    id: '2', 
    name: '후속조치', 
    type: 'followup', 
    x: 160, 
    y: 40,
    isSelected: true,
    assertions: [
      {
        id: 'a2',
        type: 'visible',
        selector: { by: 'name', value: '확인 버튼' }
      }
    ]
  },
  { 
    id: '3', 
    name: '완료', 
    type: 'closed', 
    x: 160, 
    y: 90 
  },
];

const mockEdges: StateEdge[] = [
  { 
    id: 'e1', 
    from: '1', 
    to: '2', 
    label: 'clickGood',
    event: {
      id: 'ev1',
      type: 'click',
      selector: { by: 'role', value: 'button' },
      then: ['확인 메시지 표시', '다음 단계로 이동']
    }
  },
  { 
    id: 'e2', 
    from: '1', 
    to: '3', 
    label: 'clickBad' 
  },
  { 
    id: 'e3', 
    from: '2', 
    to: '3', 
    label: 'close' 
  },
];

export function BuilderTab() {
  const [nodes, setNodes] = useState<StateNode[]>(mockNodes);
  const [edges] = useState<StateEdge[]>(mockEdges);
  const [selectedNode, setSelectedNode] = useState<StateNode | null>(mockNodes[1]);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [newAssertion, setNewAssertion] = useState({
    type: 'visible' as 'visible' | 'notVisible',
    by: 'role' as 'role' | 'name' | 'css',
    value: ''
  });
  const [newEvent, setNewEvent] = useState({
    type: 'click' as 'click' | 'type',
    by: 'role' as 'role' | 'name' | 'css',
    value: '',
    inputValue: ''
  });

  const getNodeColor = (type: string, isSelected = false) => {
    const baseClasses = isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md';
    switch (type) {
      case 'question': return `bg-blue-100 border-blue-300 text-blue-800 ${baseClasses}`;
      case 'followup': return `bg-yellow-100 border-yellow-300 text-yellow-800 ${baseClasses}`;
      case 'closed': return `bg-green-100 border-green-300 text-green-800 ${baseClasses}`;
      default: return `bg-gray-100 border-gray-300 text-gray-800 ${baseClasses}`;
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'question': return <Circle className="w-2 h-2" strokeWidth={1.5} />;
      case 'followup': return <Square className="w-2 h-2" strokeWidth={1.5} />;
      case 'closed': return <Diamond className="w-2 h-2" strokeWidth={1.5} />;
      default: return <Circle className="w-2 h-2" strokeWidth={1.5} />;
    }
  };

  const getEdgeColor = (label: string) => {
    switch (label) {
      case 'clickGood': return '#10b981';
      case 'clickBad': return '#ef4444';
      case 'close': return '#6b7280';
      default: return '#6366f1';
    }
  };

  const addNewState = (type: 'question' | 'followup' | 'closed') => {
    const newNode: StateNode = {
      id: `node_${Date.now()}`,
      name: type === 'question' ? '질문' : type === 'followup' ? '후속조치' : '완료',
      type,
      x: Math.random() * 150 + 30,
      y: Math.random() * 80 + 40,
      assertions: []
    };
    setNodes([...nodes, newNode]);
  };

  const addAssertion = () => {
    if (!selectedNode || !newAssertion.value) return;
    
    const assertion: StateAssertion = {
      id: `assertion_${Date.now()}`,
      type: newAssertion.type,
      selector: {
        by: newAssertion.by,
        value: newAssertion.value
      }
    };

    setNodes(nodes.map(node => 
      node.id === selectedNode.id 
        ? { ...node, assertions: [...(node.assertions || []), assertion] }
        : node
    ));

    setSelectedNode({
      ...selectedNode,
      assertions: [...(selectedNode.assertions || []), assertion]
    });

    setNewAssertion({ type: 'visible', by: 'role', value: '' });
  };

  const validateModel = () => {
    const issues = [];
    
    nodes.forEach(node => {
      if (!node.assertions || node.assertions.length === 0) {
        issues.push(`${node.name} 노드에 어설션이 없습니다`);
      }
    });

    const nodeIds = nodes.map(n => n.id);
    edges.forEach(edge => {
      if (!nodeIds.includes(edge.from) || !nodeIds.includes(edge.to)) {
        issues.push(`잘못된 연결이 있습니다: ${edge.label}`);
      }
    });

    if (issues.length > 0) {
      toast.error("모델 검증 실패", {
        description: `${issues.length}개의 문제가 발견되었습니다`
      });
    } else {
      toast.success("모델 검증 성공", {
        description: "상태머신 모델이 유효합니다"
      });
    }
  };

  const mockModelJson = {
    states: nodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      assertions: node.assertions || []
    })),
    transitions: edges.map(edge => ({
      from: edge.from,
      to: edge.to,
      trigger: edge.label,
      event: edge.event
    }))
  };

  return (
    <div className="flex flex-col gap-2 p-2 h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => addNewState('question')} className="text-xs px-2">
            <Plus className="w-3 h-3 mr-1" strokeWidth={1.5} />
            상태
          </Button>
          <Button size="sm" variant="outline" className="text-xs px-2">
            <GitBranch className="w-3 h-3 mr-1" strokeWidth={1.5} />
            이벤트
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Label htmlFor="json-preview" className="text-xs">JSON</Label>
          <Switch
            id="json-preview"
            size="sm"
            checked={showJsonPreview}
            onCheckedChange={setShowJsonPreview}
          />
        </div>
      </div>

      {/* Canvas - Full Width */}
      <Card>
        <CardHeader className="pb-1 px-2 py-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">상태머신 캔버스</CardTitle>
            <Badge variant="outline" className="text-xs">
              {nodes.length}개 상태
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="relative h-32 bg-gray-50 rounded border overflow-hidden">
            <svg className="w-full h-full">
              {/* Edges */}
              {edges.map((edge) => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                
                return (
                  <g key={edge.id}>
                    <line
                      x1={fromNode.x + 25}
                      y1={fromNode.y + 10}
                      x2={toNode.x}
                      y2={toNode.y + 10}
                      stroke={getEdgeColor(edge.label)}
                      strokeWidth="1.5"
                      markerEnd="url(#arrowhead)"
                    />
                    <text
                      x={(fromNode.x + toNode.x) / 2 + 15}
                      y={(fromNode.y + toNode.y) / 2 + 5}
                      className="text-xs fill-gray-600"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}
              
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#6366f1" />
                </marker>
              </defs>
            </svg>
            
            {/* Nodes */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`absolute w-12 h-6 rounded border-2 flex items-center justify-center text-xs font-medium cursor-pointer transition-all ${
                  getNodeColor(node.type, node.isSelected)
                }`}
                style={{ left: node.x, top: node.y }}
                onClick={() => setSelectedNode(node)}
              >
                <div className="flex items-center gap-1">
                  {getNodeIcon(node.type)}
                  <span className="truncate text-xs">{node.name}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Details Panel - Single Column */}
      {selectedNode ? (
        <div className="space-y-2">
          {/* State Assertions */}
          <Card>
            <CardHeader className="pb-1 px-2 py-1">
              <CardTitle className="text-sm flex items-center gap-1">
                <Target className="w-3 h-3" strokeWidth={1.5} />
                State Assert
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              {/* Existing Assertions */}
              <ScrollArea className="h-16">
                <div className="space-y-1">
                  {selectedNode.assertions?.map((assertion) => (
                    <div key={assertion.id} className="flex items-center justify-between p-1 bg-muted rounded text-xs">
                      <div className="flex items-center gap-1">
                        {assertion.type === 'visible' ? 
                          <Eye className="w-2 h-2 text-green-600" strokeWidth={1.5} /> :
                          <EyeOff className="w-2 h-2 text-red-600" strokeWidth={1.5} />
                        }
                        <span className="text-xs">{assertion.selector.by}:{assertion.selector.value}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-auto p-0">
                        <Trash2 className="w-2 h-2" strokeWidth={1.5} />
                      </Button>
                    </div>
                  )) || []}
                </div>
              </ScrollArea>

              {/* Add New Assertion */}
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-1">
                  <Select value={newAssertion.type} onValueChange={(value: 'visible' | 'notVisible') => setNewAssertion({...newAssertion, type: value})}>
                    <SelectTrigger className="text-xs h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visible">Visible</SelectItem>
                      <SelectItem value="notVisible">Not Visible</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newAssertion.by} onValueChange={(value: 'role' | 'name' | 'css') => setNewAssertion({...newAssertion, by: value})}>
                    <SelectTrigger className="text-xs h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">Role</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="css">CSS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="예: button, 저장 버튼"
                  value={newAssertion.value}
                  onChange={(e) => setNewAssertion({...newAssertion, value: e.target.value})}
                  className="text-xs h-7"
                />
                <Button size="sm" onClick={addAssertion} className="w-full text-xs h-7">
                  <Plus className="w-2 h-2 mr-1" strokeWidth={1.5} />
                  어설션 추가
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Event Editor */}
          <Card>
            <CardHeader className="pb-1 px-2 py-1">
              <CardTitle className="text-sm flex items-center gap-1">
                <Mouse className="w-3 h-3" strokeWidth={1.5} />
                Event Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              <div className="grid grid-cols-2 gap-1">
                <Select value={newEvent.type} onValueChange={(value: 'click' | 'type') => setNewEvent({...newEvent, type: value})}>
                  <SelectTrigger className="text-xs h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="click">Click</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newEvent.by} onValueChange={(value: 'role' | 'name' | 'css') => setNewEvent({...newEvent, by: value})}>
                  <SelectTrigger className="text-xs h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="role">Role</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="셀렉터 값"
                value={newEvent.value}
                onChange={(e) => setNewEvent({...newEvent, value: e.target.value})}
                className="text-xs h-7"
              />
              {newEvent.type === 'type' && (
                <Input
                  placeholder="입력할 텍스트"
                  value={newEvent.inputValue}
                  onChange={(e) => setNewEvent({...newEvent, inputValue: e.target.value})}
                  className="text-xs h-7"
                />
              )}
              
              <div className="space-y-1">
                <Label className="text-xs">Then 스텝</Label>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div className="flex items-center gap-1">
                    <ArrowRight className="w-2 h-2" strokeWidth={1.5} />
                    <span>확인 메시지 표시</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowRight className="w-2 h-2" strokeWidth={1.5} />
                    <span>다음 단계로 이동</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="flex items-center justify-center h-24">
          <CardContent className="text-center text-muted-foreground p-2">
            <Target className="w-6 h-6 mx-auto mb-1 opacity-50" strokeWidth={1.5} />
            <div className="text-xs">상태를 선택하여 편집하세요</div>
          </CardContent>
        </Card>
      )}

      {/* JSON Preview */}
      {showJsonPreview && (
        <Card>
          <CardHeader className="pb-1 px-2 py-1">
            <CardTitle className="text-sm flex items-center gap-1">
              <Code className="w-3 h-3" strokeWidth={1.5} />
              JSON 미리보기
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-24">
              <pre className="text-xs font-mono bg-muted p-1 rounded">
                {JSON.stringify(mockModelJson, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Bottom Actions */}
      <div className="space-y-1 pt-1 border-t">
        <Button onClick={validateModel} className="w-full text-xs h-8">
          <CheckCircle className="w-3 h-3 mr-1" strokeWidth={1.5} />
          모델 유효성 검사
        </Button>
        <div className="text-xs text-center text-muted-foreground">
          {nodes.length}개 상태, {edges.length}개 전환
        </div>
      </div>
    </div>
  );
}