/**
 * ── inject-rtc.ts ──
 * Injected into Google Meet in the MAIN JavaScript execution world (world: "MAIN").
 * Hooks window.RTCPeerConnection to silently intercept Google Meet's WebRTC data channels:
 *  - "captions" & "captions_v2": Real-time binary Protobuf frames of Google's speech-to-text.
 *  - "collections": Participant roster metadata (deviceId -> name, avatar).
 *  - "media-session": Command channel used to silently subscribe to captions.
 *
 * Dispatches captured binary buffers to the extension via window.postMessage.
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if ((window as any)._interviewExtRtcHooked) return;
  (window as any)._interviewExtRtcHooked = true;

  try {
    document.documentElement.setAttribute('data-interview-rtc-status', 'initializing');
  } catch {}

  const LOG_PREFIX = '[AI Interview Assistant RTC]';
  const OrigPeerConnection = window.RTCPeerConnection;
  if (!OrigPeerConnection || !OrigPeerConnection.prototype) {
    console.warn(`${LOG_PREFIX} RTCPeerConnection not supported in this environment`);
    return;
  }

  // Active connections and channels
  const peerConnections = new Set<RTCPeerConnection>();
  let activePeerConnection: RTCPeerConnection | null = null;
  let activeCaptionChannel: RTCDataChannel | null = null;
  let mediaSessionChannel: RTCDataChannel | null = null;
  let isSubscribed = false;

  // Replay cache for roster messages captured before content script window.load
  interface CachedRosterMessage {
    source: string;
    buffer: ArrayBuffer;
  }
  const cachedRosterMessages: CachedRosterMessage[] = [];
  const MAX_CACHED_ROSTER = 25;

  // Rolling audio activity window (last 1.5s) from RTCPeerConnection.getStats() & RTP sources
  interface AudioSample {
    time: number;
    localLevel: number;
    remoteLevel: number;
    hasLocalStats: boolean;
    hasRemoteStats: boolean;
    activeSsrcs: string[];
  }
  const audioSamples: AudioSample[] = [];
  const prevEnergyMap = new Map<string, { energy: number; duration: number }>();
  let audioSamplerId: number | null = null;

  /** Decode standard or URL-safe Base64 text (used by Google Meet $rpc endpoints) into binary ArrayBuffer */
  function decodeBase64ToArrayBuffer(rawText: string): ArrayBuffer | null {
    try {
      const cleaned = rawText.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
      if (!cleaned || cleaned.length < 4 || !/^[A-Za-z0-9+/=_-]+$/.test(cleaned)) {
        return null;
      }
      const b64 = cleaned.replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4;
      const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
      const binary = atob(padded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch {
      return null;
    }
  }

  /** Extract safe self-identity hints from Google Meet WIZ_global_data */
  function readSelfHints(): { email: string; displayName: string } {
    try {
      const wiz = (window as any).WIZ_global_data;
      if (wiz && typeof wiz === 'object') {
        const email = typeof wiz.oPEP7c === 'string' ? wiz.oPEP7c.trim() : '';
        const displayName =
          typeof wiz.S06Grb === 'string' && wiz.S06Grb.includes('@') === false && !/^\d+$/.test(wiz.S06Grb)
            ? wiz.S06Grb.trim()
            : '';
        return { email, displayName };
      }
    } catch {}
    return { email: '', displayName: '' };
  }

  function dispatchSelfHints() {
    const hints = readSelfHints();
    if (hints.email || hints.displayName) {
      try {
        window.postMessage(
          {
            source: 'interview-ext-self-hint',
            email: hints.email,
            displayName: hints.displayName,
            time: Date.now(),
          },
          '*'
        );
      } catch {}
    }
  }

  /** Compute delta RMS audioLevel (0..1) from W3C WebRTC totalAudioEnergy & totalSamplesDuration */
  function computeEnergyRms(id: string, totalAudioEnergy: unknown, totalSamplesDuration: unknown): number | null {
    if (typeof totalAudioEnergy !== 'number' || typeof totalSamplesDuration !== 'number') {
      return null;
    }
    const prev = prevEnergyMap.get(id);
    prevEnergyMap.set(id, { energy: totalAudioEnergy, duration: totalSamplesDuration });
    if (!prev) return null;
    const dEnergy = totalAudioEnergy - prev.energy;
    const dDuration = totalSamplesDuration - prev.duration;
    if (dDuration <= 0.01 || dEnergy < 0) return 0;
    return Math.min(1, Math.sqrt(dEnergy / dDuration));
  }

  /** Sample local vs remote WebRTC audio energy & remote receiver SSRCs across all active PCs */
  function startAudioSampler() {
    if (audioSamplerId !== null) return;
    audioSamplerId = window.setInterval(async () => {
      try {
        const livePcs: RTCPeerConnection[] = [];
        for (const pc of peerConnections) {
          if (pc.connectionState === 'closed') {
            peerConnections.delete(pc);
          } else {
            livePcs.push(pc);
          }
        }
        if (livePcs.length === 0) return;

        let localLevel = 0;
        let remoteLevel = 0;
        let hasLocalStats = false;
        let hasRemoteStats = false;
        const activeSsrcs: string[] = [];

        for (const pc of livePcs) {
          // 1. Check RTCRtpReceivers (strictly REMOTE audio tracks: never local microphone)
          try {
            if (typeof pc.getReceivers === 'function') {
              for (const receiver of pc.getReceivers()) {
                if (receiver.track?.kind !== 'audio') continue;
                const readSources = (sources: Array<{ source?: number; audioLevel?: number }>) => {
                  for (const src of sources) {
                    const lvl = typeof src.audioLevel === 'number' ? src.audioLevel : 0;
                    if (lvl > remoteLevel) remoteLevel = lvl;
                    if (lvl > 0) hasRemoteStats = true;
                    if (lvl >= 0.01 && src.source !== undefined) {
                      activeSsrcs.push(String(src.source));
                    }
                  }
                };
                if (typeof receiver.getContributingSources === 'function') {
                  readSources(receiver.getContributingSources() as any);
                }
                if (typeof receiver.getSynchronizationSources === 'function') {
                  readSources(receiver.getSynchronizationSources() as any);
                }
              }
            }
          } catch {}

          // 2. Collect local mic & inbound remote RTP energy from getStats()
          try {
            if (typeof pc.getStats === 'function') {
              const stats = await pc.getStats();
              stats.forEach((report: any) => {
                if (report.kind !== 'audio') return;
                if (report.type === 'media-source') {
                  hasLocalStats = true;
                  const lvl =
                    typeof report.audioLevel === 'number'
                      ? report.audioLevel
                      : computeEnergyRms(report.id || 'local', report.totalAudioEnergy, report.totalSamplesDuration) || 0;
                  if (lvl > localLevel) localLevel = lvl;
                } else if (report.type === 'inbound-rtp') {
                  hasRemoteStats = true;
                  const rms =
                    typeof report.audioLevel === 'number'
                      ? report.audioLevel
                      : computeEnergyRms(report.id || String(report.ssrc || 'remote'), report.totalAudioEnergy, report.totalSamplesDuration);
                  const lvl = rms ?? 0;
                  if (lvl > remoteLevel) remoteLevel = lvl;
                  if (lvl >= 0.01 && report.ssrc !== undefined) {
                    activeSsrcs.push(String(report.ssrc));
                  }
                }
              });
            }
          } catch {}
        }

        const now = Date.now();
        audioSamples.push({ time: now, localLevel, remoteLevel, hasLocalStats, hasRemoteStats, activeSsrcs });
        while (audioSamples.length > 0 && now - audioSamples[0].time > 1800) {
          audioSamples.shift();
        }
      } catch {}
    }, 250);
  }

  function getRecentAudioHint() {
    const now = Date.now();
    let peakLocal = 0;
    let peakRemote = 0;
    let hasSamples = false;
    let hasLocalStats = false;
    let hasRemoteStats = false;
    const remoteActiveSsrcs = new Set<string>();

    for (let i = audioSamples.length - 1; i >= 0; i--) {
      const s = audioSamples[i];
      if (now - s.time > 1500) break;
      hasSamples = true;
      if (s.hasLocalStats) hasLocalStats = true;
      if (s.hasRemoteStats) hasRemoteStats = true;
      if (s.localLevel > peakLocal) peakLocal = s.localLevel;
      if (s.remoteLevel > peakRemote) peakRemote = s.remoteLevel;
      for (const ssrc of s.activeSsrcs) {
        remoteActiveSsrcs.add(ssrc);
      }
    }

    if (!hasSamples) return undefined;
    return {
      peakLocal,
      peakRemote,
      hasLocalStats,
      hasRemoteStats,
      remoteActiveSsrcs: Array.from(remoteActiveSsrcs),
    };
  }

  /** Cache and dispatch roster buffer to content script */
  function dispatchRoster(source: string, buffer: ArrayBufferLike) {
    try {
      const copyForCache = buffer.slice(0) as ArrayBuffer;
      cachedRosterMessages.push({ source, buffer: copyForCache });
      if (cachedRosterMessages.length > MAX_CACHED_ROSTER) {
        cachedRosterMessages.shift();
      }
    } catch {}
    dispatchToExtension(source, buffer);
  }

  // Listen for replay request once content script's TranscriptListener starts
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.source === 'interview-ext-replay-request') {
      dispatchSelfHints();
      for (const item of cachedRosterMessages) {
        dispatchToExtension(item.source, item.buffer);
      }
    }
  });

  /** Helper to safely slice ArrayBuffer or TypedArray */
  function toUint8Array(data: any): Uint8Array | null {
    try {
      if (data instanceof ArrayBuffer) return new Uint8Array(data);
      if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      }
    } catch {}
    return null;
  }

  /** Post message with binary buffer transferred or copied to content script */
  function dispatchToExtension(source: string, buffer: ArrayBufferLike, extra: Record<string, any> = {}) {
    try {
      const copy = buffer.slice(0) as ArrayBuffer;
      window.postMessage(
        {
          source,
          buffer: copy,
          time: Date.now(),
          ...extra,
        },
        '*',
        [copy]
      );
    } catch {
      try {
        window.postMessage(
          {
            source,
            buffer,
            time: Date.now(),
            ...extra,
          },
          '*'
        );
      } catch {}
    }
  }

  /**
   * Constructs Google Meet's binary protobuf packet for caption subscription.
   * Sending this over the "media-session" channel instructs Google Meet server
   * to start streaming captions silently over the "captions" data channel!
   */
  function buildCaptionSubscribePacket(lang = 'id-ID'): Uint8Array {
    function strToBytes(s: string): number[] {
      const arr: number[] = [];
      for (let i = 0; i < s.length; i++) arr.push(s.charCodeAt(i) & 0xff);
      return arr;
    }
    function wrapTag(tag: number, payload: number[]): number[] {
      return [tag, payload.length, ...payload];
    }

    const langBytes = strToBytes(lang);
    const configKey = strToBytes('client_config.caption_config');
    const langSection = wrapTag(74, [...wrapTag(10, langBytes), ...wrapTag(18, langBytes)]);
    const configSection = [...wrapTag(10, langSection), ...wrapTag(18, wrapTag(10, configKey))];
    const packet = [8, 2, ...wrapTag(26, configSection)];
    return new Uint8Array(wrapTag(10, wrapTag(18, packet)));
  }

  /**
   * Silently arm/subscribe to captions via media-session channel
   */
  function trySubscribeCaptions(lang?: string) {
    if (isSubscribed || !mediaSessionChannel || mediaSessionChannel.readyState !== 'open') return;

    try {
      const detectedLang =
        lang ||
        document.documentElement.getAttribute('data-interview-rtc-lang') ||
        (navigator.language ? navigator.language : 'id-ID');

      const packet = buildCaptionSubscribePacket(detectedLang);
      mediaSessionChannel.send(packet.buffer as ArrayBuffer);
      isSubscribed = true;
      document.documentElement.setAttribute('data-interview-rtc-subscribed', 'true');
      console.log(`${LOG_PREFIX} Sent silent caption subscription for language: ${detectedLang}`);
    } catch (err) {
      console.warn(`${LOG_PREFIX} Failed to send caption subscribe packet:`, err);
    }
  }

  /**
   * Tap an RTCDataChannel (listen for messages and forward to extension)
   */
  function tapDataChannel(channel: RTCDataChannel) {
    if (!channel || (channel as any).__interviewTapped) return;
    (channel as any).__interviewTapped = true;

    const label = channel.label;

    if (label === 'media-session') {
      mediaSessionChannel = channel;
      if (channel.readyState === 'open') {
        setTimeout(() => trySubscribeCaptions(), 500);
      } else {
        channel.addEventListener('open', () => {
          setTimeout(() => trySubscribeCaptions(), 500);
        });
      }
    }

    if (label === 'collections') {
      channel.addEventListener('message', (event) => {
        const bytes = toUint8Array(event.data);
        if (bytes && bytes.byteLength > 0) {
          dispatchRoster('interview-ext-collections', bytes.slice().buffer);
        }
      });
    }

    if (label === 'captions' || label === 'captions_v2') {
      document.documentElement.setAttribute('data-interview-rtc-status', 'connected');
      channel.addEventListener('message', (event) => {
        const bytes = toUint8Array(event.data);
        if (bytes && bytes.byteLength > 0) {
          dispatchToExtension('interview-ext-caption', bytes.slice().buffer, {
            channel: label,
            isV2: label === 'captions_v2',
            audioHint: getRecentAudioHint(),
          });
        }
      });
    }
  }

  /**
   * Open the captions channel on the PeerConnection if not yet open
   */
  function ensureCaptionChannel(pc: RTCPeerConnection) {
    try {
      if (!activeCaptionChannel || activeCaptionChannel.readyState === 'closed') {
        activeCaptionChannel = pc.createDataChannel('captions', {
          ordered: true,
          maxRetransmits: 10,
        });
        tapDataChannel(activeCaptionChannel);
        console.log(`${LOG_PREFIX} Silently created 'captions' data channel`);
      }
    } catch (e) {
      console.warn(`${LOG_PREFIX} Could not create 'captions' data channel:`, e);
    }
  }

  // ── Hook 1: RTCPeerConnection.prototype.createDataChannel ──
  const origCreateDataChannel = OrigPeerConnection.prototype.createDataChannel;
  OrigPeerConnection.prototype.createDataChannel = function (label: string, dataChannelDict?: any) {
    const channel = origCreateDataChannel.apply(this, arguments as any);
    try {
      tapDataChannel(channel);
    } catch (e) {
      console.warn(`${LOG_PREFIX} Error tapping created data channel:`, e);
    }
    return channel;
  };

  // ── Hook 2: RTCPeerConnection constructor ──
  function ProxiedPeerConnection(configuration?: RTCConfiguration) {
    const pc = new (OrigPeerConnection as any)(configuration);
    peerConnections.add(pc);
    activePeerConnection = pc;
    startAudioSampler();

    try {
      pc.addEventListener('datachannel', (event: RTCDataChannelEvent) => {
        try {
          if (event.channel) {
            tapDataChannel(event.channel);

            if (event.channel.label === 'collections') {
              // Pin primary peer connection to the one carrying Meet collections
              activePeerConnection = pc;
              ensureCaptionChannel(pc);
              setTimeout(() => trySubscribeCaptions(), 1000);
            }
          }
        } catch (e) {
          console.warn(`${LOG_PREFIX} Error in datachannel event:`, e);
        }
      });

      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'connected') {
          startAudioSampler();
          ensureCaptionChannel(pc);
          setTimeout(() => trySubscribeCaptions(), 1500);
        } else if (pc.connectionState === 'closed') {
          peerConnections.delete(pc);
        }
      });
    } catch {}

    return pc;
  }

  ProxiedPeerConnection.prototype = OrigPeerConnection.prototype;
  for (const prop in OrigPeerConnection) {
    try {
      (ProxiedPeerConnection as any)[prop] = (OrigPeerConnection as any)[prop];
    } catch {}
  }
  Object.setPrototypeOf(ProxiedPeerConnection, OrigPeerConnection);
  (window as any).RTCPeerConnection = ProxiedPeerConnection;

  // ── Hook 3: Hook window.fetch & XHR for SyncMeetingSpaceCollections (Base64 Protobuf) ──
  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = function () {
      const result = origFetch.apply(this, arguments as any);
      try {
        const url = typeof arguments[0] === 'string' ? arguments[0] : arguments[0]?.url || '';
        if (url.includes('SyncMeetingSpaceCollections')) {
          result.then((res: Response) => {
            try {
              const cloned = res.clone();
              cloned
                .arrayBuffer()
                .then((buf) => {
                  if (!buf || buf.byteLength === 0) return;
                  const asText = new TextDecoder().decode(buf);
                  const decodedBuf = decodeBase64ToArrayBuffer(asText);
                  dispatchRoster('interview-ext-collections-fetch', decodedBuf || buf);
                })
                .catch(() => {});
            } catch {}
          }).catch(() => {});
        }
      } catch {}
      return result;
    };
  }

  // Also hook XMLHttpRequest for SyncMeetingSpaceCollections (Base64 Protobuf or binary)
  try {
    const origXhrOpen = XMLHttpRequest.prototype.open;
    const origXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (_method: string, url: string | URL) {
      try {
        (this as any).__interviewUrl = String(url || '');
      } catch {}
      return origXhrOpen.apply(this, arguments as any);
    };
    XMLHttpRequest.prototype.send = function () {
      try {
        const url: string = (this as any).__interviewUrl || '';
        if (url.includes('SyncMeetingSpaceCollections')) {
          this.addEventListener('load', () => {
            try {
              if (this.response instanceof ArrayBuffer) {
                const asText = new TextDecoder().decode(this.response);
                const decodedBuf = decodeBase64ToArrayBuffer(asText);
                dispatchRoster('interview-ext-collections-fetch', decodedBuf || this.response);
              } else if (typeof this.responseText === 'string' && this.responseText.length > 0) {
                const decodedBuf = decodeBase64ToArrayBuffer(this.responseText);
                if (decodedBuf) {
                  dispatchRoster('interview-ext-collections-fetch', decodedBuf);
                } else {
                  const encoded = new TextEncoder().encode(this.responseText);
                  dispatchRoster('interview-ext-collections-fetch', encoded.buffer);
                }
              }
            } catch {}
          });
        }
      } catch {}
      return origXhrSend.apply(this, arguments as any);
    };
  } catch {}

  // Ready signal
  try {
    dispatchSelfHints();
    document.documentElement.setAttribute('data-interview-rtc-status', 'ready');
    console.log(`${LOG_PREFIX} WebRTC data channel hooks successfully installed (MAIN world)`);
  } catch {}
})();
