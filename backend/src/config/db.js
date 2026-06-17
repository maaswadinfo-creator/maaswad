import mongoose from 'mongoose';
import config from './index.js';
import logger from '../utils/logger.js';

let connected = false;

export async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    connected = true;
    logger.info('MongoDB connected');
  } catch (err) {
    connected = false;
    logger.error(`MongoDB connection failed: ${err.message}. Server will keep running; DB routes will error until connected.`);
  }
}

export const isDbConnected = () => mongoose.connection.readyState === 1;
