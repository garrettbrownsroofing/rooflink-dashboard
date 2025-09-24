'use client'

import { useState } from 'react'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  const [data, setData] = useState<any>(null)

  const connectToMCP = async () => {
    try {
      setConnectionStatus('Connecting...')
      
      // This would be replaced with actual MCP client connection
      // For now, we'll simulate the connection
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsConnected(true)
      setConnectionStatus('Connected to RoofLink MCP')
      
      // Simulate fetching some data
      setData({
        message: 'Connected to RoofLink MCP Server',
        timestamp: new Date().toISOString(),
        endpoints: [
          { name: 'Payment Analytics', status: 'Available' },
          { name: 'Job Reports', status: 'Available' },
          { name: 'Estimates', status: 'Available' },
          { name: 'Team Leaders', status: 'Available' }
        ]
      })
    } catch (error) {
      setConnectionStatus('Connection failed')
      console.error('MCP connection error:', error)
    }
  }

  const disconnectFromMCP = () => {
    setIsConnected(false)
    setConnectionStatus('Disconnected')
    setData(null)
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

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">MCP Connection</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-700">{connectionStatus}</span>
            </div>
            <div className="flex gap-2">
              {!isConnected ? (
                <button
                  onClick={connectToMCP}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Connect to MCP
                </button>
              ) : (
                <button
                  onClick={disconnectFromMCP}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Display */}
        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Connection Info</h3>
              <div className="space-y-2">
                <p><strong>Message:</strong> {data.message}</p>
                <p><strong>Connected:</strong> {new Date(data.timestamp).toLocaleString()}</p>
              </div>
            </div>

            {/* Available Endpoints */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Available Endpoints</h3>
              <div className="space-y-2">
                {data.endpoints.map((endpoint: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{endpoint.name}</span>
                    <span className="text-sm text-green-600">{endpoint.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
          <div className="space-y-2 text-gray-700">
            <p>✅ Fresh project structure created</p>
            <p>⏳ MCP client integration needed</p>
            <p>⏳ Real data fetching implementation</p>
            <p>⏳ Dashboard components development</p>
          </div>
        </div>
      </div>
    </div>
  )
}
