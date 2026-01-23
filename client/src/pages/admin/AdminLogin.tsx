import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2, AlertTriangle } from "lucide-react";

export default function AdminLogin() {
  const { user, loading, login } = useAuth();
  const [, setLocation] = useLocation();
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const role = user.role || "student";
      if (role === "owner" || role === "teacher" || role === "admin") {
        setLocation("/admin");
      } else {
        setError("You don't have admin access. Please use the regular login page.");
      }
    }
  }, [user, loading, setLocation]);

  const handleAdminLogin = async () => {
    setVerifying(true);
    setError("");
    
    try {
      const expectedCode = "TUTOR2024";
      if (adminCode.toUpperCase() === expectedCode) {
        localStorage.setItem("admin_verified", "true");
        sessionStorage.setItem("intended_role", "admin");
        login();
      } else {
        setError("Invalid admin access code");
        setVerifying(false);
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4" data-testid="admin-login-page">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            Restricted area for authorized administrators only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" data-testid="admin-login-error">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminCode">Admin Access Code</Label>
              <Input
                id="adminCode"
                type="password"
                placeholder="Enter your admin code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                data-testid="admin-code-input"
              />
              <p className="text-xs text-muted-foreground">
                Contact your system administrator if you don't have an access code.
              </p>
            </div>

            <Button 
              onClick={handleAdminLogin}
              disabled={verifying || !adminCode.trim()}
              className="w-full h-12 text-base bg-red-500 hover:bg-red-600"
              data-testid="admin-login-btn"
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Access Admin Portal"
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-4 border-t">
            Not an admin? <a href="/login" className="text-primary hover:underline">Regular Login</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
