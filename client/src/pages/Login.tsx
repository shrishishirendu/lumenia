import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Shield, Loader2, ArrowRight } from "lucide-react";
import { getRoleHomeRoute } from "@/components/ProtectedRoute";

type RoleOption = "student" | "parent" | "tutor" | "admin";

const roleConfig = {
  student: {
    title: "Student",
    description: "Access your classroom, practice problems, and track your learning journey",
    icon: Users,
    color: "bg-blue-500",
    hoverColor: "hover:border-blue-500",
    textColor: "text-blue-600"
  },
  parent: {
    title: "Parent",
    description: "Monitor your child's progress, view reports, and communicate with tutors",
    icon: BookOpen,
    color: "bg-green-500",
    hoverColor: "hover:border-green-500",
    textColor: "text-green-600"
  },
  tutor: {
    title: "Tutor",
    description: "Manage students, view sessions, and track teaching outcomes",
    icon: GraduationCap,
    color: "bg-purple-500",
    hoverColor: "hover:border-purple-500",
    textColor: "text-purple-600"
  },
  admin: {
    title: "Administrator",
    description: "Full platform access with dashboard, analytics, and system controls",
    icon: Shield,
    color: "bg-red-500",
    hoverColor: "hover:border-red-500",
    textColor: "text-red-600"
  }
};

export default function Login() {
  const { user, loading, login } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);

  useEffect(() => {
    if (!loading && user) {
      const homeRoute = getRoleHomeRoute(user.role || "student");
      setLocation(homeRoute);
    }
  }, [user, loading, setLocation]);

  const handleRoleSelect = (role: RoleOption) => {
    setSelectedRole(role);
  };

  const handleLogin = () => {
    if (selectedRole) {
      sessionStorage.setItem("intended_role", selectedRole);
      if (selectedRole === "admin") {
        setLocation("/admin/login");
      } else {
        login();
      }
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4" data-testid="login-page">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Virtual Human Tutor</h1>
          <p className="text-muted-foreground mt-2">
            Select your role to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {(Object.entries(roleConfig) as [RoleOption, typeof roleConfig.student][]).map(([role, config]) => {
            const Icon = config.icon;
            const isSelected = selectedRole === role;
            
            return (
              <Card 
                key={role}
                className={`cursor-pointer transition-all duration-200 ${config.hoverColor} ${
                  isSelected ? `border-2 ${config.textColor} shadow-lg` : "border hover:shadow-md"
                }`}
                onClick={() => handleRoleSelect(role)}
                data-testid={`role-${role}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{config.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {config.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button 
          onClick={handleLogin}
          disabled={!selectedRole}
          className="w-full h-12 text-base"
          data-testid="continue-login"
        >
          {selectedRole ? (
            <>
              Continue as {roleConfig[selectedRole].title}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            "Select a role to continue"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
