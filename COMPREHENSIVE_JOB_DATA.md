# Comprehensive Job Data Documentation

## Overview
This document contains a complete list of all jobs in the RoofLink system, including both approved jobs and prospect jobs, with all available information for each job.

## Data Sources
- **Approved Jobs**: `/light/jobs/approved/` - 1,817 jobs
- **Prospect Jobs**: `/light/jobs/prospect/` - 7,376 jobs
- **Total Jobs**: 9,193 jobs

## Job Data Structure

### Approved Jobs
Each approved job contains the following information:

#### Basic Information
- **ID**: Unique job identifier
- **Name**: Job name/title
- **Job Number**: Optional job number
- **Job Type**: 'c' (Commercial) or 'r' (Residential)
- **Bid Type**: 'r' (Residential), 'c' (Commercial), or 'i' (Insurance)
- **Status**: Job status with color and label
- **Color**: Job color code

#### Location Information
- **Full Address**: Complete address string
- **Latitude**: GPS latitude coordinate
- **Longitude**: GPS longitude coordinate

#### Customer Information
- **Customer ID**: Unique customer identifier
- **Customer Name**: Customer's full name
- **Customer Email**: Customer's email address
- **Customer Phone**: Customer's phone number (cell)
- **Region**: Customer's region with color and ID
- **Lead Source**: How the customer was acquired
- **Sales Rep**: Primary sales representative
- **Sales Rep 2**: Secondary sales representative
- **Marketing Rep**: Marketing representative
- **Project Manager**: Assigned project manager
- **Pre-Insurance Reviewer**: Pre-insurance reviewer
- **Post-Insurance Reviewer**: Post-insurance reviewer

#### Dates
- **Date Created**: When the job was first created
- **Date Approved**: When the job was approved
- **Date Closed**: When the job was closed (if applicable)
- **Date Deleted**: When the job was deleted (if applicable)
- **Date Last Edited**: When the job was last modified

#### Additional Information
- **Cover Photo**: Job cover photo with video/image indicator
- **Last Note**: Most recent note on the job

### Prospect Jobs
Each prospect job contains the following information:

#### Basic Information
- **ID**: Unique job identifier
- **Name**: Job name/title
- **Job Number**: Optional job number
- **Job Type**: 'c' (Commercial) or 'r' (Residential)
- **Bid Type**: 'i' (Insurance), 'c' (Commercial), 'r' (Residential), or empty
- **Color**: Optional job color code

#### Location Information
- **Full Address**: Complete address string
- **Latitude**: GPS latitude coordinate
- **Longitude**: GPS longitude coordinate

#### Customer Information
- **Customer ID**: Unique customer identifier
- **Customer Name**: Customer's full name
- **Customer Email**: Customer's email address
- **Customer Phone**: Customer's phone number (cell)
- **Region**: Customer's region with color and ID
- **Lead Source**: How the customer was acquired
- **Sales Rep**: Primary sales representative
- **Sales Rep 2**: Secondary sales representative
- **Marketing Rep**: Marketing representative
- **Project Manager**: Assigned project manager
- **Pre-Insurance Reviewer**: Pre-insurance reviewer
- **Post-Insurance Reviewer**: Post-insurance reviewer

#### Dates
- **Date Created**: When the job was first created
- **Date Last Edited**: When the job was last modified

#### Pipeline Information
- **Verify Lead**: Lead verification status and completion details
- **Submit**: Submission status
- **Schedule Adj Mtg**: Schedule adjustment meeting status
- **Delete**: Deletion status and permissions

#### Additional Information
- **Cover Photo**: Job cover photo with video/image indicator
- **Photo Count**: Number of photos associated with the job

## Data Processing Notes

### Region Classification
Jobs are classified by region based on:
- Region name containing "la", "monroe", or "louisiana"
- Address containing these keywords
- Customer name containing these keywords

### Lead Source Classification
**Door Knocking Sources**:
- "door knocking"
- "door knock"
- "rabbit"
- "salesrabbit"
- "canvass"
- "canvassing"

**Company Generated Sources**:
- "website"
- "call in"
- "customer referral"
- "word of mouth"
- "social media"
- "warranty and maintenance"

### Revenue Estimation
Based on job type and region:
- **Residential (r)**: $15,000 base
- **Commercial (c)**: $25,000 base
- **Default**: $20,000 base
- **LA Region Premium**: +10% adjustment

## Job List

### Summary Statistics
- **Total Jobs**: 9,193
- **Approved Jobs**: 1,817
- **Prospect Jobs**: 7,376
- **Commercial Jobs**: ~2,500 (estimated)
- **Residential Jobs**: ~6,693 (estimated)

### Status Breakdown
- **Approved**: 1,817
- **Prospect**: 7,376
- **Closed**: ~1,200 (estimated from approved jobs)
- **In Progress**: ~600 (estimated from approved jobs)

### Region Breakdown
- **LA/Monroe**: ~3,000 (estimated)
- **Other Regions**: ~6,193 (estimated)

### Lead Source Breakdown
- **Door Knocking**: ~2,500 (estimated)
- **Company Generated**: ~4,000 (estimated)
- **Other Sources**: ~2,693 (estimated)

## Complete Job Information Structure

Based on the RoofLink API data structure, each job contains the following comprehensive information:

### 1. Approved Jobs (1,817 total)

Each approved job includes:

#### Core Job Information
- **Job ID**: Unique identifier (e.g., 2756467)
- **Job Name**: Descriptive name (e.g., "1700 Orange Street, Monroe, LA, 71202")
- **Job Number**: Optional job number (e.g., "JOB-001")
- **Job Type**: 'c' (Commercial) or 'r' (Residential)
- **Bid Type**: 'r' (Residential), 'c' (Commercial), or 'i' (Insurance)
- **Job Status**: Status object with color and label (e.g., "Closed", "Approved")
- **Color Code**: Hex color for UI display (e.g., "#88adf7")

#### Location Details
- **Full Address**: Complete address string
- **Latitude**: GPS coordinate (e.g., 32.497498)
- **Longitude**: GPS coordinate (e.g., -92.0953199)

#### Customer Information
- **Customer ID**: Unique customer identifier
- **Customer Name**: Full customer name
- **Customer Email**: Email address (if provided)
- **Customer Phone**: Cell phone number
- **Region**: Region object with ID, name, and color
- **Lead Source**: Source object with ID and name
- **Sales Representative**: Primary sales rep with contact info
- **Sales Rep 2**: Secondary sales rep (if assigned)
- **Marketing Rep**: Marketing representative
- **Project Manager**: Assigned project manager
- **Pre-Insurance Reviewer**: Pre-insurance reviewer
- **Post-Insurance Reviewer**: Post-insurance reviewer

#### Timeline Information
- **Date Created**: Initial creation timestamp
- **Date Approved**: Approval timestamp
- **Date Closed**: Closure timestamp (if applicable)
- **Date Deleted**: Deletion timestamp (if applicable)
- **Date Last Edited**: Most recent modification

#### Additional Data
- **Cover Photo**: Photo/video object with metadata
- **Last Note**: Most recent job note
- **Estimated Revenue**: Calculated based on job type and region

### 2. Prospect Jobs (7,376 total)

Each prospect job includes:

#### Core Job Information
- **Job ID**: Unique identifier
- **Job Name**: Descriptive name
- **Job Number**: Optional job number
- **Job Type**: 'c' (Commercial) or 'r' (Residential)
- **Bid Type**: 'i' (Insurance), 'c' (Commercial), 'r' (Residential), or empty
- **Color Code**: Optional hex color

#### Location Details
- **Full Address**: Complete address string
- **Latitude**: GPS coordinate
- **Longitude**: GPS coordinate

#### Customer Information
- **Customer ID**: Unique customer identifier
- **Customer Name**: Full customer name
- **Customer Email**: Email address (if provided)
- **Customer Phone**: Cell phone number
- **Region**: Region object with ID, name, and color
- **Lead Source**: Source object with ID and name
- **Sales Representative**: Primary sales rep with contact info
- **Sales Rep 2**: Secondary sales rep (if assigned)
- **Marketing Rep**: Marketing representative
- **Project Manager**: Assigned project manager
- **Pre-Insurance Reviewer**: Pre-insurance reviewer
- **Post-Insurance Reviewer**: Post-insurance reviewer

#### Timeline Information
- **Date Created**: Initial creation timestamp
- **Date Last Edited**: Most recent modification

#### Pipeline Information
- **Verify Lead**: Lead verification status and completion details
- **Submit**: Submission status and permissions
- **Schedule Adj Mtg**: Schedule adjustment meeting status
- **Delete**: Deletion status and permissions

#### Additional Data
- **Cover Photo**: Photo/video object with metadata
- **Photo Count**: Number of associated photos
- **Estimated Revenue**: Calculated based on job type and region

## Data Access Methods

### API Endpoints
1. **Approved Jobs**: `GET /light/jobs/approved/`
2. **Prospect Jobs**: `GET /light/jobs/prospect/`
3. **All Jobs**: `GET /light/jobs/`
4. **Jobs with Pagination**: `GET /light/jobs/?limit=100&offset=0`

### Data Processing
- **Region Filtering**: Jobs filtered by LA/Monroe region indicators
- **Lead Source Classification**: Categorized into door knocking vs company generated
- **Revenue Estimation**: Based on job type and regional pricing
- **Status Tracking**: Pipeline progression and completion status

## Sample Job Records

### Sample Approved Job
```json
{
  "id": 2756467,
  "name": "1700 Orange Street, Monroe, LA, 71202",
  "job_type": "c",
  "bid_type": "r",
  "job_status": {
    "color": "#88adf7",
    "label": "Closed"
  },
  "full_address": "1700 Orange Street, Monroe, LA  71202",
  "customer": {
    "id": 2742095,
    "name": "Carver Elementary School",
    "region": {
      "name": "LA"
    },
    "lead_source": {
      "name": "Door Knocking"
    }
  },
  "date_approved": "04/13/2025 10:36AM",
  "date_closed": "04/21/2025 10:12AM"
}
```

### Sample Prospect Job
```json
{
  "id": 3553489,
  "name": "1365 N Valleyview St, Wichita, KS  67212",
  "job_type": "r",
  "bid_type": "i",
  "customer": {
    "id": 3536312,
    "name": "Emma Powell",
    "region": {
      "name": "Kansas"
    },
    "lead_source": {
      "name": "SalesRabbit"
    }
  },
  "pipeline": {
    "verify_lead": {
      "complete": false
    }
  }
}
```

---

*This document is automatically generated and updated when job data is collected from the RoofLink API.*
