"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon, Trash2, TriangleAlert, UploadCloud } from "lucide-react";
import { cx } from "@/components/ui";
import { ApiError, apiFetch, uploadImages } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import type { ImageMeta } from "@/lib/types";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 6 * 1024 * 1024;

interface PendingFile {
  key: string;
  name: string;
  localUrl: string;
}

export function Dropzone({
  kind,
  images,
  onChange,
  maxFiles,
  label,
  hint,
}: {
  kind: "product" | "listing";
  images: ImageMeta[];
  onChange: (images: ImageMeta[]) => void;
  maxFiles: number;
  label: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = maxFiles - images.length - pending.length;

  const handleFiles = useCallback(
    async (list: FileList | null) => {
      if (!list || list.length === 0) return;
      setError(null);
      const files = Array.from(list);

      if (files.length > remaining) {
        setError(
          `You can add ${remaining} more ${remaining === 1 ? "image" : "images"} here (max ${maxFiles}).`
        );
        return;
      }
      for (const f of files) {
        if (!ACCEPTED.includes(f.type)) {
          setError(`"${f.name}" is not supported. Use JPEG, PNG or WebP images.`);
          return;
        }
        if (f.size > MAX_BYTES) {
          setError(`"${f.name}" is ${formatBytes(f.size)} — the limit is 6 MB per image.`);
          return;
        }
        if (f.size === 0) {
          setError(`"${f.name}" is an empty file.`);
          return;
        }
      }

      const pendings = files.map((f, i) => ({
        key: `${Date.now()}-${i}`,
        name: f.name,
        localUrl: URL.createObjectURL(f),
      }));

      setPending((p) => [...p, ...pendings]);
      setUploading(true);
      setProgress(0);
      try {
        const uploaded = await uploadImages(files, kind, setProgress);
        onChange([...images, ...uploaded]);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Upload failed. Check your connection and try again."
        );
      } finally {
        pendings.forEach((p) => URL.revokeObjectURL(p.localUrl));
        setPending((prev) => prev.filter((p) => !pendings.includes(p)));
        setUploading(false);
        setProgress(0);
      }
    },
    [images, kind, onChange, remaining, maxFiles]
  );

  async function remove(meta: ImageMeta) {
    onChange(images.filter((i) => i.id !== meta.id));
    try {
      await apiFetch(`/api/images/${meta.id}`, { method: "DELETE" });
    } catch {
      /* orphan rows are harmless */
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={cx(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-9 text-center transition-all duration-200 focus-ring",
          dragging
            ? "border-blue-500 bg-blue-50/70 shadow-md"
            : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div
          className={cx(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors shadow-2xs",
            dragging
              ? "bg-blue-600 text-white"
              : "bg-blue-50 text-blue-600 border border-blue-100"
          )}
        >
          <UploadCloud size={22} />
        </div>
        <p className="mt-3 text-[14px] font-bold text-slate-800">{label}</p>
        <p className="mt-1 text-[12px] text-slate-500 max-w-sm">
          {hint ?? "Drag & drop photos, or click to browse — JPEG, PNG, WebP up to 6 MB."}
        </p>
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 border border-slate-200 text-[10.5px] font-mono font-medium text-slate-500 shadow-2xs">
          <span>{images.length} of {maxFiles} files uploaded</span>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2.5 flex items-start gap-1.5 overflow-hidden text-[12.5px] font-medium text-rose-600"
          >
            <TriangleAlert size={14} className="mt-0.5 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {(images.length > 0 || pending.length > 0) && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <AnimatePresence>
            {images.map((img) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.fileName}
                  className="h-28 w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent px-2.5 pb-2 pt-6">
                  <span className="truncate text-[10.5px] font-medium text-white">
                    {img.fileName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void remove(img);
                  }}
                  aria-label={`Remove ${img.fileName}`}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900/80 text-white opacity-0 backdrop-blur-xs transition group-hover:opacity-100 hover:bg-rose-600"
                >
                  <Trash2 size={13} />
                </button>
              </motion.div>
            ))}
            {pending.map((p) => (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.localUrl}
                  alt={p.name}
                  className="h-28 w-full object-cover opacity-40"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 backdrop-blur-[1px]">
                  <ImageIcon size={18} className="text-blue-600" />
                  <div className="h-1.5 w-3/4 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10.5px] font-semibold text-slate-700">
                    {progress}%
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {uploading && (
        <p className="mt-2 text-[12px] font-semibold text-blue-600">
          Uploading images... {progress}%
        </p>
      )}
    </div>
  );
}
