'use client'

import { useState, useEffect } from 'react'
import { mcpClient } from '@/lib/mcp-client'

interface Job {
  id: number
  name: string
  job_number?: string
  job_type: 'c' | 'r'
  bid_type: 'r' | 'c' | 'i' | ''
  job_status?: {
    color: string
    label: string
  }
  full_address: string
  customer: {
    id: number
    name: string
    cell?: string
    email?: string
    region: {
      name: string
    }
    lead_source?: {
      name: string
    }
    rep?: {
      name: string
    }
    project_manager?: {
      name: string
    }
    marketing_rep?: {
      name: string
    }
  }
  date_created: string
  date_approved?: string
  date_closed?: string
  last_note?: string
  category: 'Approved' | 'Prospect'
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    fetchAllJobs()
  }, [])

  const fetchAllJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Starting job fetch process...')
      
      // Set API key and connect
      mcpClient.setApiKey('K6RCRYiSGSuzi2Xa56wiKTG0VZbZseDbwjwcgBzAaaET7qIqAWAwjvxwzsFLyEqN')
      const connected = await mcpClient.connect()
      
      if (!connected) {
        throw new Error('Failed to connect to MCP server')
      }
      
      setIsConnected(true)
      console.log('MCP connection successful')

      // Fetch approved jobs
      console.log('Fetching approved jobs...')
      const approvedResponse = await mcpClient.getRoofLinkData('/light/jobs/approved/')
      
      // Fetch prospect jobs
      console.log('Fetching prospect jobs...')
      const prospectResponse = await mcpClient.getRoofLinkData('/light/jobs/prospect/')

      let allJobs: Job[] = []

      // Process approved jobs
      if (approvedResponse?.data?.content?.[0]?.text) {
        try {
          const data = JSON.parse(approvedResponse.data.content[0].text)
          console.log('Parsed approved jobs data:', data)
          
          if (data.results && Array.isArray(data.results)) {
            const approvedJobs = data.results.map((job: any) => ({
              id: job.id,
              name: job.name,
              job_number: job.job_number,
              job_type: job.job_type,
              bid_type: job.bid_type,
              job_status: job.job_status,
              full_address: job.full_address,
              customer: {
                id: job.customer?.id,
                name: job.customer?.name,
                cell: job.customer?.cell,
                email: job.customer?.email,
                region: {
                  name: job.customer?.region?.name
                },
                lead_source: job.customer?.lead_source ? {
                  name: job.customer.lead_source.name
                } : undefined,
                rep: job.customer?.rep ? {
                  name: job.customer.rep.name
                } : undefined,
                project_manager: job.customer?.project_manager ? {
                  name: job.customer.project_manager.name
                } : undefined,
                marketing_rep: job.customer?.marketing_rep ? {
                  name: job.customer.marketing_rep.name
                } : undefined
              },
              date_created: job.date_created,
              date_approved: job.date_approved,
              date_closed: job.date_closed,
              last_note: job.last_note,
              category: 'Approved' as const
            }))
            allJobs = [...allJobs, ...approvedJobs]
            console.log(`Added ${approvedJobs.length} approved jobs`)
          }
        } catch (parseError) {
          console.error('Error parsing approved jobs:', parseError)
        }
      }

      // Process prospect jobs
      if (prospectResponse?.data?.content?.[0]?.text) {
        try {
          const data = JSON.parse(prospectResponse.data.content[0].text)
          console.log('Parsed prospect jobs data:', data)
          
          if (data.results && Array.isArray(data.results)) {
            const prospectJobs = data.results.map((job: any) => ({
              id: job.id,
              name: job.name,
              job_number: job.job_number,
              job_type: job.job_type,
              bid_type: job.bid_type,
              job_status: { color: '#6B7280', label: 'Prospect' },
              full_address: job.full_address,
              customer: {
                id: job.customer?.id,
                name: job.customer?.name,
                cell: job.customer?.cell,
                email: job.customer?.email,
                region: {
                  name: job.customer?.region?.name
                },
                lead_source: job.customer?.lead_source ? {
                  name: job.customer.lead_source.name
                } : undefined,
                rep: job.customer?.rep ? {
                  name: job.customer.rep.name
                } : undefined,
                project_manager: job.customer?.project_manager ? {
                  name: job.customer.project_manager.name
                } : undefined,
                marketing_rep: job.customer?.marketing_rep ? {
                  name: job.customer.marketing_rep.name
                } : undefined
              },
              date_created: job.date_created,
              last_note: job.last_note,
              category: 'Prospect' as const
            }))
            allJobs = [...allJobs, ...prospectJobs]
            console.log(`Added ${prospectJobs.length} prospect jobs`)
          }
        } catch (parseError) {
          console.error('Error parsing prospect jobs:', parseError)
        }
      }

      console.log(`Total jobs loaded: ${allJobs.length}`)
      
      if (allJobs.length === 0) {
        throw new Error('No jobs found in API response. Please check API connection and endpoints.')
      }
      
      setJobs(allJobs)
      console.log('Successfully loaded real job data from RoofLink API')

    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getJobTypeLabel = (jobType: string) => {
    return jobType === 'c' ? 'Commercial' : 'Residential'
  }

  const getBidTypeLabel = (bidType: string) => {
    switch (bidType) {
      case 'r': return 'Residential Bid'
      case 'c': return 'Commercial Bid'
      case 'i': return 'Insurance Bid'
      default: return 'Not Specified'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Loading jobs from RoofLink API...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Jobs</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAllJobs}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RoofLink Jobs & Prospects</h1>
              <p className="text-gray-600">Total Jobs: {jobs.length}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <button
                onClick={fetchAllJobs}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.name}</div>
                          <div className="text-sm text-gray-500">
                            #{job.job_number || 'N/A'} • {getJobTypeLabel(job.job_type)} • {getBidTypeLabel(job.bid_type)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{job.customer.name}</div>
                      <div className="text-sm text-gray-500">
                        {job.customer.cell && <div>📞 {job.customer.cell}</div>}
                        {job.customer.email && <div>✉️ {job.customer.email}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{job.full_address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Region: {job.customer.region.name}</div>
                        {job.customer.rep && <div>Rep: {job.customer.rep.name}</div>}
                        {job.customer.project_manager && <div>PM: {job.customer.project_manager.name}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {job.customer.lead_source?.name || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: job.job_status?.color || '#6B7280' }}
                        >
                          {job.job_status?.label || job.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Created: {formatDate(job.date_created)}</div>
                      {job.date_approved && <div>Approved: {formatDate(job.date_approved)}</div>}
                      {job.date_closed && <div>Closed: {formatDate(job.date_closed)}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {jobs.filter(job => job.category === 'Approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved Jobs</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">
              {jobs.filter(job => job.category === 'Prospect').length}
            </div>
            <div className="text-sm text-gray-600">Prospect Jobs</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {jobs.filter(job => job.customer.region.name.toLowerCase().includes('la')).length}
            </div>
            <div className="text-sm text-gray-600">LA Region Jobs</div>
          </div>
        </div>
      </div>
    </div>
  )
}
