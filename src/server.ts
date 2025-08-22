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
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app'] 
    : 'http://localhost:3000'
}));
app.use(express.json());

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Try to create tables if they don't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        country VARCHAR(255),
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
  console.log(`🌤️  Server running on port ${PORT}`);
  console.log(`🔗 API URL: ${process.env.NODE_ENV === 'production' ? 'Railway URL' : `http://localhost:${PORT}`}`);
});
