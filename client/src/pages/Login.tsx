import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Loader2 } from "lucide-react";
import { getRoleHomeRoute } from "@/components/ProtectedRoute";

export default function Login() {
  const { user, loading, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      const homeRoute = getRoleHomeRoute(user.role || "student");
      setLocation(homeRoute);
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4" data-testid="login-page">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Virtual Human Tutor</CardTitle>
          <CardDescription>
            Sign in to access your personalized learning experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={login} 
            className="w-full h-12 text-base"
            data-testid="login-with-replit"
          >
            Sign in with Replit
          </Button>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <Users className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
            <div className="text-center">
              <BookOpen className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Parents</p>
            </div>
            <div className="text-center">
              <GraduationCap className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Tutors</p>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Looking for admin access? <a href="/admin/login" className="text-primary hover:underline">Admin Login</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
