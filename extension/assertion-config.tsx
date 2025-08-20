import React, { useState } from 'react';
import { AssertionConfig, AssertionType } from './types';
import { assertionTypeLabels, assertionTypeDescriptions } from './assertion-engine';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Info, Plus, X } from 'lucide-react';

interface AssertionConfigProps {
  selector: string;
  onAdd: (assertion: AssertionConfig) => void;
  onCancel: () => void;
}

export function AssertionConfigComponent({ selector, onAdd, onCancel }: AssertionConfigProps) {
  const [assertionType, setAssertionType] = useState<AssertionType>('element_exists');
  const [expected, setExpected] = useState<string>('');
  const [attribute, setAttribute] = useState<string>('');
  const [cssProperty, setCssProperty] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [timeout, setTimeout] = useState<number>(5000);
  const [retryInterval, setRetryInterval] = useState<number>(500);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const requiresAttribute = [
    'attribute_equals', 
    'attribute_exists', 
    'attribute_not_exists'
  ].includes(assertionType);

  const requiresCssProperty = assertionType === 'css_property_equals';
  
  const requiresExpectedValue = ![
    'element_exists',
    'element_not_exists', 
    'element_visible',
    'element_hidden',
    'element_enabled',
    'element_disabled',
    'element_checked',
    'element_unchecked',
    'attribute_exists',
    'attribute_not_exists'
  ].includes(assertionType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (requiresAttribute && !attribute.trim()) {
      alert('속성명을 입력해주세요.');
      return;
    }

    if (requiresCssProperty && !cssProperty.trim()) {
      alert('CSS 속성명을 입력해주세요.');
      return;
    }

    if (requiresExpectedValue && !expected.trim()) {
      alert('예상값을 입력해주세요.');
      return;
    }

    let parsedExpected: string | number | boolean = expected;
    
    // 숫자 타입 변환
    if (['count_equals', 'count_greater_than', 'count_less_than'].includes(assertionType)) {
      const num = parseInt(expected, 10);
      if (isNaN(num)) {
        alert('유효한 숫자를 입력해주세요.');
        return;
      }
      parsedExpected = num;
    }
    
    // 불린 타입 변환
    if (['element_checked', 'element_unchecked', 'element_enabled', 'element_disabled'].includes(assertionType)) {
      parsedExpected = expected.toLowerCase() === 'true';
    }

    const assertion: AssertionConfig = {
      type: assertionType,
      expected: parsedExpected,
      ...(requiresAttribute && { attribute }),
      ...(requiresCssProperty && { cssProperty }),
      ...(description.trim() && { description: description.trim() }),
      ...(showAdvanced && { timeout, retryInterval })
    };

    onAdd(assertion);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          검증 추가
        </CardTitle>
        <CardDescription>
          선택된 요소에 대한 검증 조건을 설정합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 셀렉터 표시 */}
          <div className="space-y-2">
            <Label>대상 요소</Label>
            <div className="p-3 bg-muted rounded-md">
              <code className="text-sm">{selector}</code>
            </div>
          </div>

          {/* 검증 타입 선택 */}
          <div className="space-y-2">
            <Label htmlFor="assertionType">검증 타입</Label>
            <Select value={assertionType} onValueChange={(value: AssertionType) => setAssertionType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="검증 타입을 선택하세요" />
              </SelectTrigger>
                              <SelectContent>
                  {Object.entries(assertionTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                {assertionTypeDescriptions[assertionType]}
              </p>
            </div>
          </div>

          {/* 속성명 입력 (필요한 경우) */}
          {requiresAttribute && (
            <div className="space-y-2">
              <Label htmlFor="attribute">속성명</Label>
              <Input
                id="attribute"
                value={attribute}
                onChange={(e) => setAttribute(e.target.value)}
                placeholder="예: class, id, data-testid"
                required
              />
            </div>
          )}

          {/* CSS 속성명 입력 (필요한 경우) */}
          {requiresCssProperty && (
            <div className="space-y-2">
              <Label htmlFor="cssProperty">CSS 속성명</Label>
              <Input
                id="cssProperty"
                value={cssProperty}
                onChange={(e) => setCssProperty(e.target.value)}
                placeholder="예: color, display, font-size"
                required
              />
            </div>
          )}

          {/* 예상값 입력 (필요한 경우) */}
          {requiresExpectedValue && (
            <div className="space-y-2">
              <Label htmlFor="expected">
                예상값
                {['count_equals', 'count_greater_than', 'count_less_than'].includes(assertionType) && (
                  <Badge variant="secondary" className="ml-2">숫자</Badge>
                )}
              </Label>
              <Input
                id="expected"
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                placeholder={
                  ['count_equals', 'count_greater_than', 'count_less_than'].includes(assertionType) 
                    ? "예: 5" 
                    : assertionType.includes('text') 
                      ? "예: 로그인 성공" 
                      : "예상되는 값을 입력하세요"
                }
                type={['count_equals', 'count_greater_than', 'count_less_than'].includes(assertionType) ? 'number' : 'text'}
                required
              />
            </div>
          )}

          {/* 설명 (선택사항) */}
          <div className="space-y-2">
            <Label htmlFor="description">설명 (선택사항)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 검증이 무엇을 확인하는지 설명해주세요"
              rows={2}
            />
          </div>

          {/* 고급 설정 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="showAdvanced"
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
              <Label htmlFor="showAdvanced">고급 설정</Label>
            </div>

            {showAdvanced && (
              <div className="space-y-3 p-4 border rounded-md bg-muted/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeout">타임아웃 (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      min={1000}
                      max={30000}
                      step={1000}
                      value={timeout}
                      onChange={(e) => setTimeout(parseInt(e.target.value, 10))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retryInterval">재시도 간격 (ms)</Label>
                    <Input
                      id="retryInterval"
                      type="number"
                      min={100}
                      max={5000}
                      step={100}
                      value={retryInterval}
                      onChange={(e) => setRetryInterval(parseInt(e.target.value, 10))}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              검증 추가
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// 검증 결과 표시 컴포넌트
interface AssertionResultDisplayProps {
  result: any; // AssertionResult type
  onRemove?: () => void;
}

export function AssertionResultDisplay({ result, onRemove }: AssertionResultDisplayProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className={`w-full ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.success ? '✓ 통과' : '✗ 실패'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDuration(result.duration)}
              </span>
            </div>
            
            <p className="text-sm font-medium mb-1">{result.message}</p>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div>예상: <code>{JSON.stringify(result.expected)}</code></div>
              <div>실제: <code>{JSON.stringify(result.actual)}</code></div>
              {result.errorDetails && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-red-600">오류 상세</summary>
                  <pre className="mt-1 p-2 bg-red-100 rounded text-xs overflow-auto">
                    {result.errorDetails}
                  </pre>
                </details>
              )}
            </div>
          </div>
          
          {onRemove && (
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 