import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  customType,
  index,
} from "drizzle-orm/pg-core";
import type {
  ExtractedClaim,
  VisualObservation,
  ClaimComparison,
  UnverifiableClaim,
  FollowUpQuestion,
  ProductOverview,
  OverallAssessment,
  ChatMessage,
} from "@/lib/types";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
  toDriver(value) {
    return value;
  },
  fromDriver(value) {
    return value as Buffer;
  },
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("users_email_idx").on(t.email)]
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productName: text("product_name").notNull(),
    productCategory: text("product_category").notNull(),
    listingUrl: text("listing_url"),
    sellerDescription: text("seller_description").notNull(),
    additionalDetails: text("additional_details"),
    status: text("status").notNull().default("draft"), // draft | analyzing | completed | failed
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("verifications_user_idx").on(t.userId),
    index("verifications_created_idx").on(t.createdAt),
  ]
);

export const images = pgTable(
  "images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    verificationId: uuid("verification_id").references(() => verifications.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(), // listing | product
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    data: bytea("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("images_verification_idx").on(t.verificationId),
    index("images_user_idx").on(t.userId),
  ]
);

export const analyses = pgTable("analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  verificationId: uuid("verification_id")
    .notNull()
    .unique()
    .references(() => verifications.id, { onDelete: "cascade" }),
  modelUsed: text("model_used").notNull(),
  productOverview: jsonb("product_overview").$type<ProductOverview>().notNull(),
  extractedClaims: jsonb("extracted_claims").$type<ExtractedClaim[]>().notNull(),
  visualObservations: jsonb("visual_observations")
    .$type<VisualObservation[]>()
    .notNull(),
  comparisons: jsonb("comparisons").$type<ClaimComparison[]>().notNull(),
  discrepancies: jsonb("discrepancies").$type<ClaimComparison[]>().notNull(),
  unverifiableClaims: jsonb("unverifiable_claims")
    .$type<UnverifiableClaim[]>()
    .notNull(),
  followUpQuestions: jsonb("follow_up_questions")
    .$type<FollowUpQuestion[]>()
    .notNull(),
  overallAssessment: jsonb("overall_assessment")
    .$type<OverallAssessment>()
    .notNull(),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    verificationId: uuid("verification_id")
      .notNull()
      .unique()
      .references(() => verifications.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    messages: jsonb("messages").$type<ChatMessage[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("conversations_user_idx").on(t.userId)]
);

export type UserRow = typeof users.$inferSelect;
export type VerificationRow = typeof verifications.$inferSelect;
export type ImageRow = typeof images.$inferSelect;
export type AnalysisRow = typeof analyses.$inferSelect;
export type ConversationRow = typeof conversations.$inferSelect;
