'use client'

import { useState, useEffect } from 'react'
import { mcpClient } from '@/lib/mcp-client'

interface MonroeDashboardData {
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

type DateRangeType = 'current-week' | 'monthly' | 'yearly' | 'custom'

interface MonroeRevenueDashboardProps {
  isConnected: boolean
}

export default function MonroeRevenueDashboard({ isConnected }: MonroeRevenueDashboardProps) {
  const [dashboardData, setDashboardData] = useState<MonroeDashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('current-week')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  // Helper functions for date range calculations
  const getDateRange = (type: DateRangeType): { startDate: string; endDate: string; period: string } => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    switch (type) {
      case 'current-week': {
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6) // End of current week (Saturday)
        
        return {
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: endOfWeek.toISOString().split('T')[0],
          period: `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        }
      }
      
      case 'monthly': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0],
          period: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        }
      }
      
      case 'yearly': {
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const endOfYear = new Date(now.getFullYear(), 11, 31)
        
        return {
          startDate: startOfYear.toISOString().split('T')[0],
          endDate: endOfYear.toISOString().split('T')[0],
          period: now.getFullYear().toString()
        }
      }
      
      case 'custom': {
        if (!customStartDate || !customEndDate) {
          return {
            startDate: today,
            endDate: today,
            period: 'Custom Range'
          }
        }
        
        return {
          startDate: customStartDate,
          endDate: customEndDate,
          period: `Custom: ${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`
        }
      }
      
      default:
        return {
          startDate: today,
          endDate: today,
          period: 'Today'
        }
    }
  }

  const fetchMonroeDashboardData = async () => {
    if (!isConnected) {
      setError('Not connected to MCP server')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Get the current date range
      const dateRange = getDateRange(dateRangeType)
      console.log('Fetching Monroe dashboard data for date range:', dateRange)
      
      // Get available endpoints first
      const endpoints = await mcpClient.listAvailableEndpoints()
      console.log('Available endpoints:', endpoints)
      
      // Look for relevant endpoints for Monroe dashboard metrics
      const jobsEndpoints = endpoints.filter(ep => 
        ep.name.toLowerCase().includes('jobs') ||
        ep.name.toLowerCase().includes('approved') ||
        ep.name.toLowerCase().includes('prospects')
      )
      
      const leadsEndpoints = endpoints.filter(ep => 
        ep.name.toLowerCase().includes('leads') ||
        ep.name.toLowerCase().includes('lead')
      )
      
      const claimsEndpoints = endpoints.filter(ep => 
        ep.name.toLowerCase().includes('claims') ||
        ep.name.toLowerCase().includes('claim')
      )
      
      console.log('Jobs endpoints:', jobsEndpoints)
      console.log('Leads endpoints:', leadsEndpoints)
      console.log('Claims endpoints:', claimsEndpoints)
      
      if (jobsEndpoints.length === 0 && leadsEndpoints.length === 0) {
        throw new Error('No relevant endpoints found for Monroe dashboard data')
      }

      // Fetch data from multiple endpoints
      const dashboardData: MonroeDashboardData = {
        region: 'Monroe, LA',
        period: dateRange.period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        timestamp: new Date().toISOString(),
        
        // Initialize all metrics to 0
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

      // Fetch jobs data for contracts, revenue, inspections, and backlog
      if (jobsEndpoints.length > 0) {
        try {
          const jobsData = await mcpClient.getData(jobsEndpoints[0].name)
          console.log('Jobs data received:', jobsData)
          
          // Process jobs data to extract Monroe-specific metrics
          if (jobsData?.data) {
            const jobs = Array.isArray(jobsData.data) ? jobsData.data : [jobsData.data]
            
            jobs.forEach((job: any) => {
              // Check if job is in Monroe region (you may need to adjust this filter)
              const isMonroe = job.region?.toLowerCase().includes('monroe') || 
                              job.city?.toLowerCase().includes('monroe') ||
                              job.location?.toLowerCase().includes('monroe')
              
              if (isMonroe) {
                // Contracts Signed (Jobs approved)
                if (job.status === 'approved' || job.approved === true) {
                  dashboardData.contractsSigned++
                  
                  // Sold Revenue (Job approved with total of estimate)
                  if (job.estimate_total || job.total_amount) {
                    dashboardData.soldRevenue += parseFloat(job.estimate_total || job.total_amount || 0)
                  }
                  
                  // Backlog (Jobs approved but not scheduled/deleted/completed/closed)
                  if (!['scheduled', 'deleted', 'completed', 'closed'].includes(job.status)) {
                    dashboardData.backlog++
                  }
                }
                
                // Inspections (Jobs verified)
                if (job.verified === true || job.status === 'verified') {
                  dashboardData.inspections++
                }
              }
            })
          }
        } catch (error) {
          console.error('Error fetching jobs data:', error)
        }
      }

      // Fetch leads data for door knocking and company generated leads
      if (leadsEndpoints.length > 0) {
        try {
          const leadsData = await mcpClient.getData(leadsEndpoints[0].name)
          console.log('Leads data received:', leadsData)
          
          if (leadsData?.data) {
            const leads = Array.isArray(leadsData.data) ? leadsData.data : [leadsData.data]
            
            leads.forEach((lead: any) => {
              const leadSource = lead.source?.toLowerCase() || lead.lead_source?.toLowerCase() || ''
              
              // Door Knocking Leads (Lead source contains "knocks" or "Rabbit")
              if (leadSource.includes('knocks') || leadSource.includes('rabbit')) {
                dashboardData.doorKnockingLeads++
              } else {
                // Company Generated Leads (All other lead sources)
                dashboardData.companyGeneratedLeads++
              }
            })
          }
        } catch (error) {
          console.error('Error fetching leads data:', error)
        }
      }

      // Fetch claims data
      if (claimsEndpoints.length > 0) {
        try {
          const claimsData = await mcpClient.getData(claimsEndpoints[0].name)
          console.log('Claims data received:', claimsData)
          
          if (claimsData?.data) {
            const claims = Array.isArray(claimsData.data) ? claimsData.data : [claimsData.data]
            
            claims.forEach((claim: any) => {
              dashboardData.claimsFiled++
              
              if (claim.status === 'approved' || claim.approved === true) {
                dashboardData.claimsApproved++
              }
            })
          }
        } catch (error) {
          console.error('Error fetching claims data:', error)
        }
      }

      // Calculate lead conversion percentage
      const totalLeads = dashboardData.doorKnockingLeads + dashboardData.companyGeneratedLeads
      if (totalLeads > 0) {
        dashboardData.leadConversionPercentage = (dashboardData.inspections / totalLeads) * 100
      }
      
      setDashboardData(dashboardData)
      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('Error fetching Monroe dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      setDashboardData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isConnected) {
      fetchMonroeDashboardData()
    }
  }, [isConnected, dateRangeType, customStartDate, customEndDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monroe LA Region</h2>
          <p className="text-gray-600">Comprehensive Business Dashboard</p>
        </div>
        <button
          onClick={fetchMonroeDashboardData}
          disabled={loading || !isConnected}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Select Date Range</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Range Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              value={dateRangeType}
              onChange={(e) => setDateRangeType(e.target.value as DateRangeType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="current-week">Current Week</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range Inputs */}
          {dateRangeType === 'custom' && (
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Current Date Range Display */}
        {dashboardData && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Current Range:</span> {dashboardData.startDate} to {dashboardData.endDate}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">
            Error: {error}
          </p>
          <p className="text-red-500 text-xs mt-1">
            Please ensure you're connected to the RoofLink MCP server and try again.
          </p>
        </div>
      )}

      {dashboardData ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {dashboardData.region} Dashboard
            </h3>
            <p className="text-gray-600">
              {dashboardData.period}
            </p>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Contracts Signed */}
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {dashboardData.contractsSigned}
              </div>
              <p className="text-sm font-medium text-blue-800">Contracts Signed</p>
              <p className="text-xs text-blue-600 mt-1">Jobs Approved</p>
            </div>

            {/* Sold Revenue */}
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(dashboardData.soldRevenue)}
              </div>
              <p className="text-sm font-medium text-green-800">Sold Revenue</p>
              <p className="text-xs text-green-600 mt-1">Job Approved with Estimate Total</p>
            </div>

            {/* Door Knocking Leads */}
            <div className="bg-orange-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {dashboardData.doorKnockingLeads}
              </div>
              <p className="text-sm font-medium text-orange-800">Door Knocking Leads</p>
              <p className="text-xs text-orange-600 mt-1">Source contains "knocks" or "Rabbit"</p>
            </div>

            {/* Company Generated Leads */}
            <div className="bg-purple-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {dashboardData.companyGeneratedLeads}
              </div>
              <p className="text-sm font-medium text-purple-800">Company Generated Leads</p>
              <p className="text-xs text-purple-600 mt-1">All other lead sources</p>
            </div>

            {/* Inspections */}
            <div className="bg-indigo-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {dashboardData.inspections}
              </div>
              <p className="text-sm font-medium text-indigo-800">Inspections</p>
              <p className="text-xs text-indigo-600 mt-1">Jobs Verified</p>
            </div>

            {/* Lead Conversion Percentage */}
            <div className="bg-teal-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2">
                {dashboardData.leadConversionPercentage.toFixed(1)}%
              </div>
              <p className="text-sm font-medium text-teal-800">Lead Conversion</p>
              <p className="text-xs text-teal-600 mt-1">Inspections ÷ Total Leads</p>
            </div>

            {/* Claims Filed */}
            <div className="bg-red-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {dashboardData.claimsFiled}
              </div>
              <p className="text-sm font-medium text-red-800">Claims Filed</p>
              <p className="text-xs text-red-600 mt-1">Total Claims</p>
            </div>

            {/* Claims Approved */}
            <div className="bg-emerald-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {dashboardData.claimsApproved}
              </div>
              <p className="text-sm font-medium text-emerald-800">Claims Approved</p>
              <p className="text-xs text-emerald-600 mt-1">Approved Claims</p>
            </div>

            {/* Backlog */}
            <div className="bg-yellow-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {dashboardData.backlog}
              </div>
              <p className="text-sm font-medium text-yellow-800">Backlog</p>
              <p className="text-xs text-yellow-600 mt-1">Approved but not scheduled/completed</p>
            </div>

          </div>

          {/* Summary Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {dashboardData.doorKnockingLeads + dashboardData.companyGeneratedLeads}
                </div>
                <p className="text-sm text-gray-600">Total Leads</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {dashboardData.claimsApproved > 0 ? ((dashboardData.claimsApproved / dashboardData.claimsFiled) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-sm text-gray-600">Claims Approval Rate</p>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(dashboardData.soldRevenue / Math.max(1, dashboardData.contractsSigned))}
                </div>
                <p className="text-sm text-gray-600">Avg Revenue per Contract</p>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="text-center text-sm text-gray-500">
              Last updated: {formatDate(lastUpdated.toISOString())}
            </div>
          )}
        </div>
      ) : !loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Dashboard Data Available</h3>
          <p className="text-gray-600 mb-4">
            Connect to the RoofLink MCP server to fetch live dashboard data for Monroe, LA region.
          </p>
          <button
            onClick={fetchMonroeDashboardData}
            disabled={!isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnected ? 'Fetch Dashboard Data' : 'Connect to MCP First'}
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data from RoofLink...</p>
        </div>
      )}

      {/* Connection Status */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600">
              {isConnected ? 'Connected to RoofLink MCP' : 'Disconnected'}
            </span>
          </div>
          <span className="text-gray-500">
            {dashboardData ? 'Data Available' : 'No Data'}
          </span>
        </div>
      </div>
    </div>
  )
}
