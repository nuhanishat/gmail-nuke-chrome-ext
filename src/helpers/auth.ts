const OAUTH_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID ?? "";
if (!OAUTH_CLIENT_ID) throw new Error("Missing VITE_GMAIL_CLIENT_ID in /env");
// const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/`;
const OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify"
].join(" ");

function getRedirectUri(): string {
    if (typeof chrome === "undefined" || !chrome.identity) {
        throw new Error("Chrome identity API unavailable. Open via the extension popup")
    }
    return chrome.identity.getRedirectURL();
}

// choose the best available storage area
function getStorageArea(): chrome.storage.StorageArea {
    // session when available, else local
    return (chrome.storage as any)?.session ?? chrome.storage.local;
}

type TokenInfo = { access_token: string; expires_at: number };

async function saveToken(t: TokenInfo) {
    const area = getStorageArea();
    await area.set({ gmail_token: t });
    
}


async function loadToken(): Promise<TokenInfo | null> {
    const area = getStorageArea();
    const result = await area.get("gmail_token");
    return (result as any)?.gmail_token ?? null;
}

// Building the OAuth URL
function buildAuthUrl() {
    const u = new URL(OAUTH_AUTH_URL);
    u.searchParams.set("client_id", OAUTH_CLIENT_ID);
    u.searchParams.set("redirect_uri", getRedirectUri());
    u.searchParams.set("response_type", "token"); // Implicit flow return #access_token
    u.searchParams.set("scope", SCOPES);
    u.searchParams.set("include_granted_scopes", "true"); //Incremental auth
    u.searchParams.set("prompt", "select_account consent"); //Show consent (first run/new scopes)
    return u.toString();
}

//This helper pulls out keys like access_token, expires_in, token_type
function parseHashFragment(url: string): Record<string, string> {
    const hash = url.split("#")[1] || "";
    const params = new URLSearchParams(hash);
    const out: Record<string, string> = {};
    params.forEach((v, k) => (out[k] = v));
    return out;
}

export async function getAccessToken(): Promise<string> {
    //Try a cached token first
    console.log("[auth] loading cached token…");
    const now = Date.now();
    const cached = await loadToken();
    if (cached && cached.expires_at > now + 30_000) {
        console.log("[auth] using cached token");
        return cached.access_token
    }
    
    // Launch OAuth
    console.log("[auth] launching web auth flow");
    const authUrl = buildAuthUrl();
    const redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
    });

    console.log("[auth] redirectUrl:", redirectUrl);
    if (!redirectUrl) throw new Error("Auth flow did not return a redirect URL");

    const data = parseHashFragment(redirectUrl!);
    console.log("[auth] hash data:", data);

    const access_token = data["access_token"];
    const expires_in = Number(data["expires_in"] || "3600"); //second
    
    if (!access_token) throw new Error("No access token returned");

    const token: TokenInfo = {
        access_token,
        expires_at: Date.now() + (expires_in - 30) * 1000 //safety margin
    };
    await saveToken(token);
    console.log("[auth] token saved, expires_at:", token.expires_at);
    return access_token;
}