# GawaGo - Location and Distance Indicator Module

## Purpose

This module allows the system to calculate and display the approximate distance between a household and a worker.

The distance indicator helps both users know how far they are from each other before accepting or confirming a job.

This module focuses only on distance visibility. It does not include real-time tracking, live GPS monitoring, route navigation, or travel time estimation.

---

## Core Feature

The system shall display the approximate distance between:

- the household job location
- the worker registered service location

Example display:

- `Worker is 1.2 km away`
- `Job location is 3.5 km away`
- `Nearby`

---

## Required Location Data

To calculate distance, the system must store geographic coordinates for both users.

### Household Location Data

- address
- barangay
- latitude
- longitude

### Worker Location Data

- service address
- barangay
- latitude
- longitude

Latitude and longitude are required because text-based addresses alone are not reliable for distance calculation.

---

## How Location Can Be Collected

The system may collect coordinates using one of the following methods:

### Option 1: Browser Geolocation API

The user allows location access in the browser.  
The browser returns the user's latitude and longitude.

### Option 2: Manual Address Input with Map Pin

The user manually enters an address or selects a location on a map.  
The selected map location is converted into latitude and longitude.

### Option 3: Admin/User Manual Coordinates

For testing or fallback, coordinates may be manually stored in the database.

---

## Distance Calculation

The system shall calculate the approximate straight-line distance between the household and worker using their latitude and longitude coordinates.

Recommended method:

- Haversine Formula

The Haversine Formula is suitable because it calculates the distance between two points on Earth using latitude and longitude.

---

## Distance Display Rules

The calculated distance should be displayed in a user-friendly format.

### Suggested Format

- If distance is less than 1 kilometer, display in meters.
- If distance is 1 kilometer or more, display in kilometers.
- Distance may be rounded to one decimal place.

### Examples

- `350 meters away`
- `1.4 km away`
- `5.8 km away`

---

## Smart Matching Usage

The distance value may be used as one of the factors in worker matching.

Workers may be sorted or recommended based on:

1. Skills
2. Availability
3. Verification status
4. Ratings
5. Distance from job location

Distance should not be the only basis for matching.  
Households must still be able to choose any worker manually.

---

## Backend Responsibilities

The backend should:

- store latitude and longitude values
- validate that coordinates exist before calculating distance
- compute the distance between household and worker
- return the distance value through the API
- optionally sort workers by nearest distance

---

## Frontend Responsibilities

The frontend should:

- request or accept user location input
- send latitude and longitude to the backend
- display the calculated distance
- show clear text such as `2.3 km away`
- handle missing location data properly

---

## Database Fields

Suggested fields for location support:

### Household Profile

```text
address
barangay
latitude
longitude
```

### Worker Profile

```text
service_address
barangay
latitude
longitude
```

### Job Posting

```text
job_address
job_barangay
job_latitude
job_longitude
```

Job posting coordinates are important because the job location may be different from the household's registered home address.

---

## Error Handling

The system should handle cases where location data is missing.

Example messages:

- `Location not available`
- `Distance cannot be calculated`
- `Please update your location`

If either the household or worker has no latitude and longitude, the system should not attempt to calculate distance.

---

## Limitations

This module does not provide:

- real-time user tracking
- live worker movement updates
- GPS navigation
- route directions
- estimated arrival time
- traffic-based distance calculation

The displayed distance is only an approximate straight-line distance.

---

## Expected Result

After implementation, users should be able to see the approximate distance between a household job location and a worker location.

Example:

```text
Worker Name: Juan Dela Cruz
Service: Plumbing
Distance: 2.1 km away
```

```text
Job Title: House Cleaning
Location: Barangay Wakas
Distance from worker: 3.4 km away
```