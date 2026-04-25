# Location Card - Visual Display

## Location Card Without Time-Based Thresholds

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  Main Gate                                        [✕] ║
║  [POLICE]                                            ║
║                                                       ║
║  Threshold: 20 people                                ║
║  Last count: 15                                      ║
║  📍 19.0760, 72.8777                                 ║
║  [normal] 🌤️ Weather enabled                        ║
║                                                       ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │ ⏰ Add Time-Based Threshold                      │ ║
║  └─────────────────────────────────────────────────┘ ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

## Location Card With Time-Based Thresholds

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  Central Bus Stand                                [✕] ║
║  [TRAFFIC]                                           ║
║                                                       ║
║  Threshold: 40 people                                ║
║                                                       ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │ ⏰ 3 Time-Based Thresholds                      │ ║
║  │ • Morning Rush: 08:00-10:00 (60 people)        │ ║
║  │ • Peak Hours: 12:00-14:00 (80 people)          │ ║
║  │ • Evening: 17:00-20:00 (70 people)             │ ║
║  └─────────────────────────────────────────────────┘ ║
║                                                       ║
║  Last count: 45                                      ║
║  📍 19.0850, 72.8850                                 ║
║  [warning] 🌤️ Weather enabled                       ║
║                                                       ║
║  ┌─────────────────────────────────────────────────┐ ║
║  │ ⏰ Add Time-Based Threshold                      │ ║
║  └─────────────────────────────────────────────────┘ ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

## Card Elements Breakdown

### 1. Header Section
```
┌─────────────────────────────────────────────────────┐
│ Central Bus Stand                                [✕] │
│ [TRAFFIC]                                           │
└─────────────────────────────────────────────────────┘
```
- Location name (bold, large)
- Department badge (color-coded)
- Delete button (top right)

### 2. Default Threshold
```
┌─────────────────────────────────────────────────────┐
│ Threshold: 40 people                                │
└─────────────────────────────────────────────────────┘
```
- Shows default threshold value
- Used when no time-based threshold matches

### 3. Time-Based Thresholds Box (NEW!)
```
┌─────────────────────────────────────────────────────┐
│ ⏰ 3 Time-Based Thresholds                          │
│ • Morning Rush: 08:00-10:00 (60 people)            │
│ • Peak Hours: 12:00-14:00 (80 people)              │
│ • Evening: 17:00-20:00 (70 people)                 │
└─────────────────────────────────────────────────────┘
```
- Green background (#f0fdf4)
- Green border (#86efac)
- Shows count of thresholds
- Lists each threshold with:
  - Name
  - Time range
  - Threshold value

### 4. Status Section
```
┌─────────────────────────────────────────────────────┐
│ Last count: 45                                      │
│ 📍 19.0850, 72.8850                                 │
│ [warning] 🌤️ Weather enabled                       │
└─────────────────────────────────────────────────────┘
```
- Last detected people count
- GPS coordinates (if available)
- Status badge (normal/warning/critical)
- Weather indicator (if coordinates provided)

### 5. Action Button
```
┌─────────────────────────────────────────────────────┐
│ ⏰ Add Time-Based Threshold                          │
└─────────────────────────────────────────────────────┘
```
- Blue background (#3b82f6)
- White text
- Full width
- Prominent styling
- Opens modal to add new threshold

## Color Coding

### Time-Based Thresholds Box
```
Background: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
            (Light Green #f0fdf4)

Border:     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
            (Green #86efac)

Header:     ⏰ 3 Time-Based Thresholds
            (Dark Green #16a34a)

Items:      • Morning Rush: 08:00-10:00 (60)
            (Darker Green #15803d)
```

### Status Badges
```
[normal]    ████████████ (Green #16a34a)
[warning]   ████████████ (Orange #d97706)
[critical]  ████████████ (Red #dc2626)
```

### Buttons
```
Add Button  ████████████ (Blue #3b82f6)
Delete      ████████████ (Red #dc2626)
```

## Layout Grid

### 3-Column Grid (Desktop)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Location 1   │  │ Location 2   │  │ Location 3   │
│              │  │              │  │              │
│ Threshold: 20│  │ Threshold: 40│  │ Threshold: 30│
│              │  │              │  │              │
│ ⏰ 2 Time-   │  │ ⏰ 3 Time-   │  │ No Time-     │
│   Based      │  │   Based      │  │ Based        │
│              │  │              │  │              │
│ [Add Button] │  │ [Add Button] │  │ [Add Button] │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 2-Column Grid (Tablet)
```
┌──────────────────────┐  ┌──────────────────────┐
│ Location 1           │  │ Location 2           │
│                      │  │                      │
│ Threshold: 20        │  │ Threshold: 40        │
│ ⏰ 2 Time-Based      │  │ ⏰ 3 Time-Based      │
│ [Add Button]         │  │ [Add Button]         │
└──────────────────────┘  └──────────────────────┘
```

### 1-Column Grid (Mobile)
```
┌──────────────────────────────────┐
│ Location 1                        │
│ Threshold: 20                     │
│ ⏰ 2 Time-Based Thresholds       │
│ • Morning: 08:00-10:00 (30)      │
│ • Evening: 17:00-20:00 (25)      │
│ [Add Time-Based Threshold]        │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Location 2                        │
│ Threshold: 40                     │
│ ⏰ 3 Time-Based Thresholds       │
│ • Morning: 06:00-09:00 (60)      │
│ • Noon: 12:00-14:00 (80)         │
│ • Evening: 17:00-20:00 (70)      │
│ [Add Time-Based Threshold]        │
└──────────────────────────────────┘
```

## Interaction States

### Normal State
```
┌─────────────────────────────────────────────────────┐
│ Central Bus Stand                                [✕] │
│ [TRAFFIC]                                           │
│ Threshold: 40 people                                │
│ ⏰ 3 Time-Based Thresholds                          │
│ [⏰ Add Time-Based Threshold]                        │
└─────────────────────────────────────────────────────┘
```

### Hover State
```
┌─────────────────────────────────────────────────────┐
│ Central Bus Stand                                [✕] │  ↑ Slight lift
│ [TRAFFIC]                                           │  (translateY -3px)
│ Threshold: 40 people                                │
│ ⏰ 3 Time-Based Thresholds                          │
│ [⏰ Add Time-Based Threshold]                        │
└─────────────────────────────────────────────────────┘
```

### Button Hover
```
┌─────────────────────────────────────────────────────┐
│ [⏰ Add Time-Based Threshold]                        │
│  ↑ Darker blue, cursor pointer                      │
└─────────────────────────────────────────────────────┘
```

## Information Display Examples

### Example 1: No Time-Based Thresholds
```
Threshold: 20 people
Last count: 15
[normal]
```

### Example 2: One Time-Based Threshold
```
Threshold: 40 people

⏰ 1 Time-Based Threshold
• Morning Rush: 08:00-10:00 (60)

Last count: 45
[warning]
```

### Example 3: Multiple Time-Based Thresholds
```
Threshold: 50 people

⏰ 4 Time-Based Thresholds
• Morning: 06:00-09:00 (70)
• Noon: 12:00-14:00 (90)
• Evening: 17:00-20:00 (80)
• Night: 20:00-23:00 (40)

Last count: 75
[critical]
```

## Key Features Displayed

✅ **Location Name** - Clear identification
✅ **Department Badge** - Quick categorization
✅ **Default Threshold** - Base alert level
✅ **Time-Based Thresholds** - All configured thresholds visible
✅ **Threshold Details** - Name, time, value
✅ **Last Count** - Current status
✅ **Coordinates** - Location mapping
✅ **Status Badge** - Alert level
✅ **Weather Indicator** - Feature availability
✅ **Add Button** - Easy threshold management

## Summary

The location card now provides:
- ✅ Complete threshold overview
- ✅ Visual distinction for time-based thresholds
- ✅ Easy access to add more thresholds
- ✅ All information at a glance
- ✅ Professional appearance
- ✅ Responsive design
- ✅ Clear visual hierarchy

Perfect for managing location thresholds efficiently!

---

**Status**: ✅ FULLY DISPLAYED
**Date**: April 25, 2026
