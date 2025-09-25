'use client'

import { useState, useEffect } from 'react'
import { mcpClient, MCPEndpoint } from '@/lib/mcp-client'

interface DataExplorerProps {
  isConnected: boolean
  apiKey?: string
}

interface RawDataItem {
  endpoint: string
  data: any
  timestamp: string
  error?: string
}

export default function DataExplorer({ isConnected, apiKey }: DataExplorerProps) {
  const [rawData, setRawData] = useState<RawDataItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyErrors, setShowOnlyErrors] = useState(false)
  const [endpoints, setEndpoints] = useState<MCPEndpoint[]>([])

  const fetchAllData = async () => {
    if (!isConnected) return

    setLoading(true)
    setRawData([])

    try {
      // Set API key if provided
      if (apiKey) {
        mcpClient.setApiKey(apiKey)
      }

      // Get all available endpoints
      const availableEndpoints = await mcpClient.listAvailableEndpoints()
      setEndpoints(availableEndpoints)
      console.log('Available endpoints:', availableEndpoints)

      // Try to get the list of actual API endpoints
      let actualEndpoints: string[] = []
      try {
        const listEndpointsData = await mcpClient.getData('list-endpoints')
        console.log('List endpoints response:', listEndpointsData)
        
        if (listEndpointsData?.data?.content?.[0]?.text) {
          const endpointData = JSON.parse(listEndpointsData.data.content[0].text)
          actualEndpoints = Object.keys(endpointData)
          console.log('Actual API endpoints found:', actualEndpoints)
        }
      } catch (error) {
        console.log('Could not get endpoint list:', error)
      }

      // Comprehensive list of endpoints to try
      const endpointsToTry = [
        // Specific RoofLink API paths
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
        
        // Add any actual endpoints we discovered
        ...actualEndpoints
      ]

      // Remove duplicates
      const uniqueEndpoints = [...new Set(endpointsToTry)]
      console.log(`Trying ${uniqueEndpoints.length} unique endpoints`)

      // Try each endpoint
      for (const endpoint of uniqueEndpoints) {
        try {
          console.log(`Fetching data from: ${endpoint}`)
          let data: any
          
          if (endpoint.startsWith('/')) {
            // Try as RoofLink API path
            data = await mcpClient.getRoofLinkData(endpoint)
          } else {
            // Try as MCP endpoint name
            data = await mcpClient.getData(endpoint)
          }
          
          console.log(`Success from ${endpoint}:`, data)
          
          setRawData(prev => [...prev, {
            endpoint,
            data,
            timestamp: new Date().toISOString()
          }])
          
        } catch (error) {
          console.error(`Error from ${endpoint}:`, error)
          setRawData(prev => [...prev, {
            endpoint,
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          }])
        }
      }

    } catch (error) {
      console.error('Error fetching all data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDataForDisplay = (data: any): string => {
    if (!data) return 'No data'
    
    try {
      return JSON.stringify(data, null, 2)
    } catch (error) {
      return String(data)
    }
  }

  const extractDataStructure = (data: any): string[] => {
    const fields: string[] = []
    
    const extractFields = (obj: any, prefix = '') => {
      if (obj && typeof obj === 'object') {
        if (Array.isArray(obj)) {
          fields.push(`${prefix}[${obj.length} items]`)
          if (obj.length > 0) {
            extractFields(obj[0], `${prefix}[0]`)
          }
        } else {
          Object.keys(obj).forEach(key => {
            const fullKey = prefix ? `${prefix}.${key}` : key
            if (obj[key] && typeof obj[key] === 'object') {
              fields.push(`${fullKey} (object)`)
              extractFields(obj[key], fullKey)
            } else {
              fields.push(`${fullKey}: ${typeof obj[key]} = ${String(obj[key]).substring(0, 50)}`)
            }
          })
        }
      }
    }
    
    extractFields(data)
    return fields
  }

  const filteredData = rawData.filter(item => {
    if (showOnlyErrors && !item.error) return false
    if (searchTerm && !item.endpoint.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const selectedData = selectedEndpoint ? rawData.find(item => item.endpoint === selectedEndpoint) : null

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">🔍 Complete Data Explorer</h3>
          <p className="text-sm text-gray-600">Explore ALL available data from RoofLink API</p>
        </div>
        <button
          onClick={fetchAllData}
          disabled={loading || !isConnected}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Fetching All Data...' : 'Fetch All Data'}
        </button>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search endpoints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlyErrors}
              onChange={(e) => setShowOnlyErrors(e.target.checked)}
            />
            <span className="text-sm">Show only errors</span>
          </label>
        </div>
        
        {loading && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Fetching data from all endpoints...</span>
          </div>
        )}
      </div>

      {/* Data Summary */}
      {rawData.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Data Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Endpoints:</span>
              <span className="ml-2 text-blue-600">{rawData.length}</span>
            </div>
            <div>
              <span className="font-medium">Successful:</span>
              <span className="ml-2 text-green-600">{rawData.filter(item => !item.error).length}</span>
            </div>
            <div>
              <span className="font-medium">Errors:</span>
              <span className="ml-2 text-red-600">{rawData.filter(item => item.error).length}</span>
            </div>
            <div>
              <span className="font-medium">With Data:</span>
              <span className="ml-2 text-purple-600">{rawData.filter(item => item.data && !item.error).length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoint List */}
        <div className="lg:col-span-1">
          <h4 className="font-semibold mb-4">Available Endpoints ({filteredData.length})</h4>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredData.map((item, index) => (
              <div
                key={index}
                onClick={() => setSelectedEndpoint(item.endpoint)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedEndpoint === item.endpoint
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm truncate">{item.endpoint}</span>
                  <div className="flex items-center gap-1">
                    {item.error ? (
                      <span className="w-2 h-2 bg-red-500 rounded-full" title="Error"></span>
                    ) : (
                      <span className="w-2 h-2 bg-green-500 rounded-full" title="Success"></span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {item.error ? `Error: ${item.error.substring(0, 50)}...` : 'Success'}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Display */}
        <div className="lg:col-span-2">
          {selectedData ? (
            <div>
              <h4 className="font-semibold mb-4">Data from: {selectedData.endpoint}</h4>
              
              {selectedData.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h5 className="font-medium text-red-800 mb-2">Error:</h5>
                  <p className="text-red-600 text-sm">{selectedData.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Data Structure */}
                  <div>
                    <h5 className="font-medium mb-2">Data Structure:</h5>
                    <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                      <pre className="text-xs">
                        {extractDataStructure(selectedData.data).map((field, index) => (
                          <div key={index}>{field}</div>
                        ))}
                      </pre>
                    </div>
                  </div>

                  {/* Raw Data */}
                  <div>
                    <h5 className="font-medium mb-2">Raw Data:</h5>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {formatDataForDisplay(selectedData.data)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p>Select an endpoint to view its data</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">How to Use This Explorer:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Click "Fetch All Data" to pull data from all available endpoints</li>
          <li>2. Browse the endpoint list on the left (green = success, red = error)</li>
          <li>3. Click any endpoint to see its data structure and raw content</li>
          <li>4. Use the search box to filter endpoints by name</li>
          <li>5. Check "Show only errors" to see what's failing</li>
        </ol>
        <p className="text-xs text-blue-600 mt-2">
          This will help us understand what data is actually available and how to properly display it in your dashboard.
        </p>
      </div>
    </div>
  )
}
