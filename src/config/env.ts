/** Reads a required environment variable (.env locally, repository variables in CI). */
export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name} (set it in .env or in the CI variables)`);
  }
  return value;
}
