"use client";

import { createContext, useContext, type ReactNode } from "react";
import { authClient } from "~/lib/auth-client";

type SessionData = typeof authClient.$Infer.Session;

const SessionContext = createContext<SessionData | null>(null);

export function SessionProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession: SessionData | null;
}) {
  const { data: session } = authClient.useSession();
  return (
    <SessionContext.Provider value={session ?? initialSession}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
