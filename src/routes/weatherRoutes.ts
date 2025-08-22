import express from 'express';
import { WeatherService } from '../services/weatherService';
import { PrismaClient } from '@prisma/client';
import type { City } from '@prisma/client';

const router = express.Router();
const weatherService = new WeatherService();
const prisma = new PrismaClient();

// Get weather for a specific city
router.get('/city/:id', async (req, res) => {
  const cityId = parseInt(req.params.id);

  if (isNaN(cityId)) {
    return res.status(400).json({ error: 'Invalid city ID' });
  }

  try {
    const weatherData = await weatherService.getCurrentWeather(cityId);
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather:', error);
    if (error instanceof Error && error.message === 'City not found') {
      res.status(404).json({ error: 'City not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch weather data' });
    }
  }
});

// Get weather for all cities
router.get('/all', async (req, res) => {
  try {
    const cities: City[] = await prisma.city.findMany({
      orderBy: { isDefault: 'desc' }
    });

    const weatherPromises = cities.map((city: City) => 
      weatherService.getCurrentWeather(city.id).catch(error => ({
        error: true,
        city: { id: city.id, name: city.name, country: city.country },
        message: error.message
      }))
    );

    const results = await Promise.all(weatherPromises);
    res.json(results);
  } catch (error) {
    console.error('Error fetching weather for all cities:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

export { router as weatherRoutes };
