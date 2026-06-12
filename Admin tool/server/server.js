require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-tutor';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err.message));

mongoose.connection.on('error', err => {
  console.error('MongoDB runtime error:', err.message);
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/students', require('./routes/students'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/export', require('./routes/export'));
app.use('/api/moderation', require('./routes/moderation'));
app.use('/api/management', require('./routes/management'));
app.use('/api/online', require('./routes/online'));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Admin server running on port ${PORT}`);
});
