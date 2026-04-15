import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import questionRoutes from './routes/questions.js';
import testRoutes from './routes/tests.js';
import historyRoutes from './routes/history.js';
import homeworkRoutes from './routes/homework.js';
import holidayRoutes from './routes/holiday.js';
import teacherRoutes from './routes/teacher.js';
import analyticsRoutes from './routes/analytics.js';
import tutorRoutes from './routes/tutor.js';
import importRoutes from './routes/import.js';
import { scheduleTests } from './services/scheduler.js';
import { initializeDatabase } from './services/init.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/holiday', holidayRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/import', importRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supabase: ${process.env.SUPABASE_URL}`);
  scheduleTests();
});

export default app;
