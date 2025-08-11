import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Play, Edit, Trash2, Copy, Search } from 'lucide-react';
import { useState } from 'react';

interface Scenario {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'passed' | 'failed';
  lastRun: string;
  steps: number;
  tags: string[];
}

const mockScenarios: Scenario[] = [
  { 
    id: '1', 
    name: '로그인 플로우 테스트', 
    status: 'passed', 
    lastRun: '2분 전', 
    steps: 5, 
    tags: ['auth', 'critical'] 
  },
  { 
    id: '2', 
    name: '회원가입 검증', 
    status: 'failed', 
    lastRun: '5분 전', 
    steps: 8, 
    tags: ['auth', 'registration'] 
  },
  { 
    id: '3', 
    name: '장바구니 기능', 
    status: 'running', 
    lastRun: '실행 중', 
    steps: 12, 
    tags: ['cart', 'e2e'] 
  },
  { 
    id: '4', 
    name: '접근성 체크', 
    status: 'draft', 
    lastRun: '미실행', 
    steps: 6, 
    tags: ['a11y', 'compliance'] 
  },
];

export function ScenarioTab() {
  const [scenarios] = useState<Scenario[]>(mockScenarios);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'passed': return '성공';
      case 'failed': return '실패';
      case 'running': return '실행 중';
      case 'draft': return '초안';
      default: return status;
    }
  };

  const filteredScenarios = scenarios.filter(scenario => {
    const matchesFilter = filter === 'all' || scenario.status === filter;
    const matchesSearch = scenario.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">시나리오 목록</h3>
        <Button size="sm">
          <Plus className="w-3 h-3 mr-1" strokeWidth={1.5} />
          새 시나리오
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
          <Input
            placeholder="시나리오 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 text-sm"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-24 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="passed">성공</SelectItem>
            <SelectItem value="failed">실패</SelectItem>
            <SelectItem value="running">실행 중</SelectItem>
            <SelectItem value="draft">초안</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시나리오</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>단계</TableHead>
                <TableHead>마지막 실행</TableHead>
                <TableHead width="100">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScenarios.map((scenario) => (
                <TableRow key={scenario.id} className="hover:bg-accent/50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{scenario.name}</div>
                      <div className="flex gap-1 mt-1">
                        {scenario.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getStatusColor(scenario.status)}`}>
                      {getStatusLabel(scenario.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{scenario.steps}개</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {scenario.lastRun}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Play className="w-3 h-3" strokeWidth={1.5} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Edit className="w-3 h-3" strokeWidth={1.5} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Copy className="w-3 h-3" strokeWidth={1.5} />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive">
                        <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" disabled={filteredScenarios.length === 0}>
          <Play className="w-3 h-3 mr-1" strokeWidth={1.5} />
          선택된 시나리오 실행
        </Button>
        <Button variant="outline">
          내보내기
        </Button>
      </div>
    </div>
  );
}