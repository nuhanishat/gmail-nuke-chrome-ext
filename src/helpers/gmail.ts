import { fetchWithBackoff, sleep } from "./backoff";


const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";

export async function getProfile(token: string) {
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${token}` },
    });
    
    const j = await res.json();
    console.log("[gmail] profile:", j); // { emailAddress, messagesTotal, threadsTotal, historyId }
  return j;
    
}

async function apiGet<T>(token: string, path: string) {
    const res = await fetch(`${GMAIL}${path}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;    
}

// async function apiPost<T>(token: string, path: string, body?: any) {
//     const res = await fetch(`${GMAIL}${path}`, {
//         method: "POST",
//         headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json"
//         },
//         body: body ? JSON.stringify(body) : undefined
//     });
//     if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
//     return (await res.json()) as T;

// }

// List All matching message IDs (paged)
export async function listAllIds(token: string, q: string): Promise<string[]> {
    const ids: string[] = [];
    let pageToken: string | undefined = undefined;
    let pageCount = 0;

    do {
        const path: string = `/messages?q=${encodeURIComponent(q)}&maxResults=500${pageToken ? `&pageToken=${pageToken}` : ""
            }`;
        console.log("[gmail] GET", path)
        const page = await apiGet<{ messages?: { id: string }[]; nextPageToken?: string }>(
            token, path
        );
        console.log("[gmail] page", ++pageCount, {
            count: page.messages?.length ?? 0,
            next: !!page.nextPageToken,
        });
        
        if (page.messages?.length) ids.push(...page.messages.map(m => m.id));
        pageToken = page.nextPageToken;
    } while (pageToken);
    console.log("[gmail] total ids:", ids.length);
    return ids;
    
}

// Fetch metadata for a message (for previews)
export type Preview = { id: string; from: string, to: string, subject: string, date: string };

export async function getMetaData(token: string, id: string): Promise<Preview> {
    const msg = await apiGet<any>(
        token,
        `/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`
    );
    const headers: Array<{ name: string; value: string }> = msg.payload?.headers ?? [];
    const pick = (name: string) =>
        headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
    return {
        id, 
        from: pick("From") || "(no sender)",
        to: pick("To") || "(no recipient)",
        subject: pick("Subject") || "(no subject)",
        date: pick("Date") || ""
    }
}

// Trash in batches with progress callback

/**
 * Trash in batches with throttling + retry/backoff.
 * - Small batch size avoids bursts that trigger 429s
 * - Low concurrency keeps steady pressure without spikes
 * - Backoff retries on 429 / rateLimitExceeded
 */
export async function trashIds(
    token: string,
    ids: string[],
    onProgress?: (done: number, total: number) => void,
    batchSize = 8,      // keep small
    concurrency = 2,    // keep low
    interBatchDelayMs = 300, // brief pause between batches
    shouldCancel?: () => boolean
) {
    let done = 0;
    const total = ids.length;
    onProgress?.(done, total);

    for (let i = 0; i < ids.length; i += batchSize) {
        if (shouldCancel?.()) break;
        const slice = ids.slice(i, i + batchSize);
        
        //Concurrency control: process 'slice' in groups of concurrency
        for (let j = 0; j < slice.length; j += concurrency) {
            if (shouldCancel?.()) break;
            const group = slice.slice(j, j + concurrency);
            await Promise.all(
                group.map(async (id) => {
                    if (shouldCancel?.()) return;

                    const res = await fetchWithBackoff(
                        `${GMAIL}/messages/${id}/trash`,
                        {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                        },
                        {
                            retries: 6,
                            baseDelaysMs: 500,
                            onRetry: (attempt, info) => {
                                console.log("[trash] retry", attempt, "id", id, info);
                            },
                        }
                    );

                    if (!res.ok) {
                        //If it's still not ok after retries, surface the error text (but don't halt whole run)
                        const txt = await res.text().catch(() => "");
                        // Optional: aggregate errors to show at the end
                        console.warn("Failed to trash", id, res.status, txt);
                        return;
                    }

                    done++;
                    onProgress?.(done, total);

                })
            );
                
        }

        if (shouldCancel?.()) break;
        // Spread out bursts a bit
        if (i + batchSize < ids.length) await sleep(interBatchDelayMs);
        
               
    }
    
}