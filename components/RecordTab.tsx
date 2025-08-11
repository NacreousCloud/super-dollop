import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription } from "./ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { QualityBadge } from './QualityBadge';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Mouse, 
  Keyboard, 
  Navigation, 
  Eye, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  Globe,
  Layers,
  Zap
} from 'lucide-react';
import { useState } from 'react';

interface RecordEvent {
  id: string;
  type: 'click' | 'input' | 'navigate' | 'hover' | 'scroll';
  element: {
    role?: string;
    name?: string;
    tagName: string;
  };
  timestamp: string;
  selectors: {
    css?: string;
    testid?: string;
    aria?: string;
  };
  value?: string;
  url?: string;
  isExpanded?: boolean;
}

const mockEvents: RecordEvent[] = [
  {
    id: '1',
    type: 'navigate',
    element: { tagName: 'document' },
    timestamp: '14:32:10',
    selectors: {},
    url: 'https://example.com/login',
    isExpanded: false
  },
  {
    id: '2',
    type: 'click',
    element: { role: 'button', name: '로그인', tagName: 'button' },
    timestamp: '14:32:15',
    selectors: { 
      testid: 'login-btn',
      css: '.login-button',
      aria: 'button[aria-label="로그인"]'
    },
    isExpanded: false
  },
  {
    id: '3',
    type: 'input',
    element: { role: 'textbox', name: '이메일', tagName: 'input' },
    timestamp: '14:32:18',
    selectors: { 
      css: '#email',
      aria: 'input[aria-label="이메일"]'
    },
    value: 'user@example.com',
    isExpanded: false
  },
  {
    id: '4',
    type: 'input',
    element: { role: 'textbox', name: '비밀번호', tagName: 'input' },
    timestamp: '14:32:22',
    selectors: { 
      css: 'input[type="password"]'
    },
    value: '••••••••',
    isExpanded: false
  },
  {
    id: '5',
    type: 'click',
    element: { role: 'button', name: '제출', tagName: 'button' },
    timestamp: '14:32:25',
    selectors: { 
      testid: 'submit-btn',
      css: 'button[type="submit"]',
      aria: 'button[aria-label="제출"]'
    },
    isExpanded: true
  }
];

export function RecordTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [events, setEvents] = useState<RecordEvent[]>(mockEvents);
  const [currentUrl] = useState('https://example.com/login');
  const [currentTabId] = useState('tab_1234');
  const [isDebuggerConnected] = useState(true);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'click': return <Mouse className="w-4 h-4 text-blue-600" strokeWidth={1.5} />;
      case 'input': return <Keyboard className="w-4 h-4 text-green-600" strokeWidth={1.5} />;
      case 'navigate': return <Navigation className="w-4 h-4 text-purple-600" strokeWidth={1.5} />;
      case 'hover': return <Eye className="w-4 h-4 text-orange-600" strokeWidth={1.5} />;
      case 'scroll': return <RotateCcw className="w-4 h-4 text-gray-600" strokeWidth={1.5} />;
      default: return <Zap className="w-4 h-4 text-gray-600" strokeWidth={1.5} />;
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'click': return 'Click';
      case 'input': return 'Type';
      case 'navigate': return 'Navigate';
      case 'hover': return 'Hover';
      case 'scroll': return 'Scroll';
      default: return type;
    }
  };

  const toggleEventExpansion = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, isExpanded: !event.isExpanded }
        : event
    ));
  };

  const hasOnlyCssSelectors = (event: RecordEvent) => {
    return event.selectors.css && !event.selectors.testid && !event.selectors.aria;
  };

  const hasCssOnlyEvents = events.some(hasOnlyCssSelectors);

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      {/* Recording Control Section */}
      <div className="space-y-3">
        {/* Large Toggle with Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <Switch
                id="record-toggle"
                checked={isRecording}
                onCheckedChange={setIsRecording}
                className="scale-125"
              />
              <div>
                <div className="font-medium">기록</div>
                <div className="text-xs text-muted-foreground">
                  {isRecording ? '이벤트 캡처 중...' : '대기 상태'}
                </div>
              </div>
            </div>
          </div>
          <Badge 
            variant={isRecording ? "default" : "secondary"}
            className={isRecording ? "bg-red-100 text-red-800 animate-pulse" : ""}
          >
            {isRecording ? '●  REC' : 'STOPPED'}
          </Badge>
        </div>

        {/* Current Page Info */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="font-medium">현재 페이지:</span>
          </div>
          <div className="text-xs font-mono bg-background p-2 rounded border break-all">
            {currentUrl}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3" strokeWidth={1.5} />
              <span>탭 ID: {currentTabId}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isDebuggerConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isDebuggerConnected ? 'Debugger API로 연결됨' : '연결 끊어짐'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS-only Warning Banner */}
      {hasCssOnlyEvents && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" strokeWidth={1.5} />
          <AlertDescription className="text-amber-800">
            <div className="space-y-1">
              <div className="font-medium">CSS 셀렉터만 사용된 요소가 있습니다</div>
              <div className="text-xs">
                aria-label, role 속성 또는 data-testid 추가를 권장합니다
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Event Timeline */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">이벤트 타임라인</h3>
          <Badge variant="outline" className="text-xs">
            {events.length}개 이벤트
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {events.map((event, index) => (
              <div key={event.id} className="border rounded-lg bg-card">
                <div
                  className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => toggleEventExpansion(event.id)}
                >
                  {/* Event Icon */}
                  <div className="flex-shrink-0">
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {getActionText(event.type)}
                      </span>
                      {event.element.role && (
                        <Badge variant="outline" className="text-xs">
                          {event.element.role}
                        </Badge>
                      )}
                      {hasOnlyCssSelectors(event) && (
                        <AlertTriangle className="w-3 h-3 text-amber-500" strokeWidth={1.5} />
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground truncate">
                      {event.element.name || event.element.tagName}
                      {event.value && ` = "${event.value}"`}
                      {event.url && ` → ${event.url}`}
                    </div>

                    {/* Selector Quality Badges */}
                    <div className="flex items-center gap-1 mt-2">
                      {event.selectors.aria && <QualityBadge type="A11y" quality="high" />}
                      {event.selectors.css && <QualityBadge type="CSS" quality={event.selectors.testid || event.selectors.aria ? "high" : "low"} />}
                      {event.selectors.testid && <QualityBadge type="testid" quality="high" />}
                    </div>
                  </div>

                  {/* Timestamp and Expand Icon */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" strokeWidth={1.5} />
                    <span>{event.timestamp}</span>
                    {event.isExpanded ? 
                      <ChevronDown className="w-4 h-4" strokeWidth={1.5} /> : 
                      <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                    }
                  </div>
                </div>

                {/* Expanded Details */}
                {event.isExpanded && (
                  <div className="px-3 pb-3 border-t bg-muted/30">
                    <div className="pt-3 space-y-2">
                      <h4 className="font-medium text-xs text-muted-foreground">셀렉터 상세</h4>
                      <div className="space-y-1">
                        {event.selectors.testid && (
                          <div className="flex items-center gap-2 text-xs">
                            <QualityBadge type="testid" quality="high" />
                            <code className="bg-background px-2 py-1 rounded border font-mono">
                              [data-testid="{event.selectors.testid}"]
                            </code>
                          </div>
                        )}
                        {event.selectors.aria && (
                          <div className="flex items-center gap-2 text-xs">
                            <QualityBadge type="A11y" quality="high" />
                            <code className="bg-background px-2 py-1 rounded border font-mono">
                              {event.selectors.aria}
                            </code>
                          </div>
                        )}
                        {event.selectors.css && (
                          <div className="flex items-center gap-2 text-xs">
                            <QualityBadge 
                              type="CSS" 
                              quality={event.selectors.testid || event.selectors.aria ? "high" : "low"} 
                            />
                            <code className="bg-background px-2 py-1 rounded border font-mono">
                              {event.selectors.css}
                            </code>
                          </div>
                        )}
                      </div>
                      
                      {hasOnlyCssSelectors(event) && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                          <div className="font-medium">권장사항:</div>
                          <div>aria-label 또는 data-testid 속성 추가</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" strokeWidth={1.5} />
                <div className="text-sm">기록을 시작하여 이벤트를 캡처하세요</div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Bottom Actions */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            disabled={events.length === 0}
          >
            시나리오로 저장
          </Button>
          <Button 
            variant="secondary" 
            disabled={events.length === 0}
            onClick={() => setEvents([])}
          >
            <RotateCcw className="w-3 h-3 mr-1" strokeWidth={1.5} />
            초기화
          </Button>
        </div>
        
        {events.length > 0 && (
          <div className="text-xs text-center text-muted-foreground">
            {events.length}개 이벤트가 기록되었습니다
          </div>
        )}
      </div>
    </div>
  );
}