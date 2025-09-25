// Component to visualize and analyze the RoofLink API data structure

import { RoofLinkAPIResponse } from '@/types/rooflink'

interface ApiDataVisualizerProps {
  rawDataLog: Array<{
    endpoint: string
    rawResponse: RoofLinkAPIResponse
    timestamp: string
  }>
}

export default function ApiDataVisualizer({ rawDataLog }: ApiDataVisualizerProps) {
  if (rawDataLog.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No API data available yet. Click "Refresh Data" to fetch from RoofLink.</p>
      </div>
    )
  }

  const analyzeEndpointData = (log: typeof rawDataLog[0]) => {
    const response = log.rawResponse
    let analysis = {
      hasData: false,
      itemCount: 0,
      dataType: 'unknown',
      sampleItem: null as any,
      errors: [] as string[]
    }

    try {
      if (response.data?.content) {
        // Parse RoofLink API response format
        for (const contentItem of response.data.content) {
          if (contentItem.type === 'text' && contentItem.text) {
            try {
              const parsedData = JSON.parse(contentItem.text)
              if (parsedData.results && Array.isArray(parsedData.results)) {
                analysis.hasData = true
                analysis.itemCount = parsedData.results.length
                analysis.dataType = 'paginated_results'
                analysis.sampleItem = parsedData.results[0]
                break
              }
            } catch (parseError) {
              analysis.errors.push(`JSON parse error: ${parseError}`)
            }
          }
        }
      } else if (response.data?.sampleItems) {
        // Mock data format
        analysis.hasData = true
        analysis.itemCount = response.data.sampleItems.length
        analysis.dataType = 'mock_data'
        analysis.sampleItem = response.data.sampleItems[0]
      } else if (response.error) {
        analysis.errors.push(response.error)
      }
    } catch (error) {
      analysis.errors.push(`Analysis error: ${error}`)
    }

    return analysis
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">API Data Analysis</h3>
        <p className="text-blue-700 text-sm">
          This shows the structure and content of data received from RoofLink API endpoints.
        </p>
      </div>

      {rawDataLog.map((log, index) => {
        const analysis = analyzeEndpointData(log)
        
        return (
          <div key={index} className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">
                Endpoint: {log.endpoint}
              </h4>
              <span className="text-sm text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Analysis Summary */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Data Found:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    analysis.hasData ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {analysis.hasData ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Item Count:</span>
                  <span className="ml-2 text-gray-900">{analysis.itemCount}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Data Type:</span>
                  <span className="ml-2 text-gray-900">{analysis.dataType}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Errors:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    analysis.errors.length > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {analysis.errors.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Errors */}
            {analysis.errors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <h5 className="font-medium text-red-800 mb-2">Errors:</h5>
                <ul className="text-sm text-red-700 space-y-1">
                  {analysis.errors.map((error, errorIndex) => (
                    <li key={errorIndex}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sample Item Structure */}
            {analysis.sampleItem && (
              <div className="mb-4">
                <h5 className="font-medium text-gray-800 mb-2">Sample Item Structure:</h5>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                    {JSON.stringify(analysis.sampleItem, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Full Raw Response (Collapsible) */}
            <details className="mt-4">
              <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                View Full Raw Response
              </summary>
              <div className="mt-2 bg-gray-100 p-3 rounded text-xs">
                <pre className="whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(log.rawResponse, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )
      })}

      {/* Summary Statistics */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-3">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-green-700">Total Endpoints:</span>
            <span className="ml-2 text-green-900">{rawDataLog.length}</span>
          </div>
          <div>
            <span className="font-medium text-green-700">Successful Responses:</span>
            <span className="ml-2 text-green-900">
              {rawDataLog.filter(log => analyzeEndpointData(log).hasData).length}
            </span>
          </div>
          <div>
            <span className="font-medium text-green-700">Total Items:</span>
            <span className="ml-2 text-green-900">
              {rawDataLog.reduce((sum, log) => sum + analyzeEndpointData(log).itemCount, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
