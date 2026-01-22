import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export type UserRole = "student" | "parent" | "teacher" | "owner" | "admin";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  student: "/student",
  parent: "/parent",
  teacher: "/tutor",
  owner: "/admin",
  admin: "/admin",
};

export function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const userRole = (user?.role || "student") as UserRole;
  const normalizedRole = userRole === "owner" ? "admin" : userRole;
  const isAllowed = user && allowedRoles.some(role => 
    role === userRole || (role === "admin" && userRole === "owner")
  );

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setLocation("/login");
      return;
    }

    if (!isAllowed) {
      if (redirectTo) {
        setLocation(redirectTo);
      } else {
        setLocation("/unauthorized");
      }
    }
  }, [user, loading, isAllowed, redirectTo, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="loading-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAllowed) {
    return null;
  }

  return <>{children}</>;
}

export function getRoleHomeRoute(role: string): string {
  const normalizedRole = (role === "owner" ? "admin" : role) as UserRole;
  return ROLE_HOME_ROUTES[normalizedRole] || "/";
}
