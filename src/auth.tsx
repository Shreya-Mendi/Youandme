import { createContext, useContext } from "react";
import type { Session } from "./lib/auth";

interface AuthValue {
  session: Session;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({
  session,
  logout,
  children,
}: {
  session: Session;
  logout: () => void;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={{ session, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
