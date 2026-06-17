import app from './app.js';
import config from './config/index.js';
import { connectDB } from './config/db.js';
import { initFirebase } from './config/firebase.js';
import { initCloudinary } from './services/cloudinary.service.js';
import logger from './utils/logger.js';

(async () => {
  await connectDB();
  initFirebase();
  initCloudinary();
  app.listen(config.port, () => {
    logger.info(`Maaswad API running on port ${config.port} (${config.env})`);
    logger.info(`Docs: ${config.apiBaseUrl}/api/docs`);
  });
})();

process.on('unhandledRejection', (e) => logger.error(`unhandledRejection: ${e?.message}`));
