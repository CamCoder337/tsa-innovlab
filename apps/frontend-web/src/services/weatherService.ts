import type { WeatherData } from '@/types/tracking.types';

interface OpenWeatherMapResponse {
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  visibility: number;
  rain?: {
    '1h'?: number;
  };
  snow?: {
    '1h'?: number;
  };
  dt: number;
}

/**
 * Weather Service - Integrates with OpenWeatherMap or similar API
 * For production, replace with actual API calls
 */

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fetch current weather conditions for a location
 */
export async function getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
  try {
    // In production, uncomment and use real API
    const response = await fetch(
      `${WEATHER_API_URL}?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`
    );
    const data = await response.json();
    return mapWeatherResponse(data);

    // Mock data for development
    // return generateMockWeather(lat, lng);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error('Failed to fetch weather data');
  }
}

/**
 * Get weather forecast for next 48 hours along a route
 */
export async function getRouteForecast(
  waypoints: Array<{ lat: number; lng: number; timestamp: string }>
): Promise<WeatherData[]> {
  try {
    // In production, call weather API for each waypoint
    return Promise.all(waypoints.map((point) => getCurrentWeather(point.lat, point.lng)));
  } catch (error) {
    console.error('Error fetching route forecast:', error);
    return [];
  }
}

/**
 * Analyze weather risk for delivery
 */
export function analyzeWeatherRisk(weather: WeatherData): {
  riskLevel: WeatherData['riskLevel'];
  impactOnDelivery: string;
  estimatedDelay: number;
} {
  let riskLevel: WeatherData['riskLevel'] = 'low';
  let impactOnDelivery = 'Conditions météo favorables';
  let estimatedDelay = 0;

  // Check for severe conditions
  if (weather.condition === 'storm') {
    riskLevel = 'severe';
    impactOnDelivery = 'Orage violent - Retard significatif possible';
    estimatedDelay = 60;
  } else if (weather.condition === 'rain' && weather.precipitation > 50) {
    riskLevel = 'high';
    impactOnDelivery = 'Fortes pluies - Ralentissement du trafic';
    estimatedDelay = 30;
  } else if (weather.condition === 'fog' && weather.visibility < 1) {
    riskLevel = 'high';
    impactOnDelivery = 'Brouillard dense - Visibilité réduite';
    estimatedDelay = 25;
  } else if (weather.condition === 'rain') {
    riskLevel = 'moderate';
    impactOnDelivery = 'Pluie légère - Léger ralentissement';
    estimatedDelay = 10;
  } else if (weather.windSpeed > 50) {
    riskLevel = 'moderate';
    impactOnDelivery = 'Vents forts - Conduite difficile';
    estimatedDelay = 15;
  }

  return { riskLevel, impactOnDelivery, estimatedDelay };
}

/**
 * Generate mock weather data for development
 */
// function generateMockWeather(lat: number, lng: number): WeatherData {
//   // Simulate different weather based on location
//   const seed = Math.abs(Math.sin(lat) * Math.cos(lng));

//   const conditions: Array<WeatherData['condition']> = [
//     'clear', 'partly_cloudy', 'cloudy', 'rain', 'storm'
//   ];

//   const weatherIcons = {
//     clear: '☀️',
//     partly_cloudy: '⛅',
//     cloudy: '☁️',
//     rain: '🌧️',
//     storm: '⛈️',
//     fog: '🌫️',
//     snow: '❄️'
//   };

//   const descriptions = {
//     clear: 'Temps clair et ensoleillé',
//     partly_cloudy: 'Partiellement nuageux',
//     cloudy: 'Nuageux',
//     rain: 'Pluie',
//     storm: 'Orage',
//     fog: 'Brouillard',
//     snow: 'Neige'
//   };

//   const conditionIndex = Math.floor(seed * conditions.length);
//   const condition = conditions[conditionIndex];

//   const temperature = 20 + Math.floor(seed * 15);
//   const precipitation = condition === 'rain' ? 5 + Math.floor(seed * 45)
//     : condition === 'storm' ? 20 + Math.floor(seed * 80)
//       : 0;
//   const windSpeed = 5 + Math.floor(seed * 35);
//   const visibility = condition === 'fog' ? 0.5 + seed * 2
//     : condition === 'storm' ? 2 + seed * 3
//       : 8 + seed * 2;

//   const weatherData: WeatherData = {
//     condition,
//     description: descriptions[condition],
//     temperature,
//     feelsLike: temperature - (windSpeed > 20 ? 2 : 0),
//     windSpeed,
//     windDirection: Math.floor(seed * 360),
//     precipitation,
//     humidity: 40 + Math.floor(seed * 50),
//     visibility,
//     uvIndex: condition === 'clear' ? 6 + Math.floor(seed * 5) : Math.floor(seed * 4),
//     icon: weatherIcons[condition],
//     riskLevel: 'low'
//   };

//   const riskAnalysis = analyzeWeatherRisk(weatherData);
//   weatherData.riskLevel = riskAnalysis.riskLevel;
//   weatherData.impactOnDelivery = riskAnalysis.impactOnDelivery;

//   return weatherData;
// }

/**
 * Map OpenWeatherMap API response to our WeatherData type
 */
function mapWeatherResponse(apiData: OpenWeatherMapResponse): WeatherData {
  const conditionMap: Record<string, WeatherData['condition']> = {
    Clear: 'clear',
    Clouds: 'cloudy',
    Rain: 'rain',
    Drizzle: 'rain',
    Thunderstorm: 'storm',
    Snow: 'snow',
    Mist: 'fog',
    Fog: 'fog',
  };

  const iconMap: Record<string, string> = {
    clear: '☀️',
    partly_cloudy: '⛅',
    cloudy: '☁️',
    rain: '🌧️',
    storm: '⛈️',
    fog: '🌫️',
    snow: '❄️',
  };

  const condition = conditionMap[apiData.weather[0].main] || 'cloudy';

  const weatherData: WeatherData = {
    condition,
    description: apiData.weather[0].description,
    temperature: Math.round(apiData.main.temp),
    feelsLike: Math.round(apiData.main.feels_like),
    windSpeed: Math.round(apiData.wind.speed * 3.6), // m/s to km/h
    windDirection: apiData.wind.deg,
    precipitation: apiData.rain?.['1h'] || 0,
    humidity: apiData.main.humidity,
    visibility: (apiData.visibility || 10000) / 1000, // meters to km
    uvIndex: 0, // Requires separate UV API call
    icon: iconMap[condition],
    riskLevel: 'low',
  };

  const riskAnalysis = analyzeWeatherRisk(weatherData);
  weatherData.riskLevel = riskAnalysis.riskLevel;
  weatherData.impactOnDelivery = riskAnalysis.impactOnDelivery;

  return weatherData;
}
