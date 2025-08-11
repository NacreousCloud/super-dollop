import type { DOMNodeData } from './dom-analyzer'

export interface TestStep {
  id: string
  type: 'click' | 'input' | 'assert' | 'navigate' | 'wait'
  timestamp: number
  element?: {
    selector: string
    role?: string
    name?: string
    analysis?: DOMNodeData
  }
  value?: string // For input actions
  assertion?: {
    type: 'visible' | 'hidden' | 'text' | 'accessible'
    expected: string
  }
  url?: string // For navigation
}

export interface TestScenario {
  id: string
  name: string
  description?: string
  steps: TestStep[]
  tags: string[]
  createdAt: number
  updatedAt: number
  status: 'draft' | 'ready' | 'running' | 'passed' | 'failed'
  lastRun?: number
  runCount: number
}

export interface StorageData {
  scenarios: TestScenario[]
  settings: {
    autoSave: boolean
    highlightElements: boolean
    showAccessibilityWarnings: boolean
    preferredSelector: 'testid' | 'accessibility' | 'name' | 'css'
  }
  recentElements: DOMNodeData[]
}

export class StorageManager {
  private static readonly STORAGE_KEY = 'cake-e2e-data'
  private static readonly MAX_RECENT_ELEMENTS = 10

  static async load(): Promise<StorageData> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY)
      const data = result[this.STORAGE_KEY]
      
      return {
        scenarios: data?.scenarios || [],
        settings: {
          autoSave: data?.settings?.autoSave ?? true,
          highlightElements: data?.settings?.highlightElements ?? true,
          showAccessibilityWarnings: data?.settings?.showAccessibilityWarnings ?? true,
          preferredSelector: data?.settings?.preferredSelector || 'testid'
        },
        recentElements: data?.recentElements || []
      }
    } catch (error) {
      console.error('Failed to load storage data:', error)
      return this.getDefaultData()
    }
  }

  static async save(data: Partial<StorageData>): Promise<void> {
    try {
      const current = await this.load()
      const updated = {
        ...current,
        ...data,
        settings: { ...current.settings, ...data.settings }
      }
      
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: updated
      })
    } catch (error) {
      console.error('Failed to save storage data:', error)
      throw error
    }
  }

  static async addScenario(scenario: Omit<TestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestScenario> {
    const newScenario: TestScenario = {
      ...scenario,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const data = await this.load()
    data.scenarios.push(newScenario)
    await this.save({ scenarios: data.scenarios })
    
    return newScenario
  }

  static async updateScenario(id: string, updates: Partial<TestScenario>): Promise<void> {
    const data = await this.load()
    const index = data.scenarios.findIndex(s => s.id === id)
    
    if (index === -1) {
      throw new Error(`Scenario with id ${id} not found`)
    }

    data.scenarios[index] = {
      ...data.scenarios[index],
      ...updates,
      updatedAt: Date.now()
    }

    await this.save({ scenarios: data.scenarios })
  }

  static async deleteScenario(id: string): Promise<void> {
    const data = await this.load()
    data.scenarios = data.scenarios.filter(s => s.id !== id)
    await this.save({ scenarios: data.scenarios })
  }

  static async getScenario(id: string): Promise<TestScenario | null> {
    const data = await this.load()
    return data.scenarios.find(s => s.id === id) || null
  }

  static async updateScenarioStatus(id: string, status: TestScenario['status']): Promise<void> {
    await this.updateScenario(id, { status })
  }

  static async updateLastRun(id: string): Promise<void> {
    const data = await this.load()
    const scenario = data.scenarios.find(s => s.id === id)
    
    if (scenario) {
      scenario.lastRun = Date.now()
      scenario.runCount = (scenario.runCount || 0) + 1
      await this.save({ scenarios: data.scenarios })
    }
  }

  static async addStep(scenarioId: string, step: Omit<TestStep, 'id' | 'timestamp'>): Promise<void> {
    const newStep: TestStep = {
      ...step,
      id: this.generateId(),
      timestamp: Date.now()
    }

    const data = await this.load()
    const scenario = data.scenarios.find(s => s.id === scenarioId)
    
    if (!scenario) {
      throw new Error(`Scenario with id ${scenarioId} not found`)
    }

    scenario.steps.push(newStep)
    scenario.updatedAt = Date.now()
    
    await this.save({ scenarios: data.scenarios })
  }

  static async addRecentElement(element: DOMNodeData): Promise<void> {
    const data = await this.load()
    
    // Remove if already exists
    data.recentElements = data.recentElements.filter(e => e.id !== element.id)
    
    // Add to beginning
    data.recentElements.unshift(element)
    
    // Keep only recent ones
    if (data.recentElements.length > this.MAX_RECENT_ELEMENTS) {
      data.recentElements = data.recentElements.slice(0, this.MAX_RECENT_ELEMENTS)
    }
    
    await this.save({ recentElements: data.recentElements })
  }

  static async updateSettings(settings: Partial<StorageData['settings']>): Promise<void> {
    const current = await this.load()
    const updatedSettings = { ...current.settings, ...settings }
    await this.save({ settings: updatedSettings })
  }

  static async exportScenarios(): Promise<string> {
    const data = await this.load()
    return JSON.stringify({
      scenarios: data.scenarios,
      exportedAt: Date.now(),
      version: '1.0'
    }, null, 2)
  }

  static async importScenarios(jsonData: string): Promise<void> {
    try {
      const imported = JSON.parse(jsonData)
      
      if (!imported.scenarios || !Array.isArray(imported.scenarios)) {
        throw new Error('Invalid import data format')
      }

      const data = await this.load()
      
      // Add imported scenarios with new IDs to avoid conflicts
      const newScenarios = imported.scenarios.map((scenario: any) => ({
        ...scenario,
        id: this.generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }))

      data.scenarios.push(...newScenarios)
      await this.save({ scenarios: data.scenarios })
    } catch (error) {
      console.error('Failed to import scenarios:', error)
      throw error
    }
  }

  static async clearAll(): Promise<void> {
    await chrome.storage.local.remove(this.STORAGE_KEY)
  }

  private static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static getDefaultData(): StorageData {
    return {
      scenarios: [],
      settings: {
        autoSave: true,
        highlightElements: true,
        showAccessibilityWarnings: true,
        preferredSelector: 'testid'
      },
      recentElements: []
    }
  }
} 