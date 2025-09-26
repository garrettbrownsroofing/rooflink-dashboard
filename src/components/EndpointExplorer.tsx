'use client'

import React, { useState, useEffect } from 'react'
import { mcpClient } from '@/lib/mcp-client'
import { MCPEndpoint } from '@/lib/mcp-client'

interface EndpointTestResult {
  endpoint: string
  status: 'success' | 'error' | 'loading' | 'not_tested'
  data?: any
  error?: string
  responseTime?: number
  dataSize?: number
  lastTested?: Date
}

interface EndpointCategory {
  name: string
  endpoints: MCPEndpoint[]
  description: string
}

export default function EndpointExplorer() {
  const [endpoints, setEndpoints] = useState<MCPEndpoint[]>([])
  const [testResults, setTestResults] = useState<Map<string, EndpointTestResult>>(new Map())
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set())

  // Categorize endpoints
  const categorizeEndpoints = (endpoints: MCPEndpoint[]): EndpointCategory[] => {
    const categories: EndpointCategory[] = [
      {
        name: 'API Discovery',
        endpoints: endpoints.filter(e => 
          e.name.includes('list') || e.name.includes('endpoint') || e.name.includes('spec')
        ),
        description: 'Endpoints for discovering and exploring the API structure'
      },
      {
        name: 'Data Execution',
        endpoints: endpoints.filter(e => 
          e.name.includes('execute') || e.name.includes('request') || e.name.includes('data')
        ),
        description: 'Endpoints for executing API requests and fetching data'
      },
      {
        name: 'Documentation',
        endpoints: endpoints.filter(e => 
          e.name.includes('documentation') || e.name.includes('guide') || e.name.includes('snippet')
        ),
        description: 'Endpoints for accessing documentation and code examples'
      },
      {
        name: 'Security',
        endpoints: endpoints.filter(e => 
          e.name.includes('security') || e.name.includes('auth') || e.name.includes('scheme')
        ),
        description: 'Endpoints related to authentication and security'
      },
      {
        name: 'Search',
        endpoints: endpoints.filter(e => 
          e.name.includes('search')
        ),
        description: 'Endpoints for searching and filtering data'
      },
      {
        name: 'Other',
        endpoints: endpoints.filter(e => 
          !e.name.includes('list') && !e.name.includes('endpoint') && 
          !e.name.includes('spec') && !e.name.includes('execute') && 
          !e.name.includes('request') && !e.name.includes('data') &&
          !e.name.includes('documentation') && !e.name.includes('guide') && 
          !e.name.includes('snippet') && !e.name.includes('security') && 
          !e.name.includes('auth') && !e.name.includes('scheme') && 
          !e.name.includes('search')
        ),
        description: 'Other miscellaneous endpoints'
      }
    ]

    return categories.filter(cat => cat.endpoints.length > 0)
  }

  const loadEndpoints = async () => {
    try {
      setLoading(true)
      const availableEndpoints = await mcpClient.listAvailableEndpoints()
      setEndpoints(availableEndpoints)
      console.log('Loaded endpoints:', availableEndpoints)
    } catch (error) {
      console.error('Failed to load endpoints:', error)
    } finally {
      setLoading(false)
    }
  }

  const testEndpoint = async (endpoint: MCPEndpoint) => {
    const startTime = Date.now()
    const result: EndpointTestResult = {
      endpoint: endpoint.name,
      status: 'loading',
      lastTested: new Date()
    }

    setTestResults(prev => new Map(prev.set(endpoint.name, result)))

    try {
      let data
      let responseTime = Date.now() - startTime

      // Determine which method to use based on endpoint name
      if (endpoint.name.includes('list-endpoints') || endpoint.name.includes('server-info')) {
        data = await mcpClient.getData(endpoint.name)
      } else if (endpoint.name === 'execute-request') {
        // Test with a simple API call
        data = await mcpClient.getRoofLinkData('/light/jobs/?limit=5&offset=0')
      } else {
        // Try the general getData method first
        try {
          data = await mcpClient.getData(endpoint.name)
        } catch (error) {
          // If that fails, try with a RoofLink API path
          if (endpoint.name.includes('request')) {
            data = await mcpClient.getRoofLinkData('/light/jobs/?limit=5&offset=0')
          } else {
            throw error
          }
        }
      }

      responseTime = Date.now() - startTime
      const dataSize = JSON.stringify(data).length

      setTestResults(prev => new Map(prev.set(endpoint.name, {
        ...result,
        status: 'success',
        data,
        responseTime,
        dataSize
      })))

    } catch (error) {
      const responseTime = Date.now() - startTime
      setTestResults(prev => new Map(prev.set(endpoint.name, {
        ...result,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime
      })))
    }
  }

  const testAllEndpoints = async () => {
    setTesting(true)
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint)
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    setTesting(false)
  }

  const toggleEndpointExpansion = (endpointName: string) => {
    setExpandedEndpoints(prev => {
      const newSet = new Set(prev)
      if (newSet.has(endpointName)) {
        newSet.delete(endpointName)
      } else {
        newSet.add(endpointName)
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

  useEffect(() => {
    loadEndpoints()
  }, [])

  const categories = categorizeEndpoints(endpoints)
  const filteredCategories = selectedCategory === 'all' 
    ? categories 
    : categories.filter(cat => cat.name === selectedCategory)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Endpoint Explorer</h1>
        <p className="text-gray-600 mb-6">
          Discover and test all available MCP endpoints to understand the full data landscape.
        </p>

        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={loadEndpoints}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Endpoints'}
          </button>
          
          <button
            onClick={testAllEndpoints}
            disabled={testing || endpoints.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {testing ? 'Testing...' : 'Test All Endpoints'}
          </button>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.endpoints.length})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{endpoints.length}</div>
            <div className="text-sm text-gray-600">Total Endpoints</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">
              {Array.from(testResults.values()).filter(r => r.status === 'success').length}
            </div>
            <div className="text-sm text-gray-600">Successful Tests</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-red-600">
              {Array.from(testResults.values()).filter(r => r.status === 'error').length}
            </div>
            <div className="text-sm text-gray-600">Failed Tests</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-gray-600">
              {Array.from(testResults.values()).filter(r => r.status === 'not_tested').length}
            </div>
            <div className="text-sm text-gray-600">Not Tested</div>
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
          {filteredCategories.map(category => (
            <div key={category.name} className="bg-white rounded-lg shadow border">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                <p className="text-xs text-gray-500 mt-1">{category.endpoints.length} endpoints</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {category.endpoints.map(endpoint => {
                  const testResult = testResults.get(endpoint.name)
                  const isExpanded = expandedEndpoints.has(endpoint.name)
                  
                  return (
                    <div key={endpoint.name} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900">{endpoint.name}</h3>
                            {testResult && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(testResult.status)}`}>
                                {testResult.status}
                              </span>
                            )}
                          </div>
                          {endpoint.description && (
                            <p className="text-sm text-gray-600 mt-1">{endpoint.description}</p>
                          )}
                          {testResult && testResult.status === 'success' && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              {testResult.responseTime && (
                                <span>Response: {testResult.responseTime}ms</span>
                              )}
                              {testResult.dataSize && (
                                <span>Size: {formatBytes(testResult.dataSize)}</span>
                              )}
                              {testResult.lastTested && (
                                <span>Tested: {testResult.lastTested.toLocaleTimeString()}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => testEndpoint(endpoint)}
                            disabled={testResult?.status === 'loading'}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                          >
                            {testResult?.status === 'loading' ? 'Testing...' : 'Test'}
                          </button>
                          
                          {testResult && (
                            <button
                              onClick={() => toggleEndpointExpansion(endpoint.name)}
                              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              {isExpanded ? 'Hide' : 'Show'} Data
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && testResult && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          {testResult.status === 'success' && testResult.data && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Response Data:</h4>
                              <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-96">
                                {JSON.stringify(testResult.data, null, 2)}
                              </pre>
                            </div>
                          )}
                          {testResult.status === 'error' && testResult.error && (
                            <div>
                              <h4 className="font-medium text-red-900 mb-2">Error:</h4>
                              <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
                                {testResult.error}
                              </p>
                            </div>
                          )}
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
