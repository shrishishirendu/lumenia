import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Logout() {
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
    
    window.location.href = "/api/logout";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="logout-page">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">Logging you out...</p>
      </div>
    </div>
  );
}
