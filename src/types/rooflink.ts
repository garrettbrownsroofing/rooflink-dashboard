// TypeScript interfaces for RoofLink API data structures

export interface RoofLinkRegion {
  color: string
  id: number
  name: string
}

export interface RoofLinkUser {
  color: string
  email: string
  id: number
  name: string
  phone?: string
}

export interface RoofLinkLeadSource {
  id: number
  name: string
}

export interface RoofLinkCoverPhoto {
  id?: number
  is_video: boolean
  name: string
  preview_url?: string
  thumb_url?: string
  url?: string
}

export interface RoofLinkJobStatus {
  color: string
  label: string
}

export interface RoofLinkPipeline {
  delete: {
    complete: boolean
    key: string
    name: string
    permissions: {
      can_delete: boolean
    }
    date?: string
    deleted_by?: RoofLinkUser
  }
  schedule_adj_mtg: {
    complete: boolean
    key: string
  }
  submit: {
    complete: boolean
    key: string
    permissions: any
  }
  verify_lead: {
    complete: boolean
    key: string
    completed_by?: RoofLinkUser
    date?: string
    name?: string
  }
}

export interface RoofLinkCustomer {
  cell?: string
  email?: string
  id: number
  lead_source?: RoofLinkLeadSource
  marketing_rep?: RoofLinkUser
  name: string
  post_insurance_reviewer?: RoofLinkUser
  pre_insurance_reviewer?: RoofLinkUser
  project_manager?: RoofLinkUser
  region: RoofLinkRegion
  rep?: RoofLinkUser
  rep_2?: RoofLinkUser
  user_id: number
}

export interface RoofLinkApprovedJob {
  bid_type: 'r' | 'c' | 'i' // residential, commercial, insurance
  color: string
  cover_photo: RoofLinkCoverPhoto
  customer: RoofLinkCustomer
  date_approved: string
  date_closed?: string
  date_created: string
  date_deleted?: string
  date_last_edited: string
  full_address: string
  id: number
  job_number?: string
  job_status: RoofLinkJobStatus
  job_type: 'c' | 'r' // commercial, residential
  last_note?: string
  latitude: number
  longitude: number
  name: string
}

export interface RoofLinkProspectJob {
  bid_type: 'i' | 'c' | 'r' | '' // insurance, commercial, residential, or empty
  color?: string
  cover_photo: RoofLinkCoverPhoto
  customer: RoofLinkCustomer
  date_created: string
  date_last_edited: string
  full_address: string
  id: number
  job_number?: string
  job_type: 'c' | 'r' // commercial, residential
  latitude: number
  longitude: number
  name: string
  photo_count: number
  pipeline: RoofLinkPipeline
}

export interface RoofLinkCustomerData {
  cell?: string
  email?: string
  id: number
  name: string
  phone?: string
  phone_ext?: string
  region: RoofLinkRegion
  rep?: RoofLinkUser
  user_id: number
}

export interface RoofLinkPaginationInfo {
  count: number
  from_index: number
  next?: string
  next_page?: number
  previous?: string
  results: any[]
  to_index: number
}

export interface RoofLinkAPIResponse {
  endpoint: string
  data: {
    content?: Array<{
      type: string
      text: string
    }>
    message?: string
    error?: string
    mock?: boolean
    sampleItems?: any[]
  }
  timestamp: string
  rawResponse?: any
  error?: string
}

// Dashboard-specific interfaces
export interface MonroeDashboardMetrics {
  region: string
  period: string
  startDate: string
  endDate: string
  timestamp: string
  
  // Core Metrics
  contractsSigned: number        // Jobs approved
  soldRevenue: number           // Job approved with total of estimate
  doorKnockingLeads: number     // Lead source contains "knocks" or "Rabbit"
  companyGeneratedLeads: number // All lead sources except "knocks" or "Rabbit"
  inspections: number           // Jobs verified
  leadConversionPercentage: number // Inspections / (Company + Door Knock leads)
  claimsFiled: number
  claimsApproved: number
  backlog: number              // Jobs approved but not scheduled/deleted/completed/closed
}

// Helper types for data processing
export type JobType = 'c' | 'r' // commercial, residential
export type BidType = 'r' | 'c' | 'i' // residential, commercial, insurance

// Constants for lead source classification
export const DOOR_KNOCKING_SOURCES = ['door knocking', 'door knock', 'rabbit', 'salesrabbit', 'canvass', 'canvassing']
export const COMPANY_GENERATED_SOURCES = ['website', 'call in', 'customer referral', 'word of mouth', 'social media', 'warranty and maintenance']

// Constants for region filtering
export const MONROE_REGION_INDICATORS = ['la', 'monroe', 'louisiana']
