/**
 * ── rtc-decoder.ts ──
 * Lightweight Protobuf wire parser & Google Meet caption decoder.
 * Runs completely without heavy external dependencies like protobufjs or pako,
 * leveraging native DecompressionStream('gzip') and binary varint traversal.
 */

export interface ParsedCaption {
  deviceId: string;
  messageId: string;
  messageVersion: number;
  text: string;
  langCode?: string;
  isFinal?: boolean;
}

export interface ParticipantInfo {
  deviceId: string;
  deviceName: string;
  shortName?: string;
  avatarUrl?: string;
  parentDeviceId?: string;
}

export interface MediaStreamInfo {
  deviceId: string;
  ssrc: string;
  streamType: number; // 1 = audio, 2 = video
  muted?: boolean;
}

export interface DecodedCollectionsResult {
  participants: ParticipantInfo[];
  streams: MediaStreamInfo[];
}

/**
 * Checks for gzip magic header (0x1F, 0x8B, 0x08) and decompresses if needed
 */
export async function decompressGzipIfNeeded(data: Uint8Array): Promise<Uint8Array> {
  if (data.length < 3) return data;

  let offset = -1;
  if (data[0] === 0x1f && data[1] === 0x8b && data[2] === 0x08) {
    offset = 0;
  } else if (data.length >= 6 && data[3] === 0x1f && data[4] === 0x8b && data[5] === 0x08) {
    offset = 3;
  }

  if (offset === -1) return data;

  try {
    const slice = offset === 0 ? data : data.subarray(offset);
    if (typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('gzip');
      const writer = ds.writable.getWriter();
      writer.write(slice as unknown as BufferSource);
      writer.close();
      const res = new Response(ds.readable);
      const decompressed = await res.arrayBuffer();
      return new Uint8Array(decompressed);
    }
  } catch (err) {
    console.warn('[RTC Decoder] Gzip decompression failed, using raw buffer:', err);
  }

  return data;
}

/**
 * Reads a single Varint from a Uint8Array at the given byte offset.
 * Returns [value, nextOffset].
 */
export function readVarint(buf: Uint8Array, offset: number): [number, number] {
  let val = 0;
  let shift = 0;
  let i = offset;

  while (i < buf.length) {
    const byte = buf[i++];
    val += (byte & 0x7f) * Math.pow(2, shift);
    if (!(byte & 0x80)) break;
    shift += 7;
    if (shift > 63) break;
  }

  return [val, i];
}

/**
 * Traverses raw Protobuf wire fields in a buffer.
 * Calls `callback(fieldNumber, wireType, valueOrBytes)` for each field.
 */
export function parseProtoFields(
  buf: Uint8Array,
  callback: (fieldNum: number, wireType: number, value: number | Uint8Array) => void
): boolean {
  let offset = 0;

  while (offset < buf.length) {
    const [tag, nextOffset] = readVarint(buf, offset);
    offset = nextOffset;

    const fieldNum = tag >> 3;
    const wireType = tag & 0x07;

    if (fieldNum === 0) return false;

    if (wireType === 0) {
      // Varint
      const [val, afterVal] = readVarint(buf, offset);
      offset = afterVal;
      callback(fieldNum, wireType, val);
    } else if (wireType === 2) {
      // Length-delimited (string / bytes / submessage)
      const [len, afterLen] = readVarint(buf, offset);
      offset = afterLen;
      if (len < 0 || offset + len > buf.length) return false;
      const slice = buf.subarray(offset, offset + len);
      callback(fieldNum, wireType, slice);
      offset += len;
    } else if (wireType === 5) {
      // 32-bit fixed
      offset += 4;
    } else if (wireType === 1) {
      // 64-bit fixed
      offset += 8;
    } else {
      // Unknown or unsupported wire type (3 or 4 are deprecated groups)
      return false;
    }
  }

  return true;
}

const textDecoder = new TextDecoder('utf-8');

/**
 * Decodes a caption buffer (from "captions" or "captions_v2" channel)
 */
export async function decodeCaptionBuffer(
  buffer: ArrayBuffer,
  isV2 = false
): Promise<ParsedCaption[] | null> {
  const bytes = await decompressGzipIfNeeded(new Uint8Array(buffer));
  if (!bytes || bytes.length === 0) return null;

  const results: ParsedCaption[] = [];

  if (isV2) {
    // ── captions_v2 decoder ──
    parseProtoFields(bytes, (field1, wire1, sub1) => {
      if (field1 === 1 && wire1 === 2 && sub1 instanceof Uint8Array) {
        parseProtoFields(sub1, (field2, wire2, sub2) => {
          if (field2 === 1 && wire2 === 2 && sub2 instanceof Uint8Array) {
            const parsed = decodeCaptionV2Record(sub2);
            if (parsed) results.push(parsed);
          }
        });
      }
    });
  } else {
    // ── captions (v1) decoder ──
    const parsed = decodeCaptionV1Record(bytes);
    if (parsed) {
      results.push(parsed);
    } else {
      // Fallback: look for embedded submessages
      let offset = 0;
      while (offset < bytes.length) {
        const [tag, nextOffset] = readVarint(bytes, offset);
        offset = nextOffset;
        const wire = tag & 0x07;
        if (wire === 2) {
          const [len, afterLen] = readVarint(bytes, offset);
          offset = afterLen;
          if (len > 0 && offset + len <= bytes.length) {
            const sub = bytes.subarray(offset, offset + len);
            const found = decodeCaptionV1Record(sub);
            if (found) {
              results.push(found);
              break;
            }
          }
          offset += len;
        } else if (wire === 0) {
          offset = readVarint(bytes, offset)[1];
        } else if (wire === 5) {
          offset += 4;
        } else if (wire === 1) {
          offset += 8;
        } else {
          break;
        }
      }
    }
  }

  return results.length > 0 ? results : null;
}

/** Decode an individual captions_v2 leaf record */
function decodeCaptionV2Record(recordBytes: Uint8Array): ParsedCaption | null {
  const res: ParsedCaption = {
    deviceId: '',
    messageId: '',
    messageVersion: 0,
    text: '',
  };

  let innerPayload: Uint8Array | null = null;

  parseProtoFields(recordBytes, (field, wire, val) => {
    if (wire === 0) {
      if (field === 1) res.messageId = String(val);
      if (field === 2) res.messageVersion = typeof val === 'number' ? val : 0;
    } else if (wire === 2 && field === 3 && val instanceof Uint8Array) {
      innerPayload = val;
    }
  });

  if (!innerPayload) return null;

  let lang = '';
  parseProtoFields(innerPayload, (field, wire, val) => {
    if (wire === 0 && field === 2 && typeof val === 'number') {
      res.isFinal = val === 1;
    } else if (wire === 2 && val instanceof Uint8Array) {
      if (field === 3) res.text = textDecoder.decode(val);
      if (field === 4 || field === 5) lang = textDecoder.decode(val);
      if (field === 6) res.deviceId = textDecoder.decode(val);
    }
  });

  res.langCode = lang;
  return res.text && res.deviceId ? res : null;
}

/** Decode a standard captions (v1) record */
function decodeCaptionV1Record(recordBytes: Uint8Array): ParsedCaption | null {
  const res: ParsedCaption = {
    deviceId: '',
    messageId: '',
    messageVersion: 0,
    text: '',
  };

  parseProtoFields(recordBytes, (field, wire, val) => {
    if (wire === 0) {
      if (field === 2) res.messageId = String(val);
      if (field === 3) res.messageVersion = typeof val === 'number' ? val : 0;
    } else if (wire === 2 && val instanceof Uint8Array) {
      if (field === 1) {
        res.deviceId = textDecoder.decode(val);
      } else if (field === 6) {
        res.text = textDecoder.decode(val);
      }
    }
  });

  return res.deviceId && res.text ? res : null;
}

/** Decode UserDetails protobuf record (Meet schema: 1=deviceId, 2=fullName, 3=profile, 21=parentDeviceId, 29=name) */
function decodeUserDetailsRecord(bytes: Uint8Array): ParticipantInfo | null {
  let deviceId = '';
  let fullName = '';
  let shortName = '';
  let avatarUrl = '';
  let parentDeviceId = '';

  const ok = parseProtoFields(bytes, (field, wire, val) => {
    if (wire === 2 && val instanceof Uint8Array) {
      const str = textDecoder.decode(val).trim();
      if (field === 1) deviceId = str;
      else if (field === 2) fullName = str;
      else if (field === 3) avatarUrl = str;
      else if (field === 21) parentDeviceId = str;
      else if (field === 29) shortName = str;
    }
  });

  if (!ok || !deviceId) return null;
  const displayName = fullName || shortName;
  if (!displayName) return null;

  return {
    deviceId,
    deviceName: displayName,
    shortName: shortName || undefined,
    avatarUrl: avatarUrl || undefined,
    parentDeviceId: parentDeviceId || undefined,
  };
}

/** Decode MediaStreamEntry protobuf record (2=streamType, 4=ssrc, 6=deviceId, 10=muteState) */
function decodeMediaStreamRecord(bytes: Uint8Array): MediaStreamInfo | null {
  let streamType = 0;
  let ssrc = '';
  let deviceId = '';
  let muted: boolean | undefined;

  const ok = parseProtoFields(bytes, (field, wire, val) => {
    if (wire === 0 && field === 2 && typeof val === 'number') {
      streamType = val;
    } else if (wire === 2 && val instanceof Uint8Array) {
      if (field === 4) ssrc = textDecoder.decode(val).trim();
      else if (field === 6) deviceId = textDecoder.decode(val).trim();
      else if (field === 10) {
        parseProtoFields(val, (mField, mWire, mVal) => {
          if (mField === 1 && mWire === 0 && typeof mVal === 'number') {
            muted = mVal !== 0;
          }
        });
      }
    }
  });

  if (!ok || !deviceId) return null;
  return { deviceId, ssrc, streamType, muted };
}

/** Filter out non-human strings extracted from Protobuf binary */
function isPlausibleParticipantName(candidate: string): boolean {
  if (!candidate) return false;
  const trimmed = candidate.trim();
  if (trimmed.length < 2 || trimmed.length > 60) return false;
  if (
    trimmed.includes('/') ||
    trimmed.includes('http') ||
    trimmed.includes('google.com') ||
    trimmed.includes('spaces/') ||
    trimmed.includes('@') ||
    trimmed.includes('=') ||
    trimmed.includes(':')
  ) {
    return false;
  }
  // Reject pure numeric Gaia/device IDs
  if (/^\d+$/.test(trimmed)) return false;
  // Reject locale codes like en-US, id-ID
  if (/^[a-z]{2,3}(-[A-Za-z0-9]{2,4})+$/i.test(trimmed)) return false;
  // Reject UUIDs or hex tokens
  if (/^[0-9a-f-]{16,}$/i.test(trimmed)) return false;
  // Reject opaque single-token base64/random IDs (long string without space containing digits/symbols)
  if (!/\s/.test(trimmed) && trimmed.length >= 18 && /\d/.test(trimmed)) return false;
  // Must contain at least one letter
  if (!/[a-zA-Z\u00C0-\u024F]/.test(trimmed)) return false;

  return true;
}

/**
 * Decodes both participant roster entries and media stream mappings (ssrc -> deviceId)
 * from Google Meet's MeetingSpaceCollectionResponse or CollectionMessage Protobuf frames.
 */
export async function decodeCollectionsDetails(
  buffer: ArrayBuffer
): Promise<DecodedCollectionsResult> {
  const bytes = await decompressGzipIfNeeded(new Uint8Array(buffer));
  if (!bytes || bytes.length === 0) return { participants: [], streams: [] };

  const participants: ParticipantInfo[] = [];
  const streams: MediaStreamInfo[] = [];
  const seenDeviceIds = new Set<string>();

  const addParticipant = (p: ParticipantInfo | null) => {
    if (!p || !p.deviceId || !p.deviceName) return;
    if (!seenDeviceIds.has(p.deviceId)) {
      seenDeviceIds.add(p.deviceId);
      participants.push(p);
    }
  };

  try {
    // Path 1: CollectionMessage schema:
    //   1 (body) -> 2 (wrapper1) -> { 3 (media) -> 2 (MediaStreamEntry), 13 (wrapper2) -> 1 (wrapper3) -> 2 (UserDetails) }
    // Path 2: MeetingSpaceCollectionResponse schema (SyncMeetingSpaceCollections):
    //   2 (spaces) -> 2 (wrapper) -> 2 (UserDetails)
    parseProtoFields(bytes, (f1, w1, v1) => {
      if (w1 !== 2 || !(v1 instanceof Uint8Array)) return;

      // Check CollectionMessage path (field 1 -> field 2)
      if (f1 === 1) {
        parseProtoFields(v1, (f2, w2, v2) => {
          if (f2 === 2 && w2 === 2 && v2 instanceof Uint8Array) {
            parseProtoFields(v2, (f3, w3, v3) => {
              if (w3 !== 2 || !(v3 instanceof Uint8Array)) return;
              if (f3 === 3) {
                parseProtoFields(v3, (mf, mw, mv) => {
                  if (mf === 2 && mw === 2 && mv instanceof Uint8Array) {
                    const st = decodeMediaStreamRecord(mv);
                    if (st) streams.push(st);
                  }
                });
              } else if (f3 === 13) {
                parseProtoFields(v3, (wf, ww, wv) => {
                  if (wf === 1 && ww === 2 && wv instanceof Uint8Array) {
                    parseProtoFields(wv, (uf, uw, uv) => {
                      if (uf === 2 && uw === 2 && uv instanceof Uint8Array) {
                        addParticipant(decodeUserDetailsRecord(uv));
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }

      // Check MeetingSpaceCollectionResponse path (field 2 -> field 2 -> field 2)
      if (f1 === 2) {
        parseProtoFields(v1, (f2, w2, v2) => {
          if (f2 === 2 && w2 === 2 && v2 instanceof Uint8Array) {
            parseProtoFields(v2, (f3, w3, v3) => {
              if (f3 === 2 && w3 === 2 && v3 instanceof Uint8Array) {
                addParticipant(decodeUserDetailsRecord(v3));
              }
            });
          }
        });
      }
    });

    // Fallback string-pair scanner (e.g. Simulator mock buffers or nested variants)
    if (participants.length === 0) {
      let offset = 0;
      const strings: { text: string; offset: number }[] = [];

      while (offset < bytes.length) {
        const [tag, nextOffset] = readVarint(bytes, offset);
        offset = nextOffset;
        const wire = tag & 0x07;

        if (wire === 2) {
          const [len, afterLen] = readVarint(bytes, offset);
          offset = afterLen;
          if (len > 0 && offset + len <= bytes.length) {
            const slice = bytes.subarray(offset, offset + len);
            let looksLikeText = true;
            for (let k = 0; k < Math.min(slice.length, 30); k++) {
              if (slice[k] < 0x09 || (slice[k] > 0x0d && slice[k] < 0x20)) {
                looksLikeText = false;
                break;
              }
            }
            if (looksLikeText) {
              try {
                const str = textDecoder.decode(slice).trim();
                if (str.length > 0) strings.push({ text: str, offset });
              } catch {}
            }
          }
          offset += len;
        } else if (wire === 0) {
          offset = readVarint(bytes, offset)[1];
        } else if (wire === 5) {
          offset += 4;
        } else if (wire === 1) {
          offset += 8;
        } else {
          break;
        }
      }

      for (let i = 0; i < strings.length; i++) {
        const item = strings[i];
        if (item.text.includes('devices/')) {
          const deviceId = item.text;
          for (let j = 1; j <= 8 && i + j < strings.length; j++) {
            const candidate = strings[i + j].text;
            if (candidate.includes('devices/')) break;
            if (isPlausibleParticipantName(candidate)) {
              addParticipant({ deviceId, deviceName: candidate });
              break;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[RTC Decoder] Error parsing collections buffer:', err);
  }

  return { participants, streams };
}

/**
 * Extracts participant mappings (deviceId -> { deviceName, avatarUrl })
 * from a collections buffer or SyncMeetingSpaceCollections response.
 */
export async function decodeCollectionsBuffer(
  buffer: ArrayBuffer
): Promise<ParticipantInfo[]> {
  const details = await decodeCollectionsDetails(buffer);
  return details.participants;
}
