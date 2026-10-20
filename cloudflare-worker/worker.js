/**
 * Cloudflare Worker: Private GitHub Release Proxy for AI Interview Copilot
 * 
 * 1. Checks latest release of your PRIVATE GitHub repo securely.
 * 2. Generates authenticated one-time download redirects for the release .zip.
 * 3. Never leaks your GitHub token or private repo code to the public.
 */

export default {
  async fetch(request, env) {
    // 1. Handle CORS Preflight
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // Configurable via Cloudflare Environment Variables or defaults
    const OWNER = env.GITHUB_OWNER || 'rivaldiekaptrrr';
    const REPO = env.GITHUB_REPO || 'interview-ext';
    const TOKEN = env.GH_TOKEN; // Set as Secret in Cloudflare

    if (!TOKEN) {
      return new Response(
        JSON.stringify({ error: 'GH_TOKEN secret is not configured in Cloudflare Worker environment.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ghHeaders = {
      'User-Agent': 'Cloudflare-Worker-Release-Proxy',
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
    };

    try {
      // ── ROUTE 1: /download -> Securely fetch and redirect to the latest .zip asset ──
      if (pathname === '/download' || pathname === '/download/latest') {
        const releaseRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, {
          headers: ghHeaders,
        });

        if (!releaseRes.ok) {
          return new Response(`GitHub API error: ${releaseRes.statusText}`, { status: releaseRes.status });
        }

        const releaseData = await releaseRes.json();
        const zipAsset = (releaseData.assets || []).find((a) => a.name && a.name.endsWith('.zip'));

        if (!zipAsset) {
          return new Response('No .zip asset found in the latest release.', { status: 404 });
        }

        // Request GitHub asset stream - GitHub will reply with 302 redirect to pre-signed S3 storage
        const assetRes = await fetch(zipAsset.url, {
          method: 'GET',
          headers: {
            ...ghHeaders,
            'Accept': 'application/octet-stream',
          },
          redirect: 'manual',
        });

        const downloadLocation = assetRes.headers.get('location');
        if (downloadLocation) {
          // Redirect user browser to pre-signed download URL
          return Response.redirect(downloadLocation, 302);
        }

        // If GitHub returned the binary directly, stream it
        return new Response(assetRes.body, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${zipAsset.name}"`,
            ...corsHeaders,
          },
        });
      }

      // ── ROUTE 2: / (or /version or /check) -> Return latest version JSON info ──
      const releaseRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, {
        headers: ghHeaders,
      });

      if (!releaseRes.ok) {
        return new Response(
          JSON.stringify({ error: `GitHub API error: ${releaseRes.statusText}`, status: releaseRes.status }),
          { status: releaseRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await releaseRes.json();
      const rawTag = data.tag_name || '';
      const cleanTag = rawTag.replace(/^v/, '');

      const responsePayload = {
        tag_name: rawTag,
        version: cleanTag,
        name: data.name || rawTag,
        published_at: data.published_at,
        release_notes: data.body || '',
        download_url: `${url.origin}/download`,
        has_assets: Array.isArray(data.assets) && data.assets.length > 0,
      };

      return new Response(JSON.stringify(responsePayload, null, 2), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=180', // Cache for 3 minutes
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
