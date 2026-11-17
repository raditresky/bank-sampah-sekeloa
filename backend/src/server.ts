import app from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`====================================================`);
  console.log(`  Bank Sampah Sekeloa REST API Server is running`);
  console.log(`  Listening on port : http://localhost:${env.PORT}`);
  console.log(`  Environment       : ${env.NODE_ENV}`);
  console.log(`  Health Check URL  : http://localhost:${env.PORT}/`);
  console.log(`  API Base URL      : http://localhost:${env.PORT}/api/v1`);
  console.log(`====================================================`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

