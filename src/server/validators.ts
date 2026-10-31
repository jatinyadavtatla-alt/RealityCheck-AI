import { z } from "zod";

const uuid = z.string().uuid();

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name is too long."),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(160),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.").max(128),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required.").max(128),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters.")
    .max(128, "Password is too long."),
});

const optionalUrl = z
  .string()
  .trim()
  .max(500, "Listing URL is too long.")
  .refine(
    (v) => v === "" || /^https?:\/\/.+/i.test(v),
    "Listing URL must start with http:// or https://"
  )
  .optional();

export const createVerificationSchema = z.object({
  productName: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters.")
    .max(140, "Product name is too long."),
  productCategory: z
    .string()
    .trim()
    .min(2)
    .max(60),
  listingUrl: optionalUrl,
  sellerDescription: z
    .string()
    .trim()
    .min(10, "Seller description must be at least 10 characters.")
    .max(8000, "Seller description must be under 8000 characters."),
  additionalDetails: z
    .string()
    .trim()
    .max(2000, "Additional details must be under 2000 characters.")
    .optional(),
  listingImageIds: z.array(uuid).max(6, "Up to 6 listing screenshots.").default([]),
  productImageIds: z
    .array(uuid)
    .min(1, "Upload at least one product photograph.")
    .max(10, "Up to 10 product photographs."),
});

export const assistantMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message is too long."),
});

export const historyQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
