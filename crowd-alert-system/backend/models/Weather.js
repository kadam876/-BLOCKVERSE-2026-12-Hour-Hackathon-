import mongoose from 'mongoose';

const weatherSchema = new mongoose.Schema({
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
  locationName: String,
  coordinates: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
  },
  temperature: {
    current: Number, // Celsius
    feelsLike: Number,
    min: Number,
    max: Number,
  },
  humidity: Number, // Percentage
  pressure: Number, // hPa
  windSpeed: Number, // m/s
  weatherCondition: String, // Clear, Clouds, Rain, etc.
  weatherDescription: String,
  weatherIcon: String,
  aqi: {
    value: Number, // 1-5 scale
    category: { type: String, enum: ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'] },
    components: {
      co: Number, // Carbon monoxide (μg/m³)
      no: Number, // Nitrogen monoxide (μg/m³)
      no2: Number, // Nitrogen dioxide (μg/m³)
      o3: Number, // Ozone (μg/m³)
      so2: Number, // Sulphur dioxide (μg/m³)
      pm2_5: Number, // Fine particles matter (μg/m³)
      pm10: Number, // Coarse particulate matter (μg/m³)
      nh3: Number, // Ammonia (μg/m³)
    },
  },
  crowdDensity: Number, // People count at time of reading
  crowdPollutionCorrelation: String, // Analysis of crowd vs pollution
  timestamp: { type: Date, default: Date.now, index: true },
});

// Index for efficient queries
weatherSchema.index({ locationId: 1, timestamp: -1 });

export default mongoose.model('Weather', weatherSchema);
