import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
  id: string;
  email?: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth status on mount
    fetch("/api/auth/check")
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn && data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const login = () => {
    // Force a full page navigation, not SPA routing
    window.location.replace("/api/login");
  };

  const logout = () => {
    fetch("/api/logout", { method: "GET" })
      .then(() => {
        setUser(null);
        window.location.href = "/";
      })
      .catch(console.error);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
