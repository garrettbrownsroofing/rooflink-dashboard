'use client'

import { useState, useEffect } from 'react'
import { mcpClient, MCPEndpoint } from '@/lib/mcp-client'
import MonroeRevenueDashboard from '@/components/MonroeRevenueDashboard'
import ChatInterface from '@/components/ChatInterface'
import DataExplorer from '@/components/DataExplorer'
import ComprehensiveDataViewer from '@/components/ComprehensiveDataViewer'
import MCPDebugger from '@/components/MCPDebugger'
import EndpointExplorer from '@/components/EndpointExplorer'
import ComprehensiveDataCollector from '@/components/ComprehensiveDataCollector'
import DebugConsole from '@/components/DebugConsole'
import RealDataInsights from '@/components/RealDataInsights'
import ComprehensiveJobDashboard from '@/components/ComprehensiveJobDashboard'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  const [endpoints, setEndpoints] = useState<MCPEndpoint[]>([])
  const [serverInfo, setServerInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [showDataExplorer, setShowDataExplorer] = useState(false)
  const [showComprehensiveViewer, setShowComprehensiveViewer] = useState(false)
  const [showMCPDebugger, setShowMCPDebugger] = useState(false)
  const [showEndpointExplorer, setShowEndpointExplorer] = useState(false)
  const [showDataCollector, setShowDataCollector] = useState(false)
  const [showDebugConsole, setShowDebugConsole] = useState(false)
  const [showDataInsights, setShowDataInsights] = useState(false)
  const [showJobDashboard, setShowJobDashboard] = useState(false)
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

        {/* Debug Console Toggle - Prominent placement for easy access */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow p-6 mb-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-red-800">🐛 Debug Console - Copy & Paste Everything Here</h3>
                <p className="text-sm text-red-700">One-click comprehensive debug data collection for easy sharing</p>
              </div>
              <button
                onClick={() => setShowDebugConsole(!showDebugConsole)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-lg"
              >
                {showDebugConsole ? 'Hide Debug Console' : 'Show Debug Console'}
              </button>
            </div>
            {!showDebugConsole && (
              <div className="mt-4 p-4 bg-red-100 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>🎯 Perfect for sharing with me:</strong> This collects ALL debug information, API responses, errors, 
                  connection status, and system data in one organized report. Just click "Collect All Debug Info" then 
                  "Copy Debug Report" and paste everything here for me to analyze and fix!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Debug Console */}
        {showDebugConsole && (
          <div className="mb-8">
            <DebugConsole />
          </div>
        )}

        {/* Data Insights Toggle */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow p-6 mb-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-green-800">📊 Business Data Insights</h3>
                <p className="text-sm text-green-700">Real-time analysis of your RoofLink API endpoints and business data</p>
              </div>
              <button
                onClick={() => setShowDataInsights(!showDataInsights)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-lg"
              >
                {showDataInsights ? 'Hide Insights' : 'Show Insights'}
              </button>
            </div>
            {!showDataInsights && (
              <div className="mt-4 p-4 bg-green-100 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>🎯 Live API Analysis:</strong> This shows your actual RoofLink API capabilities - 
                  200+ available endpoints, 1,817 approved jobs, 7,376 prospects, 
                  9,160 customers, and comprehensive business management tools!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Data Insights */}
        {showDataInsights && (
          <div className="mb-8">
            <RealDataInsights />
          </div>
        )}

        {/* Job Dashboard Toggle */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6 mb-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-blue-800">🏗️ Comprehensive Job Dashboard</h3>
                <p className="text-sm text-blue-700">View and manage all jobs with detailed information similar to RoofLink interface</p>
              </div>
              <button
                onClick={() => setShowJobDashboard(!showJobDashboard)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
              >
                {showJobDashboard ? 'Hide Job Dashboard' : 'Show Job Dashboard'}
              </button>
            </div>
            {!showJobDashboard && (
              <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📋 Complete Job Management:</strong> View all 9,193 jobs (1,817 approved + 7,376 prospect) 
                  with detailed customer information, job status, lead sources, and team assignments. 
                  Includes Robert Mincil's job and all other jobs in the system!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Job Dashboard */}
        {showJobDashboard && (
          <div className="mb-8">
            <ComprehensiveJobDashboard />
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

        {/* Comprehensive Data Viewer Toggle */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">📊 Comprehensive Data Viewer</h3>
                <p className="text-sm text-gray-600">Extract and view ALL data in structured format</p>
              </div>
              <button
                onClick={() => setShowComprehensiveViewer(!showComprehensiveViewer)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {showComprehensiveViewer ? 'Hide Data Viewer' : 'Show Data Viewer'}
              </button>
            </div>
            {!showComprehensiveViewer && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>What this does:</strong> Extracts ALL available data from your RoofLink API and displays it in a structured, readable format. 
                  This will show you every single data item that's available, organized by endpoint, so you can see exactly what information you have access to.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Comprehensive Data Viewer */}
        {showComprehensiveViewer && (
          <div className="mb-8">
            <ComprehensiveDataViewer isConnected={isConnected} apiKey={apiKey} />
          </div>
        )}

        {/* Endpoint Explorer Toggle */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">🔍 Endpoint Explorer</h3>
                <p className="text-sm text-gray-600">Discover and test all available MCP endpoints</p>
              </div>
              <button
                onClick={() => setShowEndpointExplorer(!showEndpointExplorer)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {showEndpointExplorer ? 'Hide Explorer' : 'Show Explorer'}
              </button>
            </div>
            {!showEndpointExplorer && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-800">
                  <strong>What this does:</strong> Explore and test all available MCP endpoints to understand the complete data landscape. 
                  This will help us discover all the data sources we can access and ensure we're not missing any valuable information.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Endpoint Explorer */}
        {showEndpointExplorer && (
          <div className="mb-8">
            <EndpointExplorer />
          </div>
        )}

        {/* Comprehensive Data Collector Toggle */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">📊 Comprehensive Data Collector</h3>
                <p className="text-sm text-gray-600">Systematically collect data from ALL available endpoints</p>
              </div>
              <button
                onClick={() => setShowDataCollector(!showDataCollector)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                {showDataCollector ? 'Hide Collector' : 'Show Collector'}
              </button>
            </div>
            {!showDataCollector && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-800">
                  <strong>What this does:</strong> Systematically tests and collects data from ALL available MCP endpoints and RoofLink API endpoints. 
                  This will give you a complete picture of all the data sources available and help identify which endpoints provide the most valuable information.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Comprehensive Data Collector */}
        {showDataCollector && (
          <div className="mb-8">
            <ComprehensiveDataCollector />
          </div>
        )}

        {/* MCP Debugger Toggle */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">🔧 MCP Connection Debugger</h3>
                <p className="text-sm text-gray-600">Debug MCP connection and data retrieval issues</p>
              </div>
              <button
                onClick={() => setShowMCPDebugger(!showMCPDebugger)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {showMCPDebugger ? 'Hide Debugger' : 'Show Debugger'}
              </button>
            </div>
            {!showMCPDebugger && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>What this does:</strong> Tests all MCP connection methods and data retrieval functions to identify 
                  why we're only getting limited data instead of the full jobs dataset. This will help us understand 
                  if the issue is with the MCP connection, API parameters, or data structure.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MCP Debugger */}
        {showMCPDebugger && (
          <div className="mb-8">
            <MCPDebugger isConnected={isConnected} apiKey={apiKey} />
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
