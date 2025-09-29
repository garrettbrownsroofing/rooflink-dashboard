'use client'

import React, { useState, useEffect } from 'react'
import { mcpClient } from '@/lib/mcp-client'
import { RoofLinkApprovedJob, RoofLinkProspectJob } from '@/types/rooflink'

interface JobDashboardProps {
  className?: string
}

interface JobWithCategory {
  id: number
  name: string
  job_number?: string
  job_type: 'c' | 'r'
  bid_type: 'r' | 'c' | 'i' | ''
  color?: string
  job_status?: {
    color: string
    label: string
  }
  full_address: string
  latitude: number
  longitude: number
  customer: {
    id: number
    name: string
    cell?: string
    email?: string
    region: {
      id: number
      name: string
      color: string
    }
    lead_source?: {
      id: number
      name: string
    }
    rep?: {
      id: number
      name: string
      email: string
      color: string
    }
    rep_2?: {
      id: number
      name: string
      email: string
      color: string
    }
    marketing_rep?: {
      id: number
      name: string
      email: string
      color: string
    }
    project_manager?: {
      id: number
      name: string
      email: string
      color: string
    }
    pre_insurance_reviewer?: {
      id: number
      name: string
      email: string
      color: string
    }
    post_insurance_reviewer?: {
      id: number
      name: string
      email: string
      color: string
    }
  }
  date_created: string
  date_last_edited: string
  date_approved?: string
  date_closed?: string
  date_deleted?: string
  cover_photo?: {
    id?: number
    is_video: boolean
    name: string
    preview_url?: string
    thumb_url?: string
    url?: string
  }
  last_note?: string
  photo_count?: number
  pipeline?: {
    delete: {
      complete: boolean
      key: string
      name: string
      permissions: {
        can_delete: boolean
      }
      date?: string
      deleted_by?: {
        id: number
        name: string
        email: string
        color: string
      }
    }
    schedule_adj_mtg: {
      complete: boolean
      key: string
    }
    submit: {
      complete: boolean
      key: string
      permissions: any
    }
    verify_lead: {
      complete: boolean
      key: string
      completed_by?: {
        id: number
        name: string
        email: string
        color: string
      }
      date?: string
      name?: string
    }
  }
  category: 'Approved' | 'Prospect'
  job_status_label: string
}

export default function ComprehensiveJobDashboard({ className = '' }: JobDashboardProps) {
  const [jobs, setJobs] = useState<JobWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<JobWithCategory | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'approved' | 'prospect'>('all')
  const [filterRegion, setFilterRegion] = useState<string>('all')

  // Sample data including Robert Mincil's job
  const sampleJobs: JobWithCategory[] = [
    {
      id: 3235064,
      name: "8440 Beebe Dr, Greenwood, LA, 71033",
      job_number: "3235064",
      job_type: "r",
      bid_type: "i",
      color: "#117A65",
      job_status: {
        color: "#117A65",
        label: "BUILD NEXT WEEK"
      },
      full_address: "8440 Beebe Dr, Greenwood, LA 71033",
      latitude: 32.4425,
      longitude: -93.9711,
      customer: {
        id: 2742097,
        name: "Robert Mincil (Browns Roofing)",
        cell: "3185195200",
        email: "tester@tester.com",
        region: {
          id: 6875,
          name: "Shreveport",
          color: "#117A65"
        },
        lead_source: {
          id: 34157,
          name: "Door Knocking"
        },
        rep: {
          id: 127,
          name: "Austin Race",
          email: "austin@rooflink.com",
          color: "#FF5733"
        },
        project_manager: {
          id: 458,
          name: "Austin Race",
          email: "austin@rooflink.com",
          color: "#33FF57"
        },
        marketing_rep: {
          id: 459,
          name: "Carter Martin",
          email: "carter@rooflink.com",
          color: "#5733FF"
        }
      },
      date_created: "06/24/2025 4:58PM",
      date_approved: "08/06/2025 10:44AM",
      date_last_edited: "08/06/2025 10:44AM",
      cover_photo: {
        id: 790,
        name: "job_cover_3235064.jpg",
        is_video: false,
        url: "https://api.roof.link/photos/job_cover_3235064.jpg"
      },
      last_note: "Final Check Approved 6 days ago. Next Step: Request RD",
      category: 'Approved',
      job_status_label: 'BUILD NEXT WEEK'
    },
    {
      id: 2756467,
      name: "1700 Orange Street, Monroe, LA, 71202",
      job_number: "JOB-001",
      job_type: "c",
      bid_type: "r",
      color: "#88adf7",
      job_status: {
        color: "#88adf7",
        label: "Closed"
      },
      full_address: "1700 Orange Street, Monroe, LA  71202",
      latitude: 32.497498,
      longitude: -92.0953199,
      customer: {
        id: 2742095,
        name: "Carver Elementary School",
        cell: "3187946280",
        email: "contact@carver.edu",
        region: {
          id: 6874,
          name: "LA",
          color: "#117A65"
        },
        lead_source: {
          id: 34156,
          name: "Door Knocking"
        },
        rep: {
          id: 123,
          name: "John Smith",
          email: "john@rooflink.com",
          color: "#FF5733"
        },
        project_manager: {
          id: 456,
          name: "Sarah Johnson",
          email: "sarah@rooflink.com",
          color: "#33FF57"
        }
      },
      date_created: "02/12/2025 5:33PM",
      date_approved: "04/13/2025 10:36AM",
      date_closed: "04/21/2025 10:12AM",
      date_last_edited: "06/20/2025 1:00PM",
      cover_photo: {
        id: 789,
        name: "job_cover_001.jpg",
        is_video: false,
        url: "https://api.roof.link/photos/job_cover_001.jpg"
      },
      last_note: "Final inspection completed successfully",
      category: 'Approved',
      job_status_label: 'Closed'
    },
    {
      id: 3553489,
      name: "1365 N Valleyview St, Wichita, KS  67212",
      job_type: "r",
      bid_type: "i",
      color: "#2E4053",
      full_address: "1365 N Valleyview St, Wichita, KS  67212",
      latitude: 37.6872,
      longitude: -97.3301,
      customer: {
        id: 3536312,
        name: "Emma Powell",
        cell: "3182008923",
        email: "mark_powell3@hotmail.com",
        region: {
          id: 15867,
          name: "Kansas",
          color: "#2E4053"
        },
        lead_source: {
          id: 94378,
          name: "SalesRabbit"
        },
        rep: {
          id: 125,
          name: "Lisa Wilson",
          email: "lisa@rooflink.com",
          color: "#FF3357"
        }
      },
      date_created: "09/24/2025 6:20PM",
      date_last_edited: "09/25/2025 8:30AM",
      cover_photo: {
        id: 791,
        name: "prospect_cover_001.jpg",
        is_video: false,
        url: "https://api.roof.link/photos/prospect_cover_001.jpg"
      },
      photo_count: 3,
      pipeline: {
        verify_lead: {
          complete: false,
          key: "verify_lead"
        },
        submit: {
          complete: false,
          key: "submit",
          permissions: {}
        },
        schedule_adj_mtg: {
          complete: false,
          key: "schedule_adj_mtg"
        },
        delete: {
          complete: false,
          key: "delete",
          name: "Delete",
          permissions: {
            can_delete: true
          }
        }
      },
      category: 'Prospect',
      job_status_label: 'Prospect'
    }
  ]

  useEffect(() => {
    fetchAllJobs()
  }, [])

  const fetchAllJobs = async () => {
    try {
      setLoading(true)
      
      // Connect to MCP if not already connected
      const connected = await mcpClient.connect()
      if (!connected) {
        console.error('Failed to connect to MCP server')
        // Fallback to sample data
        setJobs(sampleJobs)
        setLoading(false)
        return
      }

      // Fetch approved jobs
      console.log('Fetching approved jobs...')
      const approvedJobsResponse = await mcpClient.getRoofLinkData('/light/jobs/approved/')
      
      // Fetch prospect jobs
      console.log('Fetching prospect jobs...')
      const prospectJobsResponse = await mcpClient.getRoofLinkData('/light/jobs/prospect/')

      let allJobs: JobWithCategory[] = []

      // Process approved jobs
      if (approvedJobsResponse?.data?.content?.[0]?.text) {
        try {
          const approvedData = JSON.parse(approvedJobsResponse.data.content[0].text)
          if (approvedData.results && Array.isArray(approvedData.results)) {
            const approvedJobs = approvedData.results.map((job: any) => ({
              ...job,
              category: 'Approved' as const,
              job_status_label: job.job_status?.label || 'Approved'
            }))
            allJobs = [...allJobs, ...approvedJobs]
            console.log(`Fetched ${approvedJobs.length} approved jobs`)
          }
        } catch (error) {
          console.error('Error parsing approved jobs:', error)
        }
      }

      // Process prospect jobs
      if (prospectJobsResponse?.data?.content?.[0]?.text) {
        try {
          const prospectData = JSON.parse(prospectJobsResponse.data.content[0].text)
          if (prospectData.results && Array.isArray(prospectData.results)) {
            const prospectJobs = prospectData.results.map((job: any) => ({
              ...job,
              category: 'Prospect' as const,
              job_status_label: 'Prospect'
            }))
            allJobs = [...allJobs, ...prospectJobs]
            console.log(`Fetched ${prospectJobs.length} prospect jobs`)
          }
        } catch (error) {
          console.error('Error parsing prospect jobs:', error)
        }
      }

      // If we got real data, use it; otherwise fallback to sample data
      if (allJobs.length > 0) {
        setJobs(allJobs)
        console.log(`Total jobs loaded: ${allJobs.length}`)
      } else {
        console.log('No real data available, using sample data')
        setJobs(sampleJobs)
      }

    } catch (error) {
      console.error('Error fetching jobs:', error)
      // Fallback to sample data
      setJobs(sampleJobs)
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.full_address.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || 
                       (filterType === 'approved' && job.category === 'Approved') ||
                       (filterType === 'prospect' && job.category === 'Prospect')
    
    const matchesRegion = filterRegion === 'all' || 
                         job.customer.region.name.toLowerCase().includes(filterRegion.toLowerCase())
    
    return matchesSearch && matchesType && matchesRegion
  })

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading jobs...</div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Comprehensive Job Dashboard</h1>
              <p className="text-gray-600">
                View and manage all {jobs.length} jobs in the RoofLink system
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchAllJobs}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? 'Loading...' : 'Refresh Data'}</span>
              </button>
            </div>
          </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search jobs, customers, addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Jobs</option>
              <option value="approved">Approved Jobs</option>
              <option value="prospect">Prospect Jobs</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Regions</option>
              <option value="la">LA/Monroe</option>
              <option value="shreveport">Shreveport</option>
              <option value="kansas">Kansas</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterType('all')
                setFilterRegion('all')
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
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
                    className="px-2 py-1 text-xs font-medium rounded-full"
                    style={{ 
                      backgroundColor: job.job_status?.color || '#6B7280',
                      color: 'white'
                    }}
                  >
                    {job.job_status_label}
                  </span>
                  <span className="text-xs text-gray-500">{job.category}</span>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
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
                <p className="text-gray-900 mt-1">{job.full_address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Sales Rep:</span>
                  <span className="ml-1 font-medium">{job.customer.rep?.name || 'Not assigned'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Project Manager:</span>
                  <span className="ml-1 font-medium">{job.customer.project_manager?.name || 'Not assigned'}</span>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">Lead Source:</span>
                <span className="ml-1 font-medium">{job.customer.lead_source?.name || 'Not specified'}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-1 font-medium">{formatDate(job.date_created)}</span>
                </div>
                {job.category === 'Approved' && 'date_approved' in job && job.date_approved && (
                  <div>
                    <span className="text-gray-500">Approved:</span>
                    <span className="ml-1 font-medium">{formatDate(job.date_approved)}</span>
                  </div>
                )}
              </div>

              {/* Pipeline Status for Prospect Jobs */}
              {job.category === 'Prospect' && job.pipeline && (
                <div className="text-sm">
                  <span className="text-gray-500">Pipeline Status:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      job.pipeline.verify_lead?.complete ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      Lead {job.pipeline.verify_lead?.complete ? 'Verified' : 'Pending'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      job.pipeline.submit?.complete ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.pipeline.submit?.complete ? 'Submitted' : 'Not Submitted'}
                    </span>
                  </div>
                </div>
              )}

              {/* Collections Status for Approved Jobs */}
              {job.category === 'Approved' && (
                <div className="text-sm">
                  <span className="text-gray-500">Collections:</span>
                  <div className="mt-1 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-600">
                      {job.last_note || 'Status pending'}
                    </span>
                  </div>
                </div>
              )}

              {job.last_note && (
                <div className="text-sm">
                  <span className="text-gray-500">Last Note:</span>
                  <p className="text-gray-900 mt-1 text-xs">{job.last_note}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedJob.name}</h2>
                  <p className="text-gray-600">{selectedJob.customer.name}</p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Customer Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    Customer Info
                    <button className="ml-2 text-blue-600 hover:text-blue-800">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Name:</span>
                      <p className="font-medium">{selectedJob.customer.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Lead Source:</span>
                      <p className="font-medium">{selectedJob.customer.lead_source?.name || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Mailing Address:</span>
                      <p className="font-medium">{selectedJob.full_address}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Region:</span>
                      <p className="font-medium">{selectedJob.customer.region.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Phone:</span>
                      <p className="font-medium">{selectedJob.customer.cell || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Email:</span>
                      <p className="font-medium">{selectedJob.customer.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Email Verified:</span>
                      <p className="font-medium text-gray-500">Not Verified</p>
                    </div>
                  </div>
                </div>

                {/* Job Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    Job Info
                    <button className="ml-2 text-blue-600 hover:text-blue-800">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500">Job Name:</span>
                      <p className="font-medium">{selectedJob.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Job Address:</span>
                      <p className="font-medium text-blue-600 cursor-pointer hover:underline">{selectedJob.full_address}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Job Number:</span>
                      <p className="font-medium">{selectedJob.job_number || 'Not assigned'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Date Created:</span>
                      <p className="font-medium">{formatDate(selectedJob.date_created)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Created By:</span>
                      <p className="font-medium">{selectedJob.customer.rep?.name || 'Unknown'}</p>
                    </div>
                    {selectedJob.category === 'Approved' && 'date_approved' in selectedJob && selectedJob.date_approved && (
                      <div>
                        <span className="text-sm text-gray-500">Date Approved:</span>
                        <p className="font-medium">{formatDate(selectedJob.date_approved)}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-500">Job Type:</span>
                      <p className="font-medium">{getJobTypeLabel(selectedJob.job_type)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Bid Type:</span>
                      <p className="font-medium">{getBidTypeLabel(selectedJob.bid_type)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Lead Status:</span>
                      <p className="font-medium">{selectedJob.job_status_label}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Sales Rep:</span>
                      <p className="font-medium">{selectedJob.customer.rep?.name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Team:</span>
                      <p className="font-medium">{selectedJob.customer.region.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Marketing Rep:</span>
                      <p className="font-medium">{selectedJob.customer.marketing_rep?.name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Project Manager:</span>
                      <p className="font-medium">{selectedJob.customer.project_manager?.name || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collections/Status Section */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
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

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{filteredJobs.length}</div>
            <div className="text-sm text-gray-600">Filtered Jobs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {filteredJobs.filter(job => job.category === 'Approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved Jobs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {filteredJobs.filter(job => job.category === 'Prospect').length}
            </div>
            <div className="text-sm text-gray-600">Prospect Jobs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {filteredJobs.filter(job => job.customer.region.name.toLowerCase().includes('la')).length}
            </div>
            <div className="text-sm text-gray-600">LA Region Jobs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {filteredJobs.filter(job => job.job_type === 'c').length}
            </div>
            <div className="text-sm text-gray-600">Commercial Jobs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600">
              {filteredJobs.filter(job => job.job_type === 'r').length}
            </div>
            <div className="text-sm text-gray-600">Residential Jobs</div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Key Metrics</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Lead Sources</h5>
              <div className="space-y-1">
                {Object.entries(
                  filteredJobs.reduce((acc, job) => {
                    const source = job.customer.lead_source?.name || 'Not specified'
                    acc[source] = (acc[source] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                )
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([source, count]) => (
                    <div key={source} className="flex justify-between text-sm">
                      <span className="text-gray-600">{source}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Sales Reps</h5>
              <div className="space-y-1">
                {Object.entries(
                  filteredJobs.reduce((acc, job) => {
                    const rep = job.customer.rep?.name || 'Not assigned'
                    acc[rep] = (acc[rep] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                )
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([rep, count]) => (
                    <div key={rep} className="flex justify-between text-sm">
                      <span className="text-gray-600">{rep}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Job Status</h5>
              <div className="space-y-1">
                {Object.entries(
                  filteredJobs.reduce((acc, job) => {
                    const status = job.job_status_label || 'Unknown'
                    acc[status] = (acc[status] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                )
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([status, count]) => (
                    <div key={status} className="flex justify-between text-sm">
                      <span className="text-gray-600">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
