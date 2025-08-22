import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all cities
router.get('/', async (req, res) => {
  try {
    const cities = await prisma.city.findMany();
    res.json(cities);
  } catch (error: any) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Add new city
router.post('/', async (req, res) => {
  try {
    const { name, country } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'City name is required' });
    }

    const city = await prisma.city.create({
      data: { 
        name,
        country: country || null
      }
    });
    
    res.status(201).json(city);
  } catch (error: any) {
    console.error('Error adding city:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'City already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add city' });
    }
  }
});

// Get city by ID
router.get('/:id', async (req, res) => {
  try {
    const cityId = parseInt(req.params.id);
    const city = await prisma.city.findUnique({
      where: { id: cityId }  // Use id instead of name_country
    });
    
    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    res.json(city);
  } catch (error: any) {
    console.error('Error fetching city:', error);
    res.status(500).json({ error: 'Failed to fetch city' });
  }
});

// Delete city
router.delete('/:id', async (req, res) => {
  try {
    const cityId = parseInt(req.params.id);
    await prisma.city.delete({
      where: { id: cityId }  // Use id instead of name_country
    });
    
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting city:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'City not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete city' });
    }
  }
});

export { router as cityRoutes };
