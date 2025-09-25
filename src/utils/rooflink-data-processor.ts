// Utility functions for processing RoofLink API data

import {
  RoofLinkAPIResponse,
  RoofLinkApprovedJob,
  RoofLinkProspectJob,
  RoofLinkCustomerData,
  MonroeDashboardMetrics,
  DOOR_KNOCKING_SOURCES,
  COMPANY_GENERATED_SOURCES,
  MONROE_REGION_INDICATORS
} from '@/types/rooflink'

/**
 * Parses the content array from RoofLink API responses
 */
export function parseRoofLinkContent(content: Array<{ type: string; text: string }>): any {
  if (!content || !Array.isArray(content)) {
    return null
  }

  for (const item of content) {
    if (item.type === 'text' && item.text) {
      try {
        return JSON.parse(item.text)
      } catch (error) {
        console.error('Error parsing RoofLink content:', error)
        continue
      }
    }
  }
  return null
}

/**
 * Checks if a job/customer is in the Monroe LA region
 */
export function isMonroeRegion(item: any): boolean {
  if (!item) return false

  // Check various address fields
  const addressFields = [
    item.full_address,
    item.address,
    item.customer_address,
    item.customer?.address,
    item.job?.address,
    item.name
  ]

  // Check region fields
  const regionFields = [
    item.region?.name,
    item.region,
    item.customer?.region?.name,
    item.customer?.region
  ]

  // Check city and state
  const locationFields = [
    item.city,
    item.state,
    item.customer?.city,
    item.customer?.state
  ]

  const allFields = [...addressFields, ...regionFields, ...locationFields]
    .filter(Boolean)
    .map(field => field.toString().toLowerCase())

  return allFields.some(field => 
    MONROE_REGION_INDICATORS.some(indicator => field.includes(indicator))
  )
}

/**
 * Determines if a lead source is door knocking
 */
export function isDoorKnockingLead(leadSource: string | undefined): boolean {
  if (!leadSource) return false
  const source = leadSource.toLowerCase()
  return DOOR_KNOCKING_SOURCES.some(dkSource => source.includes(dkSource))
}

/**
 * Determines if a lead source is company generated
 */
export function isCompanyGeneratedLead(leadSource: string | undefined): boolean {
  if (!leadSource) return true // Default to company generated if no source
  const source = leadSource.toLowerCase()
  return COMPANY_GENERATED_SOURCES.some(cgSource => source.includes(cgSource))
}

/**
 * Estimates revenue for a job based on type and region
 */
export function estimateJobRevenue(job: RoofLinkApprovedJob): number {
  let baseRevenue = 0

  // Base revenue by job type
  switch (job.job_type) {
    case 'c': // Commercial
      baseRevenue = 25000
      break
    case 'r': // Residential
      baseRevenue = 15000
      break
    default:
      baseRevenue = 20000
  }

  // Adjust for region (LA region might have different pricing)
  if (isMonroeRegion(job)) {
    baseRevenue = Math.round(baseRevenue * 1.1) // 10% higher for LA
  }

  return baseRevenue
}

/**
 * Checks if a job is in backlog (approved but not closed)
 */
export function isJobInBacklog(job: RoofLinkApprovedJob): boolean {
  return !job.date_closed || job.job_status?.label?.toLowerCase() !== 'closed'
}

/**
 * Checks if a prospect job has been verified (inspection completed)
 */
export function isProspectVerified(prospect: RoofLinkProspectJob): boolean {
  return prospect.pipeline?.verify_lead?.complete === true
}

/**
 * Processes approved jobs data
 */
export function processApprovedJobs(
  data: any,
  dashboardMetrics: MonroeDashboardMetrics,
  debugMode: boolean = false
): void {
  if (!data?.results || !Array.isArray(data.results)) {
    return
  }

  data.results.forEach((job: RoofLinkApprovedJob) => {
    const isMonroe = isMonroeRegion(job)
    
    if (isMonroe || debugMode) {
      console.log('Processing approved job:', {
        id: job.id,
        job_status: job.job_status?.label,
        date_approved: job.date_approved,
        date_closed: job.date_closed,
        region: job.customer?.region?.name,
        job_type: job.job_type
      })

      // All approved jobs count as contracts signed
      dashboardMetrics.contractsSigned++

      // Check if job is in backlog
      if (isJobInBacklog(job)) {
        dashboardMetrics.backlog++
      }

      // Estimate and add revenue
      const estimatedRevenue = estimateJobRevenue(job)
      dashboardMetrics.soldRevenue += estimatedRevenue

      console.log(`Added estimated revenue: ${estimatedRevenue} for job type: ${job.job_type}`)
    }
  })
}

/**
 * Processes prospect jobs data
 */
export function processProspectJobs(
  data: any,
  dashboardMetrics: MonroeDashboardMetrics,
  debugMode: boolean = false
): void {
  if (!data?.results || !Array.isArray(data.results)) {
    return
  }

  data.results.forEach((prospect: RoofLinkProspectJob) => {
    const isMonroe = isMonroeRegion(prospect)
    
    if (isMonroe || debugMode) {
      console.log('Processing prospect job:', {
        id: prospect.id,
        job_type: prospect.job_type,
        lead_source: prospect.customer?.lead_source?.name,
        region: prospect.customer?.region?.name,
        verified: prospect.pipeline?.verify_lead?.complete
      })

      // Process lead source
      const leadSource = prospect.customer?.lead_source?.name
      if (isDoorKnockingLead(leadSource)) {
        dashboardMetrics.doorKnockingLeads++
        console.log('Found door knocking lead from prospect job')
      } else if (isCompanyGeneratedLead(leadSource)) {
        dashboardMetrics.companyGeneratedLeads++
        console.log('Found company generated lead from prospect job')
      }

      // Check if lead is verified (inspection completed)
      if (isProspectVerified(prospect)) {
        dashboardMetrics.inspections++
        console.log('Found verified lead - counting as inspection')
      }
    }
  })
}

/**
 * Processes customer data (for reference/context)
 */
export function processCustomerData(
  data: any,
  dashboardMetrics: MonroeDashboardMetrics,
  debugMode: boolean = false
): void {
  if (!data?.results || !Array.isArray(data.results)) {
    return
  }

  // Customers don't directly contribute to most metrics
  // They're more for reference/context
  console.log(`Processed ${data.results.length} customer records`)
}

/**
 * Processes API response and updates dashboard metrics
 */
export function processRoofLinkResponse(
  response: RoofLinkAPIResponse,
  dashboardMetrics: MonroeDashboardMetrics,
  debugMode: boolean = false
): boolean {
  if (!response?.data) {
    return false
  }

  let processed = false

  // Handle different response formats
  if (response.data.content) {
    const parsedData = parseRoofLinkContent(response.data.content)
    if (parsedData) {
      const endpoint = response.endpoint.toLowerCase()
      
      if (endpoint.includes('jobs/approved')) {
        processApprovedJobs(parsedData, dashboardMetrics, debugMode)
        processed = true
      } else if (endpoint.includes('jobs/prospect')) {
        processProspectJobs(parsedData, dashboardMetrics, debugMode)
        processed = true
      } else if (endpoint.includes('customers')) {
        processCustomerData(parsedData, dashboardMetrics, debugMode)
        processed = true
      }
    }
  } else if (response.data.sampleItems) {
    // Handle mock data
    console.log(`Processing mock data with ${response.data.sampleItems.length} items`)
    processed = true
  }

  return processed
}

/**
 * Calculates lead conversion percentage
 */
export function calculateLeadConversionPercentage(
  inspections: number,
  doorKnockingLeads: number,
  companyGeneratedLeads: number
): number {
  const totalLeads = doorKnockingLeads + companyGeneratedLeads
  if (totalLeads === 0) return 0
  return (inspections / totalLeads) * 100
}

/**
 * Creates initial dashboard metrics
 */
export function createInitialDashboardMetrics(
  region: string,
  period: string,
  startDate: string,
  endDate: string
): MonroeDashboardMetrics {
  return {
    region,
    period,
    startDate,
    endDate,
    timestamp: new Date().toISOString(),
    
    contractsSigned: 0,
    soldRevenue: 0,
    doorKnockingLeads: 0,
    companyGeneratedLeads: 0,
    inspections: 0,
    leadConversionPercentage: 0,
    claimsFiled: 0,
    claimsApproved: 0,
    backlog: 0
  }
}
