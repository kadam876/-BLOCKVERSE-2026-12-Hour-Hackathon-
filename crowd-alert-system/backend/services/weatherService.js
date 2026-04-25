import fetch from 'node-fetch';
import Weather from '../models/Weather.js';
import Location from '../models/Location.js';

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// AQI category mapping (OpenWeatherMap uses 1-5 scale)
const AQI_CATEGORIES = {
  1: 'Good',
  2: 'Fair',
  3: 'Moderate',
  4: 'Poor',
  5: 'Very Poor',
};

// Color coding for frontend
const AQI_COLORS = {
  1: '#16a34a', // Green - Good
  2: '#84cc16', // Light Green - Fair
  3: '#eab308', // Yellow - Moderate
  4: '#f97316', // Orange - Poor
  5: '#dc2626', // Red - Very Poor
};

/**
 * Fetch weather data for a location
 */
export async function fetchWeatherData(lat, lon) {
  try {
    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      temperature: {
        current: data.main.temp,
        feelsLike: data.main.feels_like,
        min: data.main.temp_min,
        max: data.main.temp_max,
      },
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      weatherCondition: data.weather[0].main,
      weatherDescription: data.weather[0].description,
      weatherIcon: data.weather[0].icon,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    throw error;
  }
}

/**
 * Fetch air quality data for a location
 */
export async function fetchAirQualityData(lat, lon) {
  try {
    const url = `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Air Quality API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const aqi = data.list[0];
    
    return {
      value: aqi.main.aqi,
      category: AQI_CATEGORIES[aqi.main.aqi],
      color: AQI_COLORS[aqi.main.aqi],
      components: {
        co: aqi.components.co,
        no: aqi.components.no,
        no2: aqi.components.no2,
        o3: aqi.components.o3,
        so2: aqi.components.so2,
        pm2_5: aqi.components.pm2_5,
        pm10: aqi.components.pm10,
        nh3: aqi.components.nh3,
      },
    };
  } catch (error) {
    console.error('Error fetching air quality data:', error.message);
    throw error;
  }
}

/**
 * Analyze correlation between crowd density and pollution
 */
export function analyzeCrowdPollutionCorrelation(crowdDensity, aqiValue, threshold) {
  const crowdRatio = threshold > 0 ? crowdDensity / threshold : 0;
  
  // High crowd + High pollution
  if (crowdRatio > 0.8 && aqiValue >= 4) {
    return 'CRITICAL: High crowd density with poor air quality. Consider crowd control measures.';
  }
  
  // High crowd + Moderate pollution
  if (crowdRatio > 0.8 && aqiValue === 3) {
    return 'WARNING: High crowd density with moderate air quality. Monitor closely.';
  }
  
  // Moderate crowd + High pollution
  if (crowdRatio > 0.5 && aqiValue >= 4) {
    return 'ALERT: Poor air quality detected. Limit outdoor activities.';
  }
  
  // Low crowd + High pollution
  if (crowdRatio < 0.5 && aqiValue >= 4) {
    return 'NOTICE: Poor air quality despite low crowd. External pollution source likely.';
  }
  
  // Normal conditions
  if (aqiValue <= 2) {
    return 'NORMAL: Good air quality conditions.';
  }
  
  return 'MODERATE: Air quality is acceptable.';
}

/**
 * Update weather and pollution data for a location
 */
export async function updateLocationWeather(locationId, crowdDensity = 0) {
  try {
    const location = await Location.findById(locationId);
    if (!location || !location.coordinates) {
      throw new Error('Location not found or coordinates missing');
    }
    
    const { lat, lon } = location.coordinates;
    
    // Fetch weather and air quality data
    const [weatherData, aqiData] = await Promise.all([
      fetchWeatherData(lat, lon),
      fetchAirQualityData(lat, lon),
    ]);
    
    // Analyze correlation
    const correlation = analyzeCrowdPollutionCorrelation(
      crowdDensity,
      aqiData.value,
      location.threshold
    );
    
    // Save to database
    const weather = await Weather.create({
      locationId,
      locationName: location.name,
      coordinates: { lat, lon },
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      pressure: weatherData.pressure,
      windSpeed: weatherData.windSpeed,
      weatherCondition: weatherData.weatherCondition,
      weatherDescription: weatherData.weatherDescription,
      weatherIcon: weatherData.weatherIcon,
      aqi: aqiData,
      crowdDensity,
      crowdPollutionCorrelation: correlation,
      timestamp: new Date(),
    });
    
    return weather;
  } catch (error) {
    console.error('Error updating location weather:', error.message);
    throw error;
  }
}

/**
 * Get latest weather data for a location
 */
export async function getLatestWeather(locationId) {
  try {
    const weather = await Weather.findOne({ locationId })
      .sort({ timestamp: -1 })
      .limit(1);
    
    return weather;
  } catch (error) {
    console.error('Error getting latest weather:', error.message);
    throw error;
  }
}

/**
 * Get weather history for a location
 */
export async function getWeatherHistory(locationId, hours = 24) {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const history = await Weather.find({
      locationId,
      timestamp: { $gte: since },
    }).sort({ timestamp: -1 });
    
    return history;
  } catch (error) {
    console.error('Error getting weather history:', error.message);
    throw error;
  }
}

export { AQI_COLORS };
