/**
 * Simple geographic marker clustering.
 *
 * Groups markers whose lat/lon are within `radius` degrees of each other.
 * This is a basic grid-based approach — fast and good enough for an MVP.
 */

export interface ClusterInput {
  _id: string;
  location: { lat: number; lon: number };
}

export interface ClusterItem<T extends ClusterInput> {
  type: "marker";
  item: T;
}

export interface ClusterGroup<T extends ClusterInput> {
  type: "cluster";
  id: string;
  coordinate: { latitude: number; longitude: number };
  count: number;
  items: T[];
}

export type ClusterResult<T extends ClusterInput> = ClusterItem<T> | ClusterGroup<T>;

/**
 * @param items   Array of items with `location.lat` and `location.lon`
 * @param radius  Grouping radius in degrees (smaller = less aggressive clustering)
 */
export function clusterMarkers<T extends ClusterInput>(
  items: T[],
  radius: number
): ClusterResult<T>[] {
  if (radius <= 0 || items.length === 0) {
    return items.map((item) => ({ type: "marker" as const, item }));
  }

  // Grid-based clustering: snap each point to a grid cell
  const buckets = new Map<string, T[]>();

  for (const item of items) {
    const cellX = Math.floor(item.location.lon / radius);
    const cellY = Math.floor(item.location.lat / radius);
    const key = `${cellX}:${cellY}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      buckets.set(key, [item]);
    }
  }

  const results: ClusterResult<T>[] = [];

  for (const [key, bucket] of buckets) {
    if (bucket.length === 1) {
      results.push({ type: "marker", item: bucket[0] });
    } else {
      // Average position for cluster center
      let latSum = 0;
      let lonSum = 0;
      for (const item of bucket) {
        latSum += item.location.lat;
        lonSum += item.location.lon;
      }
      results.push({
        type: "cluster",
        id: `cluster-${key}`,
        coordinate: {
          latitude: latSum / bucket.length,
          longitude: lonSum / bucket.length,
        },
        count: bucket.length,
        items: bucket,
      });
    }
  }

  return results;
}

/**
 * Convert a map zoom/delta to a clustering radius.
 * Larger delta (zoomed out) = larger radius = more aggressive clustering.
 */
export function deltaToRadius(latitudeDelta: number): number {
  // Tuned so clustering kicks in when zoomed out
  if (latitudeDelta > 20) return 5;
  if (latitudeDelta > 10) return 2;
  if (latitudeDelta > 5) return 1;
  if (latitudeDelta > 1) return 0.3;
  if (latitudeDelta > 0.3) return 0.08;
  if (latitudeDelta > 0.05) return 0.015;
  return 0; // No clustering when zoomed in close
}
