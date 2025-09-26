'use client'

import React, { useState, useEffect } from 'react'
import { mcpClient } from '@/lib/mcp-client'

interface JobData {
  id: number
  name: string
  full_address: string
  bid_type: 'r' | 'c' | 'i' | ''
  job_type: 'c' | 'r'
  date_approved?: string
  date_created: string
  date_closed?: string
  job_status: {
    color: string
    label: string
  }
  customer: {
    id: number
    name: string
    cell?: string
    email?: string
    lead_source?: {
      id: number
      name: string
    }
    region: {
      id: number
      name: string
      color: string
    }
    rep?: {
      id: number
      name: string
      email: string
      color: string
    }
  }
  latitude: number
  longitude: number
}

interface RegionData {
  id: number
  name: string
  abbr: string
  color: string
  phone: string
  email: string
  is_active: boolean
}

interface CustomerData {
  id: number
  name: string
  cell?: string
  email?: string
  phone?: string
  region: {
    id: number
    name: string
    color: string
  }
  rep?: {
    id: number
    name: string
    email: string
    color: string
  }
}

interface BusinessMetrics {
  totalApprovedJobs: number
  totalProspectJobs: number
  totalCustomers: number
  totalRevenue: number
  averageJobValue: number
  leadSources: { [key: string]: number }
  regions: { [key: string]: number }
  jobTypes: { [key: string]: number }
  recentActivity: JobData[]
  topPerformers: { [key: string]: number }
}

export default function DataInsights() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const processBusinessData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all the data we know works
      const [approvedJobsData, prospectJobsData, customersData, regionsData] = await Promise.all([
        mcpClient.getRoofLinkData('/light/jobs/approved/'),
        mcpClient.getRoofLinkData('/light/jobs/prospect/'),
        mcpClient.getRoofLinkData('/light/customers/'),
        mcpClient.getRoofLinkData('/light/regions/')
      ])

      // Parse the data
      const approvedJobs: JobData[] = JSON.parse(approvedJobsData.data.content[0].text).results
      const prospectJobs: JobData[] = JSON.parse(prospectJobsData.data.content[0].text).results
      const customers: CustomerData[] = JSON.parse(customersData.data.content[0].text).results
      const regions: RegionData[] = JSON.parse(regionsData.data.content[0].text).results

      // Calculate metrics
      const leadSources: { [key: string]: number } = {}
      const regionsCount: { [key: string]: number } = {}
      const jobTypes: { [key: string]: number } = {}
      const topPerformers: { [key: string]: number } = {}

      let totalRevenue = 0
      let jobCount = 0

      // Process approved jobs
      approvedJobs.forEach(job => {
        // Lead sources
        const leadSource = job.customer.lead_source?.name || 'Unknown'
        leadSources[leadSource] = (leadSources[leadSource] || 0) + 1

        // Regions
        const region = job.customer.region.name
        regionsCount[region] = (regionsCount[region] || 0) + 1

        // Job types
        const jobType = job.job_type === 'c' ? 'Commercial' : 'Residential'
        jobTypes[jobType] = (jobTypes[jobType] || 0) + 1

        // Top performers (reps)
        if (job.customer.rep) {
          const repName = job.customer.rep.name
          topPerformers[repName] = (topPerformers[repName] || 0) + 1
        }

        // Revenue calculation (this would need actual job value data)
        // For now, we'll estimate based on job type
        const estimatedValue = job.job_type === 'c' ? 15000 : 8000
        totalRevenue += estimatedValue
        jobCount++
      })

      // Process prospect jobs
      prospectJobs.forEach(job => {
        const leadSource = job.customer.lead_source?.name || 'Unknown'
        leadSources[leadSource] = (leadSources[leadSource] || 0) + 1

        const region = job.customer.region.name
        regionsCount[region] = (regionsCount[region] || 0) + 1

        const jobType = job.job_type === 'c' ? 'Commercial' : 'Residential'
        jobTypes[jobType] = (jobTypes[jobType] || 0) + 1

        if (job.customer.rep) {
          const repName = job.customer.rep.name
          topPerformers[repName] = (topPerformers[repName] || 0) + 1
        }
      })

      // Sort and get top performers
      const sortedPerformers = Object.entries(topPerformers)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .reduce((acc, [name, count]) => ({ ...acc, [name]: count }), {})

      // Get recent activity (last 10 approved jobs)
      const recentActivity = approvedJobs
        .sort((a, b) => new Date(b.date_approved || b.date_created).getTime() - new Date(a.date_approved || a.date_created).getTime())
        .slice(0, 10)

      const businessMetrics: BusinessMetrics = {
        totalApprovedJobs: approvedJobs.length,
        totalProspectJobs: prospectJobs.length,
        totalCustomers: customers.length,
        totalRevenue,
        averageJobValue: jobCount > 0 ? Math.round(totalRevenue / jobCount) : 0,
        leadSources,
        regions: regionsCount,
        jobTypes,
        recentActivity,
        topPerformers: sortedPerformers
      }

      setMetrics(businessMetrics)
    } catch (error) {
      console.error('Error processing business data:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    processBusinessData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your business data...</p>
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
            onClick={processBusinessData}
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🏢 Business Data Insights</h1>
        <p className="text-gray-600 mb-6">
          Comprehensive analysis of your roofing business data from RoofLink API
        </p>
        
        <button
          onClick={processBusinessData}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-3xl font-bold text-green-600">{metrics.totalApprovedJobs.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Approved Jobs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-3xl font-bold text-blue-600">{metrics.totalProspectJobs.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Prospect Jobs</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-3xl font-bold text-purple-600">{metrics.totalCustomers.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Customers</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="text-3xl font-bold text-orange-600">${metrics.totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Estimated Revenue</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Lead Sources */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Sources</h3>
          <div className="space-y-3">
            {Object.entries(metrics.leadSources)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([source, count]) => (
                <div key={source} className="flex justify-between items-center">
                  <span className="text-gray-700">{source}</span>
                  <span className="font-semibold text-blue-600">{count}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Regions */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs by Region</h3>
          <div className="space-y-3">
            {Object.entries(metrics.regions)
              .sort(([,a], [,b]) => b - a)
              .map(([region, count]) => (
                <div key={region} className="flex justify-between items-center">
                  <span className="text-gray-700">{region}</span>
                  <span className="font-semibold text-green-600">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Job Types */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Types</h3>
          <div className="space-y-3">
            {Object.entries(metrics.jobTypes)
              .sort(([,a], [,b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-gray-700">{type}</span>
                  <span className="font-semibold text-purple-600">{count}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers (Jobs)</h3>
          <div className="space-y-3">
            {Object.entries(metrics.topPerformers)
              .sort(([,a], [,b]) => b - a)
              .map(([rep, count]) => (
                <div key={rep} className="flex justify-between items-center">
                  <span className="text-gray-700">{rep}</span>
                  <span className="font-semibold text-orange-600">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.recentActivity.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {job.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.job_type === 'c' ? 'Commercial' : 'Residential'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                      style={{ backgroundColor: job.job_status.color }}
                    >
                      {job.job_status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.date_approved || job.date_created}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
