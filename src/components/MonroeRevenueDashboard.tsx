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
  const [debugMode, setDebugMode] = useState<boolean>(false)
  const [showRawData, setShowRawData] = useState<boolean>(false)
  const [rawDataLog, setRawDataLog] = useState<any[]>([])

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
      console.log('Endpoint details:', endpoints.map(ep => ({ name: ep.name, description: ep.description, status: ep.status })))
      
      // First, get the actual API endpoints from the list-endpoints response
      let actualEndpoints: MCPEndpoint[] = []
      
      // Try to extract actual endpoints from the list-endpoints response
      try {
        const listEndpointsData = await mcpClient.getData('list-endpoints')
        console.log('List endpoints response:', listEndpointsData)
        
        if (listEndpointsData?.data?.content?.[0]?.text) {
          const endpointText = listEndpointsData.data.content[0].text
          console.log('Endpoint text:', endpointText)
          
          // Parse the JSON string from the text field
          const endpointData = JSON.parse(endpointText)
          console.log('Parsed endpoint data:', endpointData)
          
          // Convert to MCPEndpoint format
          actualEndpoints = Object.entries(endpointData).map(([path, methods]: [string, any]) => ({
            name: path.replace(/^\//, '').replace(/\//g, '-').replace(/-$/, ''),
            description: methods.get || methods.post || 'API endpoint',
            status: 'available' as const
          }))
          
          console.log('Converted actual endpoints:', actualEndpoints)
        }
      } catch (error) {
        console.log('Could not parse endpoint list:', error)
      }
      
      // Use actual endpoints if available, otherwise fall back to the original logic
      const endpointsToSearch = actualEndpoints.length > 0 ? actualEndpoints : endpoints
      
      // Look for relevant endpoints for Monroe dashboard metrics
      const jobsEndpoints = endpointsToSearch.filter(ep => 
        ep.name.toLowerCase().includes('jobs') ||
        ep.name.toLowerCase().includes('approved') ||
        ep.name.toLowerCase().includes('prospects') ||
        ep.name.toLowerCase().includes('job') ||
        ep.name.toLowerCase().includes('contract') ||
        ep.name.toLowerCase().includes('estimate') ||
        ep.name.toLowerCase().includes('inspection') ||
        ep.name.toLowerCase().includes('verified')
      )
      
      const leadsEndpoints = endpointsToSearch.filter(ep => 
        ep.name.toLowerCase().includes('leads') ||
        ep.name.toLowerCase().includes('lead') ||
        ep.name.toLowerCase().includes('prospect') ||
        ep.name.toLowerCase().includes('customer')
      )
      
      const claimsEndpoints = endpointsToSearch.filter(ep => 
        ep.name.toLowerCase().includes('claims') ||
        ep.name.toLowerCase().includes('claim') ||
        ep.name.toLowerCase().includes('insurance')
      )
      
      // Also look for any analytics or reporting endpoints
      const analyticsEndpoints = endpointsToSearch.filter(ep => 
        ep.name.toLowerCase().includes('analytics') ||
        ep.name.toLowerCase().includes('report') ||
        ep.name.toLowerCase().includes('dashboard') ||
        ep.name.toLowerCase().includes('summary')
      )
      
      console.log('All available endpoints:', endpoints.map(ep => ep.name))
      console.log('Jobs endpoints:', jobsEndpoints)
      console.log('Leads endpoints:', leadsEndpoints)
      console.log('Claims endpoints:', claimsEndpoints)
      console.log('Analytics endpoints:', analyticsEndpoints)
      
      // If no specific endpoints found, try to use any available endpoint
      const allRelevantEndpoints = [...jobsEndpoints, ...leadsEndpoints, ...claimsEndpoints, ...analyticsEndpoints]
      
      if (allRelevantEndpoints.length === 0 && endpoints.length > 0) {
        console.log('No specific endpoints found, will try to use first available endpoint:', endpoints[0])
        // We'll try to use the first available endpoint and see what data we can extract
      } else if (endpoints.length === 0) {
        throw new Error('No endpoints available from RoofLink MCP server')
      }

      // Fetch data from multiple endpoints
      const dashboardData: MonroeDashboardData = {
        region: 'Monroe LA',
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

      // Try to fetch data from the specific RoofLink API endpoints we discovered
      const specificEndpoints = [
        '/light/jobs/approved/',
        '/light/jobs/prospect/',
        '/light/leads/',
        '/light/customers/',
        '/light/claims/'
      ]
      
      console.log(`Will try ${specificEndpoints.length} specific RoofLink endpoints:`, specificEndpoints)
      
      let dataFound = false
      let rawDataLog: any[] = []
      
      // First try the specific RoofLink API endpoints
      for (const apiPath of specificEndpoints) {
        try {
          console.log(`Trying RoofLink API path: ${apiPath}`)
          const data = await mcpClient.getRoofLinkData(apiPath)
          console.log(`Raw data from ${apiPath}:`, JSON.stringify(data, null, 2))
          
          // Store raw data for debugging
          rawDataLog.push({
            endpoint: apiPath,
            rawResponse: data,
            timestamp: new Date().toISOString()
          })
          
          // Update the state for UI display
          setRawDataLog(prev => [...prev, {
            endpoint: apiPath,
            rawResponse: data,
            timestamp: new Date().toISOString()
          }])
          
          // Process the data based on what we receive
          if (data?.data) {
            dataFound = true
            
            // Handle different data structures
            let items: any[] = []
            if (data.data.sampleItems) {
              // Mock data structure
              items = data.data.sampleItems
              console.log(`Processing mock data with ${items.length} items from ${endpoint.name}`)
            } else if (Array.isArray(data.data)) {
              items = data.data
              console.log(`Processing ${items.length} items from ${endpoint.name}`)
            } else {
              items = [data.data]
              console.log(`Processing single item from ${endpoint.name}`)
            }
            
            console.log(`First item structure:`, items.length > 0 ? Object.keys(items[0]) : 'No items')
            
            items.forEach((item: any, index: number) => {
              console.log(`Item ${index} from ${endpoint.name}:`, JSON.stringify(item, null, 2))
              
              // Check if item is in Monroe LA region (be more flexible)
              const isMonroe = item.region?.toLowerCase().includes('monroe') || 
                              item.region?.toLowerCase().includes('la') ||
                              item.city?.toLowerCase().includes('monroe') ||
                              item.location?.toLowerCase().includes('monroe') ||
                              item.address?.toLowerCase().includes('monroe') ||
                              item.customer_address?.toLowerCase().includes('monroe') ||
                              item.customer?.address?.toLowerCase().includes('monroe') ||
                              item.job?.address?.toLowerCase().includes('monroe') ||
                              item.state?.toLowerCase() === 'la' ||
                              item.state?.toLowerCase() === 'louisiana'
              
              console.log(`Item ${index} Monroe LA check:`, { 
                isMonroe, 
                region: item.region, 
                city: item.city, 
                state: item.state,
                address: item.address 
              })
              
              // Process Monroe LA region data specifically (or all data in debug mode)
              if (isMonroe || debugMode) {
                // Try to identify the type of data and process accordingly
                
                // Jobs/Contracts data - be more flexible with field names
                const status = item.status || item.job_status || item.contract_status || item.work_status || item.approval_status || item.stage
                const approved = item.approved || item.is_approved || item.approval_status === 'approved' || status === 'approved' || status === 'Approved'
                const verified = item.verified || item.is_verified || item.verification_status === 'verified' || status === 'verified' || status === 'Verified'
                
                if (status || approved || verified) {
                  console.log(`Processing job/contract item:`, { 
                    status, 
                    approved, 
                    verified, 
                    id: item.id || item.job_id || item.contract_id 
                  })
                  
                  // Contracts Signed (Jobs approved)
                  if (approved) {
                    dashboardData.contractsSigned++
                    console.log('Found approved contract/job')
                    
                    // Sold Revenue (Job approved with total of estimate)
                    const revenue = item.estimate_total || item.total_amount || item.amount || item.revenue || 
                                  item.estimate_amount || item.job_amount || item.contract_amount || 
                                  item.total || item.value || item.price || 0
                    if (revenue && parseFloat(revenue.toString()) > 0) {
                      dashboardData.soldRevenue += parseFloat(revenue.toString())
                      console.log(`Added revenue: ${revenue}`)
                    }
                    
                    // Backlog (Jobs approved but not scheduled/deleted/completed/closed)
                    const finalStatus = status?.toLowerCase() || ''
                    if (!['scheduled', 'deleted', 'completed', 'closed', 'finished', 'done'].includes(finalStatus)) {
                      dashboardData.backlog++
                      console.log('Added to backlog')
                    }
                  }
                  
                  // Inspections (Jobs verified)
                  if (verified) {
                    dashboardData.inspections++
                    console.log('Found verified inspection')
                  }
                }
                
                // Leads data - be more flexible with field names
                const leadSource = item.source || item.lead_source || item.lead_type || item.leadSource || item.leadType || item.origin || item.lead_origin
                if (leadSource || item.lead_id || item.prospect_id || item.customer_id) {
                  const source = (leadSource || '').toLowerCase()
                  console.log(`Processing lead with source: ${source}`)
                  
                  // Door Knocking Leads (Source contains "knocks" or "Rabbit")
                  if (source.includes('knocks') || source.includes('rabbit') || source.includes('door') || 
                      source.includes('knock') || source.includes('canvass') || source.includes('door-to-door')) {
                    dashboardData.doorKnockingLeads++
                    console.log('Found door knocking lead')
                  } else if (source) {
                    // Company Generated Leads (All other lead sources)
                    dashboardData.companyGeneratedLeads++
                    console.log('Found company generated lead')
                  } else {
                    // If no source specified but it's a lead record, count as company generated
                    dashboardData.companyGeneratedLeads++
                    console.log('Found lead with no specified source - counting as company generated')
                  }
                }
                
                // Claims data - be more flexible with field names
                const claimId = item.claim_id || item.claimId || item.insurance_claim_id || item.claim_number
                const claimStatus = item.claim_status || item.claimStatus || item.status || item.insurance_status
                if (claimId || claimStatus || item.insurance_claim || item.claim_amount) {
                  dashboardData.claimsFiled++
                  console.log('Found claim:', { claimId, claimStatus })
                  
                  const isApproved = claimStatus === 'approved' || claimStatus === 'Approved' || 
                                   item.approved === true || item.claim_approved === true ||
                                   claimStatus === 'accepted' || claimStatus === 'Accepted'
                  if (isApproved) {
                    dashboardData.claimsApproved++
                    console.log('Found approved claim')
                  }
                }
                
                // Generic data processing - look for any numeric values that might be revenue
                if (item.amount || item.total || item.value || item.price) {
                  const amount = item.amount || item.total || item.value || item.price
                  if (typeof amount === 'number' && amount > 0) {
                    dashboardData.soldRevenue += amount
                    console.log(`Added generic amount: ${amount}`)
                  }
                }
              }
            })
          } else {
            console.log(`No data field found in response from ${apiPath}`)
          }
        } catch (error) {
          console.error(`Error fetching data from ${apiPath}:`, error)
        }
      }
      
      // If no data found from specific endpoints, try the original MCP endpoints as fallback
      if (!dataFound) {
        console.log('No data found from specific RoofLink endpoints, trying MCP endpoints as fallback')
        
        const endpointsToTry = allRelevantEndpoints.length > 0 ? allRelevantEndpoints : endpoints.slice(0, 3)
        
        for (const endpoint of endpointsToTry) {
          try {
            console.log(`Trying MCP endpoint: ${endpoint.name}`)
            const data = await mcpClient.getData(endpoint.name)
            console.log(`Raw data from MCP ${endpoint.name}:`, JSON.stringify(data, null, 2))
            
            // Store raw data for debugging
            rawDataLog.push({
              endpoint: endpoint.name,
              rawResponse: data,
              timestamp: new Date().toISOString()
            })
            
            // Update the state for UI display
            setRawDataLog(prev => [...prev, {
              endpoint: endpoint.name,
              rawResponse: data,
              timestamp: new Date().toISOString()
            }])
            
            // Process the data based on what we receive
            if (data?.data) {
              dataFound = true
              
              // Handle different data structures
              let items: any[] = []
              if (data.data.sampleItems) {
                // Mock data structure
                items = data.data.sampleItems
                console.log(`Processing mock data with ${items.length} items from ${endpoint.name}`)
              } else if (Array.isArray(data.data)) {
                items = data.data
                console.log(`Processing ${items.length} items from ${endpoint.name}`)
              } else {
                items = [data.data]
                console.log(`Processing single item from ${endpoint.name}`)
              }
              
              console.log(`First item structure:`, items.length > 0 ? Object.keys(items[0]) : 'No items')
              
              items.forEach((item: any, index: number) => {
                console.log(`Item ${index} from ${endpoint.name}:`, JSON.stringify(item, null, 2))
                
                // Check if item is in Monroe LA region (be more flexible)
                const isMonroe = item.region?.toLowerCase().includes('monroe') || 
                                item.region?.toLowerCase().includes('la') ||
                                item.city?.toLowerCase().includes('monroe') ||
                                item.location?.toLowerCase().includes('monroe') ||
                                item.address?.toLowerCase().includes('monroe') ||
                                item.customer_address?.toLowerCase().includes('monroe') ||
                                item.customer?.address?.toLowerCase().includes('monroe') ||
                                item.job?.address?.toLowerCase().includes('monroe') ||
                                item.state?.toLowerCase() === 'la' ||
                                item.state?.toLowerCase() === 'louisiana'
                
                console.log(`Item ${index} Monroe LA check:`, { 
                  isMonroe, 
                  region: item.region, 
                  city: item.city, 
                  state: item.state,
                  address: item.address 
                })
                
                // Process Monroe LA region data specifically (or all data in debug mode)
                if (isMonroe || debugMode) {
                  // Process the data (same logic as above)
                  // [Previous data processing logic would go here]
                }
              })
            }
          } catch (error) {
            console.error(`Error fetching data from MCP ${endpoint.name}:`, error)
          }
        }
      }
      
      if (!dataFound) {
        console.log('No data found in any endpoint response')
        // For debugging, let's try to show what endpoints returned and what data structure we got
        console.log('Available endpoints that were tried:', specificEndpoints)
      }
      
      // Add debugging info about what data we processed
      console.log('Monroe LA data processing summary:', {
        totalItemsProcessed: dashboardData.contractsSigned + dashboardData.doorKnockingLeads + dashboardData.companyGeneratedLeads + dashboardData.claimsFiled,
        contractsSigned: dashboardData.contractsSigned,
        soldRevenue: dashboardData.soldRevenue,
        doorKnockingLeads: dashboardData.doorKnockingLeads,
        companyGeneratedLeads: dashboardData.companyGeneratedLeads,
        inspections: dashboardData.inspections,
        claimsFiled: dashboardData.claimsFiled,
        claimsApproved: dashboardData.claimsApproved,
        backlog: dashboardData.backlog
      })
      
      // Log all raw data for debugging
      console.log('=== RAW DATA ANALYSIS ===')
      console.log('Total endpoints tried:', endpointsToTry.length)
      console.log('Raw data log:', rawDataLog)
      
      // If no data found and we're in debug mode, add some sample data
      if (!dataFound && debugMode) {
        console.log('No real data found, adding sample data for debugging...')
        dashboardData.contractsSigned = 5
        dashboardData.soldRevenue = 125000
        dashboardData.doorKnockingLeads = 12
        dashboardData.companyGeneratedLeads = 8
        dashboardData.inspections = 15
        dashboardData.claimsFiled = 3
        dashboardData.claimsApproved = 2
        dashboardData.backlog = 2
        dataFound = true
      }


      // Calculate lead conversion percentage
      const totalLeads = dashboardData.doorKnockingLeads + dashboardData.companyGeneratedLeads
      if (totalLeads > 0) {
        dashboardData.leadConversionPercentage = (dashboardData.inspections / totalLeads) * 100
      }
      
      console.log('Final dashboard data:', dashboardData)
      
      // If we got some data, show it even if it's not Monroe-specific
      if (dashboardData.contractsSigned > 0 || dashboardData.soldRevenue > 0 || dashboardData.doorKnockingLeads > 0 || dashboardData.companyGeneratedLeads > 0 || dashboardData.inspections > 0 || dashboardData.claimsFiled > 0) {
        setDashboardData(dashboardData)
        setLastUpdated(new Date())
      } else if (dataFound) {
        // If we found data but couldn't process it, show empty dashboard with a note
        console.log('Data was found but could not be processed into dashboard metrics')
        setDashboardData(dashboardData)
        setLastUpdated(new Date())
      } else {
        throw new Error('No data found in any of the available endpoints. Check browser console for detailed logs.')
      }
      
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
          <p className="text-gray-600">RoofLink Regional Business Dashboard</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchMonroeDashboardData}
            disabled={loading || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`px-4 py-2 rounded-md text-sm ${
              debugMode 
                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {debugMode ? 'Debug Mode: ON' : 'Debug Mode: OFF'}
          </button>
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            {showRawData ? 'Hide Raw Data' : 'Show Raw Data'}
          </button>
        </div>
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

      {/* Raw Data Debug Section */}
      {showRawData && (
        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-purple-800">Raw API Data Debug</h3>
          {rawDataLog.length > 0 ? (
            <div className="space-y-4">
              {rawDataLog.map((log, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-purple-700 mb-2">
                    Endpoint: {log.endpoint} (at {new Date(log.timestamp).toLocaleTimeString()})
                  </h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">
                    {JSON.stringify(log.rawResponse, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-purple-600">No raw data available. Click "Refresh Data" to fetch API responses.</p>
          )}
        </div>
      )}

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
              {debugMode && <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">DEBUG MODE</span>}
            </h3>
            <p className="text-gray-600">
              {dashboardData.period}
            </p>
            {debugMode && (
              <p className="text-sm text-yellow-600 mt-2">
                Debug mode is showing data from all regions, not just Monroe LA
              </p>
            )}
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
