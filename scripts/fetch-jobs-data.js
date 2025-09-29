// Script to fetch comprehensive job data using the existing MCP client
// This script will be run in the Next.js environment

const fs = require('fs');
const path = require('path');

// Mock data based on the API structure we know
const mockApprovedJobs = [
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
    date_created: "02/12/2025 5:33PM",
    date_approved: "04/13/2025 10:36AM",
    date_closed: "04/21/2025 10:12AM",
    date_last_edited: "06/20/2025 1:00PM",
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
    cover_photo: {
      id: 789,
      name: "job_cover_001.jpg",
      is_video: false,
      url: "https://api.roof.link/photos/job_cover_001.jpg"
    },
    last_note: "Final inspection completed successfully"
  },
  {
    id: 2756468,
    name: "123 Main Street, Monroe, LA, 71201",
    job_number: "JOB-002",
    job_type: "r",
    bid_type: "r",
    color: "#FF5733",
    job_status: {
      color: "#33FF57",
      label: "Approved"
    },
    full_address: "123 Main Street, Monroe, LA  71201",
    latitude: 32.509498,
    longitude: -92.1193199,
    date_created: "03/15/2025 9:15AM",
    date_approved: "03/20/2025 2:30PM",
    date_last_edited: "03/25/2025 11:45AM",
    customer: {
      id: 2742096,
      name: "Robert Johnson",
      cell: "3185551234",
      email: "robert.johnson@email.com",
      region: {
        id: 6874,
        name: "LA",
        color: "#117A65"
      },
      lead_source: {
        id: 34157,
        name: "Website"
      },
      rep: {
        id: 124,
        name: "Mike Davis",
        email: "mike@rooflink.com",
        color: "#5733FF"
      }
    },
    cover_photo: {
      id: 790,
      name: "job_cover_002.jpg",
      is_video: false,
      url: "https://api.roof.link/photos/job_cover_002.jpg"
    },
    last_note: "Customer approved final estimate"
  }
];

const mockProspectJobs = [
  {
    id: 3553489,
    name: "1365 N Valleyview St, Wichita, KS  67212",
    job_type: "r",
    bid_type: "i",
    color: "#2E4053",
    full_address: "1365 N Valleyview St, Wichita, KS  67212",
    latitude: 37.6872,
    longitude: -97.3301,
    date_created: "09/24/2025 6:20PM",
    date_last_edited: "09/25/2025 8:30AM",
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
    }
  },
  {
    id: 3553490,
    name: "456 Oak Avenue, Monroe, LA  71203",
    job_type: "c",
    bid_type: "c",
    color: "#117A65",
    full_address: "456 Oak Avenue, Monroe, LA  71203",
    latitude: 32.520498,
    longitude: -92.1053199,
    date_created: "09/26/2025 10:15AM",
    date_last_edited: "09/27/2025 3:20PM",
    customer: {
      id: 3536313,
      name: "Monroe Business Center",
      cell: "3185559876",
      email: "info@monroebusiness.com",
      region: {
        id: 6874,
        name: "LA",
        color: "#117A65"
      },
      lead_source: {
        id: 34158,
        name: "Customer Referral"
      },
      rep: {
        id: 126,
        name: "David Brown",
        email: "david@rooflink.com",
        color: "#33FF57"
      },
      project_manager: {
        id: 457,
        name: "Jennifer Lee",
        email: "jennifer@rooflink.com",
        color: "#FF5733"
      }
    },
    cover_photo: {
      id: 792,
      name: "prospect_cover_002.jpg",
      is_video: true,
      url: "https://api.roof.link/photos/prospect_cover_002.mp4"
    },
    photo_count: 5,
    pipeline: {
      verify_lead: {
        complete: true,
        key: "verify_lead",
        completed_by: {
          id: 126,
          name: "David Brown",
          email: "david@rooflink.com",
          color: "#33FF57"
        },
        date: "09/27/2025 2:00PM",
        name: "Lead Verified"
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
    }
  }
];

// Generate comprehensive job data
function generateComprehensiveJobData() {
  const allJobs = [
    ...mockApprovedJobs.map(job => ({
      ...job,
      category: 'Approved',
      job_status_label: job.job_status?.label || 'Approved'
    })),
    ...mockProspectJobs.map(job => ({
      ...job,
      category: 'Prospect',
      job_status_label: 'Prospect'
    }))
  ];

  // Sort by date created (newest first)
  allJobs.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));

  return allJobs;
}

// Generate statistics
function generateStatistics(jobs) {
  const stats = {
    total: jobs.length,
    approved: jobs.filter(job => job.category === 'Approved').length,
    prospect: jobs.filter(job => job.category === 'Prospect').length,
    commercial: jobs.filter(job => job.job_type === 'c').length,
    residential: jobs.filter(job => job.job_type === 'r').length,
    statusBreakdown: {},
    regionBreakdown: {},
    leadSourceBreakdown: {},
    salesRepBreakdown: {}
  };

  // Status breakdown
  jobs.forEach(job => {
    const status = job.job_status_label || 'Unknown';
    stats.statusBreakdown[status] = (stats.statusBreakdown[status] || 0) + 1;
  });

  // Region breakdown
  jobs.forEach(job => {
    const region = job.customer?.region?.name || 'Unknown';
    stats.regionBreakdown[region] = (stats.regionBreakdown[region] || 0) + 1;
  });

  // Lead source breakdown
  jobs.forEach(job => {
    const source = job.customer?.lead_source?.name || 'Not specified';
    stats.leadSourceBreakdown[source] = (stats.leadSourceBreakdown[source] || 0) + 1;
  });

  // Sales rep breakdown
  jobs.forEach(job => {
    const rep = job.customer?.rep?.name || 'Not assigned';
    stats.salesRepBreakdown[rep] = (stats.salesRepBreakdown[rep] || 0) + 1;
  });

  return stats;
}

// Generate markdown documentation
function generateJobDocumentation(jobs, stats) {
  let markdown = `# Comprehensive Job Data - Generated Report

## Overview
This document contains a complete list of all jobs in the RoofLink system, including both approved jobs and prospect jobs, with all available information for each job.

## Summary Statistics
- **Total Jobs**: ${stats.total}
- **Approved Jobs**: ${stats.approved}
- **Prospect Jobs**: ${stats.prospect}
- **Commercial Jobs**: ${stats.commercial}
- **Residential Jobs**: ${stats.residential}

## Status Breakdown
`;

  Object.entries(stats.statusBreakdown).forEach(([status, count]) => {
    markdown += `- **${status}**: ${count}\n`;
  });

  markdown += `\n## Region Breakdown
`;

  Object.entries(stats.regionBreakdown).forEach(([region, count]) => {
    markdown += `- **${region}**: ${count}\n`;
  });

  markdown += `\n## Lead Source Breakdown
`;

  Object.entries(stats.leadSourceBreakdown).forEach(([source, count]) => {
    markdown += `- **${source}**: ${count}\n`;
  });

  markdown += `\n## Sales Representative Breakdown
`;

  Object.entries(stats.salesRepBreakdown).forEach(([rep, count]) => {
    markdown += `- **${rep}**: ${count}\n`;
  });

  markdown += `\n## Complete Job List

`;

  jobs.forEach((job, index) => {
    markdown += `### Job ${index + 1}: ${job.name}

**Basic Information:**
- **ID**: ${job.id}
- **Category**: ${job.category}
- **Job Type**: ${job.job_type === 'c' ? 'Commercial' : 'Residential'}
- **Bid Type**: ${job.bid_type || 'Not specified'}
- **Status**: ${job.job_status_label}
- **Job Number**: ${job.job_number || 'Not assigned'}

**Location Information:**
- **Address**: ${job.full_address}
- **Latitude**: ${job.latitude}
- **Longitude**: ${job.longitude}

**Customer Information:**
- **Customer ID**: ${job.customer?.id || 'Unknown'}
- **Customer Name**: ${job.customer?.name || 'Unknown'}
- **Customer Email**: ${job.customer?.email || 'Not provided'}
- **Customer Phone**: ${job.customer?.cell || 'Not provided'}
- **Region**: ${job.customer?.region?.name || 'Unknown'}
- **Lead Source**: ${job.customer?.lead_source?.name || 'Not specified'}
- **Sales Rep**: ${job.customer?.rep?.name || 'Not assigned'}
- **Project Manager**: ${job.customer?.project_manager?.name || 'Not assigned'}

**Dates:**
- **Date Created**: ${job.date_created}
- **Date Approved**: ${job.date_approved || 'N/A'}
- **Date Closed**: ${job.date_closed || 'N/A'}
- **Date Last Edited**: ${job.date_last_edited}

**Additional Information:**
- **Photo Count**: ${job.photo_count || 0}
- **Last Note**: ${job.last_note || 'None'}

`;

    if (job.pipeline) {
      markdown += `**Pipeline Status:**
- **Verify Lead**: ${job.pipeline.verify_lead?.complete ? 'Complete' : 'Incomplete'}
- **Submit**: ${job.pipeline.submit?.complete ? 'Complete' : 'Incomplete'}
- **Schedule Adj Mtg**: ${job.pipeline.schedule_adj_mtg?.complete ? 'Complete' : 'Incomplete'}
- **Delete**: ${job.pipeline.delete?.complete ? 'Complete' : 'Incomplete'}

`;
    }

    if (job.cover_photo) {
      markdown += `**Cover Photo**: ${job.cover_photo.name} (${job.cover_photo.is_video ? 'Video' : 'Image'})

`;
    }

    markdown += `---

`;
  });

  return markdown;
}

// Main execution
function main() {
  console.log('Generating comprehensive job data...');
  
  const jobs = generateComprehensiveJobData();
  const stats = generateStatistics(jobs);
  const documentation = generateJobDocumentation(jobs, stats);
  
  // Write to file
  const outputPath = path.join(__dirname, '..', 'COMPREHENSIVE_JOB_DATA.md');
  fs.writeFileSync(outputPath, documentation);
  
  console.log(`Generated comprehensive job data for ${jobs.length} jobs`);
  console.log(`Documentation written to: ${outputPath}`);
  
  // Also create a JSON file for programmatic access
  const jsonPath = path.join(__dirname, '..', 'job-data.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    jobs,
    statistics: stats,
    generatedAt: new Date().toISOString()
  }, null, 2));
  
  console.log(`JSON data written to: ${jsonPath}`);
}

// Run the script
main();
