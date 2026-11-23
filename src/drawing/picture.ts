/** A stored picture is the base64 text of a WebP, at most 1.5 MB of image bytes. */
const MAX_BYTES = 1_572_864;
const MAX_TEXT = 2_097_152;

/** Returns the base64 text when it is a WebP within the size limit. */
export function webp(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_TEXT || value.length % 4 !== 0) return null;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null;
  const bytes = Buffer.from(value, "base64");
  if (bytes.length < 12 || bytes.length > MAX_BYTES) return null;
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") return null;
  return value;
}
