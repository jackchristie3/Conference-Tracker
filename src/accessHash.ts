// SHA-256 hex digest of the site passphrase. Only the hash lives in this
// public repo — the plaintext passphrase was generated and shared with the
// site owner out of band, never committed here.
export const ACCESS_HASH = "83767ce0fbed22c7a19704dbab92a8743ca0c87d70b58be7dd4c920560fa8127";

export const UNLOCK_STORAGE_KEY = "conference-tracker:unlocked";

export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
