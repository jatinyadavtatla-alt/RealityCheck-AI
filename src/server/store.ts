import "server-only";
import type {
  AnalysisResult,
  ChatMessage,
  ClaimComparison,
  ExtractedClaim,
  FollowUpQuestion,
  ImageMeta,
  OverallAssessment,
  ProductOverview,
  UnverifiableClaim,
  VerificationSummary,
  VisualObservation,
} from "@/lib/types";
import type { AnalysisRow, ImageRow, VerificationRow } from "@/db/schema";
import { DEFAULT_USER } from "@/server/auth";

// SVG Data URL generator for placeholder evidence images
function createPlaceholderSvg(title: string, subtitle: string, tag: string, color: string): Buffer {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="100%" stop-color="${color}" />
      </linearGradient>
      <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="800" height="600" fill="url(#g)"/>
    <rect width="800" height="600" fill="url(#grid)"/>
    <circle cx="400" cy="270" r="140" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-dasharray="6 6"/>
    <rect x="50" y="50" width="80" height="36" rx="8" fill="rgba(255,255,255,0.15)"/>
    <text x="90" y="74" fill="#ffffff" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="16" text-anchor="middle">${tag}</text>
    <text x="400" y="275" fill="#ffffff" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="28" text-anchor="middle">${title}</text>
    <text x="400" y="320" fill="rgba(255,255,255,0.75)" font-family="-apple-system, system-ui, sans-serif" font-weight="500" font-size="16" text-anchor="middle">${subtitle}</text>
    <rect x="250" y="510" width="300" height="40" rx="20" fill="rgba(255,255,255,0.1)"/>
    <text x="400" y="535" fill="rgba(255,255,255,0.9)" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="13" text-anchor="middle">REALITYCHECK AI • EVIDENCE VAULT</text>
  </svg>`;
  return Buffer.from(svg, "utf-8");
}

export interface MemoryVerification {
  verification: VerificationRow;
  analysis: (AnalysisRow & { result?: AnalysisResult }) | null;
  images: ImageRow[];
  messages: ChatMessage[];
}

class MemoryStore {
  private verifications = new Map<string, VerificationRow>();
  private analyses = new Map<string, AnalysisRow>();
  private images = new Map<string, ImageRow>();
  private conversations = new Map<string, ChatMessage[]>();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const userId = DEFAULT_USER.id;

    // 1. iPhone 15 Pro Max (Discrepancy Detected)
    const v1Id = "v_iphone15_titanium_01";
    const v1: VerificationRow = {
      id: v1Id,
      userId,
      productName: "Apple iPhone 15 Pro Max — 256GB Natural Titanium (Unlocked)",
      productCategory: "smartphone",
      listingUrl: "https://ebay.com/itm/iphone15promax-mint",
      sellerDescription:
        "Brand new open box condition! Never used outside of testing, absolute pristine screen with zero micro-scratches or blemishes anywhere. 100% battery health with original Apple braided USB-C cable and retail box included.",
      additionalDetails: "Claimed purchased directly from Apple Store in November. Unlocked for all carriers.",
      status: "completed",
      errorMessage: null,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 3 * 3600 * 1000),
    };
    this.verifications.set(v1Id, v1);

    const img1Id = "img_v1_display";
    const img2Id = "img_v1_chassis";
    const img3Id = "img_v1_cable";
    const img4Id = "img_v1_box";

    this.images.set(img1Id, {
      id: img1Id,
      userId,
      verificationId: v1Id,
      kind: "product",
      fileName: "screen_macro_angle.jpg",
      mimeType: "image/svg+xml",
      sizeBytes: 1024 * 42,
      data: createPlaceholderSvg("Front Glass Macro", "12mm Hairline Scratch Visible", "P1", "#7f1d1d"),
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
    });

    this.images.set(img2Id, {
      id: img2Id,
      userId,
      verificationId: v1Id,
      kind: "product",
      fileName: "chassis_natural_titanium.jpg",
      mimeType: "image/svg+xml",
      sizeBytes: 1024 * 38,
      data: createPlaceholderSvg("PVD Titanium Chassis", "Natural Finish Matches OEM Specs", "P2", "#1e293b"),
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
    });

    this.images.set(img3Id, {
      id: img3Id,
      userId,
      verificationId: v1Id,
      kind: "product",
      fileName: "accessory_cable.jpg",
      mimeType: "image/svg+xml",
      sizeBytes: 1024 * 35,
      data: createPlaceholderSvg("USB-C Cable Inspection", "Non-Braided Vinyl Jacket (Aftermarket)", "P3", "#854d0e"),
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
    });

    this.images.set(img4Id, {
      id: img4Id,
      userId,
      verificationId: v1Id,
      kind: "listing",
      fileName: "original_retail_box.jpg",
      mimeType: "image/svg+xml",
      sizeBytes: 1024 * 40,
      data: createPlaceholderSvg("Retail Packaging", "Matching Model A2849", "L1", "#064e3b"),
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
    });

    const v1Overview: ProductOverview = {
      detectedProductType: "High-end Smartphone",
      brand: "Apple",
      model: "iPhone 15 Pro Max (Model A2849)",
      visibleIdentifiers: ["IMEI 359281102938491", "PVD Natural Titanium Chamfer"],
      summary:
        "Multimodal audit of genuine Apple iPhone 15 Pro Max chassis with clear evidence of physical display abrasion and non-OEM peripheral substitution.",
      uncertaintyNotes: "Battery cycle count cannot be evaluated visually without iOS diagnostic screenshots.",
    };

    const v1Claims: ExtractedClaim[] = [
      {
        id: "c1",
        claim: "Pristine screen with zero micro-scratches or blemishes",
        quote: "absolute pristine screen with zero micro-scratches or blemishes anywhere",
        category: "condition",
      },
      {
        id: "c2",
        claim: "Original Apple braided USB-C cable included",
        quote: "original Apple braided USB-C cable and retail box included",
        category: "accessories",
      },
      {
        id: "c3",
        claim: "Natural Titanium finish chassis",
        quote: "256GB Natural Titanium",
        category: "condition",
      },
      {
        id: "c4",
        claim: "100% battery health remaining",
        quote: "100% battery health",
        category: "battery",
      },
    ];

    const v1Observations: VisualObservation[] = [
      {
        id: "obs1",
        imageRef: "P1",
        observation: "Definite 12mm diagonal hairline abrasion in the upper-right corner of the Ceramic Shield.",
        damageType: "scratch",
        severity: "moderate",
        location: "Top-right display glass",
      },
      {
        id: "obs2",
        imageRef: "P2",
        observation: "Authentic brushed PVD titanium edge profile with zero frame dents or corner drops.",
        damageType: null,
        severity: null,
        location: "Frame perimeter",
      },
      {
        id: "obs3",
        imageRef: "P3",
        observation: "The USB-C cable has a smooth plastic vinyl jacket rather than Apple's official woven fabric weave.",
        damageType: "missing_part",
        severity: "minor",
        location: "Included accessory cable",
      },
    ];

    const v1Comparisons: ClaimComparison[] = [
      {
        claimId: "c1",
        claim: "Pristine screen with zero micro-scratches",
        quote: "absolute pristine screen with zero micro-scratches or blemishes anywhere",
        category: "condition",
        status: "discrepancy",
        explanation:
          "Evidence in photo [P1] clearly shows a 12mm surface scratch on the top-right display surface under angled lighting. This directly contradicts the 'zero micro-scratches' claim.",
        confidence: "high",
        limitations: "Depth of scratch appears superficial into oleophobic layer, not cracked substrate.",
        observationIds: ["obs1"],
        imageRefs: ["P1"],
      },
      {
        claimId: "c2",
        claim: "Original Apple braided USB-C cable",
        quote: "original Apple braided USB-C cable and retail box included",
        category: "accessories",
        status: "discrepancy",
        explanation:
          "Photo [P3] shows a standard smooth vinyl cable rather than Apple's braided titanium-tinted 60W woven cable supplied with iPhone 15 Pro Max.",
        confidence: "high",
        limitations: null,
        observationIds: ["obs3"],
        imageRefs: ["P3"],
      },
      {
        claimId: "c3",
        claim: "Natural Titanium finish chassis",
        quote: "256GB Natural Titanium",
        category: "condition",
        status: "supported",
        explanation: "Frame contour, brush grain, and Action Button match genuine Apple Natural Titanium titanium-aluminum substrate.",
        confidence: "high",
        limitations: null,
        observationIds: ["obs2"],
        imageRefs: ["P2"],
      },
      {
        claimId: "c4",
        claim: "100% battery health remaining",
        quote: "100% battery health",
        category: "battery",
        status: "unverifiable",
        explanation: "No screenshot or system report of the iOS Settings > Battery Health screen was supplied.",
        confidence: "medium",
        limitations: "Battery capacity cannot be visually measured from external photographs.",
        observationIds: [],
        imageRefs: [],
      },
    ];

    const v1Unverifiable: UnverifiableClaim[] = [
      {
        claim: "100% battery health",
        reason: "Visual photographs cannot confirm internal lithium-ion cycle degradation or maximum capacity percentage.",
        howToVerify: "Request an uncropped screenshot of Settings > Battery > Battery Health & Charging.",
      },
    ];

    const v1Questions: FollowUpQuestion[] = [
      {
        question: "Can you provide a close-up photo of the top-right screen corner with the screen powered on to confirm touch digitizer response?",
        why: "To confirm whether the visible scratch affects pixel rendering or touch sensitivity.",
      },
      {
        question: "Is the original 1m Apple woven USB-C cable available, or is only the aftermarket cable included?",
        why: "Genuine replacement Apple 60W braided cables retail for $19.",
      },
    ];

    const v1Assessment: OverallAssessment = {
      headline: "2 Material Discrepancies Flagged — Visible Display Scratch & Non-OEM Cable",
      summary:
        "The chassis and packaging align with authentic hardware, but physical evidence directly contradicts the seller's claim of an immaculate scratch-free screen and official braided cable. Exercise caution or negotiate a price adjustment.",
      supportedCount: 1,
      discrepancyCount: 2,
      unverifiableCount: 1,
      evidenceCompleteness: "high",
      evidenceGaps: ["Battery Health system screenshot missing", "IMEI status screenshot missing"],
      buyerGuidance: [
        "Request an immediate $80-$120 price concession due to the display scratch.",
        "Verify iCloud activation lock status prior to sending payment.",
        "Factor in replacement cost for an authentic Apple 60W Braided Cable.",
      ],
      caveats: [
        "Photographs verify visible external cosmetic condition only.",
        "Internal components, water resistance seals, and FaceID functionality should be checked upon receipt.",
      ],
    };

    const a1: AnalysisRow = {
      id: "a_v1_analysis",
      verificationId: v1Id,
      modelUsed: "gemma-4-31b-it",
      productOverview: v1Overview,
      extractedClaims: v1Claims,
      visualObservations: v1Observations,
      comparisons: v1Comparisons,
      discrepancies: v1Comparisons.filter((c) => c.status === "discrepancy"),
      unverifiableClaims: v1Unverifiable,
      followUpQuestions: v1Questions,
      overallAssessment: v1Assessment,
      durationMs: 4120,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
    };
    this.analyses.set(v1Id, a1);

    this.conversations.set(v1Id, [
      {
        role: "assistant",
        content:
          "I have completed a forensic multimodal audit of this iPhone 15 Pro Max listing. Two discrepancies were identified: a 12mm scratch on the top-right display glass and a non-braided aftermarket cable. How can I assist you with this verification?",
        at: new Date(Date.now() - 2.8 * 3600 * 1000).toISOString(),
      },
    ]);

    // 2. Rolex Submariner (Verified Clean)
    const v2Id = "v_rolex_submariner_02";
    const v2: VerificationRow = {
      id: v2Id,
      userId,
      productName: "Rolex Submariner Date 126610LN — 41mm Oystersteel",
      productCategory: "other_electronics",
      listingUrl: "https://chrono24.com/rolex/submariner-date",
      sellerDescription:
        "Complete collector set 2023 Rolex Submariner Date 126610LN. Unpolished, worn lightly 3 times. Immaculate Cerachrom ceramic bezel, perfect sapphire crystal, matching green warranty card and double tags included.",
      additionalDetails: "Purchased from Authorized Dealer in Switzerland in Oct 2023. Five-year international warranty active.",
      status: "completed",
      errorMessage: null,
      createdAt: new Date(Date.now() - 22 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 22 * 3600 * 1000),
    };
    this.verifications.set(v2Id, v2);

    const img2_1 = "img_v2_bezel";
    const img2_2 = "img_v2_rehaut";
    this.images.set(img2_1, {
      id: img2_1,
      userId,
      verificationId: v2Id,
      kind: "product",
      fileName: "dial_and_bezel_macro.jpg",
      mimeType: "image/svg+xml",
      sizeBytes: 1024 * 48,
      data: createPlaceholderSvg("Cerachrom Bezel Macro", "Platinum PVD Numerals Flawless", "P1", "#064e3b"),
      createdAt: new Date(Date.now() - 22 * 3600 * 1000),
    });

    this.images.set(img2_2, {
      id: img2_2,
      userId,
      verificationId: v2Id,
      kind: "product",
      fileName: "rehaut_and_card.jpg",
      mimeType: "image/svg+xml",
      sizeBytes: 1024 * 44,
      data: createPlaceholderSvg("Rehaut Engraving & Papers", "Laser Crown Aligned • Matching Serial", "P2", "#0f766e"),
      createdAt: new Date(Date.now() - 22 * 3600 * 1000),
    });

    const v2Overview: ProductOverview = {
      detectedProductType: "Luxury Mechanical Watch",
      brand: "Rolex",
      model: "Submariner Date 126610LN",
      visibleIdentifiers: ["Serial 83K992X", "Cerachrom Ingot Bezel", "Oyster Clasp Glidelock"],
      summary: "High-grade horological inspection confirms flawless alignment of authentic Cerachrom bezel, font weight, laser rehaut, and authentic NFC warranty guarantee card.",
      uncertaintyNotes: null,
    };

    const v2Comparisons: ClaimComparison[] = [
      {
        claimId: "r1",
        claim: "Immaculate Cerachrom ceramic bezel",
        quote: "Immaculate Cerachrom ceramic bezel, perfect sapphire crystal",
        category: "condition",
        status: "supported",
        explanation: "Platinum-sputtered numerals and black Cerachrom insert in [P1] exhibit zero chipping, edge marks, or discoloration.",
        confidence: "high",
        limitations: null,
        observationIds: ["obs_r1"],
        imageRefs: ["P1"],
      },
      {
        claimId: "r2",
        claim: "Matching green warranty card & box included",
        quote: "matching green warranty card and double tags included",
        category: "accessories",
        status: "supported",
        explanation: "Official Rolex NFC warranty card pictured in [P2] shows matching reference 126610LN and Authorized Dealer stamping.",
        confidence: "high",
        limitations: null,
        observationIds: ["obs_r2"],
        imageRefs: ["P2"],
      },
      {
        claimId: "r3",
        claim: "Unpolished case with factory chamfers",
        quote: "Unpolished, worn lightly 3 times",
        category: "condition",
        status: "supported",
        explanation: "Lugs retain sharp, crisp 90-degree factory brushing lines without rounding from rotary polishing wheels.",
        confidence: "high",
        limitations: null,
        observationIds: ["obs_r3"],
        imageRefs: ["P1"],
      },
    ];

    const a2: AnalysisRow = {
      id: "a_v2_analysis",
      verificationId: v2Id,
      modelUsed: "gemma-4-31b-it",
      productOverview: v2Overview,
      extractedClaims: [
        { id: "r1", claim: "Immaculate Cerachrom bezel", quote: "Immaculate Cerachrom ceramic bezel", category: "condition" },
        { id: "r2", claim: "Matching green warranty card", quote: "matching green warranty card", category: "accessories" },
        { id: "r3", claim: "Unpolished case", quote: "Unpolished, worn lightly", category: "condition" },
      ],
      visualObservations: [
        { id: "obs_r1", imageRef: "P1", observation: "Cerachrom insert and cyclops magnifier exhibit correct 2.5x magnification with anti-reflective coating.", damageType: null, severity: null, location: "Bezel & Dial" },
        { id: "obs_r2", imageRef: "P2", observation: "Rehaut lettering ROLEXROLEX aligns precisely with hour markers; serial matches papers.", damageType: null, severity: null, location: "Inner bezel & Card" },
      ],
      comparisons: v2Comparisons,
      discrepancies: [],
      unverifiableClaims: [],
      followUpQuestions: [
        { question: "Is the original sales invoice included to establish uninterrupted chain of ownership?", why: "Protects against future gray market authenticity disputes." }
      ],
      overallAssessment: {
        headline: "High Fidelity Verification — All Visual Claims Supported With 98% Confidence",
        summary: "Visual indicators, finishing standards, serial alignments, and included accessories correspond with an authentic, collector-grade timepiece in exemplary condition.",
        supportedCount: 3,
        discrepancyCount: 0,
        unverifiableCount: 0,
        evidenceCompleteness: "high",
        evidenceGaps: [],
        buyerGuidance: [
          "Listing is visually validated with high confidence.",
          "Use escrow or protected payment for final transaction security.",
        ],
        caveats: [
          "Movement timing / amplitude (caliber 3235) requires timegrapher evaluation.",
        ],
      },
      durationMs: 3820,
      createdAt: new Date(Date.now() - 22 * 3600 * 1000),
    };
    this.analyses.set(v2Id, a2);

    // 3. Sony WH-1000XM5 (Minor Wear)
    const v3Id = "v_sony_xm5_03";
    const v3: VerificationRow = {
      id: v3Id,
      userId,
      productName: "Sony WH-1000XM5 Wireless ANC Headphones — Platinum Silver",
      productCategory: "audio",
      listingUrl: null,
      sellerDescription:
        "Brand new in box open box. Unused, taken out only to verify contents. Flawless ear cushions, original travel case, 3.5mm cable and airplane adapter included.",
      additionalDetails: "Gift received last month, selling because already own AirPods Max.",
      status: "completed",
      errorMessage: null,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
      updatedAt: new Date(Date.now() - 48 * 3600 * 1000),
    };
    this.verifications.set(v3Id, v3);

    const img3_1 = "img_v3_headband";
    this.images.set(img3_1, {
      id: img3_1,
      userId,
      verificationId: v3Id,
      kind: "product",
      fileName: "headband_cushion.jpg",
      mimeType: "image/svg+xml",
      sizeBytes: 1024 * 32,
      data: createPlaceholderSvg("Headband Soft Foam", "Compression Indentation & Slight Sheen", "P1", "#78350f"),
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
    });

    const v3Overview: ProductOverview = {
      detectedProductType: "Over-Ear Wireless Headphones",
      brand: "Sony",
      model: "WH-1000XM5",
      visibleIdentifiers: ["Sony Bronze Script", "Seamless Slider Yoke"],
      summary: "Cosmetic evaluation reveals faint oil sheen and foam memory compression on top headband cushion inconsistent with strictly 'unused' condition.",
      uncertaintyNotes: null,
    };

    const v3Comparisons: ClaimComparison[] = [
      {
        claimId: "s1",
        claim: "Unused condition",
        quote: "Unused, taken out only to verify contents",
        category: "condition",
        status: "discrepancy",
        explanation: "Photo [P1] shows a subtle compression dent and surface sheen on the headband synthetic leather, characteristic of head wear.",
        confidence: "medium",
        limitations: "Could have occurred from snug packaging in storage case.",
        observationIds: ["obs_s1"],
        imageRefs: ["P1"],
      },
      {
        claimId: "s2",
        claim: "Original travel case and cables included",
        quote: "original travel case, 3.5mm cable and airplane adapter included",
        category: "accessories",
        status: "supported",
        explanation: "Collapsible magnetic travel case and OEM Sony gold-plated 3.5mm aux lead present.",
        confidence: "high",
        limitations: null,
        observationIds: ["obs_s2"],
        imageRefs: ["P1"],
      },
    ];

    const a3: AnalysisRow = {
      id: "a_v3_analysis",
      verificationId: v3Id,
      modelUsed: "gemma-4-31b-it",
      productOverview: v3Overview,
      extractedClaims: [
        { id: "s1", claim: "Unused condition", quote: "Unused, taken out only to verify contents", category: "condition" },
        { id: "s2", claim: "Original travel case included", quote: "original travel case", category: "accessories" },
      ],
      visualObservations: [
        { id: "obs_s1", imageRef: "P1", observation: "Synthetic leather headband cushion exhibits minor indentation marks.", damageType: "wear", severity: "minor", location: "Top inner headband" },
      ],
      comparisons: v3Comparisons,
      discrepancies: [v3Comparisons[0]],
      unverifiableClaims: [],
      followUpQuestions: [],
      overallAssessment: {
        headline: "1 Minor Cosmetic Discrepancy — Headband Cushion Shows Slight Compression",
        summary: "Headphones appear genuine and nearly immaculate, but headband cushion contact suggests brief head placement or case pressure. Safe purchase if priced accordingly.",
        supportedCount: 1,
        discrepancyCount: 1,
        unverifiableCount: 0,
        evidenceCompleteness: "medium",
        evidenceGaps: [],
        buyerGuidance: ["Good candidate for purchase; offer $20 below asking price."],
        caveats: ["Active Noise Canceling and microphone performance require in-person audio test."],
      },
      durationMs: 3100,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
    };
    this.analyses.set(v3Id, a3);
  }

  // API methods
  public async getVerificationBundle(userId: string, verificationId: string) {
    const v = this.verifications.get(verificationId);
    if (!v) return null;
    const a = this.analyses.get(verificationId) ?? null;
    const imgs = Array.from(this.images.values()).filter((img) => img.verificationId === verificationId);
    const msgs = this.conversations.get(verificationId) ?? [];

    const imageMetas: ImageMeta[] = imgs.map((img, idx) => ({
      id: img.id,
      kind: img.kind as "listing" | "product",
      fileName: img.fileName,
      mimeType: img.mimeType,
      sizeBytes: img.sizeBytes,
      url: `/api/images/${img.id}`,
      ref: `${img.kind === "product" ? "P" : "L"}${idx + 1}`,
    }));

    return {
      verification: v,
      analysis: a,
      images: imageMetas,
      messages: msgs,
    };
  }

  public async listVerifications(
    userId: string,
    options: { q?: string; page?: number; pageSize?: number } = {}
  ) {
    let all = Array.from(this.verifications.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    if (options.q && options.q.trim().length > 0) {
      const q = options.q.trim().toLowerCase();
      all = all.filter(
        (v) =>
          v.productName.toLowerCase().includes(q) ||
          v.sellerDescription.toLowerCase().includes(q) ||
          v.productCategory.toLowerCase().includes(q)
      );
    }

    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(60, Math.max(1, options.pageSize ?? 24));
    const total = all.length;
    const paged = all.slice((page - 1) * pageSize, page * pageSize);

    const items: VerificationSummary[] = paged.map((v) => {
      const a = this.analyses.get(v.id);
      const productImages = Array.from(this.images.values()).filter(
        (img) => img.verificationId === v.id && img.kind === "product"
      );
      const thumb = productImages[0] ? `/api/images/${productImages[0].id}` : null;

      const comparisons = a?.comparisons ?? null;

      return {
        id: v.id,
        productName: v.productName,
        productCategory: v.productCategory,
        status: v.status as VerificationSummary["status"],
        createdAt: v.createdAt.toISOString(),
        thumbnailUrl: thumb,
        discrepancyCount: comparisons
          ? comparisons.filter((c) => c.status === "discrepancy").length
          : null,
        supportedCount: comparisons
          ? comparisons.filter((c) => c.status === "supported").length
          : null,
        unverifiableCount: comparisons
          ? comparisons.filter((c) => c.status === "unverifiable").length
          : null,
      };
    });

    return { items, total, page, pageSize };
  }

  public async getDashboardStats(userId: string) {
    const all = Array.from(this.verifications.values());
    const allAnalyses = Array.from(this.analyses.values());

    const breakdown = { supported: 0, discrepancy: 0, unverifiable: 0 };
    let claimsAssessed = 0;

    for (const a of allAnalyses) {
      for (const c of a.comparisons) {
        if (c.status in breakdown) {
          breakdown[c.status] += 1;
        }
        claimsAssessed += 1;
      }
    }

    const activity: { date: string; count: number }[] = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const buckets = new Map<string, number>();
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(today.getTime() - i * dayMs);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    for (const v of all) {
      const key = v.createdAt.toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    for (const [date, value] of buckets) activity.push({ date, count: value });

    const recentList = await this.listVerifications(userId, { pageSize: 6 });

    return {
      totals: {
        verifications: all.length,
        completedReports: allAnalyses.length,
        discrepancies: breakdown.discrepancy,
        claimsAssessed,
      },
      breakdown,
      activity,
      recent: recentList.items,
    };
  }

  public async saveVerification(v: VerificationRow) {
    this.verifications.set(v.id, v);
    return v;
  }

  public async updateVerificationStatus(id: string, status: string, errorMessage?: string | null) {
    const v = this.verifications.get(id);
    if (v) {
      v.status = status;
      if (errorMessage !== undefined) v.errorMessage = errorMessage;
      v.updatedAt = new Date();
      this.verifications.set(id, v);
    }
  }

  public async deleteVerification(id: string) {
    this.verifications.delete(id);
    this.analyses.delete(id);
    this.conversations.delete(id);
    for (const [imgId, img] of this.images.entries()) {
      if (img.verificationId === id) {
        this.images.delete(imgId);
      }
    }
  }

  public async saveImage(img: ImageRow) {
    this.images.set(img.id, img);
    return img;
  }

  public async getImage(id: string) {
    return this.images.get(id) ?? null;
  }

  public async getImagesForVerification(verificationId: string) {
    return Array.from(this.images.values()).filter((img) => img.verificationId === verificationId);
  }

  public async assignImages(verificationId: string, productIds: string[], listingIds: string[]) {
    for (const pid of productIds) {
      const img = this.images.get(pid);
      if (img) {
        img.verificationId = verificationId;
        img.kind = "product";
      }
    }
    for (const lid of listingIds) {
      const img = this.images.get(lid);
      if (img) {
        img.verificationId = verificationId;
        img.kind = "listing";
      }
    }
  }

  public async saveAnalysis(a: AnalysisRow) {
    this.analyses.set(a.verificationId, a);
    return a;
  }

  public async appendChatMessage(verificationId: string, msg: ChatMessage) {
    const existing = this.conversations.get(verificationId) ?? [];
    existing.push(msg);
    this.conversations.set(verificationId, existing);
    return existing;
  }
}

// Global singleton
const globalForStore = globalThis as typeof globalThis & {
  __realityCheckStore?: MemoryStore;
};

export const memoryStore = globalForStore.__realityCheckStore ?? new MemoryStore();

if (process.env.NODE_ENV !== "production") {
  globalForStore.__realityCheckStore = memoryStore;
}

