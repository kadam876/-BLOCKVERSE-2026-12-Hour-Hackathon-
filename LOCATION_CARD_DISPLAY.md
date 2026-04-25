# Location Card Display - Updated

## Location Card Layout

### Before (Without Time-Based Thresholds)
```
┌─────────────────────────────────────────┐
│ Main Gate                            [✕] │
│ [POLICE]                                │
│                                         │
│ Threshold: 20 people                    │
│ Last count: 15                          │
│ 📍 19.0760, 72.8777                     │
│ [normal] 🌤️ Weather enabled            │
│                                         │
│ ⏰ Add Time-Based Threshold             │
└─────────────────────────────────────────┘
```

### After (With Time-Based Thresholds)
```
┌─────────────────────────────────────────┐
│ Central Bus Stand                    [✕] │
│ [TRAFFIC]                               │
│                                         │
│ Threshold: 40 people                    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ⏰ 3 Time-Based Thresholds          │ │
│ │ • Morning Rush: 08:00-10:00 (60)    │ │
│ │ • Peak Hours: 12:00-14:00 (80)      │ │
│ │ • Evening: 17:00-20:00 (70)         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Last count: 45                          │
│ 📍 19.0850, 72.8850                     │
│ [warning] 🌤️ Weather enabled           │
│                                         │
│ ⏰ Add Time-Based Threshold             │
└─────────────────────────────────────────┘
```

## Card Sections

### 1. Header
- **Location Name** (bold, large)
- **Delete Button** (✕) - top right

### 2. Department Badge
- Color-coded badge (POLICE, SECURITY, TRAFFIC, EMERGENCY, OTHER)
- Shows department type

### 3. Default Threshold
- Shows default threshold value
- Example: "Threshold: 20 people"

### 4. Time-Based Thresholds Section (NEW!)
**Only shows if time-based thresholds exist**

- **Green background** (#f0fdf4) with green border
- **Header**: "⏰ X Time-Based Threshold(s)"
- **List**: Each threshold shows:
  - Threshold name
  - Time range (HH:MM-HH:MM)
  - Threshold value in parentheses
  - Example: "• Morning Rush: 08:00-10:00 (60)"

### 5. Last Count
- Shows last detected people count
- Example: "Last count: 15"

### 6. Coordinates (if available)
- Shows GPS coordinates
- Example: "📍 19.0760, 72.8777"

### 7. Status & Features
- **Status Badge**: normal/warning/critical
- **Weather Indicator**: 🌤️ (if coordinates provided)

### 8. Action Button
- **⏰ Add Time-Based Threshold** button
- Blue background (#3b82f6)
- Full width
- Prominent styling

## Visual Styling

### Time-Based Thresholds Box
```css
Background: #f0fdf4 (light green)
Border: 1px solid #86efac (green)
Border-radius: 4px
Padding: 0.6rem
Margin-top: 0.4rem
```

### Threshold Header
```css
Font-weight: 600
Color: #16a34a (dark green)
Margin-bottom: 0.4rem
```

### Threshold Items
```css
Font-size: 0.75rem
Color: #15803d (darker green)
Margin-bottom: 0.3rem (between items)
```

### Add Button
```css
Background: #3b82f6 (blue)
Color: white
Font-weight: 600
Padding: 0.6rem
Width: 100%
Margin-top: 1rem
Border-radius: 6px
```

## Examples

### Example 1: No Time-Based Thresholds
```
┌──────────────────────────────────┐
│ Police Station                [✕] │
│ [POLICE]                         │
│                                  │
│ Threshold: 25 people             │
│ Last count: 10                   │
│ [normal]                         │
│                                  │
│ ⏰ Add Time-Based Threshold      │
└──────────────────────────────────┘
```

### Example 2: One Time-Based Threshold
```
┌──────────────────────────────────┐
│ Shopping Mall                 [✕] │
│ [SECURITY]                       │
│                                  │
│ Threshold: 100 people            │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ⏰ 1 Time-Based Threshold    │ │
│ │ • Lunch Peak: 12:00-14:00    │ │
│ │   (150)                      │ │
│ └──────────────────────────────┘ │
│                                  │
│ Last count: 120                  │
│ [warning]                        │
│                                  │
│ ⏰ Add Time-Based Threshold      │
└──────────────────────────────────┘
```

### Example 3: Multiple Time-Based Thresholds
```
┌──────────────────────────────────┐
│ Bus Terminal                  [✕] │
│ [TRAFFIC]                        │
│                                  │
│ Threshold: 50 people             │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ⏰ 4 Time-Based Thresholds   │ │
│ │ • Morning: 06:00-09:00 (70)  │ │
│ │ • Noon: 12:00-14:00 (90)     │ │
│ │ • Evening: 17:00-20:00 (80)  │ │
│ │ • Night: 20:00-23:00 (40)    │ │
│ └──────────────────────────────┘ │
│                                  │
│ Last count: 75                   │
│ 📍 19.0900, 72.8900              │
│ [critical] 🌤️ Weather enabled   │
│                                  │
│ ⏰ Add Time-Based Threshold      │
└──────────────────────────────────┘
```

## Interaction

### Clicking on Card
- Navigates to location detail page
- Shows setup wizard or testing interface

### Clicking Delete Button (✕)
- Stops propagation (doesn't navigate)
- Deletes location
- Refreshes location list

### Clicking Add Time-Based Threshold Button
- Stops propagation (doesn't navigate)
- Opens modal form
- Pre-selects this location
- Shows existing thresholds

## Responsive Design

### Desktop (Full Width)
- Card shows all information
- Full-width button
- All details visible

### Tablet
- Card adjusts to grid
- Button remains full-width
- Text may wrap

### Mobile
- Single column layout
- Stacked cards
- Button remains accessible
- Time-based thresholds list scrollable if needed

## Color Scheme

### Time-Based Thresholds Box
- **Background**: #f0fdf4 (very light green)
- **Border**: #86efac (light green)
- **Header Text**: #16a34a (medium green)
- **Item Text**: #15803d (dark green)

### Status Badges
- **Normal**: Green (#16a34a)
- **Warning**: Orange (#d97706)
- **Critical**: Red (#dc2626)

### Buttons
- **Add Button**: Blue (#3b82f6)
- **Delete Button**: Red (#dc2626)

## Information Hierarchy

1. **Location Name** - Most prominent
2. **Department Badge** - Quick identification
3. **Default Threshold** - Key metric
4. **Time-Based Thresholds** - Important if configured
5. **Last Count** - Current status
6. **Coordinates** - Optional
7. **Status Badge** - Current state
8. **Action Button** - Call to action

## Accessibility

✅ **Clear Labels**: All information clearly labeled
✅ **Color + Text**: Not relying on color alone
✅ **Button Contrast**: High contrast button
✅ **Readable Font**: Appropriate font sizes
✅ **Keyboard Navigation**: Buttons are keyboard accessible
✅ **Screen Reader**: Semantic HTML structure

## Animation & Hover Effects

### Card Hover
- Slight upward translation (translateY(-3px))
- Smooth transition (0.15s)
- Indicates clickability

### Button Hover
- Darker blue on hover
- Cursor changes to pointer
- Indicates interactivity

## Summary

The updated location card now displays:

✅ **Default Threshold** - Always visible
✅ **Time-Based Thresholds** - Shows count and details if configured
✅ **Green Highlight Box** - Makes time-based thresholds stand out
✅ **Prominent Button** - Easy to add more thresholds
✅ **All Information** - Complete location overview
✅ **Clean Design** - Professional appearance
✅ **Responsive** - Works on all devices

Perfect for managing location thresholds at a glance!

---

**Status**: ✅ IMPLEMENTED
**Date**: April 25, 2026
