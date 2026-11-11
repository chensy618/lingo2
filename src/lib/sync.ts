export const SYNC_URL = process.env.NEXT_PUBLIC_SYNC_URL ?? "";

export interface SyncPayload {
  exportedAt: string;
  preferences: unknown;
  attempts: unknown;
  bookmarks: unknown;
  vocabulary: unknown;
}

async function request(path: string, init: RequestInit) {
  const response = await fetch(path, init);
  if (!response.ok) throw new Error(`Sync failed with ${response.status}.`);
  return response;
}

export async function uploadSync(key: string, payload: SyncPayload) {
  await request(SYNC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(payload),
  });
}

export async function downloadSync(key: string): Promise<SyncPayload> {
  const response = await request(`${SYNC_URL}?key=${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  return (await response.json()) as SyncPayload;
}
