require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  const env = process.env.NODE_ENV || 'development';
  // Structured startup log — intentional use of process.stdout, not console.log
  process.stdout.write(
    JSON.stringify({
      level: 'info',
      message: 'Server started',
      port: PORT,
      host: HOST,
      env,
      timestamp: new Date().toISOString(),
    }) + '\n'
  );
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  process.stdout.write(
    JSON.stringify({
      level: 'info',
      message: `${signal} received — shutting down gracefully`,
      timestamp: new Date().toISOString(),
    }) + '\n'
  );

  server.close(() => {
    process.stdout.write(
      JSON.stringify({
        level: 'info',
        message: 'HTTP server closed',
        timestamp: new Date().toISOString(),
      }) + '\n'
    );
    process.exit(0);
  });

  // Force kill after 10 s
  setTimeout(() => {
    process.stdout.write(
      JSON.stringify({
        level: 'error',
        message: 'Forced shutdown after timeout',
        timestamp: new Date().toISOString(),
      }) + '\n'
    );
    process.exit(1);
  }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
