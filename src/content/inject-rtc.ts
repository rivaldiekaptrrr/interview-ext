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
  let activePeerConnection: RTCPeerConnection | null = null;
  let activeCaptionChannel: RTCDataChannel | null = null;
  let mediaSessionChannel: RTCDataChannel | null = null;
  let isSubscribed = false;

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
          dispatchToExtension('interview-ext-collections', bytes.buffer);
        }
      });
    }

    if (label === 'captions' || label === 'captions_v2') {
      document.documentElement.setAttribute('data-interview-rtc-status', 'connected');
      channel.addEventListener('message', (event) => {
        const bytes = toUint8Array(event.data);
        if (bytes && bytes.byteLength > 0) {
          dispatchToExtension('interview-ext-caption', bytes.buffer, {
            channel: label,
            isV2: label === 'captions_v2',
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
    activePeerConnection = pc;

    try {
      pc.addEventListener('datachannel', (event: RTCDataChannelEvent) => {
        try {
          if (event.channel) {
            tapDataChannel(event.channel);

            if (event.channel.label === 'collections') {
              // Google Meet collections connection established; ensure captions are open
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
          ensureCaptionChannel(pc);
          setTimeout(() => trySubscribeCaptions(), 1500);
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

  // ── Hook 3: Hook window.fetch for SyncMeetingSpaceCollections ──
  const origFetch = window.fetch;
  if (typeof origFetch === 'function') {
    window.fetch = function () {
      const result = origFetch.apply(this, arguments as any);
      try {
        const url = typeof arguments[0] === 'string' ? arguments[0] : arguments[0]?.url || '';
        if (url.includes('SyncMeetingSpaceCollections')) {
          result.then((res: Response) => {
            try {
              res
                .clone()
                .arrayBuffer()
                .then((buf) => {
                  dispatchToExtension('interview-ext-collections-fetch', buf);
                })
                .catch(() => {});
            } catch {}
          }).catch(() => {});
        }
      } catch {}
      return result;
    };
  }

  // Ready signal
  try {
    document.documentElement.setAttribute('data-interview-rtc-status', 'ready');
    console.log(`${LOG_PREFIX} WebRTC data channel hooks successfully installed (MAIN world)`);
  } catch {}
})();
