import axios from 'axios';
import NodeCache from 'node-cache';
import { PrismaClient } from '@prisma/client';
import { 
  WeatherData, 
  ForecastDay, 
  CityWeather, 
  OpenWeatherResponse, 
  OpenWeatherForecastResponse 
} from '../types/weather';

const prisma = new PrismaClient();
const cache = new NodeCache({ stdTTL: 600 });

export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY!;
  }

  async getCurrentWeather(cityId: number): Promise<CityWeather> {
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw new Error('City not found');

    const weatherResponse = await axios.get<OpenWeatherResponse>(
      `${this.baseUrl}/weather?lat=${city.lat}&lon=${city.lon}&appid=${this.apiKey}&units=metric`
    );

    const forecastResponse = await axios.get<OpenWeatherForecastResponse>(
      `${this.baseUrl}/forecast?lat=${city.lat}&lon=${city.lon}&appid=${this.apiKey}&units=metric`
    );

    return {
      city: { id: city.id, name: city.name, country: city.country },
      current: {
        temperature: Math.round(weatherResponse.data.main.temp),
        description: weatherResponse.data.weather[0].description,
        icon: weatherResponse.data.weather[0].icon,
        humidity: weatherResponse.data.main.humidity,
        windSpeed: Math.round(weatherResponse.data.wind.speed * 3.6),
        feelsLike: Math.round(weatherResponse.data.main.feels_like),
        pressure: weatherResponse.data.main.pressure
      },
      forecast: this.parseForecast(forecastResponse.data)
    };
  }

  private parseForecast(data: OpenWeatherForecastResponse): ForecastDay[] {
    const dailyData = new Map();
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          temps: [item.main.temp_min, item.main.temp_max],
          weather: item.weather,
          humidity: item.main.humidity
        });
      } else {
        const existing = dailyData.get(date);
        existing.temps.push(item.main.temp_min, item.main.temp_max);
      }
    });

    return Array.from(dailyData.values()).slice(0, 5).map((day: any) => ({
      date: day.date,
      temperature: {
        min: Math.round(Math.min(...day.temps)),
        max: Math.round(Math.max(...day.temps))
      },
      description: day.weather.description,
      icon: day.weather.icon,
      humidity: day.humidity
    }));
  }
}
