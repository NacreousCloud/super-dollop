import { Alert, AlertDescription } from "./ui/alert";
import { AlertTriangle, X, Lightbulb } from 'lucide-react';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState } from 'react';

interface AccessibilityWarningProps {
  type?: 'general' | 'css-selectors' | 'missing-aria';
  affectedElements?: number;
  onDismiss?: () => void;
}

export function AccessibilityWarning({ 
  type = 'general', 
  affectedElements = 0,
  onDismiss 
}: AccessibilityWarningProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const getWarningContent = () => {
    switch (type) {
      case 'css-selectors':
        return {
          title: 'CSS 셀렉터만 사용된 요소 발견',
          description: 'CSS 셀렉터는 페이지 구조 변경 시 쉽게 깨질 수 있습니다. 안정적인 테스트를 위해 다음을 권장합니다:',
          suggestions: [
            'data-testid 속성 추가',
            'aria-label 또는 aria-labelledby 추가',
            'role 속성 명시',
            '의미적 HTML 요소 사용'
          ]
        };
      case 'missing-aria':
        return {
          title: 'ARIA 속성이 누락된 요소들',
          description: '접근성과 테스트 안정성을 위해 ARIA 속성 추가를 권장합니다:',
          suggestions: [
            'button 요소에 aria-label 추가',
            'form 요소에 aria-describedby 추가',
            '상호작용 요소에 role 명시'
          ]
        };
      default:
        return {
          title: '접근성 개선 권장사항',
          description: '일부 요소에 접근성 속성이 누락되었습니다.',
          suggestions: [
            'ARIA 레이블 추가',
            'data-testid 속성 추가'
          ]
        };
    }
  };

  const content = getWarningContent();

  return (
    <Alert className="m-3 bg-amber-50 border-amber-200 relative">
      <AlertTriangle className="h-4 w-4 text-amber-600" strokeWidth={1.5} />
      <AlertDescription className="text-amber-800 pr-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{content.title}</span>
            {affectedElements > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                {affectedElements}개 요소
              </Badge>
            )}
          </div>
          <div className="text-xs">{content.description}</div>
          <div className="flex items-start gap-1">
            <Lightbulb className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <div className="text-xs space-y-1">
              {content.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className="text-amber-600">•</span>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AlertDescription>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-auto p-1 text-amber-600 hover:text-amber-800"
        onClick={handleDismiss}
      >
        <X className="h-3 w-3" strokeWidth={1.5} />
      </Button>
    </Alert>
  );
}