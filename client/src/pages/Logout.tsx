import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { LogOut, Loader2 } from "lucide-react";

export default function Logout() {
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(true);

  useEffect(() => {
    const performLogout = async () => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        await fetch("/api/logout", { 
          method: "GET",
          credentials: "include"
        });
        
        window.location.href = "/";
      } catch (error) {
        console.error("Logout error:", error);
        window.location.href = "/";
      } finally {
        setLoggingOut(false);
      }
    };

    performLogout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="logout-page">
      <div className="text-center">
        {loggingOut ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Logging you out...</p>
          </>
        ) : (
          <>
            <LogOut className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">You have been logged out.</p>
          </>
        )}
      </div>
    </div>
  );
}
