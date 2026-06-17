import { v2 as cloudinary } from 'cloudinary';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let configured = false;
export function initCloudinary() {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    logger.warn('Cloudinary not configured — image uploads disabled until CLOUDINARY_* env vars are set.');
    return;
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  configured = true;
  logger.info('Cloudinary configured');
}
export const cloudinaryEnabled = () => configured;

/**
 * Returns the params a client needs to upload directly to Cloudinary
 * (so large files never pass through our API).
 */
export function signUpload(folder = 'maaswad') {
  if (!configured) throw new Error('Cloudinary not configured');
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, config.cloudinary.apiSecret);
  return {
    signature, timestamp, folder,
    apiKey: config.cloudinary.apiKey,
    cloudName: config.cloudinary.cloudName,
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/auto/upload`,
  };
}
