'use client'

import { useState, useEffect } from 'react'
import { mcpClient, MCPEndpoint } from '@/lib/mcp-client'
import MonroeRevenueDashboard from '@/components/MonroeRevenueDashboard'
import ChatInterface from '@/components/ChatInterface'
import DataExplorer from '@/components/DataExplorer'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  const [endpoints, setEndpoints] = useState<MCPEndpoint[]>([])
  const [serverInfo, setServerInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [showDataExplorer, setShowDataExplorer] = useState(false)
  const [apiKey, setApiKey] = useState<string>('')

  const connectToMCP = async () => {
    try {
      setLoading(true)
      setError(null)
      setConnectionStatus('Connecting...')
      
      const connected = await mcpClient.connect()
      
      if (connected) {
        setIsConnected(true)
        setConnectionStatus('Connected to RoofLink MCP')
        
        // Get server info
        const info = await mcpClient.getServerInfo()
        setServerInfo(info)
        
        // Get available endpoints
        const availableEndpoints = await mcpClient.listAvailableEndpoints()
        setEndpoints(availableEndpoints)
        
        console.log('MCP connection successful:', { info, endpoints: availableEndpoints })
      } else {
        throw new Error('Failed to connect to MCP server')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setConnectionStatus('Connection failed')
      setError(errorMessage)
      console.error('MCP connection error:', error)
    } finally {
      setLoading(false)
    }
  }

  const disconnectFromMCP = async () => {
    try {
      await mcpClient.disconnect()
      setIsConnected(false)
      setConnectionStatus('Disconnected')
      setEndpoints([])
      setServerInfo(null)
      setError(null)
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }

  const testEndpoint = async (endpointName: string) => {
    try {
      setLoading(true)
      const data = await mcpClient.getData(endpointName)
      console.log(`Data from ${endpointName}:`, data)
      
      // You could show this data in a modal or update the UI
      alert(`Data from ${endpointName}: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      console.error(`Error testing ${endpointName}:`, error)
      alert(`Error testing ${endpointName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            RoofLink Dashboard
          </h1>
          <p className="text-gray-600">
            Powered by RoofLink MCP Server
          </p>
        </div>

        {/* API Key Input */}
        <div className="bg-orange-50 rounded-lg shadow p-6 mb-8 border border-orange-200">
          <h2 className="text-xl font-semibold mb-4 text-orange-800">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-orange-700 mb-2">
                RoofLink API Key (Required for live data)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your RoofLink API key (X-API-KEY)"
                className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-orange-600 mt-1">
                This API key is required to access live data from RoofLink. Get your API key from the RoofLink developer portal.
              </p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">MCP Connection</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-700">{connectionStatus}</span>
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
            </div>
            <div className="flex gap-2">
              {!isConnected ? (
                <button
                  onClick={connectToMCP}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Connect to MCP'}
                </button>
              ) : (
                <button
                  onClick={disconnectFromMCP}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Server Info */}
        {serverInfo && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Server Information</h3>
            <div className="bg-gray-50 rounded-md p-3">
              <pre className="text-sm text-gray-800 overflow-x-auto">
                {JSON.stringify(serverInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Available Endpoints */}
        {endpoints.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Available Endpoints ({endpoints.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{endpoint.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      endpoint.status === 'available' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {endpoint.status}
                    </span>
                  </div>
                  {endpoint.description && (
                    <p className="text-sm text-gray-600 mb-3">{endpoint.description}</p>
                  )}
                  <button
                    onClick={() => testEndpoint(endpoint.name)}
                    disabled={loading || endpoint.status !== 'available'}
                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Testing...' : 'Test Endpoint'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monroe Revenue Dashboard */}
        <MonroeRevenueDashboard isConnected={isConnected} onDataUpdate={setDashboardData} />

        {/* Data Explorer Toggle */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">🔍 Complete Data Explorer</h3>
                <p className="text-sm text-gray-600">Explore ALL available data from your RoofLink API</p>
              </div>
              <button
                onClick={() => setShowDataExplorer(!showDataExplorer)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                {showDataExplorer ? 'Hide Data Explorer' : 'Show Data Explorer'}
              </button>
            </div>
            {!showDataExplorer && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>What this does:</strong> Fetches data from ALL available RoofLink API endpoints 
                  so we can see exactly what information is available and how to properly display it. 
                  This will help us understand the complete data structure and create better dashboards.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Data Explorer */}
        {showDataExplorer && (
          <div className="mb-8">
            <DataExplorer isConnected={isConnected} apiKey={apiKey} />
          </div>
        )}

        {/* AI Chat Interface */}
        <div className="mt-8">
          <ChatInterface dashboardData={dashboardData} isConnected={isConnected} />
        </div>

        {/* Development Status */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">Development Status</h3>
          <div className="space-y-2 text-gray-700">
            <p>✅ Fresh project structure created</p>
            <p>✅ MCP client integration implemented</p>
            <p>✅ Real data fetching framework ready</p>
            <p>✅ Dashboard components with metrics display</p>
            <p>✅ AI Chat Assistant with OpenAI integration</p>
            <p>✅ Data processing and analysis utilities</p>
            <p>⏳ Real MCP server connection testing</p>
            <p>⏳ Authentication implementation</p>
          </div>
        </div>

        {/* AI Assistant Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">🤖 AI Data Assistant</h3>
          <div className="space-y-3 text-gray-700">
            <p className="text-sm">
              <strong>New Feature:</strong> Ask questions about your roofing business data using natural language!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-700 mb-2">Try asking:</p>
                <ul className="space-y-1 text-xs">
                  <li>• "How is my revenue performance?"</li>
                  <li>• "What's my lead conversion rate?"</li>
                  <li>• "Give me a business summary"</li>
                  <li>• "What recommendations do you have?"</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-purple-700 mb-2">AI Capabilities:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Analyze dashboard metrics and trends</li>
                  <li>• Provide business insights and recommendations</li>
                  <li>• Answer questions about performance</li>
                  <li>• Generate contextual reports</li>
                </ul>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Setup:</strong> To enable full AI features, add your OPENAI_API_KEY to environment variables. 
                The assistant works with local analysis as a fallback.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
