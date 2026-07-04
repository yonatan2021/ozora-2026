/**
 * Compresses a payload object to a Base64url-safe string.
 * Supports UTF-8 / Hebrew characters.
 */
export function compressPayload(payload) {
  if (payload == null) return '';
  try {
    const jsonStr = JSON.stringify(payload);
    // Use TextEncoder to safely handle Unicode/Hebrew characters
    const bytes = new TextEncoder().encode(jsonStr);
    const binaryStr = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
    const base64 = btoa(binaryStr);
    // Convert standard base64 to base64url (URL safe, no padding)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Failed to compress payload', err);
    return '';
  }
}

/**
 * Decompresses a Base64url-safe string back to a payload object.
 * Returns null if the string is invalid or cannot be parsed.
 */
export function decompressPayload(base64url) {
  if (!base64url) return null;
  try {
    // Convert base64url back to standard base64 with padding
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
    const binaryStr = atob(paddedBase64);
    const bytes = new Uint8Array(binaryStr.split('').map(c => c.charCodeAt(0)));
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to decompress payload', err);
    return null;
  }
}
