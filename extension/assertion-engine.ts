import { AssertionConfig, AssertionResult, AssertionType } from './types';

export class AssertionEngine {
  private static instance: AssertionEngine;

  public static getInstance(): AssertionEngine {
    if (!AssertionEngine.instance) {
      AssertionEngine.instance = new AssertionEngine();
    }
    return AssertionEngine.instance;
  }

  /**
   * 선택자를 사용하여 검증을 수행합니다
   */
  public async executeAssertion(
    selector: string, 
    assertion: AssertionConfig
  ): Promise<AssertionResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.performAssertion(selector, assertion);
      const duration = Date.now() - startTime;
      
      return {
        success: result.success,
        message: result.message,
        actual: result.actual,
        expected: assertion.expected,
        timestamp: startTime,
        duration,
        errorDetails: result.errorDetails
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        message: `검증 실행 중 오류 발생: ${error.message}`,
        actual: null,
        expected: assertion.expected,
        timestamp: startTime,
        duration,
        errorDetails: error.stack
      };
    }
  }

  /**
   * 실제 검증 로직을 수행합니다
   */
  private async performAssertion(
    selector: string, 
    assertion: AssertionConfig
  ): Promise<{ success: boolean; message: string; actual: any; errorDetails?: string }> {
    const { type, expected, attribute, cssProperty, timeout = 5000, retryInterval = 500 } = assertion;
    
    // 타임아웃과 재시도를 위한 루프
    const endTime = Date.now() + timeout;
    let lastError: Error | null = null;
    
    while (Date.now() < endTime) {
      try {
        const result = await this.checkAssertion(selector, type, expected, attribute, cssProperty);
        if (result.success) {
          return result;
        }
        lastError = new Error(result.message);
             } catch (error: any) {
         lastError = error instanceof Error ? error : new Error(String(error));
      }
      
      if (Date.now() + retryInterval < endTime) {
        await this.sleep(retryInterval);
      }
    }
    
    // 타임아웃 시 마지막 에러 반환
    return {
      success: false,
      message: `타임아웃 (${timeout}ms): ${lastError?.message || '알 수 없는 오류'}`,
      actual: null,
      errorDetails: lastError?.stack
    };
  }

  /**
   * 단일 검증을 수행합니다 (타임아웃/재시도 없음)
   */
  private async checkAssertion(
    selector: string,
    type: AssertionType,
    expected: string | number | boolean,
    attribute?: string,
    cssProperty?: string
  ): Promise<{ success: boolean; message: string; actual: any }> {
    switch (type) {
      case 'element_exists':
        return this.checkElementExists(selector);
      
      case 'element_not_exists':
        return this.checkElementNotExists(selector);
      
      case 'element_visible':
        return this.checkElementVisible(selector);
      
      case 'element_hidden':
        return this.checkElementHidden(selector);
      
      case 'text_equals':
        return this.checkTextEquals(selector, expected as string);
      
      case 'text_contains':
        return this.checkTextContains(selector, expected as string);
      
      case 'text_not_contains':
        return this.checkTextNotContains(selector, expected as string);
      
      case 'attribute_equals':
        if (!attribute) throw new Error('attribute 파라미터가 필요합니다');
        return this.checkAttributeEquals(selector, attribute, expected as string);
      
      case 'attribute_exists':
        if (!attribute) throw new Error('attribute 파라미터가 필요합니다');
        return this.checkAttributeExists(selector, attribute);
      
      case 'attribute_not_exists':
        if (!attribute) throw new Error('attribute 파라미터가 필요합니다');
        return this.checkAttributeNotExists(selector, attribute);
      
      case 'css_property_equals':
        if (!cssProperty) throw new Error('cssProperty 파라미터가 필요합니다');
        return this.checkCssPropertyEquals(selector, cssProperty, expected as string);
      
      case 'element_enabled':
        return this.checkElementEnabled(selector);
      
      case 'element_disabled':
        return this.checkElementDisabled(selector);
      
      case 'element_checked':
        return this.checkElementChecked(selector);
      
      case 'element_unchecked':
        return this.checkElementUnchecked(selector);
      
      case 'value_equals':
        return this.checkValueEquals(selector, expected as string);
      
      case 'value_not_equals':
        return this.checkValueNotEquals(selector, expected as string);
      
      case 'count_equals':
        return this.checkCountEquals(selector, expected as number);
      
      case 'count_greater_than':
        return this.checkCountGreaterThan(selector, expected as number);
      
      case 'count_less_than':
        return this.checkCountLessThan(selector, expected as number);
      
      default:
        throw new Error(`지원하지 않는 검증 타입: ${type}`);
    }
  }

  // 개별 검증 메소드들
  private async checkElementExists(selector: string) {
    const element = document.querySelector(selector);
    return {
      success: element !== null,
      message: element ? '요소가 존재합니다' : '요소가 존재하지 않습니다',
      actual: element !== null
    };
  }

  private async checkElementNotExists(selector: string) {
    const element = document.querySelector(selector);
    return {
      success: element === null,
      message: element ? '요소가 존재합니다' : '요소가 존재하지 않습니다',
      actual: element !== null
    };
  }

  private async checkElementVisible(selector: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      return { success: false, message: '요소가 존재하지 않습니다', actual: false };
    }
    
    const style = window.getComputedStyle(element);
    const isVisible = style.display !== 'none' && 
                     style.visibility !== 'hidden' && 
                     style.opacity !== '0' &&
                     element.offsetWidth > 0 && 
                     element.offsetHeight > 0;
    
    return {
      success: isVisible,
      message: isVisible ? '요소가 보입니다' : '요소가 숨겨져 있습니다',
      actual: isVisible
    };
  }

  private async checkElementHidden(selector: string) {
    const result = await this.checkElementVisible(selector);
    return {
      success: !result.success,
      message: !result.actual ? '요소가 숨겨져 있습니다' : '요소가 보입니다',
      actual: !result.actual
    };
  }

  private async checkTextEquals(selector: string, expected: string) {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, message: '요소가 존재하지 않습니다', actual: null };
    }
    
    const actual = element.textContent?.trim() || '';
    return {
      success: actual === expected,
      message: `텍스트 ${actual === expected ? '일치' : '불일치'}: "${actual}" vs "${expected}"`,
      actual
    };
  }

  private async checkTextContains(selector: string, expected: string) {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, message: '요소가 존재하지 않습니다', actual: null };
    }
    
    const actual = element.textContent?.trim() || '';
    const contains = actual.includes(expected);
    return {
      success: contains,
      message: `텍스트 ${contains ? '포함' : '미포함'}: "${actual}" 안에 "${expected}"`,
      actual
    };
  }

  private async checkTextNotContains(selector: string, expected: string) {
    const result = await this.checkTextContains(selector, expected);
    return {
      success: !result.success,
      message: result.success ? 
        `텍스트 포함: "${result.actual}" 안에 "${expected}"` : 
        `텍스트 미포함: "${result.actual}" 안에 "${expected}"`,
      actual: result.actual
    };
  }

  private async checkAttributeEquals(selector: string, attribute: string, expected: string) {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, message: '요소가 존재하지 않습니다', actual: null };
    }
    
    const actual = element.getAttribute(attribute);
    return {
      success: actual === expected,
      message: `속성 ${attribute} ${actual === expected ? '일치' : '불일치'}: "${actual}" vs "${expected}"`,
      actual
    };
  }

  private async checkAttributeExists(selector: string, attribute: string) {
    const element = document.querySelector(selector);
    if (!element) {
      return { success: false, message: '요소가 존재하지 않습니다', actual: false };
    }
    
    const exists = element.hasAttribute(attribute);
    return {
      success: exists,
      message: `속성 ${attribute} ${exists ? '존재' : '미존재'}`,
      actual: exists
    };
  }

  private async checkAttributeNotExists(selector: string, attribute: string) {
    const result = await this.checkAttributeExists(selector, attribute);
    return {
      success: !result.success,
      message: `속성 ${attribute} ${result.actual ? '존재' : '미존재'}`,
      actual: !result.actual
    };
  }

  private async checkCssPropertyEquals(selector: string, cssProperty: string, expected: string) {
    const element = document.querySelector(selector) as HTMLElement;
    if (!element) {
      return { success: false, message: '요소가 존재하지 않습니다', actual: null };
    }
    
    const style = window.getComputedStyle(element);
    const actual = style.getPropertyValue(cssProperty);
    return {
      success: actual === expected,
      message: `CSS 속성 ${cssProperty} ${actual === expected ? '일치' : '불일치'}: "${actual}" vs "${expected}"`,
      actual
    };
  }

  private async checkElementEnabled(selector: string) {
    const element = document.querySelector(selector) as HTMLInputElement | HTMLButtonElement;
    if (!element) {
      return { success: false, message: '요소가 존재하지 않습니다', actual: false };
    }
    
    const enabled = !element.disabled;
    return {
      success: enabled,
      message: `요소가 ${enabled ? '활성화' : '비활성화'} 상태입니다`,
      actual: enabled
    };
  }

  private async checkElementDisabled(selector: string) {
    const result = await this.checkElementEnabled(selector);
    return {
      success: !result.success,
      message: `요소가 ${result.actual ? '활성화' : '비활성화'} 상태입니다`,
      actual: !result.actual
    };
  }

  private async checkElementChecked(selector: string) {
    const element = document.querySelector(selector) as HTMLInputElement;
    if (!element) {
      return { success: false, message: '요소가 존재하지 않습니다', actual: false };
    }
    
    const checked = element.checked;
    return {
      success: checked,
      message: `요소가 ${checked ? '선택' : '선택되지 않음'} 상태입니다`,
      actual: checked
    };
  }

  private async checkElementUnchecked(selector: string) {
    const result = await this.checkElementChecked(selector);
    return {
      success: !result.success,
      message: `요소가 ${result.actual ? '선택' : '선택되지 않음'} 상태입니다`,
      actual: !result.actual
    };
  }

  private async checkValueEquals(selector: string, expected: string) {
    const element = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (!element) {
      return { success: false, message: '요소가 존재하지 않습니다', actual: null };
    }
    
    const actual = element.value;
    return {
      success: actual === expected,
      message: `값 ${actual === expected ? '일치' : '불일치'}: "${actual}" vs "${expected}"`,
      actual
    };
  }

  private async checkValueNotEquals(selector: string, expected: string) {
    const result = await this.checkValueEquals(selector, expected);
    return {
      success: !result.success,
      message: `값 ${result.success ? '일치' : '불일치'}: "${result.actual}" vs "${expected}"`,
      actual: result.actual
    };
  }

  private async checkCountEquals(selector: string, expected: number) {
    const elements = document.querySelectorAll(selector);
    const actual = elements.length;
    return {
      success: actual === expected,
      message: `요소 개수 ${actual === expected ? '일치' : '불일치'}: ${actual}개 vs ${expected}개`,
      actual
    };
  }

  private async checkCountGreaterThan(selector: string, expected: number) {
    const elements = document.querySelectorAll(selector);
    const actual = elements.length;
    return {
      success: actual > expected,
      message: `요소 개수: ${actual}개 ${actual > expected ? '>' : '<='} ${expected}개`,
      actual
    };
  }

  private async checkCountLessThan(selector: string, expected: number) {
    const elements = document.querySelectorAll(selector);
    const actual = elements.length;
    return {
      success: actual < expected,
      message: `요소 개수: ${actual}개 ${actual < expected ? '<' : '>='} ${expected}개`,
      actual
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 유틸리티 함수들
export const assertionTypeLabels: Record<AssertionType, string> = {
  'text_equals': '텍스트 일치',
  'text_contains': '텍스트 포함',
  'text_not_contains': '텍스트 미포함',
  'attribute_equals': '속성값 일치',
  'attribute_exists': '속성 존재',
  'attribute_not_exists': '속성 미존재',
  'css_property_equals': 'CSS 속성 일치',
  'element_visible': '요소 보임',
  'element_hidden': '요소 숨김',
  'element_exists': '요소 존재',
  'element_not_exists': '요소 미존재',
  'element_enabled': '요소 활성화',
  'element_disabled': '요소 비활성화',
  'element_checked': '요소 선택됨',
  'element_unchecked': '요소 선택 안됨',
  'count_equals': '개수 일치',
  'count_greater_than': '개수 초과',
  'count_less_than': '개수 미만',
  'value_equals': '값 일치',
  'value_not_equals': '값 불일치'
};

export const assertionTypeDescriptions: Record<AssertionType, string> = {
  'text_equals': '요소의 텍스트가 지정된 값과 정확히 일치하는지 확인',
  'text_contains': '요소의 텍스트에 지정된 문자열이 포함되어 있는지 확인',
  'text_not_contains': '요소의 텍스트에 지정된 문자열이 포함되지 않았는지 확인',
  'attribute_equals': '요소의 속성값이 지정된 값과 일치하는지 확인',
  'attribute_exists': '요소에 지정된 속성이 존재하는지 확인',
  'attribute_not_exists': '요소에 지정된 속성이 존재하지 않는지 확인',
  'css_property_equals': '요소의 CSS 속성값이 지정된 값과 일치하는지 확인',
  'element_visible': '요소가 화면에 보이는지 확인 (display, visibility, opacity 고려)',
  'element_hidden': '요소가 화면에서 숨겨져 있는지 확인',
  'element_exists': '지정된 선택자로 요소를 찾을 수 있는지 확인',
  'element_not_exists': '지정된 선택자로 요소를 찾을 수 없는지 확인',
  'element_enabled': '요소가 활성화 상태인지 확인 (disabled 속성 없음)',
  'element_disabled': '요소가 비활성화 상태인지 확인 (disabled 속성 있음)',
  'element_checked': '체크박스나 라디오 버튼이 선택된 상태인지 확인',
  'element_unchecked': '체크박스나 라디오 버튼이 선택되지 않은 상태인지 확인',
  'count_equals': '선택자로 찾은 요소의 개수가 지정된 수와 일치하는지 확인',
  'count_greater_than': '선택자로 찾은 요소의 개수가 지정된 수보다 많은지 확인',
  'count_less_than': '선택자로 찾은 요소의 개수가 지정된 수보다 적은지 확인',
  'value_equals': '입력 요소의 값이 지정된 값과 일치하는지 확인',
  'value_not_equals': '입력 요소의 값이 지정된 값과 일치하지 않는지 확인'
}; 