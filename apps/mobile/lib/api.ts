/**
 * Thin API client for the FastAPI Photo Log backend.
 *
 * Every function maps 1-to-1 with an existing endpoint so there's
 * nothing to guess about — just look at apps/api/routes/photos.py.
 */

import { API_BASE_URL } from "@/constants/api";

// ── Types ────────────────────────────────────────────────────────

export interface Photo {
  _id: string;
  filename: string;
  url?: string;
  thumbnail?: string;
  description?: string;
  tags?: string[];
  location?: { lat: number; lon: number; z?: number } | null;
  timestamp?: string;
  size?: { width: number; height: number } | null;
  content_type?: string;
  size_bytes?: number;
}

export interface PaginatedPhotos {
  Message: string;
  Photos: Photo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface UploadResult {
  Message: string;
  Photos: Photo[];
  total: number;
}

export interface PhotoMarker {
  _id: string;
  filename: string;
  location: { lat: number; lon: number; z?: number };
  thumbnail?: string;
  timestamp?: string;
  tags?: string[];
}

export interface MarkersResult {
  Message: string;
  markers: PhotoMarker[];
  total: number;
}

// ── Helpers ──────────────────────────────────────────────────────

function url(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function json<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ── Endpoints ────────────────────────────────────────────────────

/** Paginated photo list with optional tag filter. */
export async function getPhotos(
  page = 1,
  limit = 20,
  tags?: string
): Promise<PaginatedPhotos> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort_by: "timestamp",
    order: "desc",
  });
  if (tags) params.set("tags", tags);
  return json<PaginatedPhotos>(url(`/photos?${params}`));
}

/** Single photo by ID. */
export async function getPhoto(id: string): Promise<Photo> {
  return json<Photo>(url(`/photos/${id}`));
}

/** All unique tags (used as lightweight "project" filter). */
export async function getTags(): Promise<{ tags: string[]; total: number }> {
  return json(url("/photos/tags"));
}

/**
 * Upload one image via multipart/form-data.
 *
 * `uri` is the local file URI from expo-image-picker.
 * The backend expects the field name "file".
 */
export async function uploadPhoto(
  uri: string,
  filename: string,
  mimeType: string,
  description?: string,
  tags?: string
): Promise<UploadResult> {
  const form = new FormData();

  // React Native's FormData accepts this shape for file blobs.
  form.append("file", {
    uri,
    name: filename,
    type: mimeType,
  } as unknown as Blob);

  if (description?.trim()) form.append("description", description.trim());
  if (tags?.trim()) form.append("tags", tags.trim());

  return json<UploadResult>(url("/photos/upload"), {
    method: "POST",
    body: form,
    // Do NOT set Content-Type — RN sets the multipart boundary automatically.
  });
}

/** Update description and/or tags on an existing photo. */
export async function updatePhoto(
  id: string,
  description?: string,
  tags?: string
): Promise<{ Message: string }> {
  const form = new FormData();
  if (description !== undefined) form.append("description", description);
  if (tags !== undefined) form.append("tags", tags);

  return json(url(`/photos/${id}/update`), {
    method: "PUT",
    body: form,
  });
}

/** Health check — just pings the root route. */
export async function ping(): Promise<boolean> {
  try {
    await fetch(url("/"), { method: "GET" });
    return true;
  } catch {
    return false;
  }
}

/** Delete a photo by ID. */
export async function deletePhoto(id: string): Promise<{ Message: string }> {
  return json(url(`/photos/${id}/delete`), { method: "DELETE" });
}

/**
 * Download an export file (zip/kml/kmz).
 * Returns the download URL — on mobile we hand this to the share sheet.
 */
export function getExportUrl(
  format: "zip" | "kml" | "kmz",
  photoIds: string[]
): string {
  const params = photoIds.map((id) => `payload=${encodeURIComponent(id)}`).join("&");
  return `${API_BASE_URL}/export/${format}?${params}`;
}

/** Lightweight photo markers for map display. */
export async function getMarkers(tags?: string): Promise<MarkersResult> {
  const params = new URLSearchParams();
  if (tags) params.set("tags", tags);
  const qs = params.toString();
  return json<MarkersResult>(url(`/photos/markers${qs ? `?${qs}` : ""}`));
}
