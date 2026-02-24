import type { OutreachInvestor, OutreachPipelineStatus } from './types'

// ─── TONE OPTIONS ─────────────────────────────────────────────────────────────
export const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-focused' },
  { value: 'warm', label: 'Warm & Personal', description: 'Friendly founder-to-investor tone' },
  { value: 'data-driven', label: 'Data-Driven', description: 'Lead with numbers and traction' },
  { value: 'bold', label: 'Bold & Direct', description: 'Confident and punchy' },
]

// ─── PIPELINE STAGES ──────────────────────────────────────────────────────────
export const OUTREACH_STAGES: OutreachPipelineStatus[] = [
  'Identified', 'Contacted', 'Replied', 'Meeting', 'DD', 'Committed',
]

export const STAGE_COLORS: Record<OutreachPipelineStatus, string> = {
  Identified: '#3A5060',
  Contacted:  '#EAB308',
  Replied:    '#57ACAF',
  Meeting:    '#8B5CF6',
  DD:         '#F97316',
  Committed:  '#10B981',
}

// ─── NEXT STAGE MAP ───────────────────────────────────────────────────────────
export const NEXT_STAGE: Record<OutreachPipelineStatus, OutreachPipelineStatus | null> = {
  Identified: 'Contacted',
  Contacted:  'Replied',
  Replied:    'Meeting',
  Meeting:    'DD',
  DD:         'Committed',
  Committed:  null,
}

// ─── AI PROMPT: COLD EMAIL ────────────────────────────────────────────────────
export function buildOutreachPrompt(investor: OutreachInvestor, tone: string): string {
  return `You are HUNTER, fabricXai's investor outreach AI agent. Write a cold outreach email to ${investor.name} at ${investor.firm_name || 'their firm'}.

INVESTOR PROFILE:
- Name: ${investor.name}
- Firm: ${investor.firm_name || 'N/A'}
- Investment thesis: ${investor.thesis || 'N/A'}
- Focus: ${investor.focus_areas || 'N/A'}
- Check size: ${investor.check_size || 'N/A'}
- Portfolio: ${(investor.portfolio_companies || []).join(', ') || 'N/A'}
- Geography: ${investor.geography || 'N/A'}

FABRICXAI:
- AI-native manufacturing intelligence platform — 22 specialist AI agents
- Target: garment factories in Bangladesh (4,500+ factories, 98% unserved)
- POC live in Dhaka factory. ৳240,000 saved in week 1 via VerifyX
- Angel round: $150K–$250K · SAFE · $3M cap · 20% discount
- Founders: Arifur Rahman (CEO, BUET, gaming exit) + Kamrul Hasan (CTO, BUET EEE, AI research)
- Investor portal: fabricxai.com/investors

TONE: ${tone}

Write a short, punchy cold email (150–200 words max). Subject line on first line as "Subject: ...". Reference their specific thesis and portfolio companies naturally. End with a soft CTA to visit the investor portal or take a 20-min call. Do NOT use generic AI phrases. Sound like a founder, not a bot.`
}

// ─── AI PROMPT: FOLLOW-UP ─────────────────────────────────────────────────────
export function buildFollowUpPrompt(
  investorName: string,
  firmName: string,
  originalSubject: string,
  sentAgo: string
): string {
  return `You are HUNTER, fabricXai's investor outreach AI. Write a short follow-up email to ${investorName} at ${firmName} who hasn't replied to: "${originalSubject}" sent ${sentAgo}.

fabricXai context: AI platform for garment factories, angel round $150K–$250K, POC live in Dhaka with real traction (৳240K saved in week 1).

Write a 3–4 sentence follow-up. Subject line first as "Subject: ...". Keep it human, brief, add a new hook or data point. No apologies for following up.`
}

// ─── BRANDED HTML EMAIL BUILDER ───────────────────────────────────────────────
interface HTMLEmailOptions {
  ctaText?: string
  ctaUrl?: string
  callout?: string | null
  showStats?: boolean
}

export function buildBrandedHTMLEmail(
  subject: string,
  body: string,
  senderName: string,
  opts: HTMLEmailOptions = {}
): string {
  const ctaText = opts.ctaText || 'Visit Investor Portal \u2192'
  const ctaUrl = opts.ctaUrl || 'https://fabricxai.com/investors'
  const callout = opts.callout !== undefined ? opts.callout : 'fabricXai is raising $150K\u2013$250K on a SAFE at a $3M cap. POC live in Dhaka \u2014 \u09f3240,000 saved in week 1.'
  const showStats = opts.showStats !== undefined ? opts.showStats : true

  const paragraphs = body
    .split('\n')
    .filter(l => l.trim())
    .map(l => `<p style="margin:0 0 18px;color:#C8D8E4;font-size:15px;line-height:1.8;font-family:Helvetica Neue,Arial,sans-serif;">${escapeHtml(l)}</p>`)
    .join('')

  const statsBar = showStats ? `<tr>
  <td style="background:#07111E;border-bottom:1px solid #1C3042;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td align="center" style="padding:16px 0;border-right:1px solid #1C3042;width:33.33%;">
        <div style="font-size:22px;font-weight:700;color:#57ACAF;font-family:Arial,sans-serif;line-height:1;">22</div>
        <div style="font-size:9px;color:#6A8899;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;margin-top:4px;">AI Agents</div>
      </td>
      <td align="center" style="padding:16px 0;border-right:1px solid #1C3042;width:33.33%;">
        <div style="font-size:22px;font-weight:700;color:#EAB308;font-family:Arial,sans-serif;line-height:1;">$3M</div>
        <div style="font-size:9px;color:#6A8899;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;margin-top:4px;">SAFE Cap</div>
      </td>
      <td align="center" style="padding:16px 0;width:33.33%;">
        <div style="font-size:15px;font-weight:700;color:#10B981;font-family:Arial,sans-serif;line-height:1;">POC Live</div>
        <div style="font-size:9px;color:#6A8899;letter-spacing:2px;text-transform:uppercase;font-family:Arial,sans-serif;margin-top:4px;">Dhaka &middot; Q1 2026</div>
      </td>
    </tr></table>
  </td>
</tr>` : ''

  const calloutBlock = callout ? `<tr>
  <td style="padding:0 28px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #57ACAF;background:#07111E;border-radius:0 10px 10px 0;border-top:1px solid #1C3042;border-right:1px solid #1C3042;border-bottom:1px solid #1C3042;">
      <tr><td style="padding:18px 20px;">
        <div style="font-size:9px;color:#57ACAF;letter-spacing:2.5px;text-transform:uppercase;font-family:Arial,sans-serif;font-weight:700;margin-bottom:8px;">&#x2736; Key Highlight</div>
        <p style="margin:0;color:#FFFFFF;font-size:14px;line-height:1.7;font-family:Arial,sans-serif;">${escapeHtml(callout)}</p>
      </td></tr>
    </table>
  </td>
</tr>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
<style>*{box-sizing:border-box;}body{margin:0;padding:0;background:#07111E;}a{color:#57ACAF;text-decoration:none;}</style>
</head>
<body style="margin:0;padding:0;background:#07111E;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#07111E;padding:32px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#0D1B2A;border:1px solid #1C3042;border-radius:14px;overflow:hidden;max-width:600px;">

<!-- TOP ACCENT BAR -->
<tr><td style="height:4px;background:linear-gradient(90deg,#57ACAF 0%,#EAB308 60%,#57ACAF 100%);font-size:0;">&nbsp;</td></tr>

<!-- HEADER -->
<tr>
  <td style="background:#07111E;padding:20px 28px;border-bottom:1px solid #1C3042;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle;">
        <img src="https://devppcpvuwneduuibygh.supabase.co/storage/v1/object/public/investor-portal/logo/fabricxai-logo-dark.png" alt="fabricXai" height="22" style="display:block;height:22px;width:auto;" />
      </td>
      <td align="right" style="vertical-align:middle;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="padding-left:8px;">
            <a href="https://linkedin.com/company/fabricxai" style="display:inline-block;width:32px;height:32px;background:#0A66C215;border:1px solid #0A66C240;border-radius:8px;text-align:center;line-height:32px;font-size:13px;font-weight:700;color:#0A66C2;font-family:Arial,sans-serif;text-decoration:none;">in</a>
          </td>
          <td style="padding-left:7px;">
            <a href="mailto:arifur@fabricxai.com" style="display:inline-block;width:32px;height:32px;background:#57ACAF15;border:1px solid #57ACAF40;border-radius:8px;text-align:center;line-height:30px;font-size:17px;color:#57ACAF;text-decoration:none;">&#9993;</a>
          </td>
          <td style="padding-left:7px;">
            <a href="https://fabricxai.com" style="display:inline-block;width:32px;height:32px;background:#57ACAF15;border:1px solid #57ACAF40;border-radius:8px;text-align:center;line-height:32px;font-size:14px;color:#57ACAF;text-decoration:none;">&#127760;</a>
          </td>
          <td style="padding-left:10px;">
            <a href="https://fabricxai.com/investors" style="display:inline-block;background:#57ACAF;color:#07111E;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:9px 14px;border-radius:8px;text-decoration:none;white-space:nowrap;">Portal &#8594;</a>
          </td>
        </tr></table>
      </td>
    </tr></table>
  </td>
</tr>

<!-- STATS BAR -->
${statsBar}

<!-- BODY TEXT -->
<tr><td style="padding:36px 28px 8px;">${paragraphs}</td></tr>

<!-- CALLOUT BOX -->
${calloutBlock}

<!-- CTA BUTTON -->
<tr>
  <td align="center" style="padding:4px 28px 36px;">
    <a href="${ctaUrl}" style="display:inline-block;background:#57ACAF;color:#07111E;font-family:Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:0.5px;padding:15px 36px;border-radius:10px;text-decoration:none;">${escapeHtml(ctaText)}</a>
  </td>
</tr>

<!-- DIVIDER -->
<tr><td style="padding:0 28px;"><div style="height:1px;background:#1C3042;">&nbsp;</div></td></tr>

<!-- SIGNATURE -->
<tr>
  <td style="padding:24px 28px;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:top;padding-right:16px;">
        <table cellpadding="0" cellspacing="0">
          <tr><td align="center" style="width:48px;height:48px;background:#57ACAF22;border:1px solid #57ACAF55;border-radius:12px;font-size:15px;font-weight:700;color:#57ACAF;font-family:Arial,sans-serif;vertical-align:middle;">AR</td></tr>
        </table>
      </td>
      <td style="vertical-align:top;">
        <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#FFFFFF;font-family:Arial,sans-serif;">${escapeHtml(senderName)}</p>
        <p style="margin:0 0 3px;font-size:12px;color:#6A8899;font-family:Arial,sans-serif;">fabricXai &middot; SocioFi &middot; Dhaka, Bangladesh</p>
        <p style="margin:0 0 10px;font-size:12px;font-family:Arial,sans-serif;"><a href="mailto:arifur@fabricxai.com" style="color:#57ACAF;text-decoration:none;">arifur@fabricxai.com</a>&nbsp;&middot;&nbsp;<a href="tel:+8801234567890" style="color:#57ACAF;text-decoration:none;">+880 123 456 7890</a></p>
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="padding-right:8px;"><a href="https://linkedin.com/in/ari0071" style="display:inline-block;font-size:10px;font-weight:700;color:#0A66C2;font-family:Arial,sans-serif;background:#0A66C215;border:1px solid #0A66C230;border-radius:6px;padding:4px 10px;text-decoration:none;">in  LinkedIn</a></td>
          <td><a href="https://fabricxai.com/investors" style="display:inline-block;font-size:10px;font-weight:700;color:#57ACAF;font-family:Arial,sans-serif;background:#57ACAF15;border:1px solid #57ACAF30;border-radius:6px;padding:4px 10px;text-decoration:none;">&#128279; Investor Portal</a></td>
        </tr></table>
      </td>
    </tr></table>
  </td>
</tr>

<!-- FOOTER -->
<tr>
  <td style="background:#07111E;border-top:1px solid #1C3042;padding:16px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><p style="margin:0;font-size:10px;color:#3A5060;font-family:Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;">fabricXai &middot; SocioFi Limited &middot; Dhaka, Bangladesh</p></td>
      <td align="right"><table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-left:14px;"><a href="https://linkedin.com/company/fabricxai" style="font-size:10px;color:#3A5060;font-family:Arial,sans-serif;text-decoration:none;">LinkedIn</a></td>
        <td style="padding-left:14px;"><a href="https://fabricxai.com" style="font-size:10px;color:#3A5060;font-family:Arial,sans-serif;text-decoration:none;">Website</a></td>
        <td style="padding-left:14px;"><a href="mailto:arifur@fabricxai.com" style="font-size:10px;color:#3A5060;font-family:Arial,sans-serif;text-decoration:none;">Email</a></td>
      </tr></table></td>
    </tr>
    <tr><td colspan="2" style="padding-top:8px;"><p style="margin:0;font-size:9px;color:#1C3042;font-family:Arial,sans-serif;">This message was sent to you as a prospective investor in fabricXai's angel round. Not an offer to sell securities.</p></td></tr>
    </table>
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
