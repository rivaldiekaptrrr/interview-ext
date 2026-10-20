/* ── GitHub Release Update Checker ──
 * Checks GitHub Releases API for newer extension versions
 * Minimalist, resilient (silent on offline/rate-limit), and secure
 * ────────────────────────────────────────────────────────────────────────── */

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  downloadUrl: string;
  releaseNotes: string;
}

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

/** Check GitHub for latest release */
export async function checkGitHubUpdate(repo: string = GITHUB_REPO): Promise<UpdateCheckResult | null> {
  try {
    const currentVer = chrome.runtime?.getManifest?.()?.version || '1.0.2';
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

    // Look for zip asset in release
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
    // Fail quietly without interrupting the UI
    console.debug('[Update Checker] Could not fetch GitHub release:', err);
    return null;
  }
}
