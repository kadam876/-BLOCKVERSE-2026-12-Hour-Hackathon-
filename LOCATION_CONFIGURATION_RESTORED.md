# Location Configuration - Restored ✅

## What Was Added

The "Add New Location" form now includes all the configuration fields for setting up locations with thresholds and alert settings.

## New Fields Added

### Required Fields
1. **Location Name** - Name of the location (e.g., "Bus Stand B")
2. **Threshold (People Count)** - Alert threshold (e.g., 20 people)
3. **Department** - Select from:
   - POLICE
   - SECURITY
   - TRAFFIC
   - EMERGENCY
   - OTHER
4. **Authority Email** - Email for alerts (e.g., authority@example.com)

### Optional Fields
1. **Latitude** - GPS latitude for weather monitoring
2. **Longitude** - GPS longitude for weather monitoring
3. **Address** - Physical address of location

## Form Layout

```
┌─────────────────────────────────────┐
│     Add New Location                │
├─────────────────────────────────────┤
│ Location Name *                     │
│ [Bus Stand B                    ]   │
│                                     │
│ Threshold *        │ Department *   │
│ [20            ]   │ [POLICE    ]   │
│                                     │
│ Authority Email *                   │
│ [authority@example.com          ]   │
│                                     │
│ Latitude (opt)     │ Longitude (opt)│
│ [19.0760       ]   │ [72.8777   ]   │
│                                     │
│ Address (optional)                  │
│ [Mumbai, Maharashtra            ]   │
│                                     │
│ 💡 Add coordinates to enable        │
│    weather & pollution monitoring   │
│                                     │
│ [Add Location]                      │
└─────────────────────────────────────┘
```

## How to Use

### Step 1: Fill in Required Fields
1. Enter **Location Name** (e.g., "Main Gate")
2. Enter **Threshold** (e.g., 20 people)
3. Select **Department** (e.g., POLICE)
4. Enter **Authority Email** (e.g., your-email@gmail.com)

### Step 2: Optional - Add Coordinates
1. Enter **Latitude** (e.g., 19.0760)
2. Enter **Longitude** (e.g., 72.8777)
3. Enter **Address** (e.g., Mumbai, Maharashtra)

### Step 3: Submit
Click **Add Location** button

## What Happens After Adding

1. Location is created in database
2. Threshold is set for this location
3. Department is assigned
4. Email is configured for alerts
5. If coordinates provided, weather monitoring is enabled
6. Location appears in the grid below

## Location Card Display

After adding, each location shows:
- Location name
- Department badge
- Threshold value
- Last count
- Coordinates (if provided)
- Status badge
- Weather enabled indicator (if coordinates provided)

## Features Enabled by Configuration

### With Threshold
- ✅ People count monitoring
- ✅ Alert triggering when threshold exceeded
- ✅ Status indicators (normal/warning/critical)
- ✅ Real-time updates

### With Email
- ✅ Email alerts when threshold exceeded
- ✅ Alert notifications to authority
- ✅ Email delivery tracking

### With Department
- ✅ Department-based filtering
- ✅ Department badges on cards
- ✅ Department-specific alerts

### With Coordinates
- ✅ Weather monitoring
- ✅ Pollution tracking
- ✅ Map integration
- ✅ Crowd-pollution correlation

## Example Locations

### Example 1: Police Station
```
Name: Main Police Station
Threshold: 30 people
Department: POLICE
Email: police@station.com
Latitude: 19.0760
Longitude: 72.8777
Address: Mumbai, Maharashtra
```

### Example 2: Bus Stand
```
Name: Central Bus Stand
Threshold: 50 people
Department: TRAFFIC
Email: traffic@city.gov
Latitude: 19.0850
Longitude: 72.8850
Address: Mumbai, Maharashtra
```

### Example 3: Emergency Center
```
Name: Emergency Response Center
Threshold: 25 people
Department: EMERGENCY
Email: emergency@center.com
Latitude: 19.0900
Longitude: 72.8900
Address: Mumbai, Maharashtra
```

## Validation

### Required Fields Validation
- ✅ Location Name: Must not be empty
- ✅ Threshold: Must be a number ≥ 1
- ✅ Department: Must select one
- ✅ Email: Must be valid email format

### Optional Fields Validation
- ✅ Latitude: Must be valid number (-90 to 90)
- ✅ Longitude: Must be valid number (-180 to 180)
- ✅ Address: Any text allowed

## Integration with Other Features

### Cameras
- When adding camera, select location
- Camera inherits location's threshold
- Camera inherits location's email
- Can override with custom values

### Alerts
- Alerts use location's threshold
- Alerts sent to location's email
- Alerts include location's department
- Alerts show location's name

### Dashboard
- Shows all locations
- Shows location status
- Shows location threshold
- Shows location statistics

### Weather
- If coordinates provided, weather data fetched
- Weather data correlated with crowd density
- Pollution data shown on map
- Weather alerts can be configured

## Database Storage

Each location stores:
```json
{
  "_id": "ObjectId",
  "name": "Main Gate",
  "threshold": 20,
  "department": "POLICE",
  "authorityEmail": "police@example.com",
  "coordinates": {
    "lat": 19.0760,
    "lon": 72.8777
  },
  "address": "Mumbai, Maharashtra",
  "isConfigured": true,
  "lastCount": 15,
  "lastStatus": "normal",
  "lastUpdated": "2026-04-25T10:30:00Z",
  "createdAt": "2026-04-25T10:00:00Z"
}
```

## API Endpoint

### Create Location
```
POST /api/locations
Content-Type: application/json

{
  "name": "Main Gate",
  "threshold": 20,
  "department": "POLICE",
  "authorityEmail": "police@example.com",
  "coordinates": {
    "lat": 19.0760,
    "lon": 72.8777
  },
  "address": "Mumbai, Maharashtra"
}
```

## Troubleshooting

### Email Not Sending
1. Check email format is valid
2. Verify email is configured in backend
3. Check .env file has EMAIL_USER and EMAIL_PASS

### Threshold Not Working
1. Check threshold is a number
2. Verify threshold is ≥ 1
3. Check camera is using this location

### Coordinates Not Working
1. Check latitude is -90 to 90
2. Check longitude is -180 to 180
3. Verify both are provided (both required for weather)

## Next Steps

1. ✅ Add location with threshold
2. ▶️ Add camera to location
3. ▶️ Enable detection on camera
4. ▶️ Monitor alerts
5. ▶️ View statistics

## Summary

The location configuration form is now fully restored with:
- ✅ Threshold setting
- ✅ Department selection
- ✅ Email configuration
- ✅ Coordinate support
- ✅ Address field
- ✅ Full validation
- ✅ Database integration

All functionality is working and ready to use!

---

**Status**: ✅ RESTORED AND FUNCTIONAL
**Date**: April 25, 2026
