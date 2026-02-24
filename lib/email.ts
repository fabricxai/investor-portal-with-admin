import { Resend } from 'resend'

const LOGO_URL = 'https://devppcpvuwneduuibygh.supabase.co/storage/v1/object/public/investor-portal/logo/fabricxai-logo-dark.png'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

function brandedEmailHtml(params: {
  body: string
  ctaText?: string
  ctaUrl?: string
}): string {
  const { body, ctaText, ctaUrl } = params

  const ctaBlock = ctaText && ctaUrl ? `<tr>
  <td align="center" style="padding:8px 28px 32px;">
    <a href="${ctaUrl}" style="display:inline-block;background:#57ACAF;color:#07111E;font-family:Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.5px;padding:13px 32px;border-radius:10px;text-decoration:none;">${ctaText}</a>
  </td>
</tr>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{box-sizing:border-box;}body{margin:0;padding:0;background:#07111E;}a{color:#57ACAF;text-decoration:none;}</style>
</head>
<body style="margin:0;padding:0;background:#07111E;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#07111E;padding:32px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0D1B2A;border:1px solid #1C3042;border-radius:14px;overflow:hidden;max-width:600px;">

<!-- TOP ACCENT BAR -->
<tr><td style="height:4px;background:linear-gradient(90deg,#57ACAF 0%,#EAB308 60%,#57ACAF 100%);font-size:0;">&nbsp;</td></tr>

<!-- HEADER WITH LOGO -->
<tr>
  <td style="background:#07111E;padding:20px 28px;border-bottom:1px solid #1C3042;">
    <img src="${LOGO_URL}" alt="fabricXai" height="22" style="display:block;height:22px;width:auto;" />
  </td>
</tr>

<!-- BODY -->
<tr><td style="padding:32px 28px 16px;">${body}</td></tr>

<!-- CTA -->
${ctaBlock}

<!-- FOOTER -->
<tr>
  <td style="background:#07111E;border-top:1px solid #1C3042;padding:16px 28px;">
    <p style="margin:0;font-size:10px;color:#3A5060;font-family:Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;">fabricXai &middot; SocioFi Limited &middot; Dhaka, Bangladesh</p>
  </td>
</tr>

<!-- BOTTOM ACCENT BAR -->
<tr><td style="height:3px;background:linear-gradient(90deg,#EAB308 0%,#57ACAF 100%);font-size:0;">&nbsp;</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;color:#C8D8E4;font-size:15px;line-height:1.7;font-family:Helvetica Neue,Arial,sans-serif;">${esc(text)}</p>`
}

function sig(name: string, title: string): string {
  return `<p style="margin:24px 0 0;color:#6A8899;font-size:13px;line-height:1.5;font-family:Arial,sans-serif;">&mdash; ${esc(name)}, ${esc(title)}, fabricXai</p>`
}

export async function sendAdminNewInquiry(params: {
  name: string
  firm: string | null
  investorId: string
  score: number | null
  tier: number
  fitReasoning: string | null
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const profileUrl = `${appUrl}/admin/investors/${params.investorId}`

  const body = [
    p(`${esc(params.name)}${params.firm ? ` from ${esc(params.firm)}` : ''} just requested portal access.`),
    `<table cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid #1C3042;border-radius:8px;overflow:hidden;width:100%;">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #1C3042;background:#07111E;">
        <span style="font-size:11px;color:#6A8899;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">AI Fit Score</span>
        <div style="font-size:20px;font-weight:700;color:#57ACAF;font-family:Arial,sans-serif;margin-top:4px;">${params.score ?? 'Pending'}/10</div>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #1C3042;background:#07111E;">
        <span style="font-size:11px;color:#6A8899;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">Auto-Tier</span>
        <div style="font-size:20px;font-weight:700;color:#EAB308;font-family:Arial,sans-serif;margin-top:4px;">Tier ${params.tier}</div>
      </td></tr>
    </table>`,
    params.fitReasoning
      ? `<div style="border-left:3px solid #57ACAF;padding:12px 16px;margin:0 0 20px;background:#07111E;border-radius:0 8px 8px 0;">
          <span style="font-size:10px;color:#57ACAF;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:2px;font-weight:700;">Reasoning</span>
          <p style="margin:6px 0 0;color:#C8D8E4;font-size:13px;line-height:1.6;font-family:Arial,sans-serif;">${esc(params.fitReasoning)}</p>
        </div>`
      : p('AI research in progress...'),
  ].join('')

  const html = brandedEmailHtml({
    body,
    ctaText: 'View Investor Profile \u2192',
    ctaUrl: profileUrl,
  })

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'investors@fabricxai.com',
    to: adminEmail,
    subject: `New investor inquiry — ${params.name}${params.firm ? `, ${params.firm}` : ''}`,
    html,
  })
}

export async function sendInvestorTier1Access(params: {
  firstName: string
  email: string
  portalToken: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const portalUrl = `${appUrl}/portal/${params.portalToken}`

  const body = [
    p(`Hi ${esc(params.firstName)},`),
    p("We've reviewed your profile and set up your investor access."),
    p('You can explore our metrics, product overview, and team details through the portal below.'),
    p('Some detailed financials require a brief call first \u2014 you can request full access directly from within the portal.'),
    sig('Kamrul Hasan', 'CEO'),
  ].join('')

  const html = brandedEmailHtml({
    body,
    ctaText: 'Open Investor Portal \u2192',
    ctaUrl: portalUrl,
  })

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'investors@fabricxai.com',
    to: params.email,
    subject: 'Your fabricXai investor portal is ready',
    html,
  })
}

export async function sendInvestorTier2Access(params: {
  firstName: string
  email: string
  portalToken: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const portalUrl = `${appUrl}/portal/${params.portalToken}`

  const body = [
    p(`Hi ${esc(params.firstName)},`),
    p('You now have full access to the fabricXai investor portal, including live metrics, financial documents, and our investor copilot.'),
    p("I'm happy to answer any questions directly."),
    sig('Kamrul Hasan', 'CEO'),
  ].join('')

  const html = brandedEmailHtml({
    body,
    ctaText: 'Open Full Portal \u2192',
    ctaUrl: portalUrl,
  })

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'investors@fabricxai.com',
    to: params.email,
    subject: 'Full access granted — fabricXai investor portal',
    html,
  })
}

export async function sendAdminPortalVisitNotification(params: {
  investorName: string
  investorId: string
  visitCount: number
}) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const profileUrl = `${appUrl}/admin/investors/${params.investorId}`

  const body = [
    p(`${esc(params.investorName)} just visited the investor portal (visit #${params.visitCount}).`),
  ].join('')

  const html = brandedEmailHtml({
    body,
    ctaText: 'View Profile \u2192',
    ctaUrl: profileUrl,
  })

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'investors@fabricxai.com',
    to: adminEmail,
    subject: `Portal visit — ${params.investorName} (visit #${params.visitCount})`,
    html,
  })
}
