"use client";

import type { AnalysisEvent, ImageMeta } from "@/lib/types";

export class ApiError extends Error {
  status: number;
  code: string | null;
  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function readError(res: Response): Promise<ApiError> {
  let message = res.statusText || "Request failed.";
  let code: string | null = null;
  try {
    const data = await res.json();
    if (typeof data?.error === "string") message = data.error;
    if (typeof data?.code === "string") code = data.code;
  } catch {
    /* non-JSON body */
  }
  return new ApiError(message, res.status, code);
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers:
      init?.body instanceof FormData
        ? init?.headers
        : { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw await readError(res);
  return (await res.json()) as T;
}

/* ---------------- Uploads with real progress (XHR) ---------------- */

export function uploadImages(
  files: File[],
  kind: "listing" | "product",
  onProgress: (pct: number) => void
): Promise<ImageMeta[]> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("kind", kind);
    for (const file of files) form.append("files", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.responseType = "json";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
      }
    };
    xhr.onload = () => {
      const body = xhr.response;
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve((body?.images ?? []) as ImageMeta[]);
      } else {
        reject(
          new ApiError(
            typeof body?.error === "string" ? body.error : "Upload failed.",
            xhr.status,
            typeof body?.code === "string" ? body.code : null
          )
        );
      }
    };
    xhr.onerror = () =>
      reject(new ApiError("Network error during upload.", 0, null));
    xhr.send(form);
  });
}

/* ---------------- NDJSON streaming client ---------------- */

const NL = String.fromCharCode(10);

export async function streamAnalysis(
  verificationId: string,
  onEvent: (event: AnalysisEvent) => void
): Promise<{ outcome: "complete" | "error" }> {
  const res = await fetch(`/api/analysis/${verificationId}`, {
    method: "POST",
  });

  if (!res.ok) {
    throw await readError(res);
  }
  if (!res.body) {
    throw new ApiError("The server returned no stream.", 0, null);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let outcome: "complete" | "error" = "error";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx = buffer.indexOf(NL);
    while (idx !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      idx = buffer.indexOf(NL);
      if (!line) continue;
      try {
        const event = JSON.parse(line) as AnalysisEvent;
        onEvent(event);
        if (event.type === "complete") outcome = "complete";
        if (event.type === "error") outcome = "error";
      } catch {
        /* partial line — ignore */
      }
    }
  }
  return { outcome };
}
