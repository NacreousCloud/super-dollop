import { AssertionEngine } from './assertion-engine';
import { StorageManager, type TestScenario, type TestStep } from './storage';
import type { AssertionResult } from './types';

export interface TestRunResult {
  scenarioId: string;
  status: 'passed' | 'failed' | 'cancelled';
  startTime: number;
  endTime: number;
  duration: number;
  stepResults: StepResult[];
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  assertionResults: AssertionResult[];
}

export interface StepResult {
  stepId: string;
  stepType: TestStep['type'];
  selector?: string;
  description?: string;
  assertType?: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  assertion?: AssertionResult;
}

export class TestRunner {
  private static instance: TestRunner;
  private engine = AssertionEngine.getInstance();
  private currentRun: { scenarioId: string; cancelled: boolean } | null = null;

  public static getInstance(): TestRunner {
    if (!TestRunner.instance) {
      TestRunner.instance = new TestRunner();
    }
    return TestRunner.instance;
  }

  /**
   * 시나리오를 실행합니다
   */
  public async runScenario(
    scenarioId: string,
    onProgress?: (step: number, total: number, currentStep: TestStep) => void
  ): Promise<TestRunResult> {
    // 이미 실행 중인 경우 취소
    if (this.currentRun) {
      this.currentRun.cancelled = true;
    }

    this.currentRun = { scenarioId, cancelled: false };
    
    const startTime = Date.now();
    const scenario = await StorageManager.getScenario(scenarioId);
    
    if (!scenario) {
      throw new Error('시나리오를 찾을 수 없습니다');
    }

    // 시나리오 상태를 'running'으로 변경
    await StorageManager.updateScenarioStatus(scenarioId, 'running');

    const result: TestRunResult = {
      scenarioId,
      status: 'passed',
      startTime,
      endTime: 0,
      duration: 0,
      stepResults: [],
      totalSteps: scenario.steps.length,
      passedSteps: 0,
      failedSteps: 0,
      assertionResults: []
    };

    try {
      // 각 스텝 실행
      for (let i = 0; i < scenario.steps.length; i++) {
        if (this.currentRun.cancelled) {
          result.status = 'cancelled';
          break;
        }

        const step = scenario.steps[i];
        onProgress?.(i + 1, scenario.steps.length, step);

        const stepResult = await this.executeStep(step);
        result.stepResults.push(stepResult);

        if (stepResult.status === 'passed') {
          result.passedSteps++;
        } else if (stepResult.status === 'failed') {
          result.failedSteps++;
          result.status = 'failed'; // 하나라도 실패하면 전체 실패
        }

        // 어설션 결과가 있다면 추가
        if (stepResult.assertion) {
          result.assertionResults.push(stepResult.assertion);
        }

        // 실패한 스텝이 있으면 조기 종료 (설정 가능하게 만들 수 있음)
        if (stepResult.status === 'failed' && step.type === 'assert') {
          // 어설션 실패는 계속 진행하지만, 다른 실패는 중단할 수 있음
        }
      }

      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;

      // 결과에 따라 시나리오 상태 업데이트
      const finalStatus = result.status === 'cancelled' ? 'draft' : result.status;
      await StorageManager.updateScenarioStatus(scenarioId, finalStatus);
      
      // 실행 기록 업데이트
      await StorageManager.updateLastRun(scenarioId);

      return result;

    } catch (error) {
      result.status = 'failed';
      result.endTime = Date.now();
      result.duration = result.endTime - result.startTime;
      
      await StorageManager.updateScenarioStatus(scenarioId, 'failed');
      
      throw error;
    } finally {
      this.currentRun = null;
    }
  }

  /**
   * 실행 중인 테스트를 취소합니다
   */
  public cancelRun(): void {
    if (this.currentRun) {
      this.currentRun.cancelled = true;
    }
  }

  /**
   * 개별 스텝을 실행합니다
   */
  private async executeStep(step: TestStep): Promise<StepResult> {
    const startTime = Date.now();
    const baseMeta = {
      stepId: step.id,
      stepType: step.type,
      selector: step.element?.selector,
      description: undefined, // storage.TestStep has no description
      assertType: step.assertion?.type as any
    } as Pick<StepResult, 'stepId' | 'stepType' | 'selector' | 'description' | 'assertType'>;
    
    try {
      switch (step.type) {
        case 'assert':
          return await this.executeAssertStep(step, startTime, baseMeta);
        
        case 'click':
          return await this.executeClickStep(step, startTime, baseMeta);
        
        case 'input':
          return await this.executeInputStep(step, startTime, baseMeta);
        
        case 'wait':
          return await this.executeWaitStep(step, startTime, baseMeta);
        
        default:
          return {
            ...baseMeta,
            status: 'skipped',
            duration: Date.now() - startTime,
            error: `지원하지 않는 스텝 타입: ${step.type}`
          };
      }
    } catch (error) {
      return {
        ...baseMeta,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 클릭 스텝 실행
   */
  private async executeClickStep(step: TestStep, startTime: number, meta: any): Promise<StepResult> {
    if (!step.element?.selector) {
      return {
        ...meta,
        status: 'failed',
        duration: Date.now() - startTime,
        error: '셀렉터 정보가 없습니다'
      };
    }

    try {
      // content script에 클릭 요청
      const response = await this.sendMessageToContentScript({
        type: 'CLICK_ELEMENT',
        selector: step.element.selector
      });

      if (!response.ok) {
        return {
          ...meta,
          status: 'failed',
          duration: Date.now() - startTime,
          error: response.error || '클릭 실행 중 오류가 발생했습니다'
        };
      }

      return {
        ...meta,
        status: 'passed',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        ...meta,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 입력 스텝 실행
   */
  private async executeInputStep(step: TestStep, startTime: number, meta: any): Promise<StepResult> {
    if (!step.element?.selector) {
      return {
        ...meta,
        status: 'failed',
        duration: Date.now() - startTime,
        error: '셀렉터 정보가 없습니다'
      };
    }

    if (!step.value) {
      return {
        ...meta,
        status: 'failed',
        duration: Date.now() - startTime,
        error: '입력값이 없습니다'
      };
    }

    try {
      // content script에 입력 요청
      const response = await this.sendMessageToContentScript({
        type: 'INPUT_ELEMENT',
        selector: step.element.selector,
        value: step.value
      });

      if (!response.ok) {
        return {
          ...meta,
          status: 'failed',
          duration: Date.now() - startTime,
          error: response.error || '입력 실행 중 오류가 발생했습니다'
        };
      }

      return {
        ...meta,
        status: 'passed',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        ...meta,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 검증 스텝 실행
   */
  private async executeAssertStep(step: TestStep, startTime: number, meta: any): Promise<StepResult> {
    if (!step.element?.selector) {
      return {
        ...meta,
        status: 'failed',
        duration: Date.now() - startTime,
        error: '셀렉터 정보가 없습니다'
      };
    }

    if (!step.assertion) {
      return {
        ...meta,
        status: 'failed',
        duration: Date.now() - startTime,
        error: '검증 설정이 없습니다'
      };
    }

    try {
      // storage.ts의 assertion 형식을 content script용으로 변환
      const assertionConfig = {
        type: step.assertion.type,
        expected: step.assertion.expected
      };

      // content script에 검증 요청
      const response = await this.sendMessageToContentScript({
        type: 'ASSERT_ELEMENT',
        selector: step.element.selector,
        assertion: assertionConfig
      });

      if (!response.ok) {
        return {
          ...meta,
          status: 'failed',
          duration: Date.now() - startTime,
          error: response.error || '검증 실행 중 오류가 발생했습니다'
        };
      }

      const assertionResult: AssertionResult = {
        success: response.success,
        message: response.message,
        actual: response.actual,
        expected: step.assertion.expected,
        timestamp: Date.now(),
        duration: Date.now() - startTime
      };

      return {
        ...meta,
        status: response.success ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        assertion: assertionResult
      };
    } catch (error) {
      return {
        ...meta,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 대기 스텝 실행
   */
  private async executeWaitStep(step: TestStep, startTime: number, meta: any): Promise<StepResult> {
    const waitTime = parseInt(step.value || '1000', 10);
    await this.sleep(waitTime);

    return {
      ...meta,
      status: 'passed',
      duration: Date.now() - startTime
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * content script에 메시지 전송
   */
  private async sendMessageToContentScript(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          reject(new Error('활성 탭을 찾을 수 없습니다'));
          return;
        }

        const activeTab = tabs[0];
        if (!activeTab.id) {
          reject(new Error('탭 ID를 찾을 수 없습니다'));
          return;
        }

        chrome.tabs.sendMessage(activeTab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });
    });
  }
}

// 유틸리티 함수들
export function formatTestDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function getTestStatusBadge(status: 'passed' | 'failed' | 'cancelled' | 'running'): {
  variant: 'default' | 'destructive' | 'secondary' | 'outline';
  text: string;
  color: string;
} {
  switch (status) {
    case 'passed':
      return { variant: 'default', text: '통과', color: 'green' };
    case 'failed':
      return { variant: 'destructive', text: '실패', color: 'red' };
    case 'cancelled':
      return { variant: 'secondary', text: '취소', color: 'gray' };
    case 'running':
      return { variant: 'outline', text: '실행중', color: 'blue' };
  }
} 