import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok } from '../utils/apiResponse.js';
import { signUpload, cloudinaryEnabled } from '../services/cloudinary.service.js';

// GET /uploads/signature?folder=dishes
export const getUploadSignature = asyncHandler(async (req, res) => {
  if (!cloudinaryEnabled()) throw ApiError.badRequest('Image uploads are not configured on the server');
  ok(res, signUpload(req.query.folder || 'maaswad'));
});
