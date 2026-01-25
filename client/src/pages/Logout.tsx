import { useEffect, useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";

export default function Logout() {
  const [status, setStatus] = useState<"loading" | "success" | "redirecting">("loading");

  useEffect(() => {
    const performLogout = async () => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        localStorage.removeItem("lumenia_role");
        localStorage.removeItem("lumenia_session_started");
        localStorage.removeItem("lumenia_closure_shown");
        
        setStatus("redirecting");
        
        window.location.href = "/api/logout";
      } catch (error) {
        console.error("Logout error:", error);
        window.location.href = "/";
      }
    };

    const alreadyLoggingOut = sessionStorage.getItem("logging_out");
    if (!alreadyLoggingOut) {
      sessionStorage.setItem("logging_out", "true");
      performLogout();
    } else {
      window.location.href = "/";
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="logout-page">
      <div className="text-center">
        {status === "loading" ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Preparing to log out...</p>
          </>
        ) : status === "redirecting" ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Logging you out...</p>
          </>
        ) : (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">You have been logged out.</p>
          </>
        )}
      </div>
    </div>
  );
}
