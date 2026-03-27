require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/italor';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[server] MongoDB connected');

    app.listen(PORT, () => {
      console.log(`[server] Listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();
