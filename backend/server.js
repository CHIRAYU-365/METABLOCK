const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Backend server running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
