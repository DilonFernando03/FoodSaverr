/**
 * Utility functions to parse PostGIS coordinates from various formats
 * Handles: POINT strings, hex WKB, and object formats
 */

/**
 * Parse hex WKB (Well-Known Binary) format to extract longitude and latitude
 * Format: "0101000020E6100000..." (hex string)
 * EWKB (Extended WKB) format for PostGIS Point with SRID 4326:
 * - Byte 0: 01 (little endian)
 * - Byte 1: 01 (Point type with SRID flag)
 * - Bytes 2-5: SRID (0x0020E610 = 4326 in little endian)
 * - Bytes 6-13: X coordinate (longitude) as 64-bit IEEE 754 double (little endian)
 * - Bytes 14-21: Y coordinate (latitude) as 64-bit IEEE 754 double (little endian)
 */
export function parseHexWKB(hex: string): { lng: number; lat: number } | null {
  try {
    if (typeof hex !== 'string') {
      return null
    }

    const trimmed = hex.trim()
    if (!/^[0-9a-fA-F]+$/.test(trimmed) || trimmed.length % 2 !== 0) {
      return null
    }

    const byteLength = trimmed.length / 2
    if (byteLength < 21) {
      return null
    }

    const bytes = new Uint8Array(byteLength)
    for (let i = 0; i < byteLength; i++) {
      const byte = trimmed.substr(i * 2, 2)
      bytes[i] = parseInt(byte, 16)
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const littleEndian = bytes[0] === 1
    let offset = 1

    if (offset + 4 > view.byteLength) {
      return null
    }

    let geometryType = view.getUint32(offset, littleEndian)
    offset += 4
    const hasSrid = (geometryType & 0x20000000) !== 0
    geometryType = geometryType & 0x0fffffff

    if (geometryType !== 1) {
      return null
    }

    if (hasSrid) {
      if (offset + 4 > view.byteLength) {
        return null
      }
      offset += 4
    }

    if (offset + 16 > view.byteLength) {
      return null
    }

    const lng = view.getFloat64(offset, littleEndian)
    const lat = view.getFloat64(offset + 8, littleEndian)

    if (!isFinite(lng) || !isFinite(lat)) {
      console.warn('Invalid parsed coordinates (non-finite):', { lng, lat })
      return null
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      console.warn('Coordinates out of range:', { lng, lat })
      return null
    }

    return { lng, lat }
  } catch (error) {
    console.warn('Error parsing hex WKB:', error, hex.substring(0, 64))
    return null
  }
}

/**
 * Parse PostGIS coordinates from various formats
 * Returns { lat, lng } or null if parsing fails
 */
export function parsePostGISCoordinates(coords: any): { lat: number; lng: number } | null {
  if (!coords) return null

  // String format: "POINT(lng lat)" or "SRID=4326;POINT(lng lat)"
  if (typeof coords === 'string') {
    // Try POINT string format first
    const pointMatch = coords.match(/POINT\(([^ ]+) ([^ ]+)\)/)
    if (pointMatch) {
      const lng = parseFloat(pointMatch[1])
      const lat = parseFloat(pointMatch[2])
      if (!isNaN(lng) && !isNaN(lat)) {
        return { lat, lng }
      }
    }
    
    // Try hex WKB format
    if (/^[0-9A-Fa-f]+$/.test(coords)) {
      return parseHexWKB(coords)
    }
  }

  // Object format
  if (typeof coords === 'object') {
    // Try various property names
    const lng = coords.lng ?? coords.longitude ?? coords.x ?? null
    const lat = coords.lat ?? coords.latitude ?? coords.y ?? null
    
    if (lng != null && lat != null && !isNaN(lng) && !isNaN(lat)) {
      return { lat, lng }
    }
    
    // Try GeoJSON format with coordinates array
    if (coords.coordinates && Array.isArray(coords.coordinates)) {
      const coordArray = coords.coordinates
      if (coordArray.length >= 2) {
        const lng = parseFloat(coordArray[0])
        const lat = parseFloat(coordArray[1])
        if (!isNaN(lng) && !isNaN(lat)) {
          return { lat, lng }
        }
      }
    }
  }

  return null
}

