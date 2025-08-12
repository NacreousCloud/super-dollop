import { DOMAnalyzer } from './dom-analyzer'
import { StorageManager } from './storage'
import type { TestStep } from './storage'

export interface RecordedEvent {
  id: string
  type: 'click' | 'input' | 'navigate' | 'wait'
  timestamp: number
  target?: {
    selector: string
    role?: string
    name?: string
    tagName: string
  }
  value?: string
  url?: string
  coordinates?: { x: number; y: number }
}

export class EventRecorder {
  private static instance: EventRecorder | null = null
  private tabId: number | null = null
  private isRecording = false
  private events: RecordedEvent[] = []
  private currentScenarioId: string | null = null

  private constructor() {}

  static getInstance(): EventRecorder {
    if (!this.instance) {
      this.instance = new EventRecorder()
    }
    return this.instance
  }

  async startRecording(tabId: number, scenarioId?: string): Promise<void> {
    if (this.isRecording) {
      await this.stopRecording()
    }

    this.tabId = tabId
    this.isRecording = true
    this.events = []
    this.currentScenarioId = scenarioId || null

    try {
      // Enable Runtime domain for script execution
      await chrome.debugger.sendCommand({ tabId }, 'Runtime.enable')
      
      // Enable DOM domain for node inspection
      await chrome.debugger.sendCommand({ tabId }, 'DOM.enable')
      
      // Enable Page domain for navigation events
      await chrome.debugger.sendCommand({ tabId }, 'Page.enable')

      // Inject event listeners into the page
      await this.injectEventListeners(tabId)
      
      console.log('Event recording started for tab:', tabId)
    } catch (error) {
      console.error('Failed to start recording:', error)
      this.isRecording = false
      throw error
    }
  }

  async stopRecording(): Promise<RecordedEvent[]> {
    if (!this.isRecording || !this.tabId) {
      return this.events
    }

    try {
      // Remove event listeners
      await this.removeEventListeners(this.tabId)
      
      // Disable domains
      await chrome.debugger.sendCommand({ tabId: this.tabId }, 'Runtime.disable')
      await chrome.debugger.sendCommand({ tabId: this.tabId }, 'DOM.disable')
      await chrome.debugger.sendCommand({ tabId: this.tabId }, 'Page.disable')
      
      console.log('Event recording stopped. Recorded events:', this.events.length)
    } catch (error) {
      console.error('Error stopping recording:', error)
    } finally {
      this.isRecording = false
      this.tabId = null
    }

    return this.events
  }

  getRecordedEvents(): RecordedEvent[] {
    return [...this.events]
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  async saveEventsAsSteps(): Promise<void> {
    if (!this.currentScenarioId) {
      throw new Error('No current scenario to save events to')
    }

    for (const event of this.events) {
      const step: Omit<TestStep, 'id' | 'timestamp'> = {
        type: event.type,
        element: event.target ? {
          selector: event.target.selector,
          role: event.target.role,
          name: event.target.name
        } : undefined,
        value: event.value,
        url: event.url
      }

      await StorageManager.addStep(this.currentScenarioId, step)
    }
  }

  private async injectEventListeners(tabId: number): Promise<void> {
    const scriptSource = `
      (function() {
        if (window.__cakeRecorderInjected) return;
        window.__cakeRecorderInjected = true;
        
        const sendEvent = (eventData) => {
          // We'll send events through a custom event that content script can listen to
          window.dispatchEvent(new CustomEvent('__cakeRecorderEvent', { detail: eventData }));
        };

        const getElementInfo = (element) => {
          if (!element || element.nodeType !== Node.ELEMENT_NODE) return null;
          
          const rect = element.getBoundingClientRect();
          const selector = getSelector(element);
          
          return {
            selector,
            tagName: element.tagName?.toLowerCase() || 'unknown',
            role: element.getAttribute('role') || getImplicitRole(element),
            name: getAccessibleName(element),
            coordinates: {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            }
          };
        };

        const getSelector = (element) => {
          // Try data-testid first
          const testId = element.getAttribute('data-testid');
          if (testId) return \`[data-testid="\${testId}"]\`;
          
          // Try id
          if (element.id) return \`#\${element.id}\`;
          
          // Fallback to CSS path
          const parts = [];
          let current = element;
          while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
            let selector = current.nodeName?.toLowerCase() || 'unknown';
            if (current.id) {
              selector += \`#\${current.id}\`;
              parts.unshift(selector);
              break;
            }
            
            const siblings = Array.from(current.parentElement?.children || [])
              .filter(s => s.nodeName === current.nodeName);
            if (siblings.length > 1) {
              const index = siblings.indexOf(current) + 1;
              selector += \`:nth-of-type(\${index})\`;
            }
            
            parts.unshift(selector);
            current = current.parentElement;
          }
          return parts.join(' > ');
        };

        const getImplicitRole = (element) => {
          const tag = element.tagName?.toLowerCase() || 'unknown';
          const roleMap = {
            'button': 'button',
            'a': element.hasAttribute('href') ? 'link' : null,
            'input': getInputRole(element),
            'select': 'combobox',
            'textarea': 'textbox'
          };
          return roleMap[tag] || null;
        };

        const getInputRole = (input) => {
          const type = input.type?.toLowerCase() || 'text';
          const typeMap = {
            'button': 'button',
            'submit': 'button',
            'checkbox': 'checkbox',
            'radio': 'radio'
          };
          return typeMap[type] || 'textbox';
        };

        const getAccessibleName = (element) => {
          const ariaLabel = element.getAttribute('aria-label');
          if (ariaLabel) return ariaLabel.trim();
          
          const labelledBy = element.getAttribute('aria-labelledby');
          if (labelledBy) {
            const text = labelledBy.split(/\\s+/)
              .map(id => document.getElementById(id)?.textContent?.trim())
              .filter(Boolean)
              .join(' ');
            if (text) return text;
          }
          
          if (element.tagName?.toLowerCase() === 'input') {
            const id = element.getAttribute('id');
            if (id) {
              const label = document.querySelector(\`label[for="\${id}"]\`);
              if (label?.textContent?.trim()) {
                return label.textContent.trim();
              }
            }
          }
          
          const text = element.textContent?.trim();
          if (text && text.length < 100) return text;
          
          return null;
        };

        // Click events
        document.addEventListener('click', (e) => {
          const elementInfo = getElementInfo(e.target);
          if (elementInfo) {
            sendEvent({
              type: 'click',
              target: elementInfo,
              timestamp: Date.now()
            });
          }
        }, true);

        // Input events
        document.addEventListener('input', (e) => {
          const elementInfo = getElementInfo(e.target);
          if (elementInfo && e.target.value !== undefined) {
            sendEvent({
              type: 'input',
              target: elementInfo,
              value: e.target.value,
              timestamp: Date.now()
            });
          }
        }, true);

        // Navigation events (will be handled separately by Page domain)
        
        console.log('Cake event recorder injected');
      })();
    `;

    await chrome.debugger.sendCommand(
      { tabId },
      'Runtime.evaluate',
      { expression: scriptSource }
    )
  }

  private async removeEventListeners(tabId: number): Promise<void> {
    const scriptSource = `
      if (window.__cakeRecorderInjected) {
        window.__cakeRecorderInjected = false;
        // Event listeners will be removed when page refreshes or navigates
        console.log('Cake event recorder removed');
      }
    `;

    try {
      await chrome.debugger.sendCommand(
        { tabId },
        'Runtime.evaluate',
        { expression: scriptSource }
      )
    } catch (error) {
      // Ignore errors when removing listeners (page might have navigated)
      console.warn('Could not remove event listeners:', error)
    }
  }

  // This method should be called by content script when it receives custom events
  recordEvent(eventData: Partial<RecordedEvent>): void {
    if (!this.isRecording) return

    const event: RecordedEvent = {
      id: this.generateId(),
      type: eventData.type || 'click',
      timestamp: eventData.timestamp || Date.now(),
      target: eventData.target,
      value: eventData.value,
      url: eventData.url,
      coordinates: eventData.coordinates
    }

    this.events.push(event)
    console.log('Recorded event:', event)
  }

  private generateId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
} 