// ─── INVESTOR ─────────────────────────────────────────────────────────────────
export interface Investor {
  id: string
  first_name: string
  last_name: string
  email: string
  firm_name: string | null
  investor_type: 'angel' | 'vc' | 'family_office' | 'strategic' | 'individual' | null
  check_size: string | null
  message: string | null
  submitted_at: string
  status: 'new' | 'reviewed' | 'approved' | 'declined'
  access_tier: 0 | 1 | 2
  portal_token: string
  portal_token_expires_at: string
  last_portal_visit: string | null
  visit_count: number
}

// ─── INVESTOR PROFILE (AI-generated) ─────────────────────────────────────────
export interface InvestorProfile {
  id: string
  investor_id: string
  firm_name: string | null
  firm_website: string | null
  firm_description: string | null
  aum: string | null
  focus_areas: string[] | null
  check_size_min: number | null
  check_size_max: number | null
  stage_focus: string[] | null
  portfolio_companies: PortfolioCompany[] | null
  recent_investments: RecentInvestment[] | null
  linkedin_url: string | null
  crunchbase_url: string | null
  twitter_url: string | null
  location: string | null
  ai_summary: string | null
  fit_score: number | null
  fit_reasoning: string | null
  auto_tier_granted: number | null
  research_status: 'pending' | 'processing' | 'complete' | 'failed'
  last_researched_at: string | null
  created_at: string
  updated_at: string
}

export interface PortfolioCompany {
  name: string
  url?: string
  description?: string
  relevance?: string
}

export interface RecentInvestment {
  company: string
  date?: string
  round?: string
  amount?: string
}

// ─── ACTUAL INVESTOR (already invested) ───────────────────────────────────────
export interface ActualInvestor {
  id: string
  name: string
  email: string
  password_hash: string | null
  temp_password_hash: string | null
  temp_password_expires: string | null
  is_password_set: boolean
  invested_amount: number | null
  invested_date: string | null
  instrument: string | null   // 'SAFE' | 'Note' | 'Equity'
  notes: string | null
  last_login: string | null
  created_at: string
  updated_at: string
}

// ─── COMPANY METRICS ──────────────────────────────────────────────────────────
export interface CompanyMetrics {
  id: string
  metric_date: string
  mrr: number
  arr: number
  factories_live: number
  factories_pipeline: number
  mom_growth_rate: number | null
  runway_months: number | null
  burn_rate: number | null
  cash_balance: number | null
  agents_deployed: number
  total_agents_built: number
  raise_target: number
  raise_committed: number
  round_stage: string
  updated_by: string | null
  updated_at: string
  notes: string | null
}

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
export type DocType = 'pitch_deck' | 'financials' | 'cap_table' | 'legal' | 'update' | 'other'

export interface Document {
  id: string
  name: string
  description: string | null
  file_url: string
  file_path: string | null
  file_size: number | null
  doc_type: DocType | null
  min_tier_to_view: number
  min_tier_to_download: number
  is_in_rag: boolean
  rag_chunk_count: number
  created_at: string
  updated_at: string
}

// ─── RAG ──────────────────────────────────────────────────────────────────────
export interface DocumentChunk {
  id: string
  document_id: string
  chunk_index: number
  content: string
  embedding?: number[]
  metadata: ChunkMetadata
  created_at: string
}

export interface ChunkMetadata {
  doc_name: string
  doc_type: string
  page_estimate?: number
  char_start: number
  char_end: number
}

export interface RetrievedChunk {
  content: string
  source: string
  docType: string
  similarity: number
}

// ─── COPILOT ──────────────────────────────────────────────────────────────────
export interface CopilotConversation {
  id: string
  session_id: string
  actor_type: 'admin' | 'investor'
  investor_id: string | null
  messages: CopilotMessage[]
  created_at: string
  updated_at: string
}

export interface CopilotMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: SourceCitation[]
  timestamp: string
}

export interface SourceCitation {
  name: string
  section?: string
}

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────
export interface ActivityLogEntry {
  id: string
  event_type: string
  investor_id: string | null
  description: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ─── OUTREACH ─────────────────────────────────────────────────────────────────
export type OutreachPipelineStatus = 'Identified' | 'Contacted' | 'Replied' | 'Meeting' | 'DD' | 'Committed'

export interface OutreachInvestor {
  id: string
  name: string
  email: string | null
  firm_name: string | null
  firm_website: string | null
  thesis: string | null
  focus_areas: string | null
  check_size: string | null
  stage_preference: string | null
  geography: string | null
  fit_score: number
  pipeline_status: OutreachPipelineStatus
  avatar_initials: string | null
  avatar_color: string
  portfolio_companies: string[] | null
  linkedin_url: string | null
  crunchbase_url: string | null
  notes: string | null
  linked_investor_id: string | null
  created_at: string
  updated_at: string
}

export interface OutreachEmail {
  id: string
  outreach_investor_id: string
  email_type: 'cold' | 'follow_up' | 'manual'
  from_email: string | null
  from_name: string | null
  to_email: string | null
  to_name: string | null
  subject: string | null
  body_text: string | null
  body_html: string | null
  tone: string | null
  ai_generated: boolean
  sent_at: string | null
  resend_message_id: string | null
  status: 'draft' | 'sent' | 'failed'
  created_at: string
}

export interface OutreachFollowup {
  id: string
  outreach_investor_id: string
  original_email_id: string | null
  due_date: string | null
  urgency: 'low' | 'medium' | 'high'
  status: 'pending' | 'completed' | 'archived'
  ai_draft: string | null
  ai_draft_subject: string | null
  sent_email_id: string | null
  created_at: string
  updated_at: string
  // Joined fields
  outreach_investor?: OutreachInvestor
  original_email?: OutreachEmail
}

export interface GenerateEmailPayload {
  investor_id: string
  tone: string
}

export interface SendOutreachEmailPayload {
  outreach_investor_id: string
  subject: string
  body_text: string
  body_html?: string
  from_name?: string
  email_type?: 'cold' | 'follow_up' | 'manual'
  tone?: string
  ai_generated?: boolean
}

// ─── HUNTER DISCOVERY ─────────────────────────────────────────────────────────
export type DiscoveryStrategy = 'thesis' | 'portfolio' | 'deals' | 'geography' | 'news'

export interface DiscoveryConfig {
  strategies: DiscoveryStrategy[]
  focusKeywords: string[]
  geographyFilter: string
  stageFilter: string
  minFitScore: number
  maxResults: number
}

export interface DiscoveryEvent {
  type: 'status' | 'investor_found' | 'investor_profiled' | 'investor_skipped' | 'error' | 'complete'
  message: string
  data?: DiscoveredInvestor
  progress?: { current: number; total: number }
  stats?: { total: number; added: number; skipped: number; duplicates: number }
}

export interface DiscoveredInvestor {
  name: string
  email: string | null
  firm_name: string | null
  firm_website: string | null
  thesis: string | null
  focus_areas: string | null
  check_size: string | null
  stage_preference: string | null
  geography: string | null
  fit_score: number
  fit_reasoning: string
  portfolio_companies: string[]
  linkedin_url: string | null
  crunchbase_url: string | null
  already_in_pipeline?: boolean
}

// ─── API HELPERS ──────────────────────────────────────────────────────────────
export interface AccessRequestPayload {
  first_name: string
  last_name: string
  email: string
  firm_name?: string
  investor_type?: string
  check_size?: string
  message?: string
}

export interface TieredMetrics {
  mrr: number | null
  mrr_range: string | null
  arr: number | null
  factories_live: number
  factories_pipeline: number
  mom_growth_rate: number | null
  runway_months: number | null
  runway_range: string | null
  burn_rate: number | null
  cash_balance: number | null
  agents_deployed: number
  total_agents_built: number
  raise_target: number
  raise_committed: number | null
  raise_percent: number | null
  round_stage: string
  updated_at: string
}
