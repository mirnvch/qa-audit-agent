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

export type ActivityAction = 'scanned' | 'sent' | 'viewed' | 'replied' | 'converted' | 'expired'

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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
