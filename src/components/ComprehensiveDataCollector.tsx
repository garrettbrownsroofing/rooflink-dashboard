'use client'

import React, { useState, useEffect } from 'react'
import { mcpClient } from '@/lib/mcp-client'
import { MCPEndpoint } from '@/lib/mcp-client'

interface DataCollectionResult {
  endpoint: string
  status: 'success' | 'error' | 'loading' | 'not_tested'
  data?: any
  error?: string
  responseTime?: number
  dataSize?: number
  lastCollected?: Date
  method: 'getData' | 'getRoofLinkData' | 'listAvailableEndpoints' | 'getServerInfo'
}

interface CollectionSummary {
  totalEndpoints: number
  successfulCollections: number
  failedCollections: number
  totalDataSize: number
  averageResponseTime: number
  lastCollectionTime?: Date
}

export default function ComprehensiveDataCollector() {
  const [endpoints, setEndpoints] = useState<MCPEndpoint[]>([])
  const [collectionResults, setCollectionResults] = useState<Map<string, DataCollectionResult>>(new Map())
  const [loading, setLoading] = useState(true)
  const [collecting, setCollecting] = useState(false)
  const [summary, setSummary] = useState<CollectionSummary>({
    totalEndpoints: 0,
    successfulCollections: 0,
    failedCollections: 0,
    totalDataSize: 0,
    averageResponseTime: 0
  })
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())

  // Known RoofLink API endpoints to test
  const roofLinkEndpoints = [
    '/light/jobs/',
    '/light/jobs/approved/',
    '/light/jobs/prospect/',
    '/light/jobs/?limit=100&offset=0',
    '/light/jobs/?limit=50&offset=0',
    '/light/jobs/?limit=10&offset=0',
    '/light/customers/',
    '/light/regions/',
    '/light/users/',
    '/light/lead-sources/',
    '/light/job-statuses/',
    '/light/pipelines/',
    '/light/cover-photos/',
    '/light/cover-photos/?limit=10&offset=0',
    '/light/customers/?limit=10&offset=0',
    '/light/regions/?limit=10&offset=0',
    '/light/users/?limit=10&offset=0',
    '/light/lead-sources/?limit=10&offset=0',
    '/light/job-statuses/?limit=10&offset=0',
    '/light/pipelines/?limit=10&offset=0'
  ]

  // MCP tool endpoints to test
  const mcpToolEndpoints = [
    'list-endpoints',
    'get-endpoint',
    'get-request-body',
    'get-response-schema',
    'list-security-schemes',
    'search-specs',
    'execute-request',
    'get-code-snippet',
    'search-documentation',
    'get-guide'
  ]

  const loadEndpoints = async () => {
    try {
      setLoading(true)
      const availableEndpoints = await mcpClient.listAvailableEndpoints()
      setEndpoints(availableEndpoints)
      console.log('Loaded MCP endpoints:', availableEndpoints)
    } catch (error) {
      console.error('Failed to load MCP endpoints:', error)
    } finally {
      setLoading(false)
    }
  }

  const collectDataFromEndpoint = async (endpoint: string, method: DataCollectionResult['method']): Promise<DataCollectionResult> => {
    const startTime = Date.now()
    const result: DataCollectionResult = {
      endpoint,
      method,
      status: 'loading',
      lastCollected: new Date()
    }

    try {
      let data
      let responseTime = Date.now() - startTime

      switch (method) {
        case 'getData':
          data = await mcpClient.getData(endpoint)
          break
        case 'getRoofLinkData':
          data = await mcpClient.getRoofLinkData(endpoint)
          break
        case 'listAvailableEndpoints':
          data = await mcpClient.listAvailableEndpoints()
          break
        case 'getServerInfo':
          data = await mcpClient.getServerInfo()
          break
        default:
          throw new Error(`Unknown method: ${method}`)
      }

      responseTime = Date.now() - startTime
      const dataSize = JSON.stringify(data).length

      return {
        ...result,
        status: 'success',
        data,
        responseTime,
        dataSize
      }

    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        ...result,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      }
    }
  }

  const collectAllData = async () => {
    setCollecting(true)
    const results = new Map<string, DataCollectionResult>()

    try {
      // First, collect MCP tool data
      console.log('Collecting MCP tool data...')
      for (const endpoint of mcpToolEndpoints) {
        const result = await collectDataFromEndpoint(endpoint, 'getData')
        results.set(endpoint, result)
        setCollectionResults(new Map(results))
        await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
      }

      // Then collect RoofLink API data
      console.log('Collecting RoofLink API data...')
      for (const endpoint of roofLinkEndpoints) {
        const result = await collectDataFromEndpoint(endpoint, 'getRoofLinkData')
        results.set(endpoint, result)
        setCollectionResults(new Map(results))
        await new Promise(resolve => setTimeout(resolve, 200)) // Slightly longer delay for API calls
      }

      // Collect server info
      console.log('Collecting server info...')
      const serverInfoResult = await collectDataFromEndpoint('server-info', 'getServerInfo')
      results.set('server-info', serverInfoResult)
      setCollectionResults(new Map(results))

      // Collect available endpoints info
      console.log('Collecting available endpoints info...')
      const endpointsResult = await collectDataFromEndpoint('list-endpoints-data', 'listAvailableEndpoints')
      results.set('list-endpoints-data', endpointsResult)
      setCollectionResults(new Map(results))

    } catch (error) {
      console.error('Error during data collection:', error)
    } finally {
      setCollecting(false)
    }
  }

  const calculateSummary = (results: Map<string, DataCollectionResult>): CollectionSummary => {
    const allResults = Array.from(results.values())
    const successful = allResults.filter(r => r.status === 'success')
    const failed = allResults.filter(r => r.status === 'error')
    const totalDataSize = successful.reduce((sum, r) => sum + (r.dataSize || 0), 0)
    const totalResponseTime = successful.reduce((sum, r) => sum + (r.responseTime || 0), 0)
    const averageResponseTime = successful.length > 0 ? totalResponseTime / successful.length : 0

    return {
      totalEndpoints: allResults.length,
      successfulCollections: successful.length,
      failedCollections: failed.length,
      totalDataSize,
      averageResponseTime: Math.round(averageResponseTime),
      lastCollectionTime: new Date()
    }
  }

  const toggleResultExpansion = (endpoint: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev)
      if (newSet.has(endpoint)) {
        newSet.delete(endpoint)
      } else {
        newSet.add(endpoint)
      }
      return newSet
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'loading': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const exportAllData = () => {
    const allData = Array.from(collectionResults.entries()).map(([endpoint, result]) => ({
      ...result,
      endpoint // This will override the endpoint from result if it exists
    }))
    
    const dataStr = JSON.stringify(allData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rooflink-data-collection-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    loadEndpoints()
  }, [])

  useEffect(() => {
    setSummary(calculateSummary(collectionResults))
  }, [collectionResults])

  const groupedResults = {
    'MCP Tools': Array.from(collectionResults.entries()).filter(([endpoint]) => 
      mcpToolEndpoints.includes(endpoint)
    ),
    'RoofLink API': Array.from(collectionResults.entries()).filter(([endpoint]) => 
      roofLinkEndpoints.includes(endpoint)
    ),
    'System Info': Array.from(collectionResults.entries()).filter(([endpoint]) => 
      ['server-info', 'list-endpoints-data'].includes(endpoint)
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Comprehensive Data Collector</h1>
        <p className="text-gray-600 mb-6">
          Systematically collect data from all available MCP endpoints and RoofLink API endpoints to get a complete picture of your data landscape.
        </p>

        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={collectAllData}
            disabled={collecting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {collecting ? 'Collecting Data...' : 'Collect All Data'}
          </button>
          
          <button
            onClick={exportAllData}
            disabled={collectionResults.size === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            Export All Data
          </button>

          <button
            onClick={loadEndpoints}
            disabled={loading}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Loading...' : 'Refresh Endpoints'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{summary.totalEndpoints}</div>
            <div className="text-sm text-gray-600">Total Endpoints</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{summary.successfulCollections}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-red-600">{summary.failedCollections}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-purple-600">{formatBytes(summary.totalDataSize)}</div>
            <div className="text-sm text-gray-600">Total Data Size</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-orange-600">{summary.averageResponseTime}ms</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading endpoints...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([category, results]) => (
            <div key={category} className="bg-white rounded-lg shadow border">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
                <p className="text-sm text-gray-600 mt-1">{results.length} endpoints</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {results.map(([endpoint, result]) => {
                  const isExpanded = expandedResults.has(endpoint)
                  
                  return (
                    <div key={endpoint} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900">{endpoint}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                              {result.status}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {result.method}
                            </span>
                          </div>
                          {result.status === 'success' && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              {result.responseTime && (
                                <span>Response: {result.responseTime}ms</span>
                              )}
                              {result.dataSize && (
                                <span>Size: {formatBytes(result.dataSize)}</span>
                              )}
                              {result.lastCollected && (
                                <span>Collected: {result.lastCollected.toLocaleTimeString()}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {result.status === 'success' && (
                            <button
                              onClick={() => toggleResultExpansion(endpoint)}
                              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              {isExpanded ? 'Hide' : 'Show'} Data
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && result.status === 'success' && result.data && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Collected Data:</h4>
                          <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-96">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {result.status === 'error' && result.error && (
                        <div className="mt-4 p-4 bg-red-50 rounded-lg">
                          <h4 className="font-medium text-red-900 mb-2">Error:</h4>
                          <p className="text-sm text-red-700">{result.error}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
