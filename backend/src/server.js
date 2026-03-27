require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/italor';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    process.stdout.write(JSON.stringify({ level: 'info', message: 'MongoDB connected', timestamp: new Date().toISOString() }) + '\n');

    app.listen(PORT, () => {
      process.stdout.write(JSON.stringify({ level: 'info', message: `Listening on port ${PORT}`, env: process.env.NODE_ENV || 'development', timestamp: new Date().toISOString() }) + '\n');
    });
  } catch (err) {
    process.stderr.write(JSON.stringify({ level: 'error', message: 'Failed to start', error: err.message, timestamp: new Date().toISOString() }) + '\n');
    process.exit(1);
  }
}

start();
