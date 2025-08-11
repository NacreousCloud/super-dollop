import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Toaster } from "./components/ui/sonner";
import { Header } from './components/Header';
import { AccessibilityWarning } from './components/AccessibilityWarning';
import { RecordTab } from './components/RecordTab';
import { InspectorTab } from './components/InspectorTab';
import { BuilderTab } from './components/BuilderTab';
import { ScenarioTab } from './components/ScenarioTab';
import { ReportTab } from './components/ReportTab';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Switch } from './components/ui/switch';
import { Play, Save, Download, Code } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('builder');
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [showAccessibilityWarning, setShowAccessibilityWarning] = useState(true);

  const mockJsonPreview = {
    scenario: "로그인 플로우 테스트",
    steps: [
      { action: "click", selector: "[data-testid='login-btn']" },
      { action: "input", selector: "#email", value: "user@example.com" },
      { action: "assert", type: "visible", selector: ".success-message" }
    ],
    assertions: [
      { type: "accessibility", target: "form", rule: "aria-label required" }
    ]
  };

  return (
    <div className="w-[360px] h-[720px] bg-background border-r flex flex-col">
      <Header />
      {showAccessibilityWarning && (
        <AccessibilityWarning 
          type="css-selectors"
          affectedElements={2}
          onDismiss={() => setShowAccessibilityWarning(false)}
        />
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5 mx-3 mt-2">
          <TabsTrigger value="record" className="text-xs">기록</TabsTrigger>
          <TabsTrigger value="inspector" className="text-xs">인스펙터</TabsTrigger>
          <TabsTrigger value="builder" className="text-xs">빌더</TabsTrigger>
          <TabsTrigger value="scenario" className="text-xs">시나리오</TabsTrigger>
          <TabsTrigger value="report" className="text-xs">리포트</TabsTrigger>
        </TabsList>

        <div className="flex-1 flex flex-col overflow-hidden">
          <TabsContent value="record" className="flex-1 mt-0">
            <RecordTab />
          </TabsContent>
          
          <TabsContent value="inspector" className="flex-1 mt-0">
            <InspectorTab />
          </TabsContent>
          
          <TabsContent value="builder" className="flex-1 mt-0">
            <BuilderTab />
          </TabsContent>
          
          <TabsContent value="scenario" className="flex-1 mt-0">
            <ScenarioTab />
          </TabsContent>
          
          <TabsContent value="report" className="flex-1 mt-0">
            <ReportTab />
          </TabsContent>
        </div>
      </Tabs>

      {/* JSON Preview Toggle */}
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
              size="sm"
              checked={showJsonPreview}
              onCheckedChange={setShowJsonPreview}
            />
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline">
              <Save className="w-3 h-3" strokeWidth={1.5} />
            </Button>
            <Button size="sm" variant="outline">
              <Download className="w-3 h-3" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button className="flex-1" size="sm">
            <Play className="w-3 h-3 mr-1" strokeWidth={1.5} />
            테스트 실행
          </Button>
          <Button size="sm" variant="outline">
            <Code className="w-3 h-3" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      <Toaster />
    </div>
  );
}