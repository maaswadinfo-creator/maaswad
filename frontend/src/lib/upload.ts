import { api } from './api';

/** Uploads a file directly to Cloudinary using a backend-signed request. */
export async function uploadImage(file: File, folder = 'maaswad'): Promise<string> {
  const { data } = await api.get(`/uploads/signature?folder=${folder}`);
  const s = data.data;
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', s.apiKey);
  form.append('timestamp', String(s.timestamp));
  form.append('signature', s.signature);
  form.append('folder', s.folder);
  const res = await fetch(s.uploadUrl, { method: 'POST', body: form });
  const json = await res.json();
  if (!json.secure_url) throw new Error(json.error?.message || 'Upload failed');
  return json.secure_url as string;
}
