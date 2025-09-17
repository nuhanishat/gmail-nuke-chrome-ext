export async function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));    
}

export async function fetchWithBackoff(input: RequestInfo, init: RequestInit, { retries = 6, baseDelaysMs = 500, onRetry }: { retries?: number; baseDelaysMs?: number; onRetry?: (attempt: number, err: any) => void } = {}): Promise<Response> {
    let attempt = 0;

    while (true) {
        try { 
            const res = await fetch(input, init);

            if (res.status !== 429 && res.status !== 403) {
                return res;
            }

            //Try to detect explicit rate limit
            let shouldRetry = false;
            try {
                const j = await res.clone().json().catch(() => ({} as any));
                const reason = j?.error?.errors?.[0]?.reason ?? j?.error?.status ?? "";
                if (res.status === 429 || /rateLimit/i.test(reason)) shouldRetry = true;
            } catch { }
            
            if (!shouldRetry || attempt >= retries) return res;
            
            // Honor Retry-After when present
            const retryAfter = res.headers.get("Retry-After");
            if (retryAfter) {
                const delay = (Number(retryAfter) || 1) * 1000;
                onRetry?.(attempt + 1, `Retry-after: ${retryAfter}s`);
                await sleep(delay);
            } else {
                //Exponential backoff with jitter
                const backoff = baseDelaysMs * Math.pow(2, attempt);
                const jitter = backoff * (0.2 * Math.random()); // +/-20%
                const delay = backoff + jitter;
                onRetry?.(attempt + 1, `backoff ~${Math.round(delay)}ms`);
                await sleep(delay);
            }
        }
        catch (err) {
            // Network error: backoff & retry unless out of retries
            if (attempt >= retries) throw err;
            const backoff = baseDelaysMs * Math.pow(2, attempt);
            const jitter = backoff * (0.2 * Math.random()); // +/-20%
            onRetry?.(attempt + 1, err);
            await sleep(backoff + jitter);
        }

        attempt++;
    } 
}