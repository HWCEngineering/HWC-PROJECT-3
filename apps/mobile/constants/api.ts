/**
 * API configuration.
 *
 * For local dev, replace with your machine's LAN IP, e.g.:
 *   http://192.168.1.42:8000
 *
 * Expo Go on a physical device can't reach "localhost".
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
