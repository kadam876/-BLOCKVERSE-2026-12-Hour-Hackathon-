# Time-Based Thresholds - Complete Guide

## Overview

Users can now set different crowd thresholds for different times of day. For example:
- **Morning Rush (8:00-10:00)**: 30 people threshold
- **Peak Hours (12:00-14:00)**: 50 people threshold
- **Night (20:00-22:00)**: 15 people threshold

## Features

✅ Multiple thresholds per location
✅ Time-based activation (start time - end time)
✅ Day-of-week filtering (specific days or all days)
✅ Automatic threshold switching
✅ Easy management interface
✅ Real-time threshold application

## How It Works

### 1. Default Threshold
- Set when creating location
- Used when no time-based threshold is active
- Example: 20 people

### 2. Time-Based Thresholds
- Override default threshold during specific times
- Applied automatically based on current time and day
- Multiple thresholds can be configured

### 3. Threshold Selection Logic
```
Current Time: 09:30, Monday

Check all time-based thresholds:
├─ Morning Rush (08:00-10:00, All days): ✓ MATCH → Use 30 people
├─ Peak Hours (12:00-14:00, All days): ✗ No match
└─ Night (20:00-22:00, All days): ✗ No match

Result: Use "Morning Rush" threshold of 30 people
```

## Setup Instructions

### Step 1: Create Location
1. Go to **Locations** page
2. Fill in basic information:
   - Location Name
   - Default Threshold (e.g., 20)
   - Department
   - Email
3. Click **Add Location**

### Step 2: Add Time-Based Threshold
1. Click **⏰ Add Time-Based Threshold** on location card
2. Fill in the form:
   - **Threshold Name**: e.g., "Morning Rush"
   - **Start Time**: e.g., 08:00
   - **End Time**: e.g., 10:00
   - **Threshold Value**: e.g., 30 people
   - **Days of Week**: Select specific days or "All"
3. Click **Add Threshold**

### Step 3: Manage Thresholds
- View all time-based thresholds in the modal
- Delete thresholds by clicking **Delete**
- Add more thresholds as needed

## Example Scenarios

### Scenario 1: Bus Stand
```
Location: Central Bus Stand
Default Threshold: 40 people

Time-Based Thresholds:
├─ Morning Rush (06:00-09:00, Mon-Fri): 60 people
├─ Peak Hours (12:00-14:00, Mon-Fri): 80 people
├─ Evening Rush (17:00-20:00, Mon-Fri): 70 people
└─ Weekend (All day, Sat-Sun): 50 people
```

### Scenario 2: Shopping Mall
```
Location: Downtown Mall
Default Threshold: 100 people

Time-Based Thresholds:
├─ Opening Hours (10:00-13:00, All days): 150 people
├─ Lunch Rush (13:00-15:00, All days): 200 people
├─ Evening (15:00-21:00, All days): 180 people
└─ Late Night (21:00-23:00, Fri-Sat): 120 people
```

### Scenario 3: Police Station
```
Location: Main Police Station
Default Threshold: 25 people

Time-Based Thresholds:
├─ Business Hours (09:00-17:00, Mon-Fri): 30 people
├─ After Hours (17:00-21:00, Mon-Fri): 20 people
└─ Weekend (All day, Sat-Sun): 15 people
```

## Form Fields Explained

### Threshold Name
- **Purpose**: Identify the threshold period
- **Examples**: "Morning Rush", "Peak Hours", "Night", "Weekend"
- **Required**: Yes

### Start Time
- **Format**: HH:MM (24-hour format)
- **Examples**: 08:00, 12:30, 20:15
- **Required**: Yes

### End Time
- **Format**: HH:MM (24-hour format)
- **Examples**: 10:00, 14:00, 22:00
- **Required**: Yes
- **Note**: Must be after start time

### Threshold Value
- **Purpose**: Number of people that triggers alert
- **Examples**: 20, 30, 50, 100
- **Required**: Yes
- **Minimum**: 1

### Days of Week
- **Options**: All, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- **Default**: All
- **Multiple Selection**: Yes
- **Purpose**: Apply threshold only on specific days

## API Endpoints

### Add Time-Based Threshold
```
POST /api/locations/:id/time-thresholds
Content-Type: application/json

{
  "name": "Morning Rush",
  "startTime": "08:00",
  "endTime": "10:00",
  "threshold": 30,
  "daysOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
}
```

### Get Time-Based Thresholds
```
GET /api/locations/:id/time-thresholds

Response:
[
  {
    "_id": "...",
    "name": "Morning Rush",
    "startTime": "08:00",
    "endTime": "10:00",
    "threshold": 30,
    "daysOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "isActive": true,
    "createdAt": "2026-04-25T10:00:00Z"
  }
]
```

### Get Current Applicable Threshold
```
GET /api/locations/:id/current-threshold

Response:
{
  "currentThreshold": 30,
  "activeTimeThreshold": {
    "name": "Morning Rush",
    "startTime": "08:00",
    "endTime": "10:00",
    "threshold": 30,
    "daysOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  "defaultThreshold": 20,
  "allTimeThresholds": [...]
}
```

### Update Time-Based Threshold
```
PATCH /api/locations/:id/time-thresholds/:thresholdId
Content-Type: application/json

{
  "name": "Morning Rush Updated",
  "threshold": 35,
  "isActive": true
}
```

### Delete Time-Based Threshold
```
DELETE /api/locations/:id/time-thresholds/:thresholdId
```

## Database Schema

### Location Model
```javascript
{
  name: String,
  threshold: Number,
  department: String,
  authorityEmail: String,
  
  // New field
  timeBasedThresholds: [
    {
      name: String,
      startTime: String,        // HH:MM
      endTime: String,          // HH:MM
      threshold: Number,
      daysOfWeek: [String],     // ["Monday", "Tuesday", ...]
      isActive: Boolean,
      createdAt: Date
    }
  ],
  
  // Other fields...
  coordinates: { lat, lon },
  address: String,
  lastCount: Number,
  lastStatus: String,
  createdAt: Date
}
```

## Frontend UI

### Location Card
Shows:
- Location name
- Default threshold
- ⏰ Number of time-based thresholds (if any)
- Last count
- Status badge
- **⏰ Add Time-Based Threshold** button

### Time-Based Threshold Modal
- Form to add new threshold
- List of existing thresholds
- Delete button for each threshold
- Close button

## How Alerts Work

### Alert Triggering
1. **Get Current Time**: 09:30, Monday
2. **Find Matching Threshold**:
   - Check all time-based thresholds
   - Find one where: startTime ≤ 09:30 ≤ endTime AND day matches
3. **Use Threshold**: If found, use time-based threshold; otherwise use default
4. **Compare**: If people count > threshold → Trigger alert

### Example
```
Location: Bus Stand
Default Threshold: 40 people
Time-Based: Morning Rush (08:00-10:00): 60 people

Scenario 1: 09:30, Monday
├─ Current Time: 09:30
├─ Matching Threshold: Morning Rush (60 people)
├─ People Detected: 65
└─ Result: ALERT (65 > 60)

Scenario 2: 15:30, Monday
├─ Current Time: 15:30
├─ Matching Threshold: None (use default 40)
├─ People Detected: 45
└─ Result: ALERT (45 > 40)

Scenario 3: 09:30, Saturday
├─ Current Time: 09:30
├─ Matching Threshold: None (Morning Rush is Mon-Fri only)
├─ Use Default: 40 people
├─ People Detected: 50
└─ Result: ALERT (50 > 40)
```

## Best Practices

### 1. Time Ranges
- Don't overlap time ranges for same day
- Use clear, non-overlapping periods
- Example: 08:00-10:00, 10:00-12:00, 12:00-14:00

### 2. Threshold Values
- Set based on location capacity
- Morning/evening rush: Higher threshold
- Off-peak: Lower threshold
- Weekends: Different from weekdays

### 3. Day Selection
- Use "All" for consistent thresholds
- Use specific days for varying patterns
- Consider holidays separately

### 4. Naming
- Use descriptive names
- Include time period in name
- Examples: "Morning Rush", "Lunch Peak", "Evening", "Night"

## Troubleshooting

### Threshold Not Changing
1. Check current time matches threshold time range
2. Verify day of week is selected
3. Check threshold is marked as active
4. Verify threshold value is set correctly

### Alert Not Triggering
1. Check current applicable threshold
2. Verify people count exceeds threshold
3. Check email configuration
4. Check alert cooldown (5 minutes between alerts)

### Time Format Issues
- Use 24-hour format (00:00 - 23:59)
- Use HH:MM format (e.g., 08:00, not 8:00)
- End time must be after start time

## Features

✅ **Multiple Thresholds**: Add unlimited time-based thresholds
✅ **Day Filtering**: Apply thresholds to specific days
✅ **Auto-Switching**: Automatically switches based on current time
✅ **Easy Management**: Add, edit, delete thresholds
✅ **Real-Time**: Applies immediately
✅ **Fallback**: Uses default threshold if no match
✅ **Database Persistence**: All thresholds saved
✅ **API Support**: Full REST API for integration

## Integration

### With Cameras
- Cameras inherit location's current threshold
- Automatically uses time-based threshold if active
- Can override with custom threshold

### With Alerts
- Alerts use current applicable threshold
- Sent to location's email
- Includes threshold information

### With Dashboard
- Shows default threshold
- Shows number of time-based thresholds
- Shows current status

## Summary

Time-based thresholds allow flexible crowd management:
- ✅ Different thresholds for different times
- ✅ Day-of-week specific rules
- ✅ Automatic threshold switching
- ✅ Easy management interface
- ✅ Full API support

Perfect for locations with varying crowd patterns throughout the day!

---

**Status**: ✅ FULLY IMPLEMENTED
**Date**: April 25, 2026
