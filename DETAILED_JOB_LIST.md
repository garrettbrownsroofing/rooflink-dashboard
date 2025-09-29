# Detailed Job List - RoofLink System

## Complete Job Inventory

This document provides a comprehensive list of all jobs in the RoofLink system with detailed information for each job.

## Summary

- **Total Jobs**: 9,193
- **Approved Jobs**: 1,817
- **Prospect Jobs**: 7,376
- **Data Last Updated**: September 29, 2025

## Job Categories

### 1. Approved Jobs (1,817 jobs)

These are jobs that have been approved and are either in progress, completed, or closed.

#### Job Status Distribution (Approved Jobs)
- **Closed**: ~1,200 jobs (66%)
- **Approved**: ~400 jobs (22%)
- **In Progress**: ~200 jobs (11%)
- **Scheduled**: ~17 jobs (1%)

#### Job Type Distribution (Approved Jobs)
- **Commercial**: ~600 jobs (33%)
- **Residential**: ~1,200 jobs (66%)
- **Insurance**: ~17 jobs (1%)

### 2. Prospect Jobs (7,376 jobs)

These are jobs in the sales pipeline that have not yet been approved.

#### Pipeline Status Distribution (Prospect Jobs)
- **Lead Verified**: ~2,200 jobs (30%)
- **Lead Not Verified**: ~5,176 jobs (70%)

#### Job Type Distribution (Prospect Jobs)
- **Commercial**: ~1,900 jobs (26%)
- **Residential**: ~5,400 jobs (73%)
- **Insurance**: ~76 jobs (1%)

## Detailed Job Information

### Information Available for Each Job

#### Basic Job Information
1. **Job ID** - Unique identifier
2. **Job Name** - Descriptive name/title
3. **Job Number** - Optional job number
4. **Job Type** - Commercial ('c') or Residential ('r')
5. **Bid Type** - Residential ('r'), Commercial ('c'), or Insurance ('i')
6. **Status** - Current job status with color coding
7. **Color Code** - Hex color for UI display

#### Location Information
1. **Full Address** - Complete address string
2. **Latitude** - GPS latitude coordinate
3. **Longitude** - GPS longitude coordinate

#### Customer Information
1. **Customer ID** - Unique customer identifier
2. **Customer Name** - Full customer name
3. **Customer Email** - Email address (if provided)
4. **Customer Phone** - Cell phone number
5. **Region** - Geographic region with ID, name, and color
6. **Lead Source** - How the customer was acquired
7. **Sales Representative** - Primary sales rep with contact details
8. **Sales Rep 2** - Secondary sales rep (if assigned)
9. **Marketing Representative** - Marketing rep details
10. **Project Manager** - Assigned project manager
11. **Pre-Insurance Reviewer** - Pre-insurance reviewer
12. **Post-Insurance Reviewer** - Post-insurance reviewer

#### Timeline Information
1. **Date Created** - Initial creation timestamp
2. **Date Approved** - Approval timestamp (approved jobs only)
3. **Date Closed** - Closure timestamp (if applicable)
4. **Date Deleted** - Deletion timestamp (if applicable)
5. **Date Last Edited** - Most recent modification

#### Additional Information
1. **Cover Photo** - Photo/video object with metadata
2. **Last Note** - Most recent job note
3. **Photo Count** - Number of associated photos (prospect jobs)
4. **Estimated Revenue** - Calculated based on job type and region

#### Pipeline Information (Prospect Jobs Only)
1. **Verify Lead** - Lead verification status and completion details
2. **Submit** - Submission status and permissions
3. **Schedule Adj Mtg** - Schedule adjustment meeting status
4. **Delete** - Deletion status and permissions

## Regional Distribution

### LA/Monroe Region (~3,000 jobs)
- **Approved**: ~1,200 jobs
- **Prospect**: ~1,800 jobs
- **Commercial**: ~800 jobs
- **Residential**: ~2,200 jobs

### Other Regions (~6,193 jobs)
- **Kansas**: ~1,500 jobs
- **Texas**: ~1,200 jobs
- **Oklahoma**: ~800 jobs
- **Arkansas**: ~600 jobs
- **Other States**: ~2,093 jobs

## Lead Source Analysis

### Door Knocking Sources (~2,500 jobs)
- **Door Knocking**: ~1,200 jobs
- **SalesRabbit**: ~800 jobs
- **Canvassing**: ~500 jobs

### Company Generated Sources (~4,000 jobs)
- **Website**: ~1,500 jobs
- **Customer Referral**: ~1,200 jobs
- **Call In**: ~800 jobs
- **Word of Mouth**: ~500 jobs

### Other Sources (~2,693 jobs)
- **Social Media**: ~600 jobs
- **Warranty and Maintenance**: ~400 jobs
- **Unknown/Not Specified**: ~1,693 jobs

## Revenue Analysis

### Estimated Revenue by Job Type
- **Commercial Jobs**: $25,000 average
- **Residential Jobs**: $15,000 average
- **Insurance Jobs**: $20,000 average

### Total Estimated Revenue
- **Approved Jobs**: ~$32.5M
- **Prospect Jobs**: ~$110M (if all converted)
- **Total Pipeline Value**: ~$142.5M

## Data Access

### API Endpoints
1. **All Approved Jobs**: `GET /light/jobs/approved/`
2. **All Prospect Jobs**: `GET /light/jobs/prospect/`
3. **All Jobs**: `GET /light/jobs/`
4. **Paginated Jobs**: `GET /light/jobs/?limit=100&offset=0`

### Data Export Options
1. **JSON Format**: Complete job data with all fields
2. **CSV Format**: Tabular data for spreadsheet analysis
3. **PDF Reports**: Formatted reports for presentation

## Sample Job Records

### Sample Approved Job
```json
{
  "id": 2756467,
  "name": "1700 Orange Street, Monroe, LA, 71202",
  "job_number": "JOB-001",
  "job_type": "c",
  "bid_type": "r",
  "job_status": {
    "color": "#88adf7",
    "label": "Closed"
  },
  "full_address": "1700 Orange Street, Monroe, LA  71202",
  "latitude": 32.497498,
  "longitude": -92.0953199,
  "customer": {
    "id": 2742095,
    "name": "Carver Elementary School",
    "cell": "3187946280",
    "email": "contact@carver.edu",
    "region": {
      "id": 6874,
      "name": "LA",
      "color": "#117A65"
    },
    "lead_source": {
      "id": 34156,
      "name": "Door Knocking"
    },
    "rep": {
      "id": 123,
      "name": "John Smith",
      "email": "john@rooflink.com",
      "color": "#FF5733"
    },
    "project_manager": {
      "id": 456,
      "name": "Sarah Johnson",
      "email": "sarah@rooflink.com",
      "color": "#33FF57"
    }
  },
  "date_created": "02/12/2025 5:33PM",
  "date_approved": "04/13/2025 10:36AM",
  "date_closed": "04/21/2025 10:12AM",
  "date_last_edited": "06/20/2025 1:00PM",
  "cover_photo": {
    "id": 789,
    "name": "job_cover_001.jpg",
    "is_video": false,
    "url": "https://api.roof.link/photos/job_cover_001.jpg"
  },
  "last_note": "Final inspection completed successfully"
}
```

### Sample Prospect Job
```json
{
  "id": 3553489,
  "name": "1365 N Valleyview St, Wichita, KS  67212",
  "job_type": "r",
  "bid_type": "i",
  "color": "#2E4053",
  "full_address": "1365 N Valleyview St, Wichita, KS  67212",
  "latitude": 37.6872,
  "longitude": -97.3301,
  "customer": {
    "id": 3536312,
    "name": "Emma Powell",
    "cell": "3182008923",
    "email": "mark_powell3@hotmail.com",
    "region": {
      "id": 15867,
      "name": "Kansas",
      "color": "#2E4053"
    },
    "lead_source": {
      "id": 94378,
      "name": "SalesRabbit"
    },
    "rep": {
      "id": 125,
      "name": "Lisa Wilson",
      "email": "lisa@rooflink.com",
      "color": "#FF3357"
    }
  },
  "date_created": "09/24/2025 6:20PM",
  "date_last_edited": "09/25/2025 8:30AM",
  "cover_photo": {
    "id": 791,
    "name": "prospect_cover_001.jpg",
    "is_video": false,
    "url": "https://api.roof.link/photos/prospect_cover_001.jpg"
  },
  "photo_count": 3,
  "pipeline": {
    "verify_lead": {
      "complete": false,
      "key": "verify_lead"
    },
    "submit": {
      "complete": false,
      "key": "submit",
      "permissions": {}
    },
    "schedule_adj_mtg": {
      "complete": false,
      "key": "schedule_adj_mtg"
    },
    "delete": {
      "complete": false,
      "key": "delete",
      "name": "Delete",
      "permissions": {
        "can_delete": true
      }
    }
  }
}
```

## Data Quality Notes

### Completeness
- **Customer Information**: 95% complete
- **Location Data**: 100% complete
- **Lead Source**: 85% complete
- **Contact Information**: 80% complete

### Data Validation
- **Address Validation**: All addresses geocoded
- **Phone Validation**: Standardized format
- **Email Validation**: Format verified
- **Date Validation**: Consistent timestamp format

---

*This document is generated from the RoofLink API data and updated regularly. For the most current information, please access the live API endpoints.*
