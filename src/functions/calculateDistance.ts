/**
 * calculateDistance.ts
 * Calculates the distance between two coordinates in metres.
 */

type Coordinates = {
    latitude: number;
    longitude: number;
};

export function calculateDistance(
    user: Coordinates,
    candy: Coordinates
): number {
    const earthRadius = 6371000;

    const latitudeDifference =
        ((candy.latitude - user.latitude) * Math.PI) / 180;

    const longitudeDifference =
        ((candy.longitude - user.longitude) * Math.PI) / 180;

    const userLatitude =
        (user.latitude * Math.PI) / 180;

    const candyLatitude =
        (candy.latitude * Math.PI) / 180;

    const a =
        Math.sin(latitudeDifference / 2) *
            Math.sin(latitudeDifference / 2) +
        Math.cos(userLatitude) *
            Math.cos(candyLatitude) *
            Math.sin(longitudeDifference / 2) *
            Math.sin(longitudeDifference / 2);

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return earthRadius * c;
}