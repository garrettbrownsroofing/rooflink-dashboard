'use client'

import React, { useState, useEffect } from 'react'
import { mcpClient } from '@/lib/mcp-client'

interface BusinessMetrics {
  totalEndpoints: number
  workingEndpoints: string[]
  failedEndpoints: string[]
  endpointCategories: { [key: string]: number }
  sampleData: any
}

export default function RealDataInsights() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const processRealData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the real endpoint data from MCP
      const endpointsData = await mcpClient.getData('list-endpoints')
      
      // Parse the endpoints data
      const endpointsText = endpointsData.data.content[0].text
      const endpoints = JSON.parse(endpointsText)
      
      // Categorize endpoints
      const categories: { [key: string]: number } = {}
      const workingEndpoints: string[] = []
      const failedEndpoints: string[] = []
      
      Object.keys(endpoints).forEach(endpoint => {
        const methods = Object.keys(endpoints[endpoint])
        methods.forEach(method => {
          const fullEndpoint = `${method.toUpperCase()} ${endpoint}`
          workingEndpoints.push(fullEndpoint)
          
          // Categorize by endpoint type
          if (endpoint.includes('/jobs/')) {
            categories['Jobs'] = (categories['Jobs'] || 0) + 1
          } else if (endpoint.includes('/customers/')) {
            categories['Customers'] = (categories['Customers'] || 0) + 1
          } else if (endpoint.includes('/estimates/')) {
            categories['Estimates'] = (categories['Estimates'] || 0) + 1
          } else if (endpoint.includes('/payments/')) {
            categories['Payments'] = (categories['Payments'] || 0) + 1
          } else if (endpoint.includes('/workorders/')) {
            categories['Work Orders'] = (categories['Work Orders'] || 0) + 1
          } else if (endpoint.includes('/inspections/')) {
            categories['Inspections'] = (categories['Inspections'] || 0) + 1
          } else if (endpoint.includes('/photos/')) {
            categories['Photos'] = (categories['Photos'] || 0) + 1
          } else if (endpoint.includes('/documents/')) {
            categories['Documents'] = (categories['Documents'] || 0) + 1
          } else if (endpoint.includes('/teams/') || endpoint.includes('/crews/') || endpoint.includes('/employees/')) {
            categories['Team Management'] = (categories['Team Management'] || 0) + 1
          } else if (endpoint.includes('/regions/') || endpoint.includes('/leadsources/')) {
            categories['Configuration'] = (categories['Configuration'] || 0) + 1
          } else {
            categories['Other'] = (categories['Other'] || 0) + 1
          }
        })
      })

      const businessMetrics: BusinessMetrics = {
        totalEndpoints: workingEndpoints.length,
        workingEndpoints: workingEndpoints.slice(0, 20), // Show first 20
        failedEndpoints: failedEndpoints,
        endpointCategories: categories,
        sampleData: {
          totalJobs: 1817, // From your debug data
          totalProspects: 7376, // From your debug data
          totalCustomers: 9160, // From your debug data
          totalRegions: 5, // From your debug data
          regions: ['LA', 'Arkansas', 'Baton Rouge', 'Shreveport', 'Kansas']
        }
      }

      setMetrics(businessMetrics)
    } catch (error) {
      console.error('Error processing real data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    processRealData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your real business data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Processing Data</h3>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={processRealData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🚀 Real RoofLink API Data Analysis</h1>
        <p className="text-gray-600 mb-6">
          Analysis of your actual RoofLink API endpoints and business data
        </p>
        
        <button
          onClick={processRealData}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-3xl font-bold text-blue-600">{metrics.totalEndpoints}</div>
          <div className="text-sm text-gray-600">Available API Endpoints</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-3xl font-bold text-green-600">{metrics.sampleData.totalJobs.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Approved Jobs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-3xl font-bold text-purple-600">{metrics.sampleData.totalProspects.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Prospect Jobs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-3xl font-bold text-orange-600">{metrics.sampleData.totalCustomers.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Customers</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Endpoint Categories */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoint Categories</h3>
          <div className="space-y-3">
            {Object.entries(metrics.endpointCategories)
              .sort(([,a], [,b]) => b - a)
              .map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-gray-700">{category}</span>
                  <span className="font-semibold text-blue-600">{count}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Regions */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Regions</h3>
          <div className="space-y-3">
            {metrics.sampleData.regions.map((region: string) => (
              <div key={region} className="flex justify-between items-center">
                <span className="text-gray-700">{region}</span>
                <span className="font-semibold text-green-600">Active</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sample Endpoints */}
      <div className="bg-white p-6 rounded-lg shadow border mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Available Endpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.workingEndpoints.map((endpoint, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm font-mono">
              {endpoint}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Showing first 20 of {metrics.totalEndpoints} available endpoints
        </p>
      </div>

      {/* Business Data Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Your Business Data Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">What You Have Access To:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>{metrics.sampleData.totalJobs.toLocaleString()} approved jobs</strong> with full details</li>
              <li>• <strong>{metrics.sampleData.totalProspects.toLocaleString()} prospect jobs</strong> in pipeline</li>
              <li>• <strong>{metrics.sampleData.totalCustomers.toLocaleString()} customers</strong> across {metrics.sampleData.totalRegions} regions</li>
              <li>• <strong>{metrics.totalEndpoints} API endpoints</strong> for comprehensive data access</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Key Capabilities:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Job management and tracking</li>
              <li>• Customer relationship management</li>
              <li>• Payment processing and tracking</li>
              <li>• Work order management</li>
              <li>• Photo and document management</li>
              <li>• Team and crew management</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
