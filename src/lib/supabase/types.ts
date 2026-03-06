export type Company = {
  id: string
  name: string
  domain: string
  contact_name: string | null
  contact_email: string | null
  created_at: string
}

export type ReportStatus = 'draft' | 'sent' | 'viewed' | 'replied' | 'expired'

export type Report = {
  id: string
  company_id: string
  code: string
  status: ReportStatus
  score: number | null
  score_calculation: string | null
  summary: string | null
  tier: string | null
  audit_date: string | null
  pages_checked: string[]
  skipped_checks: string[]
  positives: string[]
  expires_at: string | null
  view_count: number
  created_at: string
}

export type FindingSeverity = 'critical' | 'moderate' | 'minor'
export type FindingConfidence = 'high' | 'medium' | 'low'

export type Finding = {
  id: string
  report_id: string
  finding_id: string
  severity: FindingSeverity
  confidence: FindingConfidence | null
  category: string | null
  title: string
  description: string | null
  business_impact: string | null
  page: string | null
  steps_to_reproduce: string[]
  evidence: {
    screenshot?: string
    screenshot_url?: string
    eval_data?: string
    snapshot_text?: string
  }
  created_at: string
}

export type ActivityAction = 'scanned' | 'sent' | 'viewed' | 'replied' | 'converted' | 'expired' | 'deleted' | 'email_sent'

export type ActivityLog = {
  id: string
  report_id: string
  action: ActivityAction
  details: string | null
  created_at: string
}

export type ScanRequestStatus = 'pending' | 'scanning' | 'completed' | 'failed'

export type ScanRequest = {
  id: string
  url: string
  domain: string | null
  status: ScanRequestStatus
  contact_name: string | null
  contact_email: string | null
  report_id: string | null
  error_message: string | null
  ip_address: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  created_at: string
  updated_at: string
}

export type Branding = {
  id: string
  logo_url: string | null
  company_name: string | null
  primary_color: string | null
  accent_color: string | null
  created_at: string
  updated_at: string
}

export type SequenceStep = {
  delay_days: number
  template_id: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonValue = any

export type EmailSequence = {
  id: string
  name: string
  steps: SequenceStep[]
  created_at: string
  updated_at: string
}

export type SequenceEnrollmentStatus = 'active' | 'completed' | 'cancelled'

export type SequenceEnrollment = {
  id: string
  report_id: string
  sequence_id: string
  current_step: number
  next_send_at: string | null
  status: SequenceEnrollmentStatus
  created_at: string
}

export type ApiKey = {
  id: string
  name: string
  key: string
  created_at: string
}

export type Webhook = {
  id: string
  url: string
  events: string[]
  active: boolean
  created_at: string
}

export type UserRole = 'admin' | 'operator' | 'viewer'

export type UserRoleEntry = {
  id: string
  user_id: string
  role: UserRole
  created_at: string
}

// Joined types for queries
export type ReportWithCompany = Report & {
  companies: Company
}

export type ReportWithFindings = Report & {
  companies: Company
  findings: Finding[]
}

export type ActivityWithReport = ActivityLog & {
  reports: Report & {
    companies: Company
  }
}

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: Company
        Insert: Omit<Company, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Company, 'id'>>
        Relationships: []
      }
      reports: {
        Row: Report
        Insert: Omit<Report, 'id' | 'created_at' | 'view_count'> & { id?: string; created_at?: string; view_count?: number }
        Update: Partial<Omit<Report, 'id'>>
        Relationships: []
      }
      findings: {
        Row: Finding
        Insert: Omit<Finding, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Finding, 'id'>>
        Relationships: []
      }
      activity_log: {
        Row: ActivityLog
        Insert: Omit<ActivityLog, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<ActivityLog, 'id'>>
        Relationships: []
      }
      email_templates: {
        Row: EmailTemplate
        Insert: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<EmailTemplate, 'id'>>
        Relationships: []
      }
      branding: {
        Row: Branding
        Insert: Omit<Branding, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Branding, 'id'>>
        Relationships: []
      }
      scan_requests: {
        Row: ScanRequest
        Insert: Pick<ScanRequest, 'url'> & {
          id?: string
          domain?: string | null
          status?: ScanRequestStatus
          contact_name?: string | null
          contact_email?: string | null
          report_id?: string | null
          error_message?: string | null
          ip_address?: string | null
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: Partial<Omit<ScanRequest, 'id'>>
        Relationships: []
      }
      email_sequences: {
        Row: EmailSequence
        Insert: { name: string; steps: JsonValue; id?: string; created_at?: string; updated_at?: string }
        Update: Partial<{ name: string; steps: JsonValue; created_at: string; updated_at: string }>
        Relationships: []
      }
      sequence_enrollments: {
        Row: SequenceEnrollment
        Insert: Omit<SequenceEnrollment, 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<SequenceEnrollment, 'id'>>
        Relationships: []
      }
      api_keys: {
        Row: ApiKey
        Insert: Omit<ApiKey, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<ApiKey, 'id'>>
        Relationships: []
      }
      webhooks: {
        Row: Webhook
        Insert: Omit<Webhook, 'id' | 'created_at' | 'active'> & { id?: string; created_at?: string; active?: boolean }
        Update: Partial<Omit<Webhook, 'id'>>
        Relationships: []
      }
      user_roles: {
        Row: UserRoleEntry
        Insert: Omit<UserRoleEntry, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<UserRoleEntry, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
