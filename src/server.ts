import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { weatherRoutes } from './routes/weatherRoutes';
import { cityRoutes } from './routes/cityRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());

// Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/cities', cityRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Weather Dashboard API is running!' });
});

app.listen(PORT, () => {
  console.log(`🌤️  Server running on port ${PORT}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});
