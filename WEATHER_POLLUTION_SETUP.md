# Weather & Pollution Monitoring Setup Guide

## Overview
Integrated real-time weather and air quality monitoring with crowd density correlation analysis.

## Features Implemented

### ✅ Backend
- **Weather Service** - Fetches real-time data from OpenWeatherMap API
- **Air Quality Monitoring** - AQI (1-5 scale) with pollutant components
- **Correlation Analysis** - Analyzes relationship between crowd density and pollution
- **Automatic Updates** - Weather data updates every 10 minutes during live detection
- **Historical Data** - Stores all readings in MongoDB for trend analysis

### ✅ Frontend
- **Pollution Heatmap** - Color-coded visualization of air quality
- **Weather Dashboard** - Comprehensive weather and pollution data
- **Statistics** - AQI distribution and averages
- **Correlation Reports** - Crowd-pollution relationship analysis
- **Real-time Updates** - Auto-refresh every 5 minutes

## Setup Instructions

### Step 1: Get OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your API key

### Step 2: Add API Key to Environment

Edit `crowd-alert-system/backend/.env`:
```env
OPENWEATHER_API_KEY=your_actual_api_key_here
```

**Note:** Free tier includes:
- 60 calls/minute
- 1,000,000 calls/month
- Current weather data
- Air pollution data

### Step 3: Add Coordinates to Locations

1. Go to `http://localhost:5173/locations`
2. When adding a new location, fill in:
   - **Name**: Location name
   - **Latitude**: e.g., 19.0760 (Mumbai)
   - **Longitude**: e.g., 72.8777 (Mumbai)
   - **Address**: Optional description

**Finding Coordinates:**
- Use [Google Maps](https://maps.google.com)
- Right-click on location → Click coordinates to copy
- Or use [LatLong.net](https://www.latlong.net/)

**Example Coordinates:**
- Mumbai: 19.0760, 72.8777
- Delhi: 28.6139, 77.2090
- Bangalore: 12.9716, 77.5946
- Pune: 18.5204, 73.8567

### Step 4: Update Existing Locations

For locations already created without coordinates:

```bash
# Using API
PATCH http://127.0.0.1:4000/api/locations/:locationId
Content-Type: application/json

{
  "coordinates": {
    "lat": 19.0760,
    "lon": 72.8777
  },
  "address": "Mumbai, Maharashtra"
}
```

Or use the Location Detail page to edit.

## Using the System

### 1. View Weather Dashboard

**URL:** `http://localhost:5173/weather`

**Features:**
- Overall statistics (monitored locations, good/poor air quality, avg temperature)
- AQI distribution chart (Good, Fair, Moderate, Poor, Very Poor)
- Pollution heatmap with color-coded cards
- Detailed weather table
- Crowd-pollution correlation analysis

### 2. Pollution Heatmap

Each location card shows:
- **Location name**
- **AQI value** (1-5)
- **AQI category** badge (color-coded)
- **Crowd density** at time of reading
- **Coordinates**
- **Correlation analysis** message
- **Last update time**

**Color Coding:**
- 🟢 **Green (AQI 1)** - Good air quality
- 🟢 **Light Green (AQI 2)** - Fair air quality
- 🟡 **Yellow (AQI 3)** - Moderate air quality
- 🟠 **Orange (AQI 4)** - Poor air quality
- 🔴 **Red (AQI 5)** - Very poor air quality

### 3. Automatic Updates

Weather data updates automatically:
- **During live detection**: Every 10 minutes
- **Manual update**: Click "🔄 Update All" button
- **Frontend refresh**: Every 5 minutes

### 4. Correlation Analysis

The system analyzes:
- **High crowd + High pollution**: Critical alert
- **High crowd + Moderate pollution**: Warning
- **Low crowd + High pollution**: External pollution source
- **Normal conditions**: Good air quality

**Example Messages:**
```
CRITICAL: High crowd density with poor air quality. Consider crowd control measures.
WARNING: High crowd density with moderate air quality. Monitor closely.
ALERT: Poor air quality detected. Limit outdoor activities.
NOTICE: Poor air quality despite low crowd. External pollution source likely.
NORMAL: Good air quality conditions.
```

## API Endpoints

### Get All Weather Data
```bash
GET /api/weather
```

### Get Weather for Location
```bash
GET /api/weather/location/:locationId
```

### Get Weather History
```bash
GET /api/weather/location/:locationId/history?hours=24
```

### Update Weather for Location
```bash
POST /api/weather/location/:locationId/update
Content-Type: application/json

{
  "crowdDensity": 25
}
```

### Update All Locations
```bash
POST /api/weather/update-all
```

### Get Pollution Heatmap
```bash
GET /api/weather/heatmap
```

### Get Statistics
```bash
GET /api/weather/stats
```

### Get Correlation Analysis
```bash
GET /api/weather/correlation
```

## Data Structure

### Weather Model
```javascript
{
  locationId: ObjectId,
  locationName: String,
  coordinates: { lat: Number, lon: Number },
  temperature: {
    current: Number,
    feelsLike: Number,
    min: Number,
    max: Number
  },
  humidity: Number,
  pressure: Number,
  windSpeed: Number,
  weatherCondition: String,
  weatherDescription: String,
  aqi: {
    value: Number (1-5),
    category: String,
    components: {
      co: Number,
      no: Number,
      no2: Number,
      o3: Number,
      so2: Number,
      pm2_5: Number,
      pm10: Number,
      nh3: Number
    }
  },
  crowdDensity: Number,
  crowdPollutionCorrelation: String,
  timestamp: Date
}
```

## Understanding AQI

### AQI Scale (OpenWeatherMap)
- **1 - Good**: Air quality is satisfactory
- **2 - Fair**: Air quality is acceptable
- **3 - Moderate**: May cause breathing discomfort to sensitive people
- **4 - Poor**: May cause breathing discomfort to most people
- **5 - Very Poor**: May cause respiratory illness on prolonged exposure

### Key Pollutants
- **PM2.5**: Fine particles (< 2.5 μm) - Most harmful
- **PM10**: Coarse particles (< 10 μm)
- **NO2**: Nitrogen dioxide - Traffic pollution
- **O3**: Ozone - Photochemical smog
- **SO2**: Sulphur dioxide - Industrial pollution
- **CO**: Carbon monoxide - Combustion

## Correlation Insights

### Strong Correlation
When crowd density consistently increases with pollution:
- Likely caused by vehicle emissions
- Human activities contributing to pollution
- Consider traffic management

### Weak Correlation
When pollution is high regardless of crowd:
- External pollution sources (factories, construction)
- Weather conditions (temperature inversion)
- Regional air quality issues

### Moderate Correlation
Mixed patterns:
- Some crowd-related pollution
- Some external factors
- Requires detailed analysis

## Troubleshooting

### Issue: No weather data showing
**Solution:**
1. Check API key is correct in `.env`
2. Verify locations have coordinates
3. Check backend console for API errors
4. Ensure internet connection is active

### Issue: API rate limit exceeded
**Solution:**
- Free tier: 60 calls/minute
- Reduce update frequency
- Upgrade to paid plan if needed

### Issue: Coordinates not saving
**Solution:**
- Ensure lat/lon are valid numbers
- Latitude: -90 to 90
- Longitude: -180 to 180
- Check backend console for errors

### Issue: Correlation analysis empty
**Solution:**
- Need at least 24 hours of data
- Ensure cameras are running
- Check weather updates are working

## Best Practices

1. **Add coordinates to all locations** for complete monitoring
2. **Update weather manually** before important events
3. **Monitor correlation reports** to identify pollution patterns
4. **Use heatmap** for quick visual assessment
5. **Check detailed table** for specific pollutant levels
6. **Review history** to identify trends

## Integration with Other Features

### Dashboard
- Weather stats can be added to main dashboard
- Show AQI alerts alongside crowd alerts

### Alerts
- Can trigger alerts when AQI exceeds threshold
- Combine with crowd alerts for comprehensive monitoring

### Reports
- Export weather data with crowd data
- Generate pollution trend reports
- Analyze seasonal patterns

## Future Enhancements

- [ ] Weather-based crowd predictions
- [ ] Pollution alerts via email
- [ ] Historical trend charts
- [ ] Weather forecast integration
- [ ] Map visualization with markers
- [ ] Export data to CSV/PDF
- [ ] Custom AQI thresholds per location
- [ ] Mobile app integration

## API Rate Limits

**Free Tier:**
- 60 calls/minute
- 1,000,000 calls/month
- Current weather + Air pollution

**Paid Tiers:**
- Professional: $40/month - 3,000 calls/minute
- Enterprise: Custom pricing

## Support

For OpenWeatherMap API issues:
- [API Documentation](https://openweathermap.org/api)
- [FAQ](https://openweathermap.org/faq)
- [Support](https://openweathermap.org/support)

For system issues:
- Check backend console logs
- Verify MongoDB connection
- Test API endpoints manually
- Review browser console for errors
