import "server-only";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getJwtSecret } from "@/server/env";

export const SESSION_COOKIE = "rc_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function createToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(encoder.encode(getJwtSecret()));
}

export async function setSessionCookie(userId: string): Promise<void> {
  const token = await createToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const DEFAULT_USER: SessionUser = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Alex Vance",
  email: "alex@realitycheck.ai",
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  // Authentication & authorization removed completely for now — open dashboard directly
  return DEFAULT_USER;
}
