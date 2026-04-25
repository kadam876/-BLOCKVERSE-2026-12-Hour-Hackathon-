import express from 'express';
import Weather from '../models/Weather.js';
import Location from '../models/Location.js';
import {
  updateLocationWeather,
  getLatestWeather,
  getWeatherHistory,
  fetchWeatherData,
  fetchAirQualityData,
  AQI_COLORS,
} from '../services/weatherService.js';

const router = express.Router();

// Get weather for any coordinates (for user's current location)
router.get('/coordinates', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
    // Check if API key is configured
    if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'your_api_key_here') {
      return res.status(503).json({ 
        error: 'OpenWeatherMap API key not configured. Please add OPENWEATHER_API_KEY to .env file.' 
      });
    }
    
    const [weatherData, aqiData] = await Promise.all([
      fetchWeatherData(parseFloat(lat), parseFloat(lon)),
      fetchAirQualityData(parseFloat(lat), parseFloat(lon)),
    ]);
    
    res.json({
      coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) },
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      pressure: weatherData.pressure,
      windSpeed: weatherData.windSpeed,
      weatherCondition: weatherData.weatherCondition,
      weatherDescription: weatherData.weatherDescription,
      weatherIcon: weatherData.weatherIcon,
      aqi: aqiData,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Weather coordinates error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get latest weather for all locations
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find({ coordinates: { $exists: true } });
    const weatherData = await Promise.all(
      locations.map(async (loc) => {
        const weather = await getLatestWeather(loc._id);
        return {
          locationId: loc._id,
          locationName: loc.name,
          coordinates: loc.coordinates,
          weather,
        };
      })
    );
    
    res.json(weatherData.filter(w => w.weather !== null));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get weather for specific location
router.get('/location/:locationId', async (req, res) => {
  try {
    const weather = await getLatestWeather(req.params.locationId);
    if (!weather) {
      return res.status(404).json({ error: 'No weather data found' });
    }
    res.json(weather);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get weather history for location
router.get('/location/:locationId/history', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const history = await getWeatherHistory(req.params.locationId, hours);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update weather for location (manual trigger)
router.post('/location/:locationId/update', async (req, res) => {
  try {
    const { crowdDensity } = req.body;
    const weather = await updateLocationWeather(
      req.params.locationId,
      crowdDensity || 0
    );
    res.json(weather);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update weather for all locations
router.post('/update-all', async (req, res) => {
  try {
    const locations = await Location.find({ coordinates: { $exists: true } });
    
    const results = await Promise.allSettled(
      locations.map(async (loc) => {
        return await updateLocationWeather(loc._id, loc.lastCount || 0);
      })
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    res.json({
      success: true,
      updated: successful,
      failed,
      total: locations.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pollution heatmap data
router.get('/heatmap', async (req, res) => {
  try {
    const locations = await Location.find({ coordinates: { $exists: true } });
    
    const heatmapData = await Promise.all(
      locations.map(async (loc) => {
        const weather = await getLatestWeather(loc._id);
        if (!weather) return null;
        
        return {
          locationId: loc._id,
          locationName: loc.name,
          coordinates: weather.coordinates,
          aqi: weather.aqi.value,
          aqiCategory: weather.aqi.category,
          color: AQI_COLORS[weather.aqi.value],
          crowdDensity: weather.crowdDensity,
          correlation: weather.crowdPollutionCorrelation,
          timestamp: weather.timestamp,
        };
      })
    );
    
    res.json(heatmapData.filter(d => d !== null));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pollution statistics
router.get('/stats', async (req, res) => {
  try {
    const locations = await Location.find({ coordinates: { $exists: true } });
    
    const stats = await Promise.all(
      locations.map(async (loc) => {
        const weather = await getLatestWeather(loc._id);
        return weather;
      })
    );
    
    const validStats = stats.filter(s => s !== null);
    
    const summary = {
      totalLocations: validStats.length,
      good: validStats.filter(s => s.aqi.value === 1).length,
      fair: validStats.filter(s => s.aqi.value === 2).length,
      moderate: validStats.filter(s => s.aqi.value === 3).length,
      poor: validStats.filter(s => s.aqi.value === 4).length,
      veryPoor: validStats.filter(s => s.aqi.value === 5).length,
      avgTemperature: validStats.length > 0
        ? (validStats.reduce((sum, s) => sum + s.temperature.current, 0) / validStats.length).toFixed(1)
        : 0,
      avgAQI: validStats.length > 0
        ? (validStats.reduce((sum, s) => sum + s.aqi.value, 0) / validStats.length).toFixed(1)
        : 0,
    };
    
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get correlation analysis
router.get('/correlation', async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    
    const data = await Weather.find({
      timestamp: { $gte: since },
    }).sort({ timestamp: -1 });
    
    // Group by location and analyze
    const analysis = {};
    
    data.forEach(record => {
      const locId = record.locationId.toString();
      if (!analysis[locId]) {
        analysis[locId] = {
          locationName: record.locationName,
          samples: 0,
          avgCrowdDensity: 0,
          avgAQI: 0,
          highCrowdHighPollution: 0,
          lowCrowdHighPollution: 0,
        };
      }
      
      analysis[locId].samples++;
      analysis[locId].avgCrowdDensity += record.crowdDensity;
      analysis[locId].avgAQI += record.aqi.value;
      
      if (record.crowdDensity > 10 && record.aqi.value >= 4) {
        analysis[locId].highCrowdHighPollution++;
      }
      
      if (record.crowdDensity < 5 && record.aqi.value >= 4) {
        analysis[locId].lowCrowdHighPollution++;
      }
    });
    
    // Calculate averages
    Object.keys(analysis).forEach(locId => {
      const loc = analysis[locId];
      loc.avgCrowdDensity = (loc.avgCrowdDensity / loc.samples).toFixed(1);
      loc.avgAQI = (loc.avgAQI / loc.samples).toFixed(1);
      
      // Determine correlation strength
      if (loc.highCrowdHighPollution > loc.samples * 0.5) {
        loc.correlation = 'STRONG: Crowd density strongly correlates with pollution';
      } else if (loc.lowCrowdHighPollution > loc.samples * 0.5) {
        loc.correlation = 'WEAK: Pollution likely from external sources';
      } else {
        loc.correlation = 'MODERATE: Mixed correlation patterns';
      }
    });
    
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
