const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const nanoid = (len = 10) => {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
};
export const orderNumber = () => `MW${Date.now().toString(36).toUpperCase()}${nanoid(3)}`;
