'use client'

import { useState, useEffect } from 'react'
import { mcpClient, MCPEndpoint } from '@/lib/mcp-client'

interface ComprehensiveDataViewerProps {
  isConnected: boolean
  apiKey?: string
}

interface DataItem {
  endpoint: string
  rawData: any
  processedData: any
  dataCount: number
  timestamp: string
  error?: string
}

export default function ComprehensiveDataViewer({ isConnected, apiKey }: ComprehensiveDataViewerProps) {
  const [allData, setAllData] = useState<DataItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedData, setSelectedData] = useState<DataItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showRawData, setShowRawData] = useState(false)

  const extractAllData = (rawData: any): any[] => {
    if (!rawData) return []
    
    // Try different data structures
    let items: any[] = []
    
    // Check for results array
    if (rawData.results && Array.isArray(rawData.results)) {
      items = rawData.results
    }
    // Check for data array
    else if (rawData.data && Array.isArray(rawData.data)) {
      items = rawData.data
    }
    // Check for content array with JSON text
    else if (rawData.data?.content && Array.isArray(rawData.data.content)) {
      for (const item of rawData.data.content) {
        if (item.type === 'text' && item.text) {
          try {
            const parsed = JSON.parse(item.text)
            if (parsed.results && Array.isArray(parsed.results)) {
              items = [...items, ...parsed.results]
            } else if (Array.isArray(parsed)) {
              items = [...items, ...parsed]
            } else {
              items.push(parsed)
            }
          } catch (e) {
            console.log('Could not parse content text:', e)
          }
        }
      }
    }
    // Check for sampleItems
    else if (rawData.data?.sampleItems && Array.isArray(rawData.data.sampleItems)) {
      items = rawData.data.sampleItems
    }
    // If it's already an array
    else if (Array.isArray(rawData)) {
      items = rawData
    }
    // If it's a single object, wrap it
    else if (rawData && typeof rawData === 'object') {
      items = [rawData]
    }
    
    return items
  }

  const processDataItem = (item: any, endpoint: string): any => {
    const processed: any = {
      id: item.id || item.ID || item.Id || 'unknown',
      endpoint: endpoint,
      type: item.type || item.job_type || item.bid_type || 'unknown',
      status: item.status || item.job_status?.label || item.pipeline?.verify_lead?.complete || 'unknown',
      name: item.name || item.customer?.name || item.title || 'unnamed',
      address: item.full_address || item.address || item.customer_address || item.customer?.address || 'no address',
      region: item.region?.name || item.customer?.region?.name || item.region || 'unknown region',
      city: item.city || item.customer?.city || 'unknown city',
      state: item.state || item.customer?.state || 'unknown state',
      date_created: item.date_created || item.created_at || item.created || 'unknown date',
      date_approved: item.date_approved || item.approved_at || 'not approved',
      date_closed: item.date_closed || item.closed_at || 'not closed',
      revenue: item.revenue || item.estimate || item.total || item.amount || 0,
      lead_source: item.lead_source?.name || item.customer?.lead_source?.name || item.source || 'unknown source',
      customer_name: item.customer?.name || item.customer_name || 'unknown customer',
      customer_email: item.customer?.email || item.customer_email || 'no email',
      customer_phone: item.customer?.cell || item.customer?.phone || item.customer_phone || 'no phone',
      notes: item.notes || item.last_note || item.description || 'no notes',
      photos: item.photo_count || item.photos?.length || 0,
      latitude: item.latitude || item.lat || 0,
      longitude: item.longitude || item.lng || 0,
      raw_item: item // Keep the original for reference
    }
    
    return processed
  }

  const fetchAllComprehensiveData = async () => {
    if (!isConnected) return

    setLoading(true)
    setAllData([])

    try {
      if (apiKey) {
        mcpClient.setApiKey(apiKey)
      }

      // Get all available endpoints first
      const availableEndpoints = await mcpClient.listAvailableEndpoints()
      console.log('Available MCP endpoints:', availableEndpoints)

      // Comprehensive list of endpoints to try
      const endpointsToTry = [
        // RoofLink API paths
        '/light/jobs/approved/',
        '/light/jobs/prospect/',
        '/light/leads/',
        '/light/customers/',
        '/light/claims/',
        '/light/jobs/',
        '/light/estimates/',
        '/light/inspections/',
        '/light/contracts/',
        '/light/invoices/',
        '/light/payments/',
        '/light/notes/',
        '/light/photos/',
        '/light/documents/',
        '/light/users/',
        '/light/regions/',
        '/light/lead-sources/',
        '/light/job-statuses/',
        '/light/job-types/',
        '/light/bid-types/',
        
        // MCP endpoint names
        'light-jobs-approved',
        'light-jobs-prospect',
        'light-leads',
        'light-customers',
        'light-claims',
        'light-jobs',
        'light-estimates',
        'light-inspections',
        'light-contracts',
        'light-invoices',
        'light-payments',
        'light-notes',
        'light-photos',
        'light-documents',
        'light-users',
        'light-regions',
        'light-lead-sources',
        'light-job-statuses',
        'light-job-types',
        'light-bid-types',
        
        // Try the MCP endpoint names from the list
        ...availableEndpoints.map(ep => ep.name)
      ]

      // Remove duplicates
      const uniqueEndpoints = Array.from(new Set(endpointsToTry))
      console.log(`Trying ${uniqueEndpoints.length} unique endpoints`)

      const allDataItems: DataItem[] = []

      // Try each endpoint
      for (const endpoint of uniqueEndpoints) {
        try {
          console.log(`Fetching comprehensive data from: ${endpoint}`)
          let rawData: any
          
          if (endpoint.startsWith('/')) {
            rawData = await mcpClient.getRoofLinkData(endpoint)
          } else {
            rawData = await mcpClient.getData(endpoint)
          }
          
          console.log(`Raw response from ${endpoint}:`, rawData)
          
          // Extract all data items
          const extractedItems = extractAllData(rawData)
          console.log(`Extracted ${extractedItems.length} items from ${endpoint}`)
          
          // Process each item
          const processedItems = extractedItems.map(item => processDataItem(item, endpoint))
          
          if (extractedItems.length > 0) {
            allDataItems.push({
              endpoint,
              rawData,
              processedData: processedItems,
              dataCount: extractedItems.length,
              timestamp: new Date().toISOString()
            })
            
            console.log(`Successfully processed ${extractedItems.length} items from ${endpoint}`)
          }
          
        } catch (error) {
          console.error(`Error from ${endpoint}:`, error)
          allDataItems.push({
            endpoint,
            rawData: null,
            processedData: [],
            dataCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })
        }
      }

      setAllData(allDataItems)
      console.log('Comprehensive data collection complete:', allDataItems)

    } catch (error) {
      console.error('Error in comprehensive data fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = allData.filter(item => 
    item.endpoint.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalItems = allData.reduce((sum, item) => sum + item.dataCount, 0)
  const successfulEndpoints = allData.filter(item => !item.error).length
  const totalEndpoints = allData.length

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">📊 Comprehensive Data Viewer</h3>
          <p className="text-sm text-gray-600">View ALL extracted data in a structured format</p>
        </div>
        <button
          onClick={fetchAllComprehensiveData}
          disabled={loading || !isConnected}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Extracting All Data...' : 'Extract All Data'}
        </button>
      </div>

      {/* Summary Stats */}
      {allData.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold mb-2 text-green-800">Data Extraction Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Endpoints:</span>
              <span className="ml-2 text-green-600">{totalEndpoints}</span>
            </div>
            <div>
              <span className="font-medium">Successful:</span>
              <span className="ml-2 text-green-600">{successfulEndpoints}</span>
            </div>
            <div>
              <span className="font-medium">Total Items:</span>
              <span className="ml-2 text-green-600">{totalItems}</span>
            </div>
            <div>
              <span className="font-medium">Success Rate:</span>
              <span className="ml-2 text-green-600">
                {totalEndpoints > 0 ? ((successfulEndpoints / totalEndpoints) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search endpoints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showRawData}
              onChange={(e) => setShowRawData(e.target.checked)}
            />
            <span className="text-sm">Show raw data</span>
          </label>
        </div>
        
        {loading && (
          <div className="flex items-center gap-2 text-green-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            <span className="text-sm">Extracting data from all endpoints...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoint List */}
        <div>
          <h4 className="font-semibold mb-4">Data Sources ({filteredData.length})</h4>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredData.map((item, index) => (
              <div
                key={index}
                onClick={() => setSelectedData(item)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedData?.endpoint === item.endpoint
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm truncate">{item.endpoint}</span>
                  <div className="flex items-center gap-2">
                    {item.error ? (
                      <span className="text-red-600 text-xs">Error</span>
                    ) : (
                      <span className="text-green-600 text-xs">{item.dataCount} items</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {item.error ? item.error : `${item.dataCount} data items extracted`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Display */}
        <div>
          {selectedData ? (
            <div>
              <h4 className="font-semibold mb-4">
                Data from: {selectedData.endpoint} ({selectedData.dataCount} items)
              </h4>
              
              {selectedData.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h5 className="font-medium text-red-800 mb-2">Error:</h5>
                  <p className="text-red-600 text-sm">{selectedData.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Processed Data Table */}
                  <div>
                    <h5 className="font-medium mb-2">Processed Data ({selectedData.processedData.length} items):</h5>
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-2 py-1 text-left">ID</th>
                            <th className="px-2 py-1 text-left">Type</th>
                            <th className="px-2 py-1 text-left">Name</th>
                            <th className="px-2 py-1 text-left">Status</th>
                            <th className="px-2 py-1 text-left">Region</th>
                            <th className="px-2 py-1 text-left">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedData.processedData.map((item: any, index: number) => (
                            <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                              <td className="px-2 py-1">{item.id}</td>
                              <td className="px-2 py-1">{item.type}</td>
                              <td className="px-2 py-1 truncate max-w-32" title={item.name}>{item.name}</td>
                              <td className="px-2 py-1">{item.status}</td>
                              <td className="px-2 py-1">{item.region}</td>
                              <td className="px-2 py-1">${item.revenue}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Raw Data */}
                  {showRawData && (
                    <div>
                      <h5 className="font-medium mb-2">Raw Data:</h5>
                      <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(selectedData.rawData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p>Select a data source to view extracted data</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold text-green-800 mb-2">How to Use This Viewer:</h4>
        <ol className="text-sm text-green-700 space-y-1">
          <li>1. Click "Extract All Data" to pull and process data from all endpoints</li>
          <li>2. Browse the data sources on the left (shows item count for each)</li>
          <li>3. Click any source to see the processed data in table format</li>
          <li>4. Toggle "Show raw data" to see the original JSON responses</li>
          <li>5. Use search to filter data sources by name</li>
        </ol>
        <p className="text-xs text-green-600 mt-2">
          This viewer extracts and structures ALL available data so you can see exactly what's available and how it's organized.
        </p>
      </div>
    </div>
  )
}
