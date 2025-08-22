import axios from 'axios';
import { CityWeather, WeatherData, ForecastDay, OpenWeatherResponse, OpenWeatherForecastResponse } from '../types/weather';
import { City } from '@prisma/client';

class WeatherService {
  private baseUrl = 'https://api.openweathermap.org/data/2.5';
  private apiKey = process.env.WEATHER_API_KEY;

  async getWeatherData(city: City): Promise<CityWeather | null> {
    try {
      // First get coordinates if we don't have them
      let lat = city.lat;
      let lon = city.lon;
      
      if (!lat || !lon) {
        const geoResponse = await axios.get(
          `https://api.openweathermap.org/geo/1.0/direct?q=${city.name}&limit=1&appid=${this.apiKey}`
        );
        
        if (geoResponse.data.length === 0) {
          return null;
        }
        
        lat = geoResponse.data[0].lat;
        lon = geoResponse.data.lon;
      }

      // Get current weather
      const currentResponse = await axios.get<OpenWeatherResponse>(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );

      // Get forecast
      const forecastResponse = await axios.get<OpenWeatherForecastResponse>(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
      );

      const current: WeatherData = {
        temperature: currentResponse.data.main.temp,
        description: currentResponse.data.weather[0].description,
        icon: currentResponse.data.weather[0].icon, // Fixed: use  to access first element
        humidity: currentResponse.data.main.humidity,
        windSpeed: currentResponse.data.wind.speed,
        feelsLike: currentResponse.data.main.feels_like,
        pressure: currentResponse.data.main.pressure,
      };

      const forecast: ForecastDay[] = this.processForecast(forecastResponse.data);

      return {
        city: { 
          id: city.id, 
          name: city.name, 
          country: city.country || 'Unknown'
        },
        current,
        forecast
      };
    } catch (error) {
      console.error('Weather API error:', error);
      return null;
    }
  }

  private processForecast(data: OpenWeatherForecastResponse): ForecastDay[] {
    // Group forecast by day (OpenWeather returns 3-hour intervals)
    const dailyData: { [key: string]: any[] } = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = [];
      }
      dailyData[date].push(item);
    });

    // Convert to ForecastDay format
    return Object.entries(dailyData).slice(0, 5).map(([date, dayData]) => {
      // Fixed: use flatMap and correct syntax
      const temps = dayData.flatMap(d => [d.main.temp_min, d.main.temp_max]);
      const avgHumidity = dayData.reduce((sum, d) => sum + d.main.humidity, 0) / dayData.length;
      
      return {
        date,
        temperature: {
          min: Math.min(...temps),
          max: Math.max(...temps)
        },
        description: dayData[0].weather[0].description,
        icon: dayData[0].weather[0].icon,

        humidity: Math.round(avgHumidity)
      };
    });
  }
}

export const weatherService = new WeatherService();
