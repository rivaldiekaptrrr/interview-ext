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
  avatarUrl?: string;
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
    if (wire === 2 && val instanceof Uint8Array) {
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

/**
 * Extracts participant mappings (deviceId -> { deviceName, avatarUrl })
 * from a collections buffer or SyncMeetingSpaceCollections response.
 */
export async function decodeCollectionsBuffer(
  buffer: ArrayBuffer
): Promise<ParticipantInfo[]> {
  const bytes = await decompressGzipIfNeeded(new Uint8Array(buffer));
  if (!bytes || bytes.length === 0) return [];

  const participants: ParticipantInfo[] = [];

  // Robust string-pair extractor: scans the protobuf binary for "devices/..." strings
  // and follows neighboring string fields that represent the participant's display name.
  try {
    let offset = 0;
    const textDecoder = new TextDecoder('utf-8', { fatal: false });

    // Extract all UTF-8 strings of valid length from length-delimited wire chunks
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
          // Only attempt decoding if looks like ASCII / UTF-8 text
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
              if (str.length > 0) {
                strings.push({ text: str, offset });
              }
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

    // Match deviceId strings (e.g. "devices/123..." or "spaces/.../devices/...") with adjacent names
    for (let i = 0; i < strings.length; i++) {
      const item = strings[i];
      if (item.text.includes('devices/')) {
        const deviceId = item.text;
        // Search next 3 strings for a plausible participant display name
        for (let j = 1; j <= 4 && i + j < strings.length; j++) {
          const candidate = strings[i + j].text;
          if (
            candidate.length >= 2 &&
            candidate.length <= 60 &&
            !candidate.includes('/') &&
            !candidate.includes('http') &&
            !candidate.includes('google.com') &&
            !candidate.includes('spaces/')
          ) {
            participants.push({
              deviceId,
              deviceName: candidate,
            });
            break;
          }
        }
      }
    }
  } catch (err) {
    console.warn('[RTC Decoder] Error parsing collections buffer:', err);
  }

  return participants;
}
