export const ok = (res, data, message = 'OK', meta) =>
  res.status(200).json({ success: true, message, data, ...(meta && { meta }) });
export const created = (res, data, message = 'Created') =>
  res.status(201).json({ success: true, message, data });
