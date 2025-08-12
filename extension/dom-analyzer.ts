export interface SelectorStrategy {
  score: number
  selector: string
  available: boolean
}

export interface DOMNodeData {
  id: string
  tag: string
  role?: string
  accessibleName?: string
  attributes: Record<string, string>
  selectorStrategies: {
    accessibility: SelectorStrategy
    name: SelectorStrategy
    testid: SelectorStrategy
    css: SelectorStrategy
  }
  hasAccessibilityIssues?: boolean
  labelingImprovements?: string[]
}

export interface AccessibilityAnalysis {
  overallScore: number
  recommendations: string[]
  criticalIssues: string[]
  improvements: string[]
}

export class DOMAnalyzer {
  static analyzeElement(element: Element): DOMNodeData {
    const tag = element.tagName?.toLowerCase() || 'unknown'
    const role = this.getRole(element)
    const accessibleName = this.getAccessibleName(element)
    const attributes = this.getAttributes(element)
    
    const selectorStrategies = this.generateSelectorStrategies(element, role, accessibleName)
    const analysis = this.analyzeAccessibility(element, role, accessibleName, selectorStrategies)
    
    return {
      id: this.generateId(element),
      tag,
      role,
      accessibleName,
      attributes,
      selectorStrategies,
      hasAccessibilityIssues: analysis.overallScore < 70,
      labelingImprovements: analysis.improvements
    }
  }

  private static getRole(element: Element): string | undefined {
    // Explicit role attribute
    const explicitRole = element.getAttribute('role')
    if (explicitRole) return explicitRole

    // Implicit roles based on tag
    const tag = element.tagName?.toLowerCase() || 'unknown'
    const implicitRoles: Record<string, string | undefined> = {
      'button': 'button',
      'a': element.hasAttribute('href') ? 'link' : undefined,
      'input': this.getInputRole(element as HTMLInputElement),
      'select': 'combobox',
      'textarea': 'textbox',
      'main': 'main',
      'nav': 'navigation',
      'header': 'banner',
      'footer': 'contentinfo',
      'aside': 'complementary',
      'section': 'region',
      'article': 'article',
      'h1': 'heading',
      'h2': 'heading',
      'h3': 'heading',
      'h4': 'heading',
      'h5': 'heading',
      'h6': 'heading'
    }

    return implicitRoles[tag]
  }

  private static getInputRole(input: HTMLInputElement): string {
    const type = input.type?.toLowerCase() || 'text'
    const inputRoles: Record<string, string> = {
      'button': 'button',
      'submit': 'button',
      'reset': 'button',
      'checkbox': 'checkbox',
      'radio': 'radio',
      'range': 'slider',
      'search': 'searchbox'
    }
    return inputRoles[type] || 'textbox'
  }

  private static getAccessibleName(element: Element): string | undefined {
    // aria-label
    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel?.trim()) return ariaLabel.trim()

    // aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby')
    if (labelledBy) {
      const names = labelledBy.split(/\s+/)
        .map(id => document.getElementById(id)?.textContent?.trim())
        .filter(Boolean)
        .join(' ')
      if (names) return names
    }

    // Associated label
    if (element.tagName?.toLowerCase() === 'input') {
      const id = element.getAttribute('id')
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`)
        if (label?.textContent?.trim()) {
          return label.textContent.trim()
        }
      }
    }

    // Alt text for images
    if (element.tagName?.toLowerCase() === 'img') {
      const alt = element.getAttribute('alt')
      if (alt !== null) return alt // Even empty alt is intentional
    }

    // Text content for buttons, links, etc.
    const textContent = element.textContent?.trim()
    if (textContent && textContent.length < 100) {
      return textContent
    }

    return undefined
  }

  private static getAttributes(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {}
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i]
      attrs[attr.name] = attr.value
    }
    return attrs
  }

  private static generateSelectorStrategies(
    element: Element, 
    role?: string, 
    accessibleName?: string
  ): DOMNodeData['selectorStrategies'] {
    const strategies = {
      accessibility: { score: 0, selector: '', available: false },
      name: { score: 0, selector: '', available: false },
      testid: { score: 0, selector: '', available: false },
      css: { score: 0, selector: '', available: false }
    }

    // Accessibility strategy (role-based)
    if (role) {
      strategies.accessibility = {
        score: 90,
        selector: `[role="${role}"]`,
        available: true
      }
    }

    // Name strategy (accessible name)
    if (accessibleName) {
      const nameSelector = element.getAttribute('aria-label') 
        ? `[aria-label="${accessibleName}"]`
        : `[aria-labelledby*="${element.getAttribute('aria-labelledby')}"]`
      
      strategies.name = {
        score: 85,
        selector: nameSelector,
        available: true
      }
    }

    // Test ID strategy
    const testId = element.getAttribute('data-testid')
    if (testId) {
      strategies.testid = {
        score: 95,
        selector: `[data-testid="${testId}"]`,
        available: true
      }
    }

    // CSS strategy (fallback)
    const cssSelector = this.generateCSSSelector(element)
    strategies.css = {
      score: Math.max(30, 70 - cssSelector.split(' ').length * 10), // Penalty for complexity
      selector: cssSelector,
      available: true
    }

    return strategies
  }

  private static generateCSSSelector(element: Element): string {
    const parts: string[] = []
    let current: Element | null = element

    while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
      let selector = current.nodeName?.toLowerCase() || 'unknown'

      // Prefer ID
      if (current.id) {
        selector += `#${CSS.escape(current.id)}`
        parts.unshift(selector)
        break
      }

      // Add nth-of-type for uniqueness
      const siblings = Array.from(current.parentElement?.children || [])
        .filter(sibling => sibling.nodeName === current!.nodeName)
      
      if (siblings.length > 1 && current) {
        const index = siblings.indexOf(current) + 1
        selector += `:nth-of-type(${index})`
      }

      parts.unshift(selector)
      current = current.parentElement
    }

    return parts.join(' > ')
  }

  private static analyzeAccessibility(
    element: Element,
    role?: string,
    accessibleName?: string,
    strategies?: DOMNodeData['selectorStrategies']
  ): AccessibilityAnalysis {
    const issues: string[] = []
    const improvements: string[] = []
    let score = 100

    // Check for role
    if (!role) {
      issues.push('역할(role)이 명시되지 않음')
      improvements.push('적절한 role 속성 추가')
      score -= 20
    }

    // Check for accessible name
    if (!accessibleName && this.needsAccessibleName(element)) {
      issues.push('접근 가능한 이름이 없음')
      improvements.push('aria-label 또는 연결된 label 추가')
      score -= 25
    }

    // Check for test ID
    if (!element.getAttribute('data-testid')) {
      improvements.push('data-testid 속성 추가 (테스트 안정성)')
      score -= 5
    }

    // Check interactive elements
    if (this.isInteractive(element)) {
      const htmlElement = element as HTMLElement
      if (!element.hasAttribute('tabindex') && htmlElement.tabIndex < 0) {
        issues.push('키보드 접근이 불가능')
        improvements.push('tabindex 속성 확인')
        score -= 15
      }
    }

    return {
      overallScore: Math.max(0, score),
      recommendations: improvements,
      criticalIssues: issues.filter(issue => 
        issue.includes('접근 가능한 이름') || issue.includes('키보드 접근')
      ),
      improvements
    }
  }

  private static needsAccessibleName(element: Element): boolean {
    const tag = element.tagName?.toLowerCase() || 'unknown'
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea']
    return interactiveTags.includes(tag) || element.hasAttribute('role')
  }

  private static isInteractive(element: Element): boolean {
    const tag = element.tagName?.toLowerCase() || 'unknown'
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea']
    return interactiveTags.includes(tag) || 
           element.hasAttribute('onclick') || 
           element.hasAttribute('role') && 
           ['button', 'link', 'menuitem', 'tab'].includes(element.getAttribute('role')!)
  }

  private static generateId(element: Element): string {
    return element.getAttribute('data-testid') || 
           element.getAttribute('id') || 
           `${element.tagName?.toLowerCase() || 'unknown'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
} 