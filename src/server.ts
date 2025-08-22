import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { weatherRoutes } from './routes/weatherRoutes';
import { cityRoutes } from './routes/cityRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000; // Railway uses PORT env variable
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app'] 
    : 'http://localhost:3000'
}));
app.use(express.json());

// Database connection check
prisma.$connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ Database connection failed:', err));

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

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

app.listen(PORT, () => {
  console.log(`🌤️  Server running on port ${PORT}`);
  console.log(`🔗 API URL: ${process.env.NODE_ENV === 'production' ? 'Railway URL' : `http://localhost:${PORT}`}`);
});
