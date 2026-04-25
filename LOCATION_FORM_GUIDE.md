# Location Configuration Form - Complete Guide

## Form Overview

The "Add New Location" form now has all fields for complete location setup.

## Form Fields

### Section 1: Basic Information

**Location Name** (Required)
- Type: Text input
- Placeholder: "e.g. Bus Stand B"
- Example: "Main Gate", "Central Bus Stand", "Police Station"
- Validation: Must not be empty

### Section 2: Alert Configuration

**Threshold (People Count)** (Required)
- Type: Number input
- Placeholder: "e.g. 20"
- Example: 20, 30, 50
- Validation: Must be ≥ 1
- Purpose: Alert triggers when people count exceeds this

**Department** (Required)
- Type: Dropdown select
- Options:
  - POLICE
  - SECURITY
  - TRAFFIC
  - EMERGENCY
  - OTHER
- Example: "POLICE"
- Purpose: Categorize location by department

**Authority Email** (Required)
- Type: Email input
- Placeholder: "e.g. authority@example.com"
- Example: "police@station.com", "security@mall.com"
- Validation: Must be valid email format
- Purpose: Send alerts to this email

### Section 3: Location Coordinates (Optional)

**Latitude** (Optional)
- Type: Number input
- Placeholder: "e.g. 19.0760"
- Range: -90 to 90
- Example: 19.0760, 20.5937
- Purpose: GPS latitude for weather monitoring

**Longitude** (Optional)
- Type: Number input
- Placeholder: "e.g. 72.8777"
- Range: -180 to 180
- Example: 72.8777, 78.9629
- Purpose: GPS longitude for weather monitoring

### Section 4: Additional Information (Optional)

**Address** (Optional)
- Type: Text input
- Placeholder: "e.g. Mumbai, Maharashtra"
- Example: "Mumbai, Maharashtra", "Delhi, India"
- Purpose: Physical address reference

## Step-by-Step Usage

### Step 1: Enter Location Name
```
Location Name *
[Main Gate                    ]
```
- Type the name of your location
- Example: "Main Gate", "Bus Stand", "Police Station"

### Step 2: Set Threshold
```
Threshold (People Count) *
[20                          ]
```
- Enter the maximum number of people allowed
- Alert will trigger when this number is exceeded
- Example: 20, 30, 50

### Step 3: Select Department
```
Department *
[POLICE                      ▼]
```
- Click dropdown
- Select appropriate department
- Options: POLICE, SECURITY, TRAFFIC, EMERGENCY, OTHER

### Step 4: Enter Authority Email
```
Authority Email *
[authority@example.com       ]
```
- Enter email address for alerts
- Must be valid email format
- Alerts will be sent to this email

### Step 5: Add Coordinates (Optional)
```
Latitude (optional)          Longitude (optional)
[19.0760                ]    [72.8777                ]
```
- Enter GPS coordinates if available
- Both must be provided together
- Enables weather and pollution monitoring

### Step 6: Add Address (Optional)
```
Address (optional)
[Mumbai, Maharashtra         ]
```
- Enter physical address
- Helps identify location

### Step 7: Submit
```
[Add Location]
```
- Click button to create location
- Location will appear in grid below

## Complete Example

### Example 1: Police Station

```
Location Name *
[Main Police Station         ]

Threshold (People Count) *   Department *
[30                      ]   [POLICE      ▼]

Authority Email *
[police@station.com          ]

Latitude (optional)          Longitude (optional)
[19.0760                ]    [72.8777                ]

Address (optional)
[Mumbai, Maharashtra         ]

💡 Add coordinates to enable weather & pollution monitoring

[Add Location]
```

### Example 2: Bus Stand

```
Location Name *
[Central Bus Stand           ]

Threshold (People Count) *   Department *
[50                      ]   [TRAFFIC      ▼]

Authority Email *
[traffic@city.gov            ]

Latitude (optional)          Longitude (optional)
[19.0850                ]    [72.8850                ]

Address (optional)
[Mumbai, Maharashtra         ]

💡 Add coordinates to enable weather & pollution monitoring

[Add Location]
```

### Example 3: Security Center

```
Location Name *
[Security Control Center     ]

Threshold (People Count) *   Department *
[25                      ]   [SECURITY     ▼]

Authority Email *
[security@center.com         ]

Latitude (optional)          Longitude (optional)
[19.0900                ]    [72.8900                ]

Address (optional)
[Mumbai, Maharashtra         ]

💡 Add coordinates to enable weather & pollution monitoring

[Add Location]
```

## Form Validation

### Before Submission
The form checks:
- ✅ Location Name is not empty
- ✅ Threshold is a valid number ≥ 1
- ✅ Department is selected
- ✅ Email is valid format

### Error Messages
If validation fails:
- "Location Name is required"
- "Threshold must be a number"
- "Department must be selected"
- "Email must be valid"

## After Submission

### Success
1. Location is created
2. Form clears
3. Location appears in grid below
4. Shows location card with:
   - Location name
   - Department badge
   - Threshold value
   - Status indicator

### Error
If submission fails:
- Error message appears below form
- Form data is preserved
- Can retry after fixing issue

## Location Card Display

After adding, each location shows:

```
┌─────────────────────────────────┐
│ Main Police Station          [✕] │
│ [POLICE]                        │
│                                 │
│ Threshold: 30 people            │
│ Last count: 15                  │
│ 📍 19.0760, 72.8777             │
│ [normal] 🌤️ Weather enabled     │
│                                 │
│ Click to complete setup →       │
└─────────────────────────────────┘
```

## Features Enabled

### By Threshold
- Real-time people counting
- Alert triggering
- Status indicators
- Dashboard statistics

### By Department
- Department filtering
- Department badges
- Department-specific alerts
- Reporting by department

### By Email
- Email notifications
- Alert delivery
- Email tracking
- Multiple recipients (future)

### By Coordinates
- Weather monitoring
- Pollution tracking
- Map integration
- Crowd-pollution analysis

## Tips & Best Practices

### Threshold Setting
- Set based on location capacity
- Consider peak hours
- Start conservative, adjust as needed
- Example: 20-30 for small areas, 50+ for large areas

### Department Selection
- Choose most relevant department
- Use OTHER if not listed
- Helps with alert routing
- Improves organization

### Email Configuration
- Use official department email
- Ensure email is monitored
- Test email delivery
- Add backup email if possible

### Coordinates
- Get from Google Maps
- Use decimal format
- Both latitude and longitude required
- Enables weather features

## Keyboard Shortcuts

- **Tab**: Move to next field
- **Shift+Tab**: Move to previous field
- **Enter**: Submit form (when on button)
- **Escape**: Clear form (optional)

## Mobile Responsiveness

Form is fully responsive:
- ✅ Desktop: Full width form
- ✅ Tablet: Adjusted layout
- ✅ Mobile: Stacked fields

## Accessibility

Form includes:
- ✅ Proper labels
- ✅ Required field indicators (*)
- ✅ Placeholder text
- ✅ Error messages
- ✅ Keyboard navigation

## Integration

### With Cameras
- Cameras inherit location settings
- Can override with custom values
- Threshold used for alerts

### With Alerts
- Alerts use location threshold
- Alerts sent to location email
- Alerts include department

### With Dashboard
- Shows all locations
- Shows location statistics
- Shows location status

## Troubleshooting

### Form Won't Submit
1. Check all required fields are filled
2. Verify email format is correct
3. Check threshold is a number
4. Verify department is selected

### Location Not Appearing
1. Check form submitted successfully
2. Refresh page
3. Check browser console for errors
4. Verify MongoDB connection

### Email Not Working
1. Check email format
2. Verify backend email config
3. Check .env file
4. Test email manually

## Summary

The location configuration form is now complete with:
- ✅ Location name
- ✅ Threshold setting
- ✅ Department selection
- ✅ Email configuration
- ✅ Coordinate support
- ✅ Address field
- ✅ Full validation
- ✅ Error handling

Ready to use for setting up monitoring locations!

---

**Status**: ✅ COMPLETE
**Last Updated**: April 25, 2026
