import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { QualityBadge } from './QualityBadge';
import { 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  Copy, 
  Target,
  HelpCircle,
  Lightbulb,
  Keyboard,
  Focus,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { useState } from 'react';

interface DOMNode {
  id: string;
  tag: string;
  role?: string;
  accessibleName?: string;
  attributes: Record<string, string>;
  children?: DOMNode[];
  isExpanded?: boolean;
  hasAccessibilityIssues?: boolean;
  selectorStrategies: {
    accessibility: { score: number; selector: string; available: boolean };
    name: { score: number; selector: string; available: boolean };
    testid: { score: number; selector: string; available: boolean };
    css: { score: number; selector: string; available: boolean };
  };
  labelingImprovements?: string[];
}

const mockDOMTree: DOMNode = {
  id: 'root',
  tag: 'main',
  role: 'main',
  accessibleName: 'Main Content',
  attributes: { 
    'aria-label': 'Main Content',
    'class': 'main-container',
    'id': 'main-content'
  },
  isExpanded: true,
  selectorStrategies: {
    accessibility: { score: 95, selector: '[role="main"]', available: true },
    name: { score: 90, selector: '[aria-label="Main Content"]', available: true },
    testid: { score: 0, selector: '', available: false },
    css: { score: 60, selector: '#main-content', available: true }
  },
  children: [
    {
      id: 'header',
      tag: 'header',
      role: 'banner',
      accessibleName: 'Site Header',
      attributes: { 
        'aria-label': 'Site Header',
        'class': 'site-header',
        'role': 'banner'
      },
      isExpanded: true,
      selectorStrategies: {
        accessibility: { score: 95, selector: '[role="banner"]', available: true },
        name: { score: 90, selector: '[aria-label="Site Header"]', available: true },
        testid: { score: 0, selector: '', available: false },
        css: { score: 70, selector: '.site-header', available: true }
      },
      children: [
        {
          id: 'nav',
          tag: 'nav',
          role: 'navigation',
          accessibleName: 'Primary Navigation',
          attributes: { 
            'aria-label': 'Primary Navigation',
            'role': 'navigation',
            'class': 'nav-primary'
          },
          selectorStrategies: {
            accessibility: { score: 95, selector: '[role="navigation"]', available: true },
            name: { score: 90, selector: '[aria-label="Primary Navigation"]', available: true },
            testid: { score: 0, selector: '', available: false },
            css: { score: 65, selector: '.nav-primary', available: true }
          }
        },
        {
          id: 'search',
          tag: 'input',
          role: 'searchbox',
          accessibleName: 'Search products',
          attributes: { 
            'aria-label': 'Search products',
            'type': 'search',
            'placeholder': 'Search...',
            'data-testid': 'search-input'
          },
          selectorStrategies: {
            accessibility: { score: 95, selector: '[role="searchbox"]', available: true },
            name: { score: 90, selector: '[aria-label="Search products"]', available: true },
            testid: { score: 100, selector: '[data-testid="search-input"]', available: true },
            css: { score: 40, selector: 'input[type="search"]', available: true }
          }
        }
      ]
    },
    {
      id: 'login-form',
      tag: 'form',
      accessibleName: '',
      hasAccessibilityIssues: true,
      attributes: { 
        'class': 'login-form',
        'id': 'loginForm'
      },
      isExpanded: false,
      selectorStrategies: {
        accessibility: { score: 0, selector: '', available: false },
        name: { score: 0, selector: '', available: false },
        testid: { score: 0, selector: '', available: false },
        css: { score: 80, selector: '#loginForm', available: true }
      },
      labelingImprovements: [
        'aria-label="로그인 양식" 추가',
        'role="form" 명시적 추가',
        'data-testid="login-form" 추가'
      ],
      children: [
        {
          id: 'email-input',
          tag: 'input',
          role: 'textbox',
          accessibleName: '',
          hasAccessibilityIssues: true,
          attributes: { 
            'type': 'email',
            'name': 'email',
            'placeholder': 'Email'
          },
          selectorStrategies: {
            accessibility: { score: 20, selector: 'input[type="email"]', available: true },
            name: { score: 0, selector: '', available: false },
            testid: { score: 0, selector: '', available: false },
            css: { score: 60, selector: 'input[name="email"]', available: true }
          },
          labelingImprovements: [
            '<label for="email">이메일</label> 추가',
            'aria-label="이메일 주소" 추가',
            'data-testid="email-input" 추가'
          ]
        }
      ]
    }
  ]
};

export function InspectorTab() {
  const [selectedNode, setSelectedNode] = useState<DOMNode | null>(null);
  const [domTree, setDOMTree] = useState<DOMNode>(mockDOMTree);
  const [highlightOnPage, setHighlightOnPage] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const toggleNode = (nodeId: string, node: DOMNode = domTree): DOMNode => {
    if (node.id === nodeId) {
      return { ...node, isExpanded: !node.isExpanded };
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(child => toggleNode(nodeId, child))
      };
    }
    return node;
  };

  const handleToggle = (nodeId: string) => {
    setDOMTree(prev => toggleNode(nodeId, prev));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-3 h-3" strokeWidth={1.5} />;
    if (score >= 40) return <AlertTriangle className="w-3 h-3" strokeWidth={1.5} />;
    return <XCircle className="w-3 h-3" strokeWidth={1.5} />;
  };

  const renderDOMNode = (node: DOMNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} style={{ marginLeft: `${level * 8}px` }}>
        <div
          className={`flex items-center gap-1 p-1 hover:bg-accent/50 rounded cursor-pointer transition-colors ${
            selectedNode?.id === node.id ? 'bg-primary/10 border border-primary/20' : ''
          }`}
          onClick={() => setSelectedNode(node)}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 w-3"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(node.id);
              }}
            >
              {node.isExpanded ? 
                <ChevronDown className="w-2 h-2" strokeWidth={1.5} /> : 
                <ChevronRight className="w-2 h-2" strokeWidth={1.5} />
              }
            </Button>
          ) : (
            <div className="w-3" />
          )}
          
          <span className="font-mono text-xs text-blue-600 truncate">
            {node.tag}
          </span>
          
          {node.role && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {node.role.substring(0, 3)}
            </Badge>
          )}
          
          {node.hasAccessibilityIssues && (
            <AlertTriangle className="w-2 h-2 text-amber-500" strokeWidth={1.5} />
          )}
        </div>
        
        {hasChildren && node.isExpanded && (
          <div>
            {node.children!.map(child => renderDOMNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2 p-2 h-full">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h3 className="font-medium text-sm">DOM 인스펙터</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                >
                  <HelpCircle className="w-3 h-3" strokeWidth={1.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>키보드 접근성 도움말</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="highlight-toggle" className="text-xs">하이라이트</label>
          <Switch
            id="highlight-toggle"
            size="sm"
            checked={highlightOnPage}
            onCheckedChange={setHighlightOnPage}
          />
        </div>
      </div>

      {/* Keyboard Help Alert */}
      {showKeyboardHelp && (
        <Alert className="p-2">
          <Keyboard className="h-3 w-3" strokeWidth={1.5} />
          <AlertDescription className="text-xs ml-2">
            <div className="space-y-1">
              <div>Tab: 포커스 이동, Space/Enter: 활성화</div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content - Single Column Layout */}
      <div className="flex-1 space-y-2">
        {/* DOM Tree */}
        <Card>
          <CardHeader className="pb-1 px-2 py-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">DOM 트리</CardTitle>
              <Badge variant="outline" className="text-xs">
                {highlightOnPage ? '활성' : '비활성'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-48">
              {renderDOMNode(domTree)}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Node Details */}
        {selectedNode ? (
          <div className="space-y-2">
            {/* Node Info */}
            <Card>
              <CardHeader className="pb-1 px-2 py-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <span className="font-mono text-blue-600">{selectedNode.tag}</span>
                    {selectedNode.hasAccessibilityIssues && (
                      <AlertTriangle className="w-3 h-3 text-amber-500" strokeWidth={1.5} />
                    )}
                  </CardTitle>
                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0">
                    <Copy className="w-3 h-3" strokeWidth={1.5} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {/* Accessibility Info */}
                <div>
                  <h5 className="font-medium text-xs text-muted-foreground mb-1">접근성</h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>역할:</span>
                      <Badge variant="outline" className="text-xs">{selectedNode.role || '없음'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>이름:</span>
                      <span className={`text-xs ${selectedNode.accessibleName ? '' : 'text-red-600'}`}>
                        {selectedNode.accessibleName || '없음'}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Selector Strategies */}
                <div>
                  <h5 className="font-medium text-xs text-muted-foreground mb-1">셀렉터 전략</h5>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(selectedNode.selectorStrategies).map(([strategy, data]) => (
                      <div key={strategy} className="flex items-center justify-between text-xs">
                        <QualityBadge 
                          type={strategy === 'accessibility' ? 'A11y' : 
                                strategy === 'testid' ? 'testid' : 'CSS'} 
                          quality={data.score >= 80 ? 'high' : data.score >= 40 ? 'medium' : 'low'}
                        />
                        <div className="flex items-center gap-1">
                          {getScoreIcon(data.score)}
                          <Badge className={`text-xs ${getScoreColor(data.score)}`}>
                            {data.available ? `${data.score}` : 'X'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attributes */}
            <Card>
              <CardHeader className="pb-1 px-2 py-1">
                <CardTitle className="text-sm">속성</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-20">
                  <div className="space-y-1">
                    {Object.entries(selectedNode.attributes).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="font-mono text-blue-600">{key}:</span>
                        <span className="ml-1 text-muted-foreground">"{value}"</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Improvements */}
            {selectedNode.labelingImprovements && selectedNode.labelingImprovements.length > 0 && (
              <Card>
                <CardHeader className="pb-1 px-2 py-1">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-amber-500" strokeWidth={1.5} />
                    개선 제안
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    {selectedNode.labelingImprovements.map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-1 text-xs">
                        <ArrowRight className="w-2 h-2 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                        <span className="font-mono bg-muted px-1 py-0.5 rounded text-xs">
                          {suggestion}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="flex items-center justify-center h-32">
            <CardContent className="text-center text-muted-foreground p-2">
              <Eye className="w-6 h-6 mx-auto mb-1 opacity-50" strokeWidth={1.5} />
              <div className="text-xs">요소를 선택하여</div>
              <div className="text-xs">상세 정보 확인</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}