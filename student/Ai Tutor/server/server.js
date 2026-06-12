import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import sessionRoutes from './routes/sessions.js';
import curriculumRoutes from './routes/curriculum.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use('/api/uploads', express.static('uploads'));

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-tutor';
console.log('Connecting to MongoDB...', mongoUri.replace(/\/\/.*:.*@/, '//<credentials>@'));
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err.message));

app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/curriculum', curriculumRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
