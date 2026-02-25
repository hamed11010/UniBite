const LOCAL_ORIGINS = ['http://localhost:3001', 'http://127.0.0.1:3001'];

export function getFrontendOrigins(): string[] {
  const configured = process.env.FRONTEND_URL?.trim();
  if (!configured) {
    return LOCAL_ORIGINS;
  }

  const parsed = configured
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return parsed.length > 0 ? parsed : LOCAL_ORIGINS;
}
