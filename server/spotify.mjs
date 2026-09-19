/**
 * server/spotify.mjs
 *
 * Additive Spotify OAuth + personalization surface for the Vibe cloud API.
 *
 * This file is loaded INSIDE the server bundle, after `server/cloud.mjs` and
 * before `server/worker.mjs`, so the following bindings already exist and are
 * usable here:
 *
 *   - cloudRoute    : the existing cloud API router / dispatcher
 *   - cloudIdentity : resolves the authenticated Vibe session for a Request
 *   - cloudCookies  : cookie helpers (parse / serialize) when available
 *   - cloudResponse : JSON response helper used by the rest of the bundle
 *   - common        : shared header/utility helpers
 *
 * Strategy: save the existing `cloudRoute` binding, then reassign `cloudRoute`
 * to a thin wrapper that only intercepts `/api/cloud/spotify/*` and delegates
 * every other request to the original router completely unchanged.
 *
 * Security notes:
 *   - SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET are read from the runtime env
 *     and are NEVER returned to clients, never embedded in cookies and never
 *     written to logs.
 *   - The refresh token is encrypted at rest (cookie) with AES-GCM, using a
 *     256-bit key derived by SHA-256 hashing SPOTIFY_CLIENT_SECRET.
 *   - Access/refresh tokens are never included in any JSON response body.
 *   - Remote Spotify image URLs are intentionally omitted from responses,
 *     because the current CSP does not allow Spotify image hosts.
 */

const __vibeSpotifyBaseCloudRoute = cloudRoute;

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const VIBE_SPOTIFY_PREFIX = '/api/cloud/spotify';

const SPOTIFY_AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_TOP_ARTISTS_ENDPOINT =
  'https://api.spotify.com/v1/me/top/artists?limit=6&time_range=medium_term';
const SPOTIFY_SCOPE = 'user-top-read';

const SPOTIFY_STATE_COOKIE = '__Host-vibe-spotify-state';
const SPOTIFY_REFRESH_COOKIE = '__Host-vibe-spotify-refresh';

const SPOTIFY_STATE_MAX_AGE = 600; // 10 minutes
const SPOTIFY_REFRESH_MAX_AGE = 2592000; // 30 days

const SPOTIFY_REQUEST_TIMEOUT_MS = 12000; // 12s (within the 10-15s band)
const SPOTIFY_STATE_BYTES = 32;
const SPOTIFY_AES_IV_BYTES = 12; // AES-GCM 96-bit nonce

const SPOTIFY_MAX_ARTISTS = 6;
const SPOTIFY_MAX_GENRES = 5;
const SPOTIFY_MAX_GENRE_LENGTH = 40;
const SPOTIFY_MAX_NAME_LENGTH = 120;
const SPOTIFY_MAX_ID_LENGTH = 64;

/* -------------------------------------------------------------------------- */
/* Env access                                                                 */
/* -------------------------------------------------------------------------- */

function readEnvValue(source, name) {
  if (!source) return '';
  try {
    const direct = source[name];
    if (typeof direct === 'string' && direct) return direct;
  } catch (_) {
    /* ignore */
  }
  try {
    if (typeof source.get === 'function') {
      const viaGet = source.get(name);
      if (typeof viaGet === 'string' && viaGet) return viaGet;
    }
  } catch (_) {
    /* ignore */
  }
  return '';
}

function envSources(req) {
  const sources = [];
  try {
    if (req && typeof req === 'object' && req.env) sources.push(req.env);
  } catch (_) {
    /* ignore */
  }
  try {
    if (req && typeof req === 'object' && req.runtime && req.runtime.env) {
      sources.push(req.runtime.env);
    }
  } catch (_) {
    /* ignore */
  }
  try {
    if (typeof globalThis !== 'undefined' && globalThis.env) sources.push(globalThis.env);
  } catch (_) {
    /* ignore */
  }
  try {
    if (typeof globalThis !== 'undefined' && globalThis.__env) sources.push(globalThis.__env);
  } catch (_) {
    /* ignore */
  }
  try {
    if (typeof process !== 'undefined' && process && process.env) sources.push(process.env);
  } catch (_) {
    /* ignore */
  }
  try {
    if (common && typeof common === 'object') {
      if (typeof common.env === 'function') {
        const resolved = common.env();
        if (resolved) sources.push(resolved);
      } else if (common.env) {
        sources.push(common.env);
      }
    }
  } catch (_) {
    /* ignore */
  }
  return sources.filter(Boolean);
}

function getEnv(req, name) {
  const sources = envSources(req);
  for (let i = 0; i < sources.length; i += 1) {
    const value = readEnvValue(sources[i], name);
    if (value) return value;
  }
  return '';
}

function spotifyConfig(req) {
  const clientId = getEnv(req, 'SPOTIFY_CLIENT_ID');
  const clientSecret = getEnv(req, 'SPOTIFY_CLIENT_SECRET');
  return {
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret),
  };
}

/* -------------------------------------------------------------------------- */
/* Headers, JSON + redirect plumbing                                          */
/* -------------------------------------------------------------------------- */

function headerObjectFrom(value) {
  const out = {};
  if (!value) return out;
  try {
    if (typeof value.forEach === 'function' && typeof value.get === 'function') {
      value.forEach((val, key) => {
        out[String(key).toLowerCase()] = String(val);
      });
      return out;
    }
  } catch (_) {
    /* ignore */
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const entry = value[i];
      if (entry && entry.length >= 2) out[String(entry[0]).toLowerCase()] = String(entry[1]);
    }
    return out;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i += 1) {
      const raw = value[keys[i]];
      if (raw !== undefined && raw !== null) out[String(keys[i]).toLowerCase()] = String(raw);
    }
  }
  return out;
}

function baseHeaders(extra) {
  let out = {};
  try {
    const candidate = common && typeof common === 'object' ? common.headers : undefined;
    if (typeof candidate === 'function') out = headerObjectFrom(candidate());
    else if (candidate) out = headerObjectFrom(candidate);
  } catch (_) {
    /* ignore */
  }
  if (!Object.keys(out).length) {
    try {
      if (typeof common === 'function') out = headerObjectFrom(common());
    } catch (_) {
      /* ignore */
    }
  }
  return Object.assign(out, headerObjectFrom(extra));
}

function headersFrom(obj) {
  const headers = new Headers();
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const value = obj[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (let j = 0; j < value.length; j += 1) {
        if (value[j] !== undefined && value[j] !== null) headers.append(key, String(value[j]));
      }
    } else {
      headers.set(key, String(value));
    }
  }
  return headers;
}

function acceptableProvidedResponse(provided, headersObject) {
  if (!(provided instanceof Response)) return false;
  try {
    const contentType = (provided.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('json')) return false;
    const wanted = headersObject['set-cookie'];
    if (wanted) {
      let got = [];
      try {
        got = typeof provided.headers.getSetCookie === 'function'
          ? provided.headers.getSetCookie()
          : [provided.headers.get('set-cookie') || ''];
      } catch (_) {
        got = [provided.headers.get('set-cookie') || ''];
      }
      const list = Array.isArray(wanted) ? wanted : [wanted];
      for (let i = 0; i < list.length; i += 1) {
        const cookieName = String(list[i]).split('=')[0];
        let found = false;
        for (let j = 0; j < got.length; j += 1) {
          if (String(got[j]).includes(cookieName)) {
            found = true;
            break;
          }
        }
        if (!found) return false;
      }
    }
    return true;
  } catch (_) {
    return false;
  }
}

function json(data, status, extraHeaders) {
  const statusCode = typeof status === 'number' ? status : 200;
  const headersObject = baseHeaders(
    Object.assign({ 'content-type': 'application/json; charset=utf-8' }, extraHeaders || {}),
  );

  let body;
  try {
    body = JSON.stringify(data === undefined ? null : data);
  } catch (_) {
    body = '{"error":"serialization_failed"}';
  }

  try {
    if (typeof cloudResponse === 'function') {
      const provided = cloudResponse(data, statusCode, headersObject);
      if (acceptableProvidedResponse(provided, headersObject)) return provided;
    }
  } catch (_) {
    /* fall through to a locally built response */
  }

  return new Response(body, { status: statusCode, headers: headersFrom(headersObject) });
}

function redirectResponse(location, setCookies) {
  const headersObject = baseHeaders({ location });
  if (Array.isArray(setCookies) && setCookies.length) {
    headersObject['set-cookie'] = setCookies.filter(Boolean);
  }
  return new Response(null, { status: 302, headers: headersFrom(headersObject) });
}

/* -------------------------------------------------------------------------- */
/* Request header helpers                                                     */
/* -------------------------------------------------------------------------- */

function getHeader(req, name) {
  try {
    const headers = req && req.headers;
    if (headers && typeof headers.get === 'function') {
      const value = headers.get(name);
      return value == null ? '' : String(value);
    }
    if (headers && typeof headers === 'object') {
      const keys = Object.keys(headers);
      for (let i = 0; i < keys.length; i += 1) {
        if (keys[i].toLowerCase() === String(name).toLowerCase()) {
          return headers[keys[i]] == null ? '' : String(headers[keys[i]]);
        }
      }
    }
  } catch (_) {
    /* ignore */
  }
  return '';
}

function requestUrl(req) {
  if (!req || typeof req !== 'object') return null;
  const raw = typeof req.url === 'string' ? req.url : '';
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch (_) {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Cookies                                                                    */
/* -------------------------------------------------------------------------- */

function readAllCookies(req) {
  const out = {};
  try {
    if (cloudCookies && typeof cloudCookies.parse === 'function') {
      const parsed = cloudCookies.parse(req);
      if (parsed) {
        if (Array.isArray(parsed)) {
          for (let i = 0; i < parsed.length; i += 1) {
            const entry = parsed[i];
            if (entry && entry.name) {
              out[String(entry.name)] = entry.value == null ? '' : String(entry.value);
            }
          }
        } else if (typeof parsed.forEach === 'function' && typeof parsed.get === 'function') {
          parsed.forEach((value, key) => {
            out[String(key)] = value == null ? '' : String(value);
          });
        } else if (typeof parsed === 'object') {
          const keys = Object.keys(parsed);
          for (let i = 0; i < keys.length; i += 1) {
            const value = parsed[keys[i]];
            out[keys[i]] = value == null ? '' : String(value);
          }
        }
        if (Object.keys(out).length) return out;
      }
    }
  } catch (_) {
    /* fall back to manual parsing */
  }

  const header = getHeader(req, 'cookie');
  if (header) {
    const parts = String(header).split(';');
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      const idx = part.indexOf('=');
      if (idx <= 0) continue;
      const name = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (name) out[name] = value;
    }
  }
  return out;
}

function readCookie(req, name) {
  const all = readAllCookies(req);
  return Object.prototype.hasOwnProperty.call(all, name) ? all[name] : '';
}

function buildCookie(name, value, options) {
  const opts = options || {};
  const path = opts.path || '/';
  const hasMaxAge = typeof opts.maxAge === 'number';

  try {
    if (cloudCookies && typeof cloudCookies.serialize === 'function') {
      const serialized = cloudCookies.serialize(name, value, {
        path,
        maxAge: hasMaxAge ? Math.max(0, Math.floor(opts.maxAge)) : undefined,
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      });
      if (
        typeof serialized === 'string' &&
        serialized &&
        /httponly/i.test(serialized) &&
        /secure/i.test(serialized) &&
        /samesite=lax/i.test(serialized) &&
        /path=\//i.test(serialized) &&
        (!hasMaxAge || /max-age=/i.test(serialized))
      ) {
        return serialized;
      }
    }
  } catch (_) {
    /* fall back to a locally built cookie string */
  }

  const parts = [`${name}=${value}`, `Path=${path}`, 'HttpOnly', 'Secure', 'SameSite=Lax'];
  if (hasMaxAge) parts.push(`Max-Age=${Math.max(0, Math.floor(opts.maxAge))}`);
  return parts.join('; ');
}

function clearedRefreshCookie() {
  return buildCookie(SPOTIFY_REFRESH_COOKIE, '', { maxAge: 0 });
}

function clearedStateCookie() {
  return buildCookie(SPOTIFY_STATE_COOKIE, '', { maxAge: 0 });
}

/* -------------------------------------------------------------------------- */
/* Crypto helpers                                                             */
/* -------------------------------------------------------------------------- */

function getCrypto() {
  try {
    if (typeof crypto !== 'undefined' && crypto && crypto.subtle) return crypto;
  } catch (_) {
    /* ignore */
  }
  try {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
      return globalThis.crypto;
    }
  } catch (_) {
    /* ignore */
  }
  return null;
}

function toBase64(value) {
  try {
    if (typeof btoa === 'function') return btoa(value);
  } catch (_) {
    /* fall back below */
  }
  try {
    if (typeof Buffer !== 'undefined') return Buffer.from(value, 'utf8').toString('base64');
  } catch (_) {
    /* ignore */
  }
  return '';
}

function bytesToBase64Url(bytes) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  let base64 = '';
  try {
    base64 = typeof btoa === 'function' ? btoa(binary) : '';
  } catch (_) {
    base64 = '';
  }
  if (!base64) {
    try {
      if (typeof Buffer !== 'undefined') base64 = Buffer.from(bytes).toString('base64');
    } catch (_) {
      base64 = '';
    }
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  try {
    if (typeof atob === 'function') {
      const binary = atob(padded);
      const out = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
      return out;
    }
  } catch (_) {
    /* fall back to Buffer */
  }
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(padded, 'base64'));
  throw new Error('base64_unavailable');
}

function randomToken(bytes) {
  const size = typeof bytes === 'number' && bytes > 0 ? bytes : SPOTIFY_STATE_BYTES;
  const cryptoImpl = getCrypto();
  if (!cryptoImpl || typeof cryptoImpl.getRandomValues !== 'function') {
    throw new Error('crypto_unavailable');
  }
  const buffer = new Uint8Array(size);
  cryptoImpl.getRandomValues(buffer);
  return bytesToBase64Url(buffer);
}

async function deriveAesKey(clientSecret) {
  const cryptoImpl = getCrypto();
  if (!cryptoImpl || !cryptoImpl.subtle) throw new Error('crypto_unavailable');
  const secretBytes = new TextEncoder().encode(String(clientSecret));
  const digest = await cryptoImpl.subtle.digest('SHA-256', secretBytes);
  return cryptoImpl.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/** Encrypts a secret and returns base64url(IV || ciphertext). */
async function encryptSecret(clientSecret, plaintext) {
  const cryptoImpl = getCrypto();
  if (!cryptoImpl || !cryptoImpl.subtle || typeof cryptoImpl.getRandomValues !== 'function') {
    throw new Error('crypto_unavailable');
  }
  const key = await deriveAesKey(clientSecret);
  const iv = new Uint8Array(SPOTIFY_AES_IV_BYTES);
  cryptoImpl.getRandomValues(iv);
  const ciphertext = new Uint8Array(
    await cryptoImpl.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(String(plaintext)),
    ),
  );
  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv, 0);
  combined.set(ciphertext, iv.length);
  return bytesToBase64Url(combined);
}

/** Decrypts a base64url(IV || ciphertext) payload produced by encryptSecret. */
async function decryptSecret(clientSecret, encoded) {
  const cryptoImpl = getCrypto();
  if (!cryptoImpl || !cryptoImpl.subtle) throw new Error('crypto_unavailable');
  const key = await deriveAesKey(clientSecret);
  const combined = base64UrlToBytes(encoded);
  if (combined.length <= SPOTIFY_AES_IV_BYTES) throw new Error('ciphertext_too_short');
  const iv = combined.slice(0, SPOTIFY_AES_IV_BYTES);
  const ciphertext = combined.slice(SPOTIFY_AES_IV_BYTES);
  const plaintext = await cryptoImpl.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

function safeEqualStrings(left, right) {
  const a = new TextEncoder().encode(String(left));
  const b = new TextEncoder().encode(String(right));
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    diff |= (a[i] || 0) ^ (b[i] || 0);
  }
  return diff === 0;
}

/* -------------------------------------------------------------------------- */
/* Fetch helpers                                                              */
/* -------------------------------------------------------------------------- */

function timeoutSignal(ms) {
  try {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      return AbortSignal.timeout(ms);
    }
  } catch (_) {
    /* fall back to a controller based timeout */
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      try {
        controller.abort();
      } catch (_) {
        /* ignore */
      }
    }, ms);
    if (timer && typeof timer.unref === 'function') timer.unref();
    return controller.signal;
  } catch (_) {
    return undefined;
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}

function basicAuthHeader(config) {
  const raw = `${config.clientId}:${config.clientSecret}`;
  const encoded = toBase64(raw);
  return encoded ? `Basic ${encoded}` : '';
}

async function spotifyTokenRequest(config, params) {
  const headers = { 'content-type': 'application/x-www-form-urlencoded' };
  const basic = basicAuthHeader(config);
  if (basic) headers.authorization = basic;
  try {
    return await fetch(SPOTIFY_TOKEN_ENDPOINT, {
      method: 'POST',
      headers,
      body: params.toString(),
      signal: timeoutSignal(SPOTIFY_REQUEST_TIMEOUT_MS),
    });
  } catch (_) {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Response sanitization                                                      */
/* -------------------------------------------------------------------------- */

function boundString(value, max) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const chars = Array.from(trimmed);
  return chars.length > max ? chars.slice(0, max).join('') : trimmed;
}

function canonicalArtistUrl(id) {
  return `https://open.spotify.com/artist/${encodeURIComponent(id)}`;
}

/**
 * Returns only the fields we are willing to expose.
 * No image URLs (CSP does not allow Spotify image hosts), no tokens.
 */
function sanitizeArtists(payload) {
  const items = payload && Array.isArray(payload.items) ? payload.items : [];
  const artists = [];
  for (let i = 0; i < items.length; i += 1) {
    const raw = items[i];
    if (!raw || typeof raw !== 'object') continue;
    const id = boundString(raw.id, SPOTIFY_MAX_ID_LENGTH);
    if (!id) continue;

    const genres = [];
    if (Array.isArray(raw.genres)) {
      for (let g = 0; g < raw.genres.length; g += 1) {
        const genre = boundString(raw.genres[g], SPOTIFY_MAX_GENRE_LENGTH);
        if (genre && genres.indexOf(genre) === -1) genres.push(genre);
        if (genres.length >= SPOTIFY_MAX_GENRES) break;
      }
    }

    artists.push({
      id,
      name: boundString(raw.name, SPOTIFY_MAX_NAME_LENGTH),
      genres,
      url: canonicalArtistUrl(id),
    });

    if (artists.length >= SPOTIFY_MAX_ARTISTS) break;
  }
  return artists;
}

/* -------------------------------------------------------------------------- */
/* Route handlers                                                             */
/* -------------------------------------------------------------------------- */

function methodNotAllowed(allow) {
  return json({ error: 'method_not_allowed' }, 405, { allow });
}

async function hasDecryptableRefreshCookie(req, config) {
  const encrypted = readCookie(req, SPOTIFY_REFRESH_COOKIE);
  if (!encrypted) return false;
  try {
    const token = await decryptSecret(config.clientSecret, encrypted);
    return Boolean(token);
  } catch (_) {
    return false;
  }
}

async function spotifyStatus(req) {
  const config = spotifyConfig(req);
  if (!config.configured) return json({ configured: false, connected: false });
  const connected = await hasDecryptableRefreshCookie(req, config);
  return json({ configured: true, connected });
}

async function spotifyConnect(req, url) {
  const config = spotifyConfig(req);
  if (!config.configured) return json({ error: 'spotify_not_configured' }, 503);

  let state;
  try {
    state = randomToken(SPOTIFY_STATE_BYTES);
  } catch (_) {
    return json({ error: 'spotify_state_unavailable' }, 500);
  }

  const redirectUri = `${url.origin}${VIBE_SPOTIFY_PREFIX}/callback`;
  let authorize;
  try {
    authorize = new URL(SPOTIFY_AUTHORIZE_ENDPOINT);
  } catch (_) {
    return json({ error: 'spotify_internal_error' }, 500);
  }
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('client_id', config.clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', SPOTIFY_SCOPE);
  authorize.searchParams.set('state', state);

  const stateCookie = buildCookie(SPOTIFY_STATE_COOKIE, state, {
    maxAge: SPOTIFY_STATE_MAX_AGE,
  });

  return redirectResponse(authorize.toString(), [stateCookie]);
}

async function spotifyCallback(req, url) {
  const config = spotifyConfig(req);
  if (!config.configured) return json({ error: 'spotify_not_configured' }, 503);

  const clearState = clearedStateCookie();

  if (url.searchParams.get('error')) {
    return redirectResponse('/?spotify=error', [clearState]);
  }

  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const cookieState = readCookie(req, SPOTIFY_STATE_COOKIE) || '';

  if (!code || !state || !cookieState || !safeEqualStrings(state, cookieState)) {
    return json({ error: 'invalid_state' }, 400, { 'set-cookie': [clearState] });
  }

  const redirectUri = `${url.origin}${VIBE_SPOTIFY_PREFIX}/callback`;
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const tokenResponse = await spotifyTokenRequest(config, params);
  if (!tokenResponse) {
    return json({ error: 'spotify_upstream_error' }, 502, { 'set-cookie': [clearState] });
  }

  const payload = await readJson(tokenResponse);
  const refreshToken = payload && typeof payload.refresh_token === 'string' ? payload.refresh_token : '';

  if (!tokenResponse.ok || !refreshToken) {
    return json({ error: 'spotify_token_exchange_failed' }, 400, {
      'set-cookie': [clearState],
    });
  }

  let encrypted;
  try {
    encrypted = await encryptSecret(config.clientSecret, refreshToken);
  } catch (_) {
    return json({ error: 'spotify_encryption_failed' }, 500, { 'set-cookie': [clearState] });
  }

  const refreshCookie = buildCookie(SPOTIFY_REFRESH_COOKIE, encrypted, {
    maxAge: SPOTIFY_REFRESH_MAX_AGE,
  });

  return redirectResponse('/?spotify=connected', [refreshCookie, clearState]);
}

async function spotifyTop(req) {
  const config = spotifyConfig(req);
  if (!config.configured) return json({ error: 'spotify_not_configured' }, 503);

  const encrypted = readCookie(req, SPOTIFY_REFRESH_COOKIE);
  if (!encrypted) return json({ error: 'spotify_not_connected' }, 401);

  let refreshToken;
  try {
    refreshToken = await decryptSecret(config.clientSecret, encrypted);
  } catch (_) {
    return json({ error: 'spotify_not_connected' }, 401, {
      'set-cookie': [clearedRefreshCookie()],
    });
  }
  if (!refreshToken) {
    return json({ error: 'spotify_not_connected' }, 401, {
      'set-cookie': [clearedRefreshCookie()],
    });
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const tokenResponse = await spotifyTokenRequest(config, params);
  if (!tokenResponse) return json({ error: 'spotify_upstream_error' }, 502);

  const tokenPayload = await readJson(tokenResponse);
  const accessToken =
    tokenPayload && typeof tokenPayload.access_token === 'string' ? tokenPayload.access_token : '';

  if (!tokenResponse.ok || !accessToken) {
    return json({ error: 'spotify_token_refresh_failed' }, 401, {
      'set-cookie': [clearedRefreshCookie()],
    });
  }

  const extraHeaders = {};
  const replacement =
    tokenPayload && typeof tokenPayload.refresh_token === 'string' ? tokenPayload.refresh_token : '';
  if (replacement && replacement !== refreshToken) {
    try {
      const rotated = await encryptSecret(config.clientSecret, replacement);
      extraHeaders['set-cookie'] = [
        buildCookie(SPOTIFY_REFRESH_COOKIE, rotated, { maxAge: SPOTIFY_REFRESH_MAX_AGE }),
      ];
    } catch (_) {
      /* keep serving with the existing cookie if rotation fails */
    }
  }

  let artistsResponse;
  try {
    artistsResponse = await fetch(SPOTIFY_TOP_ARTISTS_ENDPOINT, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: 'application/json',
      },
      signal: timeoutSignal(SPOTIFY_REQUEST_TIMEOUT_MS),
    });
  } catch (_) {
    return json({ error: 'spotify_upstream_error' }, 502, extraHeaders);
  }

  if (!artistsResponse.ok) {
    return json({ error: 'spotify_top_artists_failed' }, 502, extraHeaders);
  }

  const payload = await readJson(artistsResponse);
  return json({ artists: sanitizeArtists(payload) }, 200, extraHeaders);
}

async function spotifyDisconnect(req, url) {
  const origin = getHeader(req, 'origin');
  if (!origin || origin !== url.origin) {
    return json({ error: 'forbidden_origin' }, 403);
  }
  return json({ ok: true }, 200, {
    'set-cookie': [clearedRefreshCookie(), clearedStateCookie()],
  });
}

/* -------------------------------------------------------------------------- */
/* Router                                                                     */
/* -------------------------------------------------------------------------- */

async function __vibeSpotifyHandle(req, url) {
  const tail = url.pathname
    .slice(VIBE_SPOTIFY_PREFIX.length)
    .replace(/^\/+/, '');
  const action = tail.split('/')[0] || '';
  const method = String((req && req.method) || 'GET').toUpperCase();

  // Every Spotify route requires an authenticated Vibe session.
  let identity = null;
  try {
    identity = await cloudIdentity(req);
  } catch (_) {
    identity = null;
  }
  if (!identity) return json({ error: 'unauthorized' }, 401);

  switch (action) {
    case 'status':
      if (method !== 'GET') return methodNotAllowed('GET');
      return spotifyStatus(req);
    case 'connect':
      if (method !== 'GET') return methodNotAllowed('GET');
      return spotifyConnect(req, url);
    case 'callback':
      if (method !== 'GET') return methodNotAllowed('GET');
      return spotifyCallback(req, url);
    case 'top':
      if (method !== 'GET') return methodNotAllowed('GET');
      return spotifyTop(req);
    case 'disconnect':
      if (method !== 'POST') return methodNotAllowed('POST');
      return spotifyDisconnect(req, url);
    default:
      return json({ error: 'not_found' }, 404);
  }
}

function __vibeSpotifyDelegate(req, ...rest) {
  const original = __vibeSpotifyBaseCloudRoute;
  try {
    if (typeof original === 'function') return original(req, ...rest);
    if (original && typeof original.fetch === 'function') return original.fetch(req, ...rest);
    if (original && typeof original.handle === 'function') return original.handle(req, ...rest);
  } catch (error) {
    throw error;
  }
  return json({ error: 'not_found' }, 404);
}

async function __vibeSpotifyRouter(req, ...rest) {
  let url = null;
  try {
    url = requestUrl(req);
  } catch (_) {
    url = null;
  }

  if (
    url &&
    (url.pathname === VIBE_SPOTIFY_PREFIX || url.pathname.startsWith(`${VIBE_SPOTIFY_PREFIX}/`))
  ) {
    try {
      return await __vibeSpotifyHandle(req, url);
    } catch (_) {
      // Deliberately no logging here: never log tokens or secrets.
      return json({ error: 'spotify_internal_error' }, 500);
    }
  }

  return __vibeSpotifyDelegate(req, ...rest);
}

// Preserve any static helpers/properties that were attached to the original
// router (e.g. registration helpers) so the rest of the bundle keeps working.
try {
  const original = __vibeSpotifyBaseCloudRoute || {};
  const keys = Object.keys(original);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (key in __vibeSpotifyRouter) continue;
    try {
      __vibeSpotifyRouter[key] = original[key];
    } catch (_) {
      /* ignore non-writable properties */
    }
  }
} catch (_) {
  /* ignore */
}

cloudRoute = __vibeSpotifyRouter;
