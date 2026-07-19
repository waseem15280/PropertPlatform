# System Design: Real Estate Discovery & Brokerage Platform

1. Stakeholders
Internal Stakeholders
•	Business Owners
•	System Administrators
•	Customer Support Team
External Stakeholders
•	Property Dealers
•	Tenants
•	Payment Gateway Providers


2. Business Objectives
The primary objectives of the platform are:
•	Digitize property listing and discovery.
•	Enable online property visit scheduling.
•	Collect visit charges through online payment mechanisms.
•	Facilitate brokerage payment collection.
•	Improve lead conversion for property dealers.
•	Provide visibility and control through customer support operations.
•	Automate property information extraction using AI technologies.
•	Build a scalable SaaS platform for property management and brokerage services


3. Database Schema & Data Models
### User Entity
- Id (Guid, Primary Key)
- Name (string)
- Mobile (int)
- Email (string, Unique)
- Role (Enum: Dealer, Tenant, Support, Admin)
- Status (boolean)

### Property Entity
- Id (Guid, Primary Key)
- Title (string)
- Description (string)
- VideoUrl (string, Nullable)
- Price (decimal)
- AdvancePayment (decimal)
- Location (string)
- IsAvailable (bool)
- DealerId (Guid, Foreign Key)

### BookingVisit
- Id (Guid, Primary Key)
- PropertyId (Guid, Foreign Key)
- TenantId (Guid, Foreign Key)
- DealerId (Guid, Foreign Key)
- VisitFee (Decimal)
- ScheduledVisitTime (DateTime)
- VisitChargeStatus (Enum: Unpaid, Paid)
- BrokerageStatus (Enum: None, Pending, Paid)

### PropertyMedia
- MediaId
- PropertyId
- MediaType(Image, Video)
- Url


### Favorites
- Column
- FavoriteId
- TenantId
- PropertyId
- CreatedDate

### Deals
DealId
TenantId
DealerId
PropertyId
MonthlyRent
BrokerageAmount
Status (Enum: None, Pending, Paid)

### Payments
- PaymentId
- PaymentReference
- UserId
- Amount
- PaymentType
- GatewayReference
- Status

4 Web API Layer
- API Gateway
Business Services
- User Service
- Property Service
- Search Service
- Visit Service
- Deal Service
- Payment Service
- Notification Service
- Reporting Service
Data Layer
- SQL Server Database
- Redis Cache
- Search Index
Storage Layer
- Azure Blob Storage
External Integrations
- Payment Gateway
- SMS Gateway
- Email Gateway
- WhatsApp Provider

5. User Roles
5.1 Tenant
A tenant is an end user searching for rental properties.
Responsibilities
•	Register and Login
•	Search properties
•	View property details
•	Watch property videos
•	Save properties to inbox/favorites
•	Request property visits
•	Pay visit charges
•	Pay brokerage amount
•	View transaction history
 
5.2 Property Dealer
Property dealers manage and publish property listings.
Responsibilities
•	Register and Login
•	Upload property details
•	Upload property videos
•	Update property information
•	Mark properties as Available or Occupied
•	View visit requests
•	Manage leads
•	View finalized deals
 
5.3 Customer Support Executive
Customer support executives assist users and monitor platform operations.
Responsibilities
•	View tenant information
•	View tenant inbox/favorites
•	View visit schedules
•	View finalized deals
•	View dealer information
•	Resolve disputes
•	Generate operational reports
 
5.4 System Administrator
System administrators manage the platform.
Responsibilities
•	User management
•	Role management
•	Dealer approval
•	Property moderation
•	Payment settlement management
•	Configuration management
•	Reporting and analytics
•	Audit monitoring


### 6 Functional Requirements
6.1 User Management Features
- User Registration
- Mobile OTP Authentication
- Login and Logout
- Password Reset
- Role-Based Access Control
 
6.2 Property Management
Property Creation
Property dealers can:
- Add new properties
- Upload videos
- Upload images
- Add location details
- Define rent and deposit amounts
- Specify furnishing status
- Update property availability
Property Status
- Available
- Reserved
- Occupied
- Removed
 

 
6.4 Property Search
Search Features
- Keyword Search
- Location Search
- Rent Range Filter
- Property Type Filter
- Bedroom Filter
- Furnishing Filter
Search Results
Display:
- Property Images
- Property Video
- Rent
- Location
- Availability Status
 
6.5 Tenant Inbox / Favorites
Tenants can save properties for future review.
Property States
- Interested
- Visit Requested
- Visited
- Deal Finalized
- Closed
 
6.6 Property Visit Management
Visit Request Workflow
1.	Tenant selects property.
2.	Tenant pays visit charge.
3.	Visit request is submitted.
4.	Dealer receives notification.
5.	Dealer confirms schedule.
6.	Tenant visits property.
7.	Visit completion recorded.
Visit Status
- Requested
- Payment Pending
- Scheduled
- Completed
- Cancelled
 
6.7 Brokerage Management
Brokerage Workflow
1.	Property selected by tenant.
2.	Deal finalized.
3.	Rent agreement completed.
4.	Brokerage payment collected.
5.	Dealer settlement processed.
Brokerage Rule
Brokerage Amount = One Month Rent
Platform Commission = Configurable
Dealer Settlement = Brokerage minus Commission
 
6.8 Payment Management
Payment Types
- Visit Charges
- Brokerage Charges
- Refunds
Payment Gateway Integration
Supported providers:
- Razorpay
- PhonePe
- PayU
Payment Status
- Initiated
- Pending
- Success
- Failed
- Refunded
 
6.9 Notification Management
Notifications shall be sent through:
- SMS
- Email
- WhatsApp
- Push Notifications
Events
- Visit Request Created
- Visit Confirmed
- Visit Cancelled
- Deal Finalized
- Payment Success
- Payment Failure
 
6.10 Reporting
Reports shall include:
Tenant Reports
- Visit History
- Payment History
- Saved Properties
Dealer Reports
- Active Listings
- Leads
- Visits
- Revenue
Admin Reports
- Users
- Properties
- Payments
- Brokerage Revenue
- Operational Metrics


