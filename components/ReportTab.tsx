import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { CheckCircle, XCircle, AlertCircle, Download, Share } from 'lucide-react';

interface TestResult {
  id: string;
  scenarioName: string;
  status: 'passed' | 'failed' | 'warning';
  duration: string;
  steps: {
    name: string;
    status: 'passed' | 'failed' | 'warning';
    screenshot?: string;
    error?: string;
  }[];
}

const mockResults: TestResult[] = [
  {
    id: '1',
    scenarioName: '로그인 플로우 테스트',
    status: 'passed',
    duration: '2.5초',
    steps: [
      { name: '페이지 로드', status: 'passed' },
      { name: '이메일 입력', status: 'passed' },
      { name: '비밀번호 입력', status: 'passed' },
      { name: '로그인 버튼 클릭', status: 'passed' },
      { name: '성공 메시지 확인', status: 'passed' },
    ]
  },
  {
    id: '2',
    scenarioName: '회원가입 검증',
    status: 'failed',
    duration: '4.2초',
    steps: [
      { name: '회원가입 페이지 접근', status: 'passed' },
      { name: '폼 데이터 입력', status: 'passed' },
      { name: '이용약관 동의', status: 'warning', error: 'aria-label 속성 누락' },
      { name: '가입 버튼 클릭', status: 'failed', error: '버튼이 비활성화 상태입니다' },
    ]
  },
];

export function ReportTab() {
  const totalScenarios = mockResults.length;
  const passedScenarios = mockResults.filter(r => r.status === 'passed').length;
  const failedScenarios = mockResults.filter(r => r.status === 'failed').length;
  const warningScenarios = mockResults.filter(r => r.status === 'warning').length;
  const successRate = Math.round((passedScenarios / totalScenarios) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-600" strokeWidth={1.5} />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" strokeWidth={1.5} />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-600" strokeWidth={1.5} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">테스트 리포트</h3>
        <div className="flex gap-1">
          <Button size="sm" variant="outline">
            <Download className="w-3 h-3 mr-1" strokeWidth={1.5} />
            다운로드
          </Button>
          <Button size="sm" variant="outline">
            <Share className="w-3 h-3 mr-1" strokeWidth={1.5} />
            공유
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold text-green-600">{successRate}%</div>
              <div className="text-sm text-muted-foreground">성공률</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" strokeWidth={1.5} />
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold">{totalScenarios}</div>
              <div className="text-sm text-muted-foreground">총 시나리오</div>
            </div>
            <div className="flex gap-1">
              <Badge className="bg-green-100 text-green-800 text-xs">{passedScenarios}</Badge>
              <Badge className="bg-red-100 text-red-800 text-xs">{failedScenarios}</Badge>
            </div>
          </div>
        </Card>
      </div>

      <Progress value={successRate} className="mb-2" />

      {/* Results */}
      <div className="flex-1">
        <ScrollArea className="h-[450px]">
          <div className="space-y-2">
            {mockResults.map((result) => (
              <Card key={result.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{result.scenarioName}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor(result.status)}`}>
                        {result.status === 'passed' ? '성공' : 
                         result.status === 'failed' ? '실패' : '경고'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{result.duration}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {result.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          {getStatusIcon(step.status)}
                          <span className="text-sm">{step.name}</span>
                        </div>
                        {step.error && (
                          <div className="text-xs text-red-600 max-w-40 truncate">
                            {step.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {result.status === 'failed' && (
                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                      <div className="text-xs text-red-800 font-medium">실패 단계 스크린샷</div>
                      <div className="mt-1 w-full h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-muted-foreground">
                        스크린샷 미리보기
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}