import type { BucketsData, ArchivesData } from "../types";

const API = "http://localhost:8000/api";

export async function fetchBuckets(): Promise<BucketsData> {
  const res = await fetch(`${API}/buckets`);
  if (!res.ok) throw new Error(`Failed to fetch buckets: ${res.status}`);
  return res.json();
}

export async function fetchBucketFiles(prefix: string = ""): Promise<ArchivesData> {
  const url = `${API}/buckets/files${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch files: ${res.status}`);
  return res.json();
}
