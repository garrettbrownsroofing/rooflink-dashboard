# RoofLink API Data Structure Documentation

## Overview
This document describes the data structure and processing logic for the RoofLink API endpoints used in the Monroe Revenue Dashboard.

## API Endpoints

### 1. `/light/jobs/approved/` - Approved Jobs
**Total Count**: 1,810 jobs  
**Purpose**: Track approved contracts and revenue

#### Response Structure
```json
{
  "count": 1810,
  "from_index": 1,
  "next": "https://api.roof.link/api/light/jobs/approved/?page=2",
  "next_page": 2,
  "previous": null,
  "results": [...],
  "to_index": 10
}
```

#### Job Object Structure
```typescript
interface RoofLinkApprovedJob {
  bid_type: 'r' | 'c' | 'i'  // residential, commercial, insurance
  color: string
  cover_photo: {
    is_video: boolean
    name: string
    // Optional: id, preview_url, thumb_url, url
  }
  customer: {
    cell?: string
    email?: string
    id: number
    lead_source?: {
      id: number
      name: string
    }
    marketing_rep?: {
      color: string
      email: string
      id: number
      name: string
    }
    name: string
    post_insurance_reviewer?: UserObject
    pre_insurance_reviewer?: UserObject
    project_manager?: UserObject
    region: {
      color: string
      id: number
      name: string
    }
    rep?: UserObject
    rep_2?: UserObject
    user_id: number
  }
  date_approved: string        // "04/13/2025 10:36AM"
  date_closed?: string         // "04/21/2025 10:12AM"
  date_created: string         // "02/12/2025 5:33PM"
  date_deleted?: string
  date_last_edited: string     // "06/20/2025 1:00PM"
  full_address: string         // "1700 Orange Street, Monroe, LA  71202"
  id: number
  job_number?: string
  job_status: {
    color: string
    label: string              // "Closed"
  }
  job_type: 'c' | 'r'         // commercial, residential
  last_note?: string
  latitude: number
  longitude: number
  name: string
}
```

### 2. `/light/jobs/prospect/` - Prospect Jobs
**Total Count**: 7,343 jobs  
**Purpose**: Track leads and pipeline progression

#### Job Object Structure
```typescript
interface RoofLinkProspectJob {
  bid_type: 'i' | 'c' | 'r' | ''
  color?: string
  cover_photo: {
    is_video: boolean
    name: string
  }
  customer: {
    cell?: string
    email?: string
    id: number
    lead_source?: {
      id: number
      name: string
    }
    marketing_rep?: UserObject
    name: string
    post_insurance_reviewer?: UserObject
    pre_insurance_reviewer?: UserObject
    project_manager?: UserObject
    region: RegionObject
    rep?: UserObject
    rep_2?: UserObject
    user_id: number
  }
  date_created: string
  date_last_edited: string
  full_address: string
  id: number
  job_number?: string
  job_type: 'c' | 'r'
  latitude: number
  longitude: number
  name: string
  photo_count: number
  pipeline: {
    delete: {
      complete: boolean
      key: string
      name: string
      permissions: {
        can_delete: boolean
      }
      date?: string
      deleted_by?: UserObject
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
      completed_by?: UserObject
      date?: string
      name?: string
    }
  }
}
```

### 3. `/light/customers/` - Customer Records
**Total Count**: 9,120 customers  
**Purpose**: Customer reference data

#### Customer Object Structure
```typescript
interface RoofLinkCustomerData {
  cell?: string
  email?: string
  id: number
  name: string
  phone?: string
  phone_ext?: string
  region: {
    color: string
    id: number
    name: string
  }
  rep?: {
    color: string
    email: string
    id: number
    name: string
  }
  user_id: number
}
```

## Data Processing Logic

### Region Filtering
Jobs/customers are considered Monroe LA region if any of these fields contain:
- "la", "monroe", "louisiana"
- Applied to: `region.name`, `full_address`, `name`, `city`, `state`

### Lead Source Classification
**Door Knocking Sources**:
- "door knocking"
- "door knock" 
- "rabbit"
- "salesrabbit"
- "canvass"

**Company Generated Sources**:
- "call in"
- "customer referral"
- "word of mouth"
- "social media"
- "warranty and maintenance"
- "website"

### Revenue Estimation
Based on job type and region:
- **Residential (r)**: $15,000 base
- **Commercial (c)**: $25,000 base
- **Default**: $20,000 base
- **LA Region Premium**: +10% adjustment

### Dashboard Metrics Calculation

#### Contracts Signed
- Count of all approved jobs in Monroe LA region

#### Sold Revenue
- Sum of estimated revenue for all approved jobs
- Based on job type and region pricing

#### Door Knocking Leads
- Count of prospect jobs with door knocking lead sources

#### Company Generated Leads
- Count of prospect jobs with company generated lead sources

#### Inspections
- Count of prospect jobs with `pipeline.verify_lead.complete = true`

#### Lead Conversion Percentage
- Formula: `(Inspections / Total Leads) * 100`

#### Backlog
- Count of approved jobs that are not closed
- Condition: `!date_closed || job_status.label !== "Closed"`

## Sample Data Examples

### Approved Job Example
```json
{
  "bid_type": "r",
  "color": "#88adf7",
  "customer": {
    "cell": "3187946280",
    "id": 2742095,
    "lead_source": {
      "id": 34156,
      "name": "Door Knocking"
    },
    "name": "Carver Elementary School",
    "region": {
      "color": "#117A65",
      "id": 6874,
      "name": "LA"
    }
  },
  "date_approved": "04/13/2025 10:36AM",
  "date_closed": "04/21/2025 10:12AM",
  "full_address": "1700 Orange Street, Monroe, LA  71202",
  "id": 2756467,
  "job_status": {
    "color": "#88adf7",
    "label": "Closed"
  },
  "job_type": "c",
  "latitude": 32.497498,
  "longitude": -92.0953199,
  "name": "1700 Orange Street, Monroe, LA, 71202"
}
```

### Prospect Job Example
```json
{
  "bid_type": "i",
  "customer": {
    "cell": "3182008923",
    "email": "mark_powell3@hotmail.com",
    "id": 3536312,
    "lead_source": {
      "id": 94378,
      "name": "SalesRabbit"
    },
    "name": "Emma Powell",
    "region": {
      "color": "#2E4053",
      "id": 15867,
      "name": "Kansas"
    }
  },
  "date_created": "09/24/2025 6:20PM",
  "full_address": "1365 N Valleyview St, Wichita, KS  67212",
  "id": 3553489,
  "job_type": "r",
  "pipeline": {
    "verify_lead": {
      "complete": false,
      "key": "verify_lead"
    }
  }
}
```

## Error Handling

### Common Issues
1. **Authentication Errors**: Missing or invalid API key
2. **Endpoint Not Found**: Some endpoints return mock data
3. **Parse Errors**: Malformed JSON in content arrays
4. **Network Errors**: Connection timeouts or failures

### Fallback Behavior
- Returns mock data when API calls fail
- Logs detailed error information
- Continues processing other endpoints
- Shows user-friendly error messages

## Performance Notes

### Data Volume
- **Approved Jobs**: 1,810 records
- **Prospect Jobs**: 7,343 records  
- **Customers**: 9,120 records
- **Total**: ~18,273 records to process

### Processing Strategy
- Process data in batches from paginated responses
- Filter at processing time to minimize memory usage
- Cache processed results for dashboard display
- Lazy load additional pages as needed

---

*This documentation provides the complete data structure and processing logic for the RoofLink API integration in the Monroe Revenue Dashboard.*
