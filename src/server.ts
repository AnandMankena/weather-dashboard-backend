import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { weatherRoutes } from './routes/weatherRoutes';
import { cityRoutes } from './routes/cityRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://127.0.0.1:3000',
    'https://weather-dashboard-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));
(express.json());

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create table with capital "City" (what Prisma expects)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "City" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        country VARCHAR(255),
        lat FLOAT,
        lon FLOAT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "isDefault" BOOLEAN DEFAULT FALSE
      );
    `;
    
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};

// Initialize database on startup
initializeDatabase();

// Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/cities', cityRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Weather Dashboard API is running!' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Weather Dashboard API',
    endpoints: ['/api/cities', '/api/weather', '/health']
  });
});

app.listen(PORT, () => {
  console.log(`🌤️ Server running on port ${PORT}`);
  console.log(`🔗 API URL: ${process.env.NODE_ENV === 'production' ? 'Railway URL' : `http://localhost:${PORT}`}`);
});
