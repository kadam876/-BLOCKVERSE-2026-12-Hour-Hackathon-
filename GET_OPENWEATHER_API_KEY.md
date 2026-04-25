# How to Get OpenWeatherMap API Key (Free)

## Quick Steps

### 1. Sign Up (2 minutes)

1. Go to: **https://openweathermap.org/api**
2. Click **"Sign Up"** (top right)
3. Fill in:
   - Username
   - Email
   - Password
4. Check "I am 16 years old and over"
5. Check "I agree with Privacy Policy..."
6. Click **"Create Account"**

### 2. Verify Email (1 minute)

1. Check your email inbox
2. Open email from OpenWeatherMap
3. Click verification link
4. You'll be redirected to OpenWeatherMap

### 3. Get API Key (30 seconds)

1. After login, you'll see your dashboard
2. Click **"API keys"** tab
3. You'll see a default key already created
4. Copy the API key (long string like: `YOUR_OPENWEATHER_API_KEY_HERE`)

### 4. Add to Your Project (30 seconds)

1. Open: `crowd-alert-system/backend/.env`
2. Replace this line:
   ```
   OPENWEATHER_API_KEY=your_api_key_here
   ```
   With:
   ```
   OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY_HERE
   ```
   (Use your actual key)

3. Save the file

### 5. Restart Backend (10 seconds)

```bash
# In Terminal 2, press Ctrl+C, then:
cd crowd-alert-system/backend
npm run dev
```

### 6. Test It! (10 seconds)

1. Go to: `http://localhost:5173/weather`
2. Click **"📍 Use My Location"**
3. Allow permission
4. Weather data should load successfully!

## Free Tier Limits

✅ **What You Get (FREE):**
- 60 calls per minute
- 1,000,000 calls per month
- Current weather data
- Air quality data (AQI)
- 5 day forecast
- No credit card required

❌ **What You DON'T Get:**
- Historical data (paid)
- 16 day forecast (paid)
- Hourly forecast (paid)

**For this project:** Free tier is MORE than enough!

## API Key Activation

⏰ **Important:** New API keys take **10-15 minutes** to activate.

If you get errors immediately after creating the key:
1. Wait 10-15 minutes
2. Try again
3. It will work!

## Testing Your API Key

```bash
# Replace YOUR_KEY with your actual key
curl "https://api.openweathermap.org/data/2.5/weather?lat=19.0760&lon=72.8777&appid=YOUR_KEY&units=metric"
```

**Success Response:**
```json
{
  "coord": {"lon": 72.8777, "lat": 19.076},
  "weather": [{"main": "Clear", "description": "clear sky"}],
  "main": {"temp": 28.5, "humidity": 65},
  ...
}
```

**Error Response (key not activated yet):**
```json
{
  "cod": 401,
  "message": "Invalid API key"
}
```
Wait 10 minutes and try again.

## Alternative: Use Without API Key

If you don't want to get an API key right now, the map will still work:

✅ **What Works:**
- Interactive map
- Location markers
- "Use My Location" button
- Add locations
- View coordinates

❌ **What Doesn't Work:**
- Weather data
- Temperature
- Air Quality Index (AQI)
- Pollution monitoring

You can add the API key later anytime!

## Troubleshooting

### Issue: "Invalid API key"

**Solutions:**
1. Wait 10-15 minutes (new keys need activation)
2. Check you copied the entire key
3. No spaces before/after the key in .env
4. Restart backend after adding key

### Issue: "API key not configured"

**Solutions:**
1. Check `.env` file exists in `crowd-alert-system/backend/`
2. Check the line says: `OPENWEATHER_API_KEY=your_actual_key`
3. No quotes around the key
4. Restart backend

### Issue: "Rate limit exceeded"

**Solutions:**
- Free tier: 60 calls/minute
- Wait 1 minute
- Reduce update frequency
- Upgrade to paid plan (if needed)

## .env File Format

**Correct:**
```env
OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY_HERE
```

**Wrong:**
```env
OPENWEATHER_API_KEY="YOUR_OPENWEATHER_API_KEY_HERE"  ❌ (no quotes)
OPENWEATHER_API_KEY= YOUR_OPENWEATHER_API_KEY_HERE  ❌ (no space)
OPENWEATHER_API_KEY=your_api_key_here                   ❌ (not real key)
```

## Security Notes

⚠️ **Keep Your API Key Secret:**
- Don't commit to GitHub
- Don't share publicly
- Don't post in forums
- `.env` file is in `.gitignore` (safe)

✅ **Safe to Use:**
- In `.env` file (not committed)
- On your local machine
- In backend only (not frontend)

## Quick Reference

**OpenWeatherMap:**
- Website: https://openweathermap.org
- Sign Up: https://openweathermap.org/api
- API Keys: https://home.openweathermap.org/api_keys
- Documentation: https://openweathermap.org/api/one-call-3
- Pricing: https://openweathermap.org/price

**Support:**
- FAQ: https://openweathermap.org/faq
- Contact: https://openweathermap.org/support

## Summary

1. ✅ Sign up at OpenWeatherMap (free)
2. ✅ Get API key from dashboard
3. ✅ Add to `.env` file
4. ✅ Restart backend
5. ✅ Test "Use My Location"

**Total time: ~5 minutes (including email verification)**

The free tier is perfect for this project and you'll never hit the limits!
