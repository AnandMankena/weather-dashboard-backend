import express from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const router = express.Router();
const prisma = new PrismaClient();

// Get all cities
router.get('/', async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { isDefault: 'desc' }
    });
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Add a new city
router.post('/', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'City name is required' });
  }

  try {
    // Get city coordinates from OpenWeatherMap
    const geoResponse = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(name)}&limit=1&appid=${process.env.OPENWEATHER_API_KEY}`
    );

    if (geoResponse.data.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    const cityData = geoResponse.data[0];

    // Check if city already exists
    const existingCity = await prisma.city.findUnique({
      where: {
        name_country: {
          name: cityData.name,
          country: cityData.country
        }
      }
    });

    if (existingCity) {
      return res.status(409).json({ error: 'City already exists' });
    }

    // Create new city
    const newCity = await prisma.city.create({
      data: {
        name: cityData.name,
        country: cityData.country,
        lat: cityData.lat,
        lon: cityData.lon
      }
    });

    res.status(201).json(newCity);
  } catch (error) {
    console.error('Error adding city:', error);
    res.status(500).json({ error: 'Failed to add city' });
  }
});

// Delete a city
router.delete('/:id', async (req, res) => {
  const cityId = parseInt(req.params.id);

  if (isNaN(cityId)) {
    return res.status(400).json({ error: 'Invalid city ID' });
  }

  try {
    const city = await prisma.city.findUnique({
      where: { id: cityId }
    });

    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    if (city.isDefault) {
      return res.status(400).json({ error: 'Cannot delete default city' });
    }

    await prisma.city.delete({
      where: { id: cityId }
    });

    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({ error: 'Failed to delete city' });
  }
});

export { router as cityRoutes };
