# Interactive Map Feature - Setup & Usage Guide

## Overview
Enhanced weather and pollution monitoring with interactive map visualization and real-time location detection.

## New Features

### ✅ Interactive Map
- **OpenStreetMap Integration** - Free, open-source map tiles
- **Real-time Markers** - Color-coded AQI markers for each location
- **Circle Overlays** - Visual pollution radius around locations
- **Popup Details** - Click markers for detailed information
- **Zoom & Pan** - Full map navigation controls

### ✅ Real-time Location Detection
- **Browser Geolocation** - Get user's current GPS coordinates
- **Instant Weather** - Fetch weather/AQI for current location
- **Quick Add** - Add current location as monitoring point
- **Auto-center** - Map centers on your location

### ✅ Visual Enhancements
- **Color-coded Markers** - AQI 1-5 with distinct colors
- **Interactive Legend** - Clear AQI scale reference
- **Location Cards** - Click to center map on location
- **Selected Location Panel** - Detailed view of clicked location

## Installation Steps

### Step 1: Install Dependencies

```bash
cd crowd-alert-system/frontend
npm install
```

This will install:
- `leaflet` - Map library
- `react-leaflet` - React bindings for Leaflet

### Step 2: Verify Installation

Check that these are in `package.json`:
```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1"
  }
}
```

### Step 3: Restart Frontend

```bash
# Stop the frontend (Ctrl+C)
# Start again
npm run dev
```

## Using the Map Feature

### 1. Access the Map

**URL:** `http://localhost:5173/weather`

The weather page now shows an interactive map by default.

### 2. Use Your Current Location

**Steps:**
1. Click "📍 Use My Location" button
2. Browser will ask for location permission
3. Click "Allow"
4. Map centers on your location
5. Blue marker shows your position
6. Weather data fetched automatically

**Troubleshooting:**
- If blocked, check browser location settings
- Chrome: Settings → Privacy → Location
- Firefox: Preferences → Privacy → Permissions → Location
- Enable location for localhost

### 3. Add Your Location as Monitoring Point

**Steps:**
1. Click "Use My Location"
2. Click "+ Add as Location" button
3. Enter location name (e.g., "My Office")
4. Enter address (optional)
5. Click "Add Location"
6. Location saved with coordinates
7. Weather monitoring starts automatically

### 4. View Location Details

**Click on any marker:**
- Location name
- AQI value and category
- Crowd density
- Correlation analysis
- Coordinates

**Click on location card:**
- Map centers on that location
- Shows in selected location panel

### 5. Navigate the Map

**Controls:**
- **Zoom**: Mouse wheel or +/- buttons
- **Pan**: Click and drag
- **Reset**: Click location card to recenter

## Map Features Explained

### Markers

**Color Coding:**
- 🟢 **Green (1)** - Good air quality
- 🟢 **Light Green (2)** - Fair air quality
- 🟡 **Yellow (3)** - Moderate air quality
- 🟠 **Orange (4)** - Poor air quality
- 🔴 **Red (5)** - Very poor air quality

**Marker Types:**
- **Numbered circles** - Monitoring locations (shows AQI)
- **Blue pin** - Your current location

### Circle Overlays

- **Radius**: 500 meters around each location
- **Color**: Matches AQI color
- **Opacity**: 20% fill for visibility
- **Purpose**: Shows pollution spread area

### Popups

Click any marker to see:
- Location name
- AQI badge
- Crowd count
- Correlation message

### Legend

Bottom of page shows:
- All 5 AQI levels
- Color coding
- Category names

## Browser Permissions

### Enabling Location Access

**Chrome:**
1. Click lock icon in address bar
2. Click "Site settings"
3. Find "Location"
4. Select "Allow"

**Firefox:**
1. Click lock icon in address bar
2. Click "Connection secure"
3. Click "More information"
4. Go to "Permissions" tab
5. Find "Access Your Location"
6. Uncheck "Use Default"
7. Check "Allow"

**Edge:**
1. Click lock icon in address bar
2. Click "Permissions for this site"
3. Find "Location"
4. Select "Allow"

### Privacy Note

- Location data is only used to fetch weather
- Not stored on server
- Not shared with third parties
- Only sent to OpenWeatherMap API

## API Endpoints

### Get Weather for Coordinates

```bash
GET /api/weather/coordinates?lat=19.0760&lon=72.8777
```

**Response:**
```json
{
  "coordinates": { "lat": 19.076, "lon": 72.8777 },
  "temperature": {
    "current": 28.5,
    "feelsLike": 30.2,
    "min": 26.0,
    "max": 31.0
  },
  "humidity": 65,
  "pressure": 1013,
  "windSpeed": 3.5,
  "weatherCondition": "Clear",
  "weatherDescription": "clear sky",
  "aqi": {
    "value": 3,
    "category": "Moderate",
    "color": "#eab308",
    "components": { ... }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Map Customization

### Change Default Center

Edit `WeatherPollutionMap.jsx`:
```javascript
const [mapCenter, setMapCenter] = useState([YOUR_LAT, YOUR_LON]);
```

### Change Default Zoom

Edit `MapContainer` component:
```javascript
<MapContainer
  center={mapCenter}
  zoom={12} // Change this (1-18)
  ...
>
```

### Change Circle Radius

Edit circle overlay:
```javascript
<Circle
  center={[...]}
  radius={500} // Change this (meters)
  ...
/>
```

### Change Map Tiles

Replace TileLayer URL:
```javascript
// Dark mode
url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"

// Satellite
url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

// Terrain
url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
```

## Troubleshooting

### Issue: Map not loading
**Solution:**
- Check internet connection
- Verify Leaflet CSS is loaded
- Check browser console for errors
- Clear browser cache

### Issue: Markers not showing
**Solution:**
- Ensure locations have coordinates
- Check heatmapData is populated
- Verify API is returning data
- Check browser console

### Issue: Location permission denied
**Solution:**
- Check browser settings
- Try different browser
- Use HTTPS in production
- Manually enter coordinates

### Issue: Map tiles not loading
**Solution:**
- Check internet connection
- Try different tile provider
- Check for CORS issues
- Verify tile URL is correct

### Issue: Popups not opening
**Solution:**
- Check Leaflet CSS is loaded
- Verify popup content is valid
- Check z-index conflicts
- Clear browser cache

## Performance Tips

1. **Limit Markers**: Don't show more than 50 locations
2. **Debounce Updates**: Update map every 5 minutes
3. **Lazy Load**: Load map only when tab is active
4. **Optimize Circles**: Reduce radius for many locations
5. **Cache Tiles**: Browser caches map tiles automatically

## Mobile Responsiveness

The map is fully responsive:
- Touch gestures for pan/zoom
- Mobile-optimized controls
- Responsive layout
- Works on all screen sizes

## Accessibility

- Keyboard navigation supported
- Screen reader compatible
- High contrast markers
- Clear visual indicators

## Future Enhancements

- [ ] Clustering for many locations
- [ ] Heatmap layer for pollution
- [ ] Route planning between locations
- [ ] Historical pollution animation
- [ ] Custom marker icons
- [ ] Drawing tools for areas
- [ ] Export map as image
- [ ] Share location links

## Alternative Map Providers

### Google Maps
- Requires API key
- Better satellite imagery
- More features
- Paid service

### Mapbox
- Beautiful custom styles
- Requires API key
- Free tier available
- Better performance

### OpenStreetMap (Current)
- Completely free
- No API key needed
- Community maintained
- Good for most uses

## Resources

- [Leaflet Documentation](https://leafletjs.com/)
- [React-Leaflet Guide](https://react-leaflet.js.org/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

## Support

For issues:
1. Check browser console
2. Verify all dependencies installed
3. Check API responses
4. Review this guide
5. Test in different browser
