# Quick Start - Interactive Map Feature

## Installation (One-time Setup)

```bash
# Navigate to frontend
cd crowd-alert-system/frontend

# Install new dependencies
npm install

# Restart frontend
npm run dev
```

## What's New

### 🗺️ Interactive Map
- Real-time pollution visualization
- Click markers for details
- Zoom and pan controls
- Color-coded AQI markers

### 📍 Real-time Location
- Click "Use My Location" button
- Browser asks for permission
- Map centers on your location
- Instant weather data

### ➕ Quick Add Location
- Get your current location
- Click "+ Add as Location"
- Enter name and save
- Starts monitoring immediately

## Usage

1. **Open Weather Page**
   ```
   http://localhost:5173/weather
   ```

2. **Use Your Location**
   - Click "📍 Use My Location"
   - Allow browser permission
   - See blue marker on map
   - View weather for your area

3. **Add as Monitoring Point**
   - Click "+ Add as Location"
   - Enter: "My Office" or "Home"
   - Click "Add Location"
   - Done! Now monitoring

4. **View Existing Locations**
   - See colored markers on map
   - Click marker for popup
   - Click location card to center
   - View detailed panel

## Map Controls

- **Zoom In/Out**: Mouse wheel or +/- buttons
- **Pan**: Click and drag
- **Marker Click**: View details
- **Card Click**: Center on location

## Color Legend

- 🟢 Green (1) - Good
- 🟢 Light Green (2) - Fair
- 🟡 Yellow (3) - Moderate
- 🟠 Orange (4) - Poor
- 🔴 Red (5) - Very Poor

## Troubleshooting

### Location Permission Denied
1. Click lock icon in address bar
2. Go to site settings
3. Allow location access
4. Refresh page

### Map Not Loading
1. Check internet connection
2. Clear browser cache
3. Try different browser
4. Check console for errors

### Dependencies Not Installing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Testing Checklist

- [ ] Map loads and displays
- [ ] Can zoom and pan
- [ ] Markers show on map
- [ ] Click marker shows popup
- [ ] "Use My Location" works
- [ ] Blue marker appears
- [ ] Can add location
- [ ] Location cards clickable
- [ ] Legend displays correctly

## Quick Commands

```bash
# Install dependencies
cd crowd-alert-system/frontend && npm install

# Start frontend
npm run dev

# Check if Leaflet installed
npm list leaflet react-leaflet

# Clear cache and reinstall
rm -rf node_modules && npm install
```

## Browser Support

✅ Chrome/Edge - Full support
✅ Firefox - Full support
✅ Safari - Full support
✅ Mobile browsers - Full support

## Need Help?

1. Check MAP_FEATURE_GUIDE.md for detailed docs
2. Check browser console (F12)
3. Verify all services running
4. Test in incognito mode
5. Try different browser

## Next Steps

1. Add OpenWeatherMap API key to `.env`
2. Add coordinates to existing locations
3. Test real-time location feature
4. Add multiple monitoring points
5. View pollution heatmap
6. Analyze correlation data

## Important Notes

⚠️ **Location Permission**: Browser will ask for permission first time
⚠️ **HTTPS**: Geolocation works best on HTTPS (production)
⚠️ **Internet**: Map tiles require internet connection
⚠️ **API Key**: Get free key from OpenWeatherMap.org

## Success Indicators

✅ Map displays with tiles
✅ Markers appear on locations
✅ Popups open on click
✅ Location button works
✅ Blue marker shows your position
✅ Can add new locations
✅ Weather data updates

Enjoy the new interactive map feature! 🗺️
