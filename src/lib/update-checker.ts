/* ── Release Update Checker ──
 * Checks for newer extension versions via Cloudflare Worker proxy (100% private repo protection)
 * or falls back to direct GitHub Releases API.
 * ────────────────────────────────────────────────────────────────────────── */

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  downloadUrl: string;
  releaseNotes: string;
}

/**
 * Cloudflare Worker Proxy Endpoint
 * Put your deployed Cloudflare Worker URL here:
 * e.g. 'https://interview-ext-update-proxy.yourname.workers.dev'
 */
export const UPDATE_PROXY_URL = 'https://interview-ext-update-proxy.pbagong75.workers.dev';

const GITHUB_REPO = 'rivaldiekaptrrr/interview-ext';

/** Compare semantic versions (e.g. "1.0.3" vs "1.0.2") */
export function compareSemver(v1: string, v2: string): number {
  const parse = (v: string) =>
    v.replace(/^[^\d]*/, '').split('.').map((x) => parseInt(x, 10) || 0);
  const p1 = parse(v1);
  const p2 = parse(v2);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/** Check for latest release via Cloudflare Worker proxy or direct GitHub API */
export async function checkGitHubUpdate(repo: string = GITHUB_REPO): Promise<UpdateCheckResult | null> {
  try {
    const currentVer = chrome.runtime?.getManifest?.()?.version || '1.0.2';

    // 1. Determine proxy URL (constant or storage override for testing)
    let proxyUrl = UPDATE_PROXY_URL?.trim() || '';
    if (!proxyUrl && typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        const stored = await chrome.storage.local.get('update_proxy_url');
        if (stored?.update_proxy_url) {
          proxyUrl = String(stored.update_proxy_url).trim();
        }
      } catch (_) { }
    }

    // 2. Query Cloudflare Worker if URL is configured
    if (proxyUrl) {
      try {
        const resp = await fetch(proxyUrl, {
          headers: { Accept: 'application/json' },
        });

        if (resp.ok) {
          const data = await resp.json();
          const rawTag: string = data.tag_name || data.version || '';
          const cleanTag = rawTag.replace(/^v/, '');
          const hasUpdate = compareSemver(cleanTag, currentVer) > 0;

          const baseOrigin = proxyUrl.replace(/\/+$/, '');
          const downloadUrl = data.download_url || `${baseOrigin}/download`;

          return {
            hasUpdate,
            currentVersion: currentVer,
            latestVersion: rawTag.startsWith('v') ? rawTag : `v${rawTag}`,
            releaseUrl: downloadUrl,
            downloadUrl,
            releaseNotes: data.release_notes || '',
          };
        }
      } catch (proxyErr) {
        console.debug('[Update Checker] Cloudflare Worker unreachable, trying fallback:', proxyErr);
      }
    }

    // 3. Fallback to direct GitHub API
    const resp = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!resp.ok) {
      return null;
    }

    const data = await resp.json();
    const rawTag: string = data.tag_name || '';
    const cleanTag = rawTag.replace(/^v/, '');

    let zipUrl = data.zipball_url || data.html_url;
    if (Array.isArray(data.assets) && data.assets.length > 0) {
      const zipAsset = data.assets.find((a: any) =>
        typeof a.name === 'string' && a.name.endsWith('.zip')
      );
      if (zipAsset?.browser_download_url) {
        zipUrl = zipAsset.browser_download_url;
      }
    }

    const hasUpdate = compareSemver(cleanTag, currentVer) > 0;

    return {
      hasUpdate,
      currentVersion: currentVer,
      latestVersion: rawTag.startsWith('v') ? rawTag : `v${rawTag}`,
      releaseUrl: data.html_url || `https://github.com/${repo}/releases`,
      downloadUrl: zipUrl,
      releaseNotes: data.body || '',
    };
  } catch (err) {
    // Fail quietly without interrupting UI
    console.debug('[Update Checker] Could not fetch release:', err);
    return null;
  }
}
