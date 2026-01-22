import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldX, Home, LogOut } from "lucide-react";
import { getRoleHomeRoute } from "@/components/ProtectedRoute";

export default function Unauthorized() {
  const { user, logout } = useAuth();
  const userRole = user?.role || "student";
  const homeRoute = getRoleHomeRoute(userRole);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="unauthorized-page">
      <div className="text-center max-w-md px-6">
        <div className="mb-6">
          <ShieldX className="h-20 w-20 text-destructive mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          You don't have permission to access this page. This area is restricted to authorized users only.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <>
              <Link href={homeRoute}>
                <Button className="w-full sm:w-auto" data-testid="go-home-btn">
                  <Home className="mr-2 h-4 w-4" />
                  Go to My Home
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={logout}
                data-testid="logout-btn"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button data-testid="login-btn">
                Go to Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
