import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { api, ApiError } from "../../lib/api";
import type { CurrentUser } from "../../types/api";

type AuthContextValue = {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      const response = await api<{ user: CurrentUser }>("/auth/me");
      setUser(response.user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        return;
      }

      throw error;
    }
  };

  useEffect(() => {
    refresh()
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login: async (email: string, password: string) => {
        const response = await api<{ user: CurrentUser }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });

        setUser(response.user);
      },
      logout: async () => {
        await api("/auth/logout", {
          method: "POST"
        });
        setUser(null);
      },
      refresh
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
