import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  clearSession,
  getStoredUser,
  getToken,
  onUnauthorized,
  request,
  storeSession,
  type CurrentUser,
} from "@/api/client";
import type { LoginResponse, MeResponse, Permissions } from "@/api/types";

interface AuthContextValue {
  user: CurrentUser | null;
  permissions: Permissions | null;
  pendingCount: number;
  /** True until the initial /me/ round trip settles, to avoid a login flash. */
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: keyof Permissions) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const EMPTY_PERMISSIONS = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => getToken());
  // Seeded from localStorage so a reload renders the shell immediately
  // instead of blanking while /me/ is in flight.
  const [user, setUser] = useState<CurrentUser | null>(() => getStoredUser());

  // A 401 from any request means the Knox token lapsed; drop straight to login.
  useEffect(
    () =>
      onUnauthorized(() => {
        setToken(null);
        setUser(null);
        queryClient.clear();
      }),
    [queryClient],
  );

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => request<MeResponse>("/me/"),
    enabled: Boolean(token),
    staleTime: 60_000,
    retry: false,
  });

  // Keep the cached identity fresh — role or station assignment can change
  // server-side while a session is open.
  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data.user);
      const current = getToken();
      if (current) storeSession(current, meQuery.data.user);
    }
  }, [meQuery.data]);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await request<LoginResponse>("/auth/login/", {
        method: "POST",
        body: { username, password },
      });
      storeSession(result.token, result.user);
      setToken(result.token);
      setUser(result.user);
      await queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    // Best-effort server-side revoke; the local session goes either way.
    void request("/api/auth/logout/", { method: "POST" }).catch(() => undefined);
    clearSession();
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const permissions = meQuery.data?.permissions ?? EMPTY_PERMISSIONS;

  const value = useMemo<AuthContextValue>(
    () => ({
      user: token ? user : null,
      permissions,
      pendingCount: meQuery.data?.pending_count ?? 0,
      loading: Boolean(token) && meQuery.isLoading,
      login,
      logout,
      can: (permission) => Boolean(permissions?.[permission]),
    }),
    [token, user, permissions, meQuery.data?.pending_count, meQuery.isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
