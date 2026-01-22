import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
  id: string;
  email?: string;
  username?: string;
  role?: string;
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
    const checkAuth = async () => {
      try {
        const authRes = await fetch("/api/auth/check");
        const authData = await authRes.json();
        if (authData.loggedIn && authData.user) {
          const intendedRole = sessionStorage.getItem("intended_role");
          
          if (intendedRole) {
            sessionStorage.removeItem("intended_role");
            const roleMap: Record<string, string> = {
              student: "student",
              parent: "parent", 
              tutor: "teacher",
              admin: "owner"
            };
            const mappedRole = roleMap[intendedRole] || "student";
            
            await fetch("/api/profile/role", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role: mappedRole })
            });
            
            setUser({ ...authData.user, role: mappedRole });
          } else {
            const profileRes = await fetch("/api/profile");
            if (profileRes.ok) {
              const profile = await profileRes.json();
              setUser({ ...authData.user, role: profile.role || "student" });
            } else {
              setUser({ ...authData.user, role: "student" });
            }
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
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
