const ts = () => new Date().toISOString();
const logger = {
  info: (m) => console.log(`[INFO] ${ts()} ${m}`),
  warn: (m) => console.warn(`[WARN] ${ts()} ${m}`),
  error: (m) => console.error(`[ERROR] ${ts()} ${m}`),
};
export default logger;
