// Email template system for investor communications
// Pure functions — no server actions, no database, no side effects

export type TemplateType = 'capital_call' | 'distribution' | 'quarterly_update' | 'custom'

export interface TemplateVariables {
  fundName: string
  investorName: string
  [key: string]: string
}

interface RenderedEmail {
  subject: string
  html: string
}

interface TemplateMetadata {
  type: TemplateType
  label: string
  description: string
}

/**
 * Escape HTML special characters to prevent XSS in email content.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Wrap template-specific content in the standard BlackGem email layout.
 */
function wrapInLayout(investorName: string, bodyContent: string): string {
  return `<div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #11141D; padding: 32px; text-align: center;">
        <h1 style="color: #F8FAFC; font-size: 24px; margin: 0;">
            <span style="font-weight: 400;">Black</span><span style="font-weight: 600;">Gem</span>
        </h1>
    </div>
    <div style="padding: 32px; background-color: #F9FAFB;">
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
            Dear ${investorName},
        </p>
        ${bodyContent}
    </div>
    <div style="padding: 16px 32px; background-color: #F1F5F9; text-align: center;">
        <p style="color: #94A3B8; font-size: 12px; margin: 0;">
            BlackGem — Institutional excellence from day one
        </p>
    </div>
</div>`
}

function renderCapitalCall(vars: Record<string, string>): RenderedEmail {
  const fundName = escapeHtml(vars.fundName)
  const investorName = escapeHtml(vars.investorName)
  const callAmount = escapeHtml(vars.callAmount || '')
  const dueDate = escapeHtml(vars.dueDate || '')
  const bankInstructions = vars.bankInstructions ? escapeHtml(vars.bankInstructions) : null

  const bankSection = bankInstructions
    ? `<div style="background-color: #F1F5F9; border-radius: 6px; padding: 16px; margin-top: 24px;">
            <p style="color: #475569; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Wire Instructions</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${bankInstructions}</p>
        </div>`
    : ''

  const body = `<p style="color: #475569; font-size: 15px; line-height: 1.6;">
            This notice serves to inform you of a capital call for <strong>${fundName}</strong>.
        </p>
        <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="color: #94A3B8; font-size: 14px; padding: 8px 0;">Call Amount</td>
                    <td style="color: #11141D; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0; font-family: 'SF Mono', 'Fira Code', monospace;">${callAmount}</td>
                </tr>
                <tr>
                    <td style="color: #94A3B8; font-size: 14px; padding: 8px 0;">Due Date</td>
                    <td style="color: #11141D; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">${dueDate}</td>
                </tr>
            </table>
        </div>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            Please ensure that funds are transferred by the due date indicated above. If you have questions regarding this capital call, contact the fund administrator directly.
        </p>
        ${bankSection}`

  return {
    subject: `Capital Call Notice \u2014 ${fundName}`,
    html: wrapInLayout(investorName, body),
  }
}

function renderDistribution(vars: Record<string, string>): RenderedEmail {
  const fundName = escapeHtml(vars.fundName)
  const investorName = escapeHtml(vars.investorName)
  const distributionAmount = escapeHtml(vars.distributionAmount || '')
  const paymentDate = escapeHtml(vars.paymentDate || '')
  const distributionType = vars.distributionType ? escapeHtml(vars.distributionType) : null

  const typeRow = distributionType
    ? `<tr>
                    <td style="color: #94A3B8; font-size: 14px; padding: 8px 0;">Type</td>
                    <td style="color: #11141D; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">${distributionType}</td>
                </tr>`
    : ''

  const body = `<p style="color: #475569; font-size: 15px; line-height: 1.6;">
            We are pleased to inform you of an upcoming distribution from <strong>${fundName}</strong>.
        </p>
        <div style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="color: #94A3B8; font-size: 14px; padding: 8px 0;">Distribution Amount</td>
                    <td style="color: #11141D; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0; font-family: 'SF Mono', 'Fira Code', monospace;">${distributionAmount}</td>
                </tr>
                <tr>
                    <td style="color: #94A3B8; font-size: 14px; padding: 8px 0;">Payment Date</td>
                    <td style="color: #11141D; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">${paymentDate}</td>
                </tr>
                ${typeRow}
            </table>
        </div>
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            Funds will be transferred to your designated bank account on or before the payment date indicated above. Please review your account details to ensure timely receipt.
        </p>`

  return {
    subject: `Distribution Notice \u2014 ${fundName}`,
    html: wrapInLayout(investorName, body),
  }
}

function renderQuarterlyUpdate(vars: Record<string, string>): RenderedEmail {
  const fundName = escapeHtml(vars.fundName)
  const investorName = escapeHtml(vars.investorName)
  const quarter = escapeHtml(vars.quarter || '')
  const year = escapeHtml(vars.year || '')
  const portalUrl = vars.portalUrl || null

  const portalSection = portalUrl
    ? `<div style="text-align: center; margin: 32px 0;">
            <a href="${escapeHtml(portalUrl)}"
               style="display: inline-block; background-color: #3E5CFF; color: white; padding: 12px 32px;
                      text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px;">
                View Quarterly Update
            </a>
        </div>`
    : ''

  const body = `<p style="color: #475569; font-size: 15px; line-height: 1.6;">
            The Q${quarter} ${year} quarterly update for <strong>${fundName}</strong> is now available for your review.
        </p>
        ${portalSection}
        <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            This report includes fund performance, portfolio updates, and key developments for the quarter. Please log in to the investor portal to access the full report and supporting documentation.
        </p>`

  return {
    subject: `Q${quarter} ${year} Quarterly Update \u2014 ${fundName}`,
    html: wrapInLayout(investorName, body),
  }
}

function renderCustom(vars: Record<string, string>): RenderedEmail {
  const fundName = escapeHtml(vars.fundName)
  const investorName = escapeHtml(vars.investorName)
  const customSubject = escapeHtml(vars.customSubject || '')
  const customBody = escapeHtml(vars.customBody || '')

  const body = `<div style="color: #11141D; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${customBody}</div>
        <p style="color: #94A3B8; font-size: 13px; line-height: 1.5; margin-top: 24px;">
            Sent on behalf of ${fundName}.
        </p>`

  return {
    subject: customSubject,
    html: wrapInLayout(investorName, body),
  }
}

/**
 * Render a typed email template with the given variables.
 * All variable values are HTML-escaped to prevent XSS.
 */
export function renderEmailTemplate(
  type: TemplateType,
  variables: TemplateVariables
): RenderedEmail {
  switch (type) {
    case 'capital_call':
      return renderCapitalCall(variables)
    case 'distribution':
      return renderDistribution(variables)
    case 'quarterly_update':
      return renderQuarterlyUpdate(variables)
    case 'custom':
      return renderCustom(variables)
  }
}

/**
 * Returns metadata about all available email templates for UI consumption.
 */
export function getAvailableTemplates(): TemplateMetadata[] {
  return [
    {
      type: 'capital_call',
      label: 'Capital Call Notice',
      description: 'Formal notice requesting investors to fund their committed capital',
    },
    {
      type: 'distribution',
      label: 'Distribution Notice',
      description: 'Notification of proceeds being returned to investors',
    },
    {
      type: 'quarterly_update',
      label: 'Quarterly Update',
      description: 'Notification that the quarterly performance report is available',
    },
    {
      type: 'custom',
      label: 'Custom Message',
      description: 'Free-form communication to investors with custom subject and body',
    },
  ]
}
