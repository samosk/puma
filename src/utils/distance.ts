/**
 * distance.ts
 * Calculate the distance between two coords
 */

export function calculateDistance(
  latitudeCandy: number,
  longitudeCandy: number,
  latitudeUser: number,
  longitudeUser: number
): number {
  const earthRadius = 6371000; // meters

  const latDifference =
    ((latitudeUser - latitudeCandy) * Math.PI) / 180;

  const lonDifference =
    ((longitudeUser - longitudeCandy) * Math.PI) / 180;

  const a =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos((latitudeCandy * Math.PI) / 180) *
      Math.cos((latitudeUser * Math.PI) / 180) *
      Math.sin(lonDifference / 2) ** 2;

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}