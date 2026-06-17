import Setting from '../models/Setting.js';
let cache = null;
export async function getSettings() {
  if (cache) return cache;
  let s = await Setting.findOne({ key: 'platform' });
  if (!s) s = await Setting.create({ key: 'platform' });
  cache = s;
  return s;
}
export async function updateSettings(patch) {
  const s = await getSettings();
  Object.assign(s, patch);
  await s.save();
  cache = s;
  return s;
}
export const invalidateSettings = () => { cache = null; };
