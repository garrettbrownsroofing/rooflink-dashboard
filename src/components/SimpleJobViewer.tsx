'use client'

import React, { useState, useEffect } from 'react'
import { mcpClient } from '@/lib/mcp-client'

interface SimpleJob {
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

export default function SimpleJobViewer() {
  const [jobs, setJobs] = useState<SimpleJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<SimpleJob | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Starting job fetch process...')
      
      // Always ensure we have the API key set
      mcpClient.setApiKey('K6RCRYiSGSuzi2Xa56wiKTG0VZbZseDbwjwcgBzAaaET7qIqAWAwjvxwzsFLyEqN')
      console.log('API key set for authentication')
      
      console.log('Connecting to MCP server...')
      const connected = await mcpClient.connect()
      console.log('MCP connection result:', connected)
      
      if (!connected) {
        throw new Error('Failed to connect to MCP server')
      }

      // Try multiple endpoints to find working ones
      console.log('Trying different job endpoints...')
      
      let approvedResponse = null
      let prospectResponse = null
      
      // Try approved jobs endpoint
      try {
        console.log('Fetching approved jobs...')
        approvedResponse = await mcpClient.getRoofLinkData('/light/jobs/approved/')
        console.log('Approved jobs response:', JSON.stringify(approvedResponse, null, 2))
      } catch (error) {
        console.log('Approved jobs endpoint failed, trying alternative...')
        try {
          approvedResponse = await mcpClient.getRoofLinkData('/light/jobs/?limit=100&offset=0')
          console.log('Alternative jobs response:', JSON.stringify(approvedResponse, null, 2))
        } catch (altError) {
          console.log('Alternative endpoint also failed:', altError)
        }
      }

      // Try prospect jobs endpoint
      try {
        console.log('Fetching prospect jobs...')
        prospectResponse = await mcpClient.getRoofLinkData('/light/jobs/prospect/')
        console.log('Prospect jobs response:', JSON.stringify(prospectResponse, null, 2))
      } catch (error) {
        console.log('Prospect jobs endpoint failed:', error)
      }

      let allJobs: SimpleJob[] = []

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
      setJobs([]) // Clear any existing data on error
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Loading jobs from RoofLink API...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Jobs</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchJobs}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RoofLink Jobs & Prospects</h1>
            <p className="text-gray-600">Total Jobs: {jobs.length}</p>
          </div>
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedJob(job)}
          >
            {/* Job Header */}
            <div className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">{job.name}</h3>
                  <p className="text-sm text-gray-600">{job.customer.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className="px-2 py-1 text-xs font-medium rounded-full text-white"
                    style={{ backgroundColor: job.job_status?.color || '#6B7280' }}
                  >
                    {job.job_status?.label || job.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Job #:</span>
                  <span className="ml-1 font-medium">{job.job_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-1 font-medium">{getJobTypeLabel(job.job_type)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Bid Type:</span>
                  <span className="ml-1 font-medium">{getBidTypeLabel(job.bid_type)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Region:</span>
                  <span className="ml-1 font-medium">{job.customer.region.name}</span>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">Address:</span>
                <p className="text-gray-900 text-xs mt-1">{job.full_address}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Sales Rep:</span>
                  <span className="ml-1 font-medium">{job.customer.rep?.name || 'Not assigned'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Lead Source:</span>
                  <span className="ml-1 font-medium">{job.customer.lead_source?.name || 'Not specified'}</span>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">Created:</span>
                <span className="ml-1 font-medium">{formatDate(job.date_created)}</span>
              </div>

              {job.date_approved && (
                <div className="text-sm">
                  <span className="text-gray-500">Approved:</span>
                  <span className="ml-1 font-medium">{formatDate(job.date_approved)}</span>
                </div>
              )}

              {job.last_note && (
                <div className="text-sm">
                  <span className="text-gray-500">Last Note:</span>
                  <p className="text-gray-900 text-xs mt-1">{job.last_note}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Job Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedJob.name}</h2>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Info</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Name:</span>
                      <p className="font-medium">{selectedJob.customer.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Lead Source:</span>
                      <p className="font-medium">{selectedJob.customer.lead_source?.name || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Mailing Address:</span>
                      <p className="font-medium">{selectedJob.full_address}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Region:</span>
                      <p className="font-medium">{selectedJob.customer.region.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <p className="font-medium">{selectedJob.customer.cell || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">{selectedJob.customer.email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Job Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Info</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Job Name:</span>
                      <p className="font-medium">{selectedJob.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Job Address:</span>
                      <p className="font-medium text-blue-600">{selectedJob.full_address}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Job Number:</span>
                      <p className="font-medium">{selectedJob.job_number || 'Not assigned'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Date Created:</span>
                      <p className="font-medium">{formatDate(selectedJob.date_created)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Created By:</span>
                      <p className="font-medium">{selectedJob.customer.rep?.name || 'Unknown'}</p>
                    </div>
                    {selectedJob.date_approved && (
                      <div>
                        <span className="text-gray-500">Date Approved:</span>
                        <p className="font-medium">{formatDate(selectedJob.date_approved)}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Job Type:</span>
                      <p className="font-medium">{getJobTypeLabel(selectedJob.job_type)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Bid Type:</span>
                      <p className="font-medium">{getBidTypeLabel(selectedJob.bid_type)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Lead Status:</span>
                      <p className="font-medium">{selectedJob.job_status?.label || selectedJob.category}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Sales Rep:</span>
                      <p className="font-medium">{selectedJob.customer.rep?.name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Team:</span>
                      <p className="font-medium">{selectedJob.customer.region.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Marketing Rep:</span>
                      <p className="font-medium">{selectedJob.customer.marketing_rep?.name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Project Manager:</span>
                      <p className="font-medium">{selectedJob.customer.project_manager?.name || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collections/Status Section */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Collections</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedJob.last_note || 'No status updates available'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
