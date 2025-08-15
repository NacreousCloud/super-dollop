import type { DOMNodeData } from './dom-analyzer'

export type PickedElementMeta = {
  role: string | null
  name: string | null
  selector: string
  detailedAnalysis?: DOMNodeData
}

export type RuntimeMessage =
  | { type: 'ELEMENT_PICKED'; payload: PickedElementMeta }
  | { type: 'PING' }
  | { type: 'START_INSPECT' }
  | { type: 'STOP_INSPECT' }
  | { type: 'QUERY_ELEMENT'; selector: string }
  | { type: 'CLICK_ELEMENT'; selector: string }
  | { type: 'INPUT_ELEMENT'; selector: string; value: string }
  | { type: 'ASSERT_ELEMENT'; selector: string; assertion: AssertionConfig } 

export interface TestStep {
  id: string;
  type: 'click' | 'input' | 'select' | 'hover' | 'scroll' | 'wait' | 'assert';
  selector: string;
  value?: string;
  description?: string;
  timestamp: number;
  metadata?: any; // Will be defined after ElementMetadata
  assert?: AssertionConfig;
}

// Assertion types
export type AssertionType = 
  | 'text_equals'          // 텍스트가 정확히 일치
  | 'text_contains'        // 텍스트 포함
  | 'text_not_contains'    // 텍스트 미포함
  | 'attribute_equals'     // 속성값이 정확히 일치
  | 'attribute_exists'     // 속성 존재
  | 'attribute_not_exists' // 속성 미존재
  | 'css_property_equals'  // CSS 속성값이 일치
  | 'element_visible'      // 요소가 보임
  | 'element_hidden'       // 요소가 숨겨짐
  | 'element_exists'       // 요소 존재
  | 'element_not_exists'   // 요소 미존재
  | 'element_enabled'      // 요소가 활성화
  | 'element_disabled'     // 요소가 비활성화
  | 'element_checked'      // 체크박스/라디오가 선택됨
  | 'element_unchecked'    // 체크박스/라디오가 선택되지 않음
  | 'count_equals'         // 요소 개수가 일치
  | 'count_greater_than'   // 요소 개수가 더 많음
  | 'count_less_than'      // 요소 개수가 더 적음
  | 'value_equals'         // 입력값이 일치
  | 'value_not_equals';    // 입력값이 일치하지 않음

export interface AssertionConfig {
  type: AssertionType;
  expected: string | number | boolean;
  attribute?: string;      // attribute_* 타입에서 사용
  cssProperty?: string;    // css_property_* 타입에서 사용
  description?: string;    // 사용자 정의 설명
  timeout?: number;        // 대기 시간 (ms)
  retryInterval?: number;  // 재시도 간격 (ms)
}

export interface AssertionResult {
  success: boolean;
  message: string;
  actual: any;
  expected: any;
  timestamp: number;
  duration: number;
  errorDetails?: string;
}

export interface TestScenario {
  id: string;
  name: string;
  description?: string;
  url?: string;
  steps: TestStep[];
  tags: string[];
  status: 'draft' | 'ready' | 'running' | 'passed' | 'failed';
  created: number;
  updated: number;
  lastRun?: number;
  runCount: number;
  assertionResults?: AssertionResult[]; // 최근 실행의 검증 결과
} 