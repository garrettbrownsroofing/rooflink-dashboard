'use client'

import { useState } from 'react'
import { mcpClient, MCPEndpoint } from '@/lib/mcp-client'

interface MCPDebuggerProps {
  isConnected: boolean
  apiKey?: string
}

interface DebugResult {
  endpoint: string
  method: string
  rawResponse: any
  responseSize: number
  hasData: boolean
  dataStructure: string
  error?: string
  timestamp: string
}

export default function MCPDebugger({ isConnected, apiKey }: MCPDebuggerProps) {
  const [debugResults, setDebugResults] = useState<DebugResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState<DebugResult | null>(null)

  const debugMCPConnection = async () => {
    if (!isConnected) return

    setLoading(true)
    setDebugResults([])

    try {
      if (apiKey) {
        mcpClient.setApiKey(apiKey)
        console.log('API key set for debugging')
      }

      const results: DebugResult[] = []

      // Test 1: Get server info
      try {
        console.log('Testing server info...')
        const serverInfo = await mcpClient.getServerInfo()
        results.push({
          endpoint: 'server-info',
          method: 'getServerInfo()',
          rawResponse: serverInfo,
          responseSize: JSON.stringify(serverInfo).length,
          hasData: !!serverInfo,
          dataStructure: serverInfo ? Object.keys(serverInfo).join(', ') : 'none',
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        results.push({
          endpoint: 'server-info',
          method: 'getServerInfo()',
          rawResponse: null,
          responseSize: 0,
          hasData: false,
          dataStructure: 'none',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }

      // Test 2: List available endpoints
      try {
        console.log('Testing list available endpoints...')
        const endpoints = await mcpClient.listAvailableEndpoints()
        results.push({
          endpoint: 'list-endpoints',
          method: 'listAvailableEndpoints()',
          rawResponse: endpoints,
          responseSize: JSON.stringify(endpoints).length,
          hasData: endpoints && endpoints.length > 0,
          dataStructure: endpoints ? `${endpoints.length} endpoints: ${endpoints.map(e => e.name).join(', ')}` : 'none',
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        results.push({
          endpoint: 'list-endpoints',
          method: 'listAvailableEndpoints()',
          rawResponse: null,
          responseSize: 0,
          hasData: false,
          dataStructure: 'none',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }

      // Test 3: Try to get the actual API endpoints list
      try {
        console.log('Testing getData for list-endpoints...')
        const listData = await mcpClient.getData('list-endpoints')
        results.push({
          endpoint: 'list-endpoints-data',
          method: 'getData("list-endpoints")',
          rawResponse: listData,
          responseSize: JSON.stringify(listData).length,
          hasData: !!listData,
          dataStructure: listData ? 'API endpoints list' : 'none',
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        results.push({
          endpoint: 'list-endpoints-data',
          method: 'getData("list-endpoints")',
          rawResponse: null,
          responseSize: 0,
          hasData: false,
          dataStructure: 'none',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }

      // Test 4: Try different jobs endpoints with various parameters
      const jobsEndpoints = [
        '/light/jobs/',
        '/light/jobs/approved/',
        '/light/jobs/prospect/',
        'light-jobs',
        'light-jobs-approved',
        'light-jobs-prospect'
      ]

      for (const endpoint of jobsEndpoints) {
        try {
          console.log(`Testing jobs endpoint: ${endpoint}`)
          let response: any
          
          if (endpoint.startsWith('/')) {
            response = await mcpClient.getRoofLinkData(endpoint)
          } else {
            response = await mcpClient.getData(endpoint)
          }
          
          // Analyze the response structure
          let dataStructure = 'none'
          let hasData = false
          
          if (response) {
            if (response.results && Array.isArray(response.results)) {
              dataStructure = `results array with ${response.results.length} items`
              hasData = response.results.length > 0
            } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
              dataStructure = `data.results array with ${response.data.results.length} items`
              hasData = response.data.results.length > 0
            } else if (response.data && Array.isArray(response.data)) {
              dataStructure = `data array with ${response.data.length} items`
              hasData = response.data.length > 0
            } else if (response.data && response.data.content && Array.isArray(response.data.content)) {
              dataStructure = `data.content array with ${response.data.content.length} items`
              hasData = response.data.content.length > 0
            } else if (Array.isArray(response)) {
              dataStructure = `direct array with ${response.length} items`
              hasData = response.length > 0
            } else {
              dataStructure = `object with keys: ${Object.keys(response).join(', ')}`
              hasData = true
            }
          }
          
          results.push({
            endpoint,
            method: endpoint.startsWith('/') ? 'getRoofLinkData()' : 'getData()',
            rawResponse: response,
            responseSize: JSON.stringify(response).length,
            hasData,
            dataStructure,
            timestamp: new Date().toISOString()
          })
          
        } catch (error) {
          results.push({
            endpoint,
            method: endpoint.startsWith('/') ? 'getRoofLinkData()' : 'getData()',
            rawResponse: null,
            responseSize: 0,
            hasData: false,
            dataStructure: 'none',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })
        }
      }

      // Test 5: Try with different parameters
      try {
        console.log('Testing jobs with parameters...')
        const response = await mcpClient.getRoofLinkData('/light/jobs/?limit=100&offset=0')
        results.push({
          endpoint: '/light/jobs/?limit=100&offset=0',
          method: 'getRoofLinkData() with params',
          rawResponse: response,
          responseSize: JSON.stringify(response).length,
          hasData: !!response,
          dataStructure: response ? 'jobs with pagination params' : 'none',
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        results.push({
          endpoint: '/light/jobs/?limit=100&offset=0',
          method: 'getRoofLinkData() with params',
          rawResponse: null,
          responseSize: 0,
          hasData: false,
          dataStructure: 'none',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })
      }

      setDebugResults(results)
      console.log('MCP Debug complete:', results)

    } catch (error) {
      console.error('Error in MCP debugging:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatResponse = (response: any): string => {
    if (!response) return 'No response'
    try {
      return JSON.stringify(response, null, 2)
    } catch (error) {
      return String(response)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">🔧 MCP Connection Debugger</h3>
          <p className="text-sm text-gray-600">Debug MCP connection and data retrieval issues</p>
        </div>
        <button
          onClick={debugMCPConnection}
          disabled={loading || !isConnected}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Debugging...' : 'Debug MCP Connection'}
        </button>
      </div>

      {/* Debug Results Summary */}
      {debugResults.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Debug Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Tests:</span>
              <span className="ml-2 text-gray-600">{debugResults.length}</span>
            </div>
            <div>
              <span className="font-medium">Successful:</span>
              <span className="ml-2 text-green-600">{debugResults.filter(r => !r.error).length}</span>
            </div>
            <div>
              <span className="font-medium">With Data:</span>
              <span className="ml-2 text-blue-600">{debugResults.filter(r => r.hasData).length}</span>
            </div>
            <div>
              <span className="font-medium">Errors:</span>
              <span className="ml-2 text-red-600">{debugResults.filter(r => r.error).length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debug Results List */}
        <div>
          <h4 className="font-semibold mb-4">Debug Results ({debugResults.length})</h4>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {debugResults.map((result, index) => (
              <div
                key={index}
                onClick={() => setSelectedResult(result)}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedResult?.endpoint === result.endpoint
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{result.endpoint}</span>
                  <div className="flex items-center gap-2">
                    {result.error ? (
                      <span className="text-red-600 text-xs">Error</span>
                    ) : result.hasData ? (
                      <span className="text-green-600 text-xs">Has Data</span>
                    ) : (
                      <span className="text-gray-600 text-xs">No Data</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {result.error ? result.error : `${result.responseSize} bytes - ${result.dataStructure}`}
                </div>
                <div className="text-xs text-gray-400">
                  {result.method} - {new Date(result.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Response */}
        <div>
          {selectedResult ? (
            <div>
              <h4 className="font-semibold mb-4">
                Response from: {selectedResult.endpoint}
              </h4>
              
              {selectedResult.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h5 className="font-medium text-red-800 mb-2">Error:</h5>
                  <p className="text-red-600 text-sm">{selectedResult.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Response Info */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm space-y-1">
                      <div><strong>Method:</strong> {selectedResult.method}</div>
                      <div><strong>Response Size:</strong> {selectedResult.responseSize} bytes</div>
                      <div><strong>Has Data:</strong> {selectedResult.hasData ? 'Yes' : 'No'}</div>
                      <div><strong>Data Structure:</strong> {selectedResult.dataStructure}</div>
                    </div>
                  </div>

                  {/* Raw Response */}
                  <div>
                    <h5 className="font-medium mb-2">Raw Response:</h5>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {formatResponse(selectedResult.rawResponse)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🔧</div>
              <p>Select a debug result to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-red-50 rounded-lg">
        <h4 className="font-semibold text-red-800 mb-2">MCP Debugging Instructions:</h4>
        <ol className="text-sm text-red-700 space-y-1">
          <li>1. Click "Debug MCP Connection" to test all MCP functions</li>
          <li>2. Review the debug results to see what's working and what's failing</li>
          <li>3. Check the "Has Data" results to see which endpoints return data</li>
          <li>4. Look at the raw responses to understand the data structure</li>
          <li>5. Identify which method is working best for getting your jobs data</li>
        </ol>
        <p className="text-xs text-red-600 mt-2">
          This will help us identify if the issue is with the MCP connection, API parameters, or data structure.
        </p>
      </div>
    </div>
  )
}
