import "server-only";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { AuthorizationError } from "./errors";
import type { NextRequest } from "next/server";

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function getServerUser() {
  const session = await getServerSession();
  if (!session?.user) {
    throw new AuthorizationError();
  }
  return session.user;
}

export async function getServerUserId() {
  const user = await getServerUser();
  return user.id;
}

// For API routes that receive NextRequest
export async function getServerSessionFromRequest(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return session;
}

export async function getServerUserIdFromRequest(req: NextRequest) {
  const session = await getServerSessionFromRequest(req);
  if (!session?.user) {
    throw new AuthorizationError();
  }
  return session.user.id;
}

