import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import careJourneyRoutes from './routes/care-journey';

const PORT = parseInt(process.env.PORT || '3000', 10);
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api', careJourneyRoutes);

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🏥 Care Journey Tracker running at http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/patients`);
});
