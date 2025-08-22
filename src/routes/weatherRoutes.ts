import { Router } from 'express';
import { weatherService } from '../services/weatherService'; // Fixed import
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get weather for all cities
router.get('/', async (req, res) => {
  try {
    const cities = await prisma.city.findMany();
    const weatherPromises = cities.map(city =>
      weatherService.getWeatherData(city).catch((error: any) => ({ // Fixed error type
        city: { id: city.id, name: city.name, country: city.country || 'Unknown' },
        current: null,
        forecast: [],
        error: error.message
      }))
    );
    
    const weatherData = await Promise.all(weatherPromises);
res.json(weatherData.filter(data => data && data.current !== null));
  } catch (error: any) { // Fixed error type
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get weather for specific city
router.get('/:cityId', async (req, res) => {
  try {
    const cityId = parseInt(req.params.cityId);
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    const weatherData = await weatherService.getWeatherData(city);
    if (!weatherData) {
      return res.status(404).json({ error: 'Weather data not available' });
    }
    
    res.json(weatherData);
  } catch (error: any) { // Fixed error type
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

export { router as weatherRoutes };
