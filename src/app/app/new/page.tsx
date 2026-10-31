"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Images,
  Link2,
  Package,
  ScanSearch,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  Field,
  Input,
  Select,
  Textarea,
  buttonClasses,
  cx,
} from "@/components/ui";
import { Dropzone } from "@/components/dropzone";
import { ApiError, apiFetch } from "@/lib/api";
import { pluralize } from "@/lib/format";
import { PRODUCT_CATEGORIES, type ImageMeta } from "@/lib/types";

type StartMode = "url" | "screenshots" | "text";

const STEPS = [
  { id: 0, label: "Listing Source", icon: Link2 },
  { id: 1, label: "Claims & Details", icon: FileText },
  { id: 2, label: "Visual Proof", icon: Images },
  { id: 3, label: "Verify & Run", icon: ScanSearch },
];

const MODE_OPTIONS: {
  id: StartMode;
  title: string;
  body: string;
  icon: typeof Link2;
}[] = [
  {
    id: "url",
    title: "Marketplace Listing Link",
    body: "Anchor the listing URL from eBay, Chrono24, StockX, or Facebook Marketplace.",
    icon: Link2,
  },
  {
    id: "screenshots",
    title: "Upload Listing Screenshots",
    body: "Capture the listing page and seller's claims as uploaded screenshots.",
    icon: Images,
  },
  {
    id: "text",
    title: "Description Paste Only",
    body: "Paste the seller's raw text description directly without external links.",
    icon: FileText,
  },
];

export default function NewVerificationPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<StartMode>("url");
  const [listingUrl, setListingUrl] = useState("");
  const [listingImages, setListingImages] = useState<ImageMeta[]>([]);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("smartphone");
  const [description, setDescription] = useState("");
  const [additional, setAdditional] = useState("");
  const [productImages, setProductImages] = useState<ImageMeta[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlValid = useMemo(() => {
    if (!listingUrl.trim()) return true;
    return /^https?:\/\//i.test(listingUrl.trim());
  }, [listingUrl]);

  const stepValid = useMemo(() => {
    if (step === 0) {
      if (!urlValid) return false;
      if (mode === "url") return listingUrl.trim().length > 0;
      if (mode === "screenshots") return listingImages.length > 0;
      return true;
    }
    if (step === 1) {
      return (
        productName.trim().length >= 2 &&
        description.trim().length >= 10 &&
        description.trim().length <= 8000
      );
    }
    if (step === 2) return productImages.length >= 1;
    return true;
  }, [step, urlValid, mode, listingUrl, listingImages, productName, description, productImages]);

  // Demo auto-fill helper
  function loadDemoData(type: "iphone" | "macbook") {
    if (type === "iphone") {
      setListingUrl("https://ebay.com/itm/iphone15promax-mint-titanium");
      setProductName("Apple iPhone 15 Pro Max — 256GB Natural Titanium");
      setCategory("smartphone");
      setDescription(
        "Brand new open box condition! Never used outside of testing, absolute pristine screen with zero micro-scratches or blemishes anywhere. 100% battery health with original Apple braided USB-C cable and retail box included."
      );
      setAdditional("Claimed direct Apple Store purchase. Unlocked for all carriers.");
      // create synthetic sample evidence photos
      setProductImages([
        {
          id: "img_v1_display",
          kind: "product",
          fileName: "screen_macro_angle.jpg",
          mimeType: "image/svg+xml",
          sizeBytes: 1024 * 42,
          url: "/api/images/img_v1_display",
          ref: "P1",
        },
        {
          id: "img_v1_chassis",
          kind: "product",
          fileName: "chassis_natural_titanium.jpg",
          mimeType: "image/svg+xml",
          sizeBytes: 1024 * 38,
          url: "/api/images/img_v1_chassis",
          ref: "P2",
        },
      ]);
    } else {
      setListingUrl("https://swappa.com/listing/macbook-pro-m3-max");
      setProductName("MacBook Pro 16-inch M3 Max (36GB RAM, 1TB SSD) Space Black");
      setCategory("laptop");
      setDescription(
        "Flawless collector condition. Zero keyboard shine, immaculate Liquid Retina XDR screen with zero dead pixels. 99% battery health with only 14 battery cycles. Includes original 140W MagSafe charger."
      );
      setAdditional("Original receipt from Best Buy available upon request.");
      setProductImages([
        {
          id: "img_v2_bezel",
          kind: "product",
          fileName: "display_and_keyboard.jpg",
          mimeType: "image/svg+xml",
          sizeBytes: 1024 * 50,
          url: "/api/images/img_v2_bezel",
          ref: "P1",
        },
      ]);
    }
    setStep(3);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch<{ verification: { id: string } }>(
        "/api/verifications",
        {
          method: "POST",
          body: JSON.stringify({
            productName: productName.trim(),
            productCategory: category,
            listingUrl: listingUrl.trim() || undefined,
            sellerDescription: description.trim(),
            additionalDetails: additional.trim() || undefined,
            listingImageIds: listingImages.map((i) => i.id),
            productImageIds: productImages.map((i) => i.id),
          }),
        }
      );
      router.push(`/app/verify/${res.verification.id}/analyze`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not create verification. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6">
      {/* Top back navigation & heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/app/dashboard"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft size={15} />
            <span>Dashboard</span>
          </Link>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Start New Evidence Audit
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Submit the seller&rsquo;s description and actual photographs. Gemma 4 will cross-examine every claim.
          </p>
        </div>

        {/* 1-Click Fast Pre-fill Demo buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Quick Demo:
          </span>
          <button
            type="button"
            onClick={() => loadDemoData("iphone")}
            className="rounded-xl border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-[11.5px] font-bold text-blue-700 shadow-2xs transition hover:bg-blue-100"
          >
            iPhone Discrepancy
          </button>
          <button
            type="button"
            onClick={() => loadDemoData("macbook")}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            MacBook Pro
          </button>
        </div>
      </div>

      {/* Modern Stepper Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
        <ol className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <li
                key={s.id}
                className={cx("flex items-center", i < STEPS.length - 1 && "flex-1")}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold transition-all shadow-2xs",
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                        ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    )}
                  >
                    {done ? <Check size={14} strokeWidth={3} /> : s.id + 1}
                  </span>
                  <span
                    className={cx(
                      "hidden sm:block text-[13px] font-semibold",
                      active ? "text-slate-900" : done ? "text-slate-700" : "text-slate-400"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cx(
                      "mx-3 h-0.5 flex-1 rounded-full transition-colors",
                      done ? "bg-emerald-500" : "bg-slate-100"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Step Wizard Container */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step 0: Listing Source */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 1: Listing Origin & Source
                  </h2>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Select how you want to record the source marketplace for this listing.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MODE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMode(opt.id)}
                      className={cx(
                        "rounded-2xl border p-4 text-left transition-all duration-200 focus-ring cursor-pointer",
                        mode === opt.id
                          ? "border-blue-400 bg-blue-50/60 shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                    >
                      <opt.icon
                        size={18}
                        className={mode === opt.id ? "text-blue-600" : "text-slate-400"}
                      />
                      <p className="mt-2.5 text-[14px] font-bold text-slate-900">
                        {opt.title}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                        {opt.body}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  {mode === "url" && (
                    <Field
                      label="Public Listing URL"
                      error={!urlValid ? "Please provide a valid http:// or https:// URL." : null}
                      hint="Paste the link to the item on eBay, Facebook, Chrono24, Swappa, etc."
                    >
                      <Input
                        type="url"
                        placeholder="https://marketplace.example/item/12345"
                        value={listingUrl}
                        onChange={(e) => setListingUrl(e.target.value)}
                      />
                    </Field>
                  )}
                  {mode === "screenshots" && (
                    <Dropzone
                      kind="listing"
                      label="Drop listing screenshots here"
                      hint="Up to 6 screenshots of the listing page."
                      images={listingImages}
                      onChange={setListingImages}
                      maxFiles={6}
                    />
                  )}
                  {mode === "text" && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-600 leading-relaxed">
                      You will provide the raw description directly in the next step.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Product & Claims */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 2: Product Name & Seller&rsquo;s Claims
                  </h2>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Copy the seller&rsquo;s exact written listing text. Gemma 4 parses claims directly from these words.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr] gap-4">
                  <Field label="Product Name">
                    <Input
                      placeholder="e.g. iPhone 15 Pro Max 256GB Natural Titanium"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      maxLength={140}
                    />
                  </Field>

                  <Field label="Product Category">
                    <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field
                  label="Seller's Exact Listing Description"
                  hint={`${description.trim().length}/8000 characters — include condition claims, included accessories, battery status, and warranties.`}
                  error={
                    description.trim().length > 0 && description.trim().length < 10
                      ? "Please enter the full description (minimum 10 characters)."
                      : null
                  }
                >
                  <Textarea
                    className="min-h-[160px]"
                    placeholder="Paste the seller's full description: e.g. 'Pristine open box condition, never used outside testing, zero scratches on screen, 100% battery health, original braided cable included...'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={8000}
                  />
                </Field>

                <Field
                  label="Private Buyer Notes (Optional)"
                  optional
                  hint="Any side messages or statements made in private chat."
                >
                  <Textarea
                    className="min-h-[70px]"
                    placeholder="e.g. Seller told me in DM that the screen protector was removed..."
                    value={additional}
                    onChange={(e) => setAdditional(e.target.value)}
                    maxLength={2000}
                  />
                </Field>
              </div>
            )}

            {/* Step 2: Evidence Photos */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 3: Photographs of Actual Item
                  </h2>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Upload clear, high-resolution photographs of the physical item you are considering purchasing.
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-[13px] text-blue-900 leading-relaxed flex items-start gap-3">
                  <Package size={17} className="mt-0.5 shrink-0 text-blue-600" />
                  <div>
                    <strong className="font-semibold">Tip for best accuracy:</strong> Include close-up photos of screens with light reflections, corner chamfers, serial number plates, and included charging cables.
                  </div>
                </div>

                <Dropzone
                  kind="product"
                  label="Drop actual product photos here"
                  hint="Upload 1 to 10 photos of the actual item — JPEG, PNG, or WebP."
                  images={productImages}
                  onChange={setProductImages}
                  maxFiles={10}
                />
              </div>
            )}

            {/* Step 3: Review & Run */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Step 4: Review Audit Payload
                  </h2>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Ready to initiate Gemma 4 multimodal inference. Review the parameters below.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                      Product Dossier
                    </span>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[15px] font-bold text-slate-900">
                        {productName}
                      </p>
                      <Badge tone="accent">
                        {PRODUCT_CATEGORIES.find((c) => c.value === category)?.label ?? category}
                      </Badge>
                    </div>
                    {listingUrl.trim() && (
                      <p className="mt-1 font-mono text-[11.5px] text-slate-500 truncate">
                        {listingUrl.trim()}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                      Claims to Verify
                    </span>
                    <p className="mt-1 text-[13px] text-slate-700 line-clamp-3 leading-relaxed">
                      {description.trim()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                        Evidence Photos
                      </span>
                      <p className="mt-1 text-[15px] font-bold text-blue-600">
                        {productImages.length} {pluralize(productImages.length, "photo")} attached
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                        Engine Configuration
                      </span>
                      <p className="mt-1 text-[15px] font-bold text-slate-900">
                        Gemma 4 Multimodal
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-[13px] font-medium text-rose-700 flex items-center gap-2">
                    <TriangleAlert size={16} className="text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Wizard Controls */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
          >
            <ArrowLeft size={15} />
            <span>Back</span>
          </Button>

          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!stepValid}>
              <span>Continue</span>
              <ArrowRight size={15} />
            </Button>
          ) : (
            <Button onClick={submit} loading={submitting} size="lg">
              <Zap size={16} />
              <span>Launch Evidence Audit</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
