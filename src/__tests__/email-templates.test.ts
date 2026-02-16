import { describe, it, expect } from 'vitest'
import {
  renderEmailTemplate,
  escapeHtml,
  getAvailableTemplates,
} from '@/lib/email-templates'
import type { TemplateType, TemplateVariables } from '@/lib/email-templates'

// ============================================================================
// escapeHtml
// ============================================================================

describe('escapeHtml', () => {
  it('escapes & < > " \' characters', () => {
    expect(escapeHtml('&')).toBe('&amp;')
    expect(escapeHtml('<')).toBe('&lt;')
    expect(escapeHtml('>')).toBe('&gt;')
    expect(escapeHtml('"')).toBe('&quot;')
    expect(escapeHtml("'")).toBe('&#39;')
  })

  it('escapes multiple special characters in one string', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('passes through safe strings unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
    expect(escapeHtml('Fund Alpha 2024')).toBe('Fund Alpha 2024')
    expect(escapeHtml('$1,250,000.00')).toBe('$1,250,000.00')
  })

  it('handles strings with only special characters', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#39;')
  })
})

// ============================================================================
// renderEmailTemplate — capital_call
// ============================================================================

describe('renderEmailTemplate', () => {
  describe('capital_call', () => {
    const baseVars: TemplateVariables = {
      fundName: 'Evergreen Partners Fund I',
      investorName: 'John Smith',
      callAmount: '$250,000',
      dueDate: 'March 15, 2026',
    }

    it('renders capital call notice with correct subject', () => {
      const result = renderEmailTemplate('capital_call', baseVars)
      expect(result.subject).toBe('Capital Call Notice \u2014 Evergreen Partners Fund I')
    })

    it('includes call amount and due date in body', () => {
      const result = renderEmailTemplate('capital_call', baseVars)
      expect(result.html).toContain('$250,000')
      expect(result.html).toContain('March 15, 2026')
    })

    it('includes the fund name in the body', () => {
      const result = renderEmailTemplate('capital_call', baseVars)
      expect(result.html).toContain('Evergreen Partners Fund I')
    })

    it('addresses the investor by name', () => {
      const result = renderEmailTemplate('capital_call', baseVars)
      expect(result.html).toContain('Dear John Smith,')
    })

    it('escapes HTML in variable values', () => {
      const xssVars: TemplateVariables = {
        fundName: '<script>alert("xss")</script>',
        investorName: '<b>Hacker</b>',
        callAmount: '$100',
        dueDate: '2026-01-01',
      }
      const result = renderEmailTemplate('capital_call', xssVars)
      expect(result.html).not.toContain('<script>')
      expect(result.html).not.toContain('<b>Hacker</b>')
      expect(result.html).toContain('&lt;script&gt;')
      expect(result.html).toContain('&lt;b&gt;Hacker&lt;/b&gt;')
      // Subject should also be escaped
      expect(result.subject).toContain('&lt;script&gt;')
    })

    it('includes bank instructions when provided', () => {
      const varsWithBank: TemplateVariables = {
        ...baseVars,
        bankInstructions: 'Chase Bank\nRouting: 021000021\nAccount: 123456789',
      }
      const result = renderEmailTemplate('capital_call', varsWithBank)
      expect(result.html).toContain('Wire Instructions')
      expect(result.html).toContain('Chase Bank')
    })

    it('omits bank instructions section when not provided', () => {
      const result = renderEmailTemplate('capital_call', baseVars)
      expect(result.html).not.toContain('Wire Instructions')
    })

    it('includes standard BlackGem layout elements', () => {
      const result = renderEmailTemplate('capital_call', baseVars)
      expect(result.html).toContain('BlackGem')
      expect(result.html).toContain('#11141D')
      expect(result.html).toContain('Institutional excellence from day one')
    })
  })

  // ==========================================================================
  // distribution
  // ==========================================================================

  describe('distribution', () => {
    const baseVars: TemplateVariables = {
      fundName: 'Meridian Growth Fund II',
      investorName: 'Jane Doe',
      distributionAmount: '$500,000',
      paymentDate: 'April 1, 2026',
    }

    it('renders distribution notice with correct subject', () => {
      const result = renderEmailTemplate('distribution', baseVars)
      expect(result.subject).toBe('Distribution Notice \u2014 Meridian Growth Fund II')
    })

    it('includes distribution amount and payment date', () => {
      const result = renderEmailTemplate('distribution', baseVars)
      expect(result.html).toContain('$500,000')
      expect(result.html).toContain('April 1, 2026')
    })

    it('addresses the investor by name', () => {
      const result = renderEmailTemplate('distribution', baseVars)
      expect(result.html).toContain('Dear Jane Doe,')
    })

    it('includes distribution type when provided', () => {
      const varsWithType: TemplateVariables = {
        ...baseVars,
        distributionType: 'Return of Capital',
      }
      const result = renderEmailTemplate('distribution', varsWithType)
      expect(result.html).toContain('Return of Capital')
      expect(result.html).toContain('Type')
    })

    it('omits distribution type row when not provided', () => {
      const result = renderEmailTemplate('distribution', baseVars)
      // The "Type" label row should not appear
      const typeOccurrences = (result.html.match(/Type<\/td>/g) || []).length
      expect(typeOccurrences).toBe(0)
    })

    it('includes standard BlackGem layout elements', () => {
      const result = renderEmailTemplate('distribution', baseVars)
      expect(result.html).toContain('BlackGem')
      expect(result.html).toContain('#F1F5F9')
      expect(result.html).toContain('Institutional excellence from day one')
    })
  })

  // ==========================================================================
  // quarterly_update
  // ==========================================================================

  describe('quarterly_update', () => {
    const baseVars: TemplateVariables = {
      fundName: 'Summit Capital Partners',
      investorName: 'Robert Chen',
      quarter: '3',
      year: '2025',
    }

    it('renders quarterly update with Q{n} {year} in subject', () => {
      const result = renderEmailTemplate('quarterly_update', baseVars)
      expect(result.subject).toBe('Q3 2025 Quarterly Update \u2014 Summit Capital Partners')
    })

    it('includes quarter and year in body', () => {
      const result = renderEmailTemplate('quarterly_update', baseVars)
      expect(result.html).toContain('Q3 2025')
      expect(result.html).toContain('Summit Capital Partners')
    })

    it('includes portal link when portalUrl provided', () => {
      const varsWithUrl: TemplateVariables = {
        ...baseVars,
        portalUrl: 'https://portal.blackgem.app/fund/abc123',
      }
      const result = renderEmailTemplate('quarterly_update', varsWithUrl)
      expect(result.html).toContain('https://portal.blackgem.app/fund/abc123')
      expect(result.html).toContain('View Quarterly Update')
      expect(result.html).toContain('#3E5CFF')
    })

    it('omits portal link when portalUrl not provided', () => {
      const result = renderEmailTemplate('quarterly_update', baseVars)
      expect(result.html).not.toContain('View Quarterly Update')
    })

    it('addresses the investor by name', () => {
      const result = renderEmailTemplate('quarterly_update', baseVars)
      expect(result.html).toContain('Dear Robert Chen,')
    })
  })

  // ==========================================================================
  // custom
  // ==========================================================================

  describe('custom', () => {
    const baseVars: TemplateVariables = {
      fundName: 'Atlas Venture Fund',
      investorName: 'Maria Garcia',
      customSubject: 'Annual Meeting Reminder',
      customBody: 'The annual meeting will be held on June 15, 2026 at our offices.',
    }

    it('uses customSubject for subject line', () => {
      const result = renderEmailTemplate('custom', baseVars)
      expect(result.subject).toBe('Annual Meeting Reminder')
    })

    it('includes customBody in email body', () => {
      const result = renderEmailTemplate('custom', baseVars)
      expect(result.html).toContain(
        'The annual meeting will be held on June 15, 2026 at our offices.'
      )
    })

    it('includes fund name reference in footer section', () => {
      const result = renderEmailTemplate('custom', baseVars)
      expect(result.html).toContain('Atlas Venture Fund')
    })

    it('addresses the investor by name', () => {
      const result = renderEmailTemplate('custom', baseVars)
      expect(result.html).toContain('Dear Maria Garcia,')
    })

    it('includes standard BlackGem layout elements', () => {
      const result = renderEmailTemplate('custom', baseVars)
      expect(result.html).toContain('BlackGem')
      expect(result.html).toContain('Institutional excellence from day one')
    })

    it('handles empty customSubject and customBody gracefully', () => {
      const emptyVars: TemplateVariables = {
        fundName: 'Test Fund',
        investorName: 'Test Investor',
        customSubject: '',
        customBody: '',
      }
      const result = renderEmailTemplate('custom', emptyVars)
      expect(result.subject).toBe('')
      expect(result.html).toContain('Dear Test Investor,')
    })
  })

  // ==========================================================================
  // Cross-cutting concerns
  // ==========================================================================

  describe('layout structure', () => {
    it('all templates include the BlackGem header', () => {
      const types: TemplateType[] = ['capital_call', 'distribution', 'quarterly_update', 'custom']
      const vars: TemplateVariables = {
        fundName: 'Test Fund',
        investorName: 'Test User',
        callAmount: '$100',
        dueDate: '2026-01-01',
        distributionAmount: '$100',
        paymentDate: '2026-01-01',
        quarter: '1',
        year: '2026',
        customSubject: 'Test',
        customBody: 'Test body',
      }

      for (const type of types) {
        const result = renderEmailTemplate(type, vars)
        expect(result.html).toContain('<span style="font-weight: 400;">Black</span>')
        expect(result.html).toContain('<span style="font-weight: 600;">Gem</span>')
      }
    })

    it('all templates include the footer', () => {
      const types: TemplateType[] = ['capital_call', 'distribution', 'quarterly_update', 'custom']
      const vars: TemplateVariables = {
        fundName: 'Test Fund',
        investorName: 'Test User',
        callAmount: '$100',
        dueDate: '2026-01-01',
        distributionAmount: '$100',
        paymentDate: '2026-01-01',
        quarter: '1',
        year: '2026',
        customSubject: 'Test',
        customBody: 'Test body',
      }

      for (const type of types) {
        const result = renderEmailTemplate(type, vars)
        expect(result.html).toContain('Institutional excellence from day one')
        expect(result.html).toContain('#F1F5F9')
      }
    })

    it('all templates use max-width 600px', () => {
      const result = renderEmailTemplate('capital_call', {
        fundName: 'Test',
        investorName: 'Test',
        callAmount: '$100',
        dueDate: '2026-01-01',
      })
      expect(result.html).toContain('max-width: 600px')
    })
  })
})

// ============================================================================
// getAvailableTemplates
// ============================================================================

describe('getAvailableTemplates', () => {
  it('returns all 4 template types', () => {
    const templates = getAvailableTemplates()
    expect(templates).toHaveLength(4)

    const types = templates.map((t) => t.type)
    expect(types).toContain('capital_call')
    expect(types).toContain('distribution')
    expect(types).toContain('quarterly_update')
    expect(types).toContain('custom')
  })

  it('each template has type, label, and description', () => {
    const templates = getAvailableTemplates()
    for (const template of templates) {
      expect(template.type).toBeTruthy()
      expect(template.label).toBeTruthy()
      expect(template.description).toBeTruthy()
      expect(typeof template.type).toBe('string')
      expect(typeof template.label).toBe('string')
      expect(typeof template.description).toBe('string')
    }
  })

  it('labels are human-readable (not snake_case)', () => {
    const templates = getAvailableTemplates()
    for (const template of templates) {
      expect(template.label).not.toContain('_')
    }
  })

  it('descriptions are non-empty sentences', () => {
    const templates = getAvailableTemplates()
    for (const template of templates) {
      expect(template.description.length).toBeGreaterThan(10)
    }
  })
})
