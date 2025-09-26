'use client'

import React, { useState, useEffect, useRef } from 'react'
import { mcpClient } from '@/lib/mcp-client'
import { MCPEndpoint } from '@/lib/mcp-client'

interface DebugLogEntry {
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning'
  source: string
  message: string
  data?: any
  endpoint?: string
  method?: string
  responseTime?: number
  dataSize?: number
}

interface DebugSummary {
  totalLogs: number
  errors: number
  warnings: number
  successes: number
  totalDataSize: number
  averageResponseTime: number
  lastActivity: string
}

export default function DebugConsole() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([])
  const [isCollecting, setIsCollecting] = useState(false)
  const [summary, setSummary] = useState<DebugSummary>({
    totalLogs: 0,
    errors: 0,
    warnings: 0,
    successes: 0,
    totalDataSize: 0,
    averageResponseTime: 0,
    lastActivity: 'Never'
  })
  const [autoScroll, setAutoScroll] = useState(true)
  const [filter, setFilter] = useState<'all' | 'errors' | 'warnings' | 'success' | 'info'>('all')
  const logsEndRef = useRef<HTMLDivElement>(null)

  const addLog = (entry: Omit<DebugLogEntry, 'timestamp'>) => {
    const newEntry: DebugLogEntry = {
      ...entry,
      timestamp: new Date().toLocaleTimeString()
    }
    setLogs(prev => [...prev, newEntry])
  }

  const clearLogs = () => {
    setLogs([])
    addLog({
      type: 'info',
      source: 'Debug Console',
      message: 'Logs cleared'
    })
  }

  const collectAllDebugInfo = async () => {
    setIsCollecting(true)
    clearLogs()
    
    addLog({
      type: 'info',
      source: 'Debug Console',
      message: 'Starting comprehensive debug data collection...'
    })

    try {
      // Test MCP Connection
      addLog({
        type: 'info',
        source: 'MCP Client',
        message: 'Testing MCP connection...'
      })

      const connected = await mcpClient.connect()
      if (connected) {
        addLog({
          type: 'success',
          source: 'MCP Client',
          message: 'Successfully connected to MCP server'
        })
      } else {
        addLog({
          type: 'error',
          source: 'MCP Client',
          message: 'Failed to connect to MCP server'
        })
        return
      }

      // Get Server Info
      addLog({
        type: 'info',
        source: 'MCP Client',
        message: 'Fetching server information...'
      })

      try {
        const serverInfo = await mcpClient.getServerInfo()
        addLog({
          type: 'success',
          source: 'MCP Client',
          message: 'Server info retrieved',
          data: serverInfo,
          method: 'getServerInfo'
        })
      } catch (error) {
        addLog({
          type: 'error',
          source: 'MCP Client',
          message: 'Failed to get server info',
          data: error instanceof Error ? error.message : 'Unknown error',
          method: 'getServerInfo'
        })
      }

      // Get Available Endpoints
      addLog({
        type: 'info',
        source: 'MCP Client',
        message: 'Fetching available endpoints...'
      })

      try {
        const endpoints = await mcpClient.listAvailableEndpoints()
        addLog({
          type: 'success',
          source: 'MCP Client',
          message: `Found ${endpoints.length} available endpoints`,
          data: endpoints,
          method: 'listAvailableEndpoints'
        })
      } catch (error) {
        addLog({
          type: 'error',
          source: 'MCP Client',
          message: 'Failed to get available endpoints',
          data: error instanceof Error ? error.message : 'Unknown error',
          method: 'listAvailableEndpoints'
        })
      }

      // Test MCP Tool Endpoints
      const mcpTools = [
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

      for (const tool of mcpTools) {
        addLog({
          type: 'info',
          source: 'MCP Tool',
          message: `Testing MCP tool: ${tool}`,
          endpoint: tool
        })

        try {
          const startTime = Date.now()
          const data = await mcpClient.getData(tool)
          const responseTime = Date.now() - startTime
          const dataSize = JSON.stringify(data).length

          addLog({
            type: 'success',
            source: 'MCP Tool',
            message: `Successfully tested ${tool}`,
            data: data,
            endpoint: tool,
            method: 'getData',
            responseTime,
            dataSize
          })
        } catch (error) {
          addLog({
            type: 'error',
            source: 'MCP Tool',
            message: `Failed to test ${tool}`,
            data: error instanceof Error ? error.message : 'Unknown error',
            endpoint: tool,
            method: 'getData'
          })
        }

        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Test RoofLink API Endpoints
      const roofLinkEndpoints = [
        '/light/jobs/',
        '/light/jobs/approved/',
        '/light/jobs/prospect/',
        '/light/jobs/?limit=10&offset=0',
        '/light/customers/',
        '/light/regions/',
        '/light/users/',
        '/light/lead-sources/',
        '/light/job-statuses/',
        '/light/pipelines/'
      ]

      for (const endpoint of roofLinkEndpoints) {
        addLog({
          type: 'info',
          source: 'RoofLink API',
          message: `Testing API endpoint: ${endpoint}`,
          endpoint: endpoint
        })

        try {
          const startTime = Date.now()
          const data = await mcpClient.getRoofLinkData(endpoint)
          const responseTime = Date.now() - startTime
          const dataSize = JSON.stringify(data).length

          addLog({
            type: 'success',
            source: 'RoofLink API',
            message: `Successfully tested ${endpoint}`,
            data: data,
            endpoint: endpoint,
            method: 'getRoofLinkData',
            responseTime,
            dataSize
          })
        } catch (error) {
          addLog({
            type: 'error',
            source: 'RoofLink API',
            message: `Failed to test ${endpoint}`,
            data: error instanceof Error ? error.message : 'Unknown error',
            endpoint: endpoint,
            method: 'getRoofLinkData'
          })
        }

        await new Promise(resolve => setTimeout(resolve, 200))
      }

      addLog({
        type: 'success',
        source: 'Debug Console',
        message: 'Comprehensive debug data collection completed!'
      })

    } catch (error) {
      addLog({
        type: 'error',
        source: 'Debug Console',
        message: 'Fatal error during debug collection',
        data: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsCollecting(false)
    }
  }

  const generateDebugReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: summary,
      logs: logs,
      systemInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    }
    return JSON.stringify(report, null, 2)
  }

  const copyDebugReport = () => {
    const report = generateDebugReport()
    navigator.clipboard.writeText(report).then(() => {
      addLog({
        type: 'success',
        source: 'Debug Console',
        message: 'Debug report copied to clipboard!'
      })
    }).catch(() => {
      addLog({
        type: 'error',
        source: 'Debug Console',
        message: 'Failed to copy to clipboard'
      })
    })
  }

  const downloadDebugReport = () => {
    const report = generateDebugReport()
    const blob = new Blob([report], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rooflink-debug-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    return log.type === filter
  })

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  useEffect(() => {
    const totalLogs = logs.length
    const errors = logs.filter(l => l.type === 'error').length
    const warnings = logs.filter(l => l.type === 'warning').length
    const successes = logs.filter(l => l.type === 'success').length
    const totalDataSize = logs.reduce((sum, l) => sum + (l.dataSize || 0), 0)
    const responseTimes = logs.filter(l => l.responseTime).map(l => l.responseTime!)
    const averageResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 0
    const lastActivity = logs.length > 0 ? logs[logs.length - 1].timestamp : 'Never'

    setSummary({
      totalLogs,
      errors,
      warnings,
      successes,
      totalDataSize,
      averageResponseTime,
      lastActivity
    })
  }, [logs])

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🐛 Debug Console</h1>
        <p className="text-gray-600 mb-6">
          Comprehensive debug information collector. Run this to gather all data, errors, and logs in one place for easy sharing.
        </p>

        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={collectAllDebugInfo}
            disabled={isCollecting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isCollecting ? 'Collecting Debug Info...' : 'Collect All Debug Info'}
          </button>
          
          <button
            onClick={copyDebugReport}
            disabled={logs.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            📋 Copy Debug Report
          </button>

          <button
            onClick={downloadDebugReport}
            disabled={logs.length === 0}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
          >
            💾 Download Debug Report
          </button>

          <button
            onClick={clearLogs}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            🗑️ Clear Logs
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{summary.totalLogs}</div>
            <div className="text-sm text-gray-600">Total Logs</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{summary.successes}</div>
            <div className="text-sm text-gray-600">Successes</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
            <div className="text-sm text-gray-600">Warnings</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-purple-600">{Math.round(summary.totalDataSize / 1024)}KB</div>
            <div className="text-sm text-gray-600">Data Size</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-orange-600">{summary.averageResponseTime}ms</div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Logs</option>
            <option value="errors">Errors Only</option>
            <option value="warnings">Warnings Only</option>
            <option value="success">Success Only</option>
            <option value="info">Info Only</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Auto-scroll to bottom</span>
          </label>
        </div>
      </div>

      {/* Debug Logs */}
      <div className="bg-white rounded-lg shadow border max-h-96 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Debug Logs ({filteredLogs.length} entries)</h3>
        </div>
        
        <div className="p-4 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No logs yet. Click "Collect All Debug Info" to start gathering data.
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getLogColor(log.type)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getLogIcon(log.type)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{log.source}</span>
                      <span className="text-xs text-gray-500">{log.timestamp}</span>
                      {log.endpoint && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                          {log.endpoint}
                        </span>
                      )}
                      {log.method && (
                        <span className="px-2 py-1 bg-blue-200 text-blue-700 rounded text-xs">
                          {log.method}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-2">{log.message}</p>
                    {log.responseTime && (
                      <div className="text-xs text-gray-500 mb-2">
                        Response: {log.responseTime}ms
                        {log.dataSize && ` | Size: ${Math.round(log.dataSize / 1024)}KB`}
                      </div>
                    )}
                    {log.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Show Data ({typeof log.data === 'object' ? 'Object' : typeof log.data})
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">📋 How to Share Debug Info</h4>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Click "Collect All Debug Info" to gather comprehensive data</li>
          <li>2. Click "Copy Debug Report" to copy everything to your clipboard</li>
          <li>3. Paste the copied data in your message to me</li>
          <li>4. Or use "Download Debug Report" to save as a file</li>
        </ol>
        <p className="text-xs text-blue-700 mt-2">
          This will include all API responses, errors, connection status, and system information in one organized report.
        </p>
      </div>
    </div>
  )
}
