# GawaGo Admin Roles Specification

## Overview
This document defines the SuperAdmin and Admin roles, their permissions, responsibilities, and the data analytics module structure.

---

## I. Role Hierarchy and Access Control

### A. SuperAdmin (Superadministrador)
**Purpose:** Full system control and worker verification management

**Key Permissions:**
- ✅ Full access to all system features and configurations
- ✅ Worker Verification Management
  - Review and approve/reject worker applications
  - Verify worker identity documents
  - Assign verification badges
  - Suspend or revoke worker verification
  - Bulk verification actions
- ✅ Admin Management
  - Create, edit, delete admin accounts
  - Assign permissions to admins
  - View admin activity logs
  - Modify admin roles
- ✅ System Configuration
  - Modify all system settings
  - Configure email templates
  - Set verification requirements
  - Manage default rating policies
  - Configure notification rules
- ✅ Database Management
  - Backup and restore system data
  - Export data in multiple formats
  - Database maintenance
- ✅ Audit and Security
  - Full access to audit logs
  - View all security events
  - Monitor system performance
  - Access security policies
- ✅ Data Analytics (Read-only)
  - View all analytics dashboards
  - Export reports
  - No data modification

**Dashboard Components:**
1. Worker Verification Queue
   - List of pending worker verifications
   - Document review interface
   - Approve/Reject actions
2. Admin Management Panel
   - List of admins and their permissions
   - Create/Edit admin accounts
   - View admin activity
3. System Health Monitor
   - Database status
   - API performance
   - Error rates and logs
4. Quick Stats
   - Total verified workers
   - Pending verifications count
   - Recent system activities

---

### B. Admin (Administratibo)
**Purpose:** Data analytics and employment metrics monitoring

**Key Permissions:**
- ✅ Data Analytics (Full Access)
  - View all employment metrics
  - Access analytics dashboards
  - Generate and export reports
  - Create custom date range queries
- ✅ View Analytics Data
  - Employment activity metrics
  - Verification and trust metrics
  - Geographic service distribution
  - Service rate transparency summary
  - User statistics (households vs workers)
  - Rating distribution
- ❌ NO Access to:
  - Worker verification
  - System configuration
  - Admin management
  - Database backup/restore
  - Audit logs
  - Security policies
  - User personal data (except aggregated stats)

**Dashboard Components:**
1. Employment Activity Dashboard
   - Total job postings (count + trend)
   - Active applications (count + trend)
   - Completed services (count + trend)
   - Cancelled requests (count + trend)
   - Ongoing matches (count + trend)
2. Verification and Trust Metrics
   - Total verified users
   - Pending verifications
   - Average reputation score
   - Rating distribution chart (histogram)
   - Ratings by job category
3. Geographic Service Distribution
   - Job demand by barangay (map/bar chart)
   - Worker availability by barangay (map/bar chart)
   - Service density heatmap
4. Service Rate Transparency
   - Average rates by job category
   - Hourly vs daily rates breakdown
   - Pricing trends over time
5. User Statistics
   - Total households registered
   - Total workers registered
   - Worker type distribution (domestic helpers vs skilled workers)
   - New registrations trend

---

## II. Data Analytics Module Specification

### A. Key Metrics and Visualizations

#### 1. Employment Activity Dashboard
```
Metric                          | Visualization      | Data Point
-------------------------------|-------------------|---------------
Total Job Postings             | Large Stat + Line  | Count & 30-day trend
                               | Graph              | 
Active Applications            | Large Stat + Line  | Count & 7-day trend
                               | Graph              |
Completed Services             | Large Stat + Line  | Count & 30-day trend
                               | Graph              |
Cancelled Requests             | Large Stat + Line  | Count & 7-day trend
                               | Graph              |
Ongoing Matches                | Large Stat         | Current count
```

#### 2. Reputation & Trust Metrics
```
Metric                          | Visualization      | Details
-------------------------------|-------------------|---------------
Verified Users Count           | Large Stat         | Total count
Pending Verifications          | Large Stat         | Queue size
Average Reputation Score       | Gauge Chart        | 0-5 scale
Rating Distribution            | Histogram/Bar      | Breakdown: 1⭐ to 5⭐
Reputation by Job Category     | Horizontal Bar     | Category ratings
Top Rated Workers              | Table              | Top 10 workers + ratings
Households Rating History      | Line Graph         | Trend over time
```

#### 3. Geographic Service Distribution
```
Metric                          | Visualization      | Details
-------------------------------|-------------------|---------------
Job Demand by Barangay         | Map/Bar Chart      | Color coded demand
Worker Availability by Barangay| Map/Bar Chart      | Worker concentration
Service Density                | Heatmap            | Jobs per km²
Barangay Rankings              | Sortable Table     | Demand vs Supply ratio
```

#### 4. Service Rate Transparency
```
Metric                          | Visualization      | Details
-------------------------------|-------------------|---------------
Avg Rate by Job Category       | Bar Chart          | Hourly & Daily rates
Hourly vs Daily Breakdown      | Pie Chart          | Percentage split
Price Trends                   | Line Graph         | 90-day trend per category
Price Range Distribution       | Box Plot           | Min, median, max, quartiles
Underpriced/Overpriced Areas   | Alert Panel        | Warnings if out of range
```

#### 5. User Statistics
```
Metric                          | Visualization      | Details
-------------------------------|-------------------|---------------
Total Households               | Large Stat         | Current count
Total Workers                  | Large Stat         | Current count
Worker Type Distribution       | Pie Chart          | Domestic vs Skilled %
New Registrations Trend        | Area Graph         | 30-day rolling
Active Users This Month        | Large Stat         | Last 30 days
User Retention Rate            | Line Graph         | Monthly retention %
```

---

### B. Recommended Charting Library

**Recommendation: React Chart Library (recharts)**

**Why recharts:**
- ✅ Built for React (perfect for frontend)
- ✅ Responsive and mobile-friendly
- ✅ Lightweight and performant
- ✅ Supports all required chart types:
  - Line charts (trends)
  - Bar charts (comparisons)
  - Pie charts (distribution)
  - Area charts (time series)
  - Histograms (rating distribution)
  - Heatmaps (geographic data)
- ✅ Easy integration with Bootstrap 5
- ✅ Good documentation and community support
- ✅ Active development

**Alternative Options:**
- Chart.js: Simple, lightweight, but less React-friendly
- D3.js: Very powerful but steep learning curve
- Apache ECharts: Feature-rich but heavier bundle
- Plotly: Great for scientific plots but overkill for this use case

**Installation:**
```bash
npm install recharts
```

---

### C. Data Analytics API Endpoints (To Be Implemented)

```
GET  /api/analytics/dashboard/employment-activity/
GET  /api/analytics/dashboard/trust-metrics/
GET  /api/analytics/dashboard/geographic-distribution/
GET  /api/analytics/dashboard/service-rates/
GET  /api/analytics/dashboard/user-statistics/
GET  /api/analytics/export/report/ (query: format=csv|pdf|excel, date_range)
GET  /api/analytics/metrics/{metric-name}/?start_date=&end_date=
```

---

## III. Database Schema Additions

### Required Models (if not exists)

#### AdminProfile
```python
- user_id (FK to User)
- role (choices: 'superadmin', 'admin')
- department (for admin role segregation)
- permissions (JSON field for flexible permissions)
- created_at
- updated_at
```

#### VerificationQueue
```python
- worker_id (FK to Worker)
- status (choices: 'pending', 'approved', 'rejected', 'under_review')
- submitted_documents (JSON or FK to Document model)
- reviewed_by (FK to SuperAdmin)
- review_notes
- created_at
- reviewed_at
```

#### AdminActivityLog
```python
- admin_id (FK to Admin)
- action (choices: 'verified_worker', 'modified_settings', 'created_admin', etc.)
- object_type (FK to ContentType)
- object_id
- details (JSON)
- timestamp
```

---

## IV. Implementation Roadmap

### Phase 1: Authentication & Authorization
- [ ] Extend User model with role field
- [ ] Create AdminProfile model
- [ ] Implement role-based permissions decorator
- [ ] Add role-based access control to views

### Phase 2: SuperAdmin Features
- [ ] Worker verification queue view
- [ ] Document review interface
- [ ] Approve/Reject worker actions
- [ ] Admin management CRUD
- [ ] System settings panel

### Phase 3: Admin Features (Analytics)
- [ ] Analytics data aggregation service
- [ ] Employment activity dashboard
- [ ] Trust metrics dashboard
- [ ] Geographic distribution module
- [ ] Service rate analysis module

### Phase 4: Frontend Implementation
- [ ] Admin dashboard layout
- [ ] Charts and visualizations (recharts)
- [ ] Data export functionality
- [ ] Date range filtering
- [ ] Real-time updates (websockets optional)

### Phase 5: Audit & Security
- [ ] Admin activity logging
- [ ] Audit dashboard for SuperAdmin
- [ ] Security event monitoring

---

## V. Frontend Structure Recommendation

```
frontend/src/
├── features/
│   ├── admin/
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   └── ReportExportPage.jsx
│   │   ├── components/
│   │   │   ├── EmploymentActivityDash.jsx
│   │   │   ├── TrustMetricsDash.jsx
│   │   │   ├── GeographicDash.jsx
│   │   │   ├── ServiceRatesDash.jsx
│   │   │   └── UserStatsDash.jsx
│   │   └── hooks/
│   │       ├── useAnalyticsData.js
│   │       └── useChartColors.js
│   └── superadmin/
│       ├── pages/
│       │   ├── SuperAdminDashboard.jsx
│       │   ├── VerificationQueue.jsx
│       │   ├── AdminManagement.jsx
│       │   └── SystemSettings.jsx
│       └── components/
│           ├── VerificationCard.jsx
│           ├── AdminForm.jsx
│           └── SystemHealthMonitor.jsx
```

---

## VI. Approval Workflow for Workers

### SuperAdmin Worker Verification Flow
```
1. Worker Submits Application
   ↓
2. Documents Uploaded to Queue
   ↓
3. SuperAdmin Reviews in Queue
   - Checks identification documents
   - Verifies information accuracy
   - Can request additional documents
   ↓
4. SuperAdmin Decision
   - APPROVE → Verification badge assigned
   - REJECT → Notification sent with reason
   - REQUEST MORE INFO → Worker notified
   ↓
5. Worker Notification
   - Email + In-app notification
   - If approved: Worker gets badge + priority in matching
   - If rejected: Can reapply after improvements
   ↓
6. Activity Logged in Audit Trail
```

---

## VII. Security & Data Privacy

**Admin Role Restrictions:**
- Admins CANNOT see personal data of individual users
- Admins CAN see only aggregated, anonymized statistics
- No export of personal information
- All actions logged and auditable
- Time-based data access (prevent historical manipulation)

**SuperAdmin Audit Trail:**
- All verification decisions logged
- All admin management actions logged
- All system configuration changes logged
- Cannot delete audit logs (only SuperAdmin with highest clearance)

---

## VIII. Notes for Development

1. **Use Permissions Framework**: Django's built-in `django.contrib.auth.decorators` or use `django-guardian` for more granular control
2. **API Authentication**: Ensure JWT tokens include role information
3. **Frontend Role Check**: Always verify user role on frontend AND backend
4. **Chart Responsiveness**: Ensure all charts work on mobile (admin might view on phone)
5. **Performance**: Cache analytics data with periodic updates (hourly/daily depending on metric)
6. **Data Freshness**: Consider real-time updates for critical metrics using WebSockets or polling
7. **Backup Strategy**: SuperAdmin dashboard should show last backup timestamp
8. **Notification**: Implement push notifications for verification requests

---

## Next Steps

1. Review and refine this specification
2. Create Django models for AdminProfile, VerificationQueue, AdminActivityLog
3. Implement role-based access control decorators
4. Create API endpoints for analytics
5. Build React components with recharts visualizations
6. Test permission enforcement across all endpoints
