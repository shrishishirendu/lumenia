import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { ParentLayout } from "@/layouts/ParentLayout";
import { TutorLayout } from "@/layouts/TutorLayout";
import { AdminLayout } from "@/layouts/AdminLayout";

import NotFound from "@/pages/not-found";
import PublicLanding from "@/pages/PublicLanding";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Login from "@/pages/Login";
import Logout from "@/pages/Logout";
import Unauthorized from "@/pages/Unauthorized";
import Onboarding from "@/pages/Onboarding";

import Classroom from "@/pages/Classroom";
import StudentDashboard from "@/pages/StudentDashboard";
import StudentToday from "@/pages/student/StudentToday";
import SessionFlow from "@/pages/student/SessionFlow";
import Practice from "@/pages/student/Practice";
import ParentPortal from "@/pages/ParentPortal";
import TutorDashboard from "@/pages/TutorDashboard";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminStudents from "@/pages/admin/AdminStudents";
import Student360 from "@/pages/admin/Student360";
import Growth from "@/pages/Growth";
import Orchestration from "@/pages/Orchestration";
import MarketingAgent from "@/pages/MarketingAgent";
import OpsAgent from "@/pages/OpsAgent";
import AdmissionsAgent from "@/pages/AdmissionsAgent";
import AcademicQualityAgent from "@/pages/AcademicQualityAgent";
import { BiDashboard } from "@/features/bi";

function StudentClassroomPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentLayout>
        <Classroom />
      </StudentLayout>
    </ProtectedRoute>
  );
}

function StudentHomePage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentLayout>
        <StudentToday />
      </StudentLayout>
    </ProtectedRoute>
  );
}

function StudentLegacyDashboard() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentLayout>
        <StudentDashboard />
      </StudentLayout>
    </ProtectedRoute>
  );
}

function StudentSessionPage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentLayout>
        <SessionFlow />
      </StudentLayout>
    </ProtectedRoute>
  );
}

function StudentPracticePage() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentLayout>
        <Practice />
      </StudentLayout>
    </ProtectedRoute>
  );
}

function ParentHomePage() {
  return (
    <ProtectedRoute allowedRoles={["parent"]}>
      <ParentLayout>
        <ParentPortal />
      </ParentLayout>
    </ProtectedRoute>
  );
}

function TutorHomePage() {
  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <TutorLayout>
        <TutorDashboard />
      </TutorLayout>
    </ProtectedRoute>
  );
}

function AdminHomePage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "teacher"]}>
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function AdminStudentsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "teacher"]}>
      <AdminLayout>
        <AdminStudents />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function AdminStudent360Page() {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "teacher"]}>
      <AdminLayout>
        <Student360 />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function AdminGrowthPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "teacher"]}>
      <AdminLayout>
        <Growth />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function AdminBiPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "teacher"]}>
      <AdminLayout>
        <BiDashboard />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function AdminOrchestrationPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "teacher"]}>
      <AdminLayout>
        <Orchestration />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function AdminMarketingPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "teacher"]}>
      <AdminLayout>
        <MarketingAgent />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function AdminOpsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "teacher"]}>
      <AdminLayout>
        <OpsAgent />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function AdminAdmissionsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "teacher"]}>
      <AdminLayout>
        <AdmissionsAgent />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function AdminAcademicQualityPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner", "teacher"]}>
      <AdminLayout>
        <AcademicQualityAgent />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={PublicLanding} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/login" component={Login} />
      <Route path="/logout" component={Logout} />
      <Route path="/unauthorized" component={Unauthorized} />
      <Route path="/onboarding" component={Onboarding} />
      
      <Route path="/student" component={StudentHomePage} />
      <Route path="/student/today" component={StudentHomePage} />
      <Route path="/student/classroom" component={StudentClassroomPage} />
      <Route path="/student/practice" component={StudentPracticePage} />
      <Route path="/student/session/:subject/:topic" component={StudentSessionPage} />
      
      <Route path="/parent" component={ParentHomePage} />
      
      <Route path="/tutor" component={TutorHomePage} />
      
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/students/:id" component={AdminStudent360Page} />
      <Route path="/admin/students" component={AdminStudentsPage} />
      <Route path="/admin/growth" component={AdminGrowthPage} />
      <Route path="/admin/bi" component={AdminBiPage} />
      <Route path="/admin/orchestration" component={AdminOrchestrationPage} />
      <Route path="/admin/marketing" component={AdminMarketingPage} />
      <Route path="/admin/ops" component={AdminOpsPage} />
      <Route path="/admin/admissions" component={AdminAdmissionsPage} />
      <Route path="/admin/academic-quality" component={AdminAcademicQualityPage} />
      <Route path="/admin" component={AdminHomePage} />
      
      <Route path="/classroom">
        {() => <Redirect to="/student/classroom" />}
      </Route>
      <Route path="/dashboard">
        {() => <Redirect to="/admin" />}
      </Route>
      <Route path="/growth">
        {() => <Redirect to="/admin/growth" />}
      </Route>
      <Route path="/orchestration">
        {() => <Redirect to="/admin/orchestration" />}
      </Route>
      <Route path="/marketing-agent">
        {() => <Redirect to="/admin/marketing" />}
      </Route>
      <Route path="/ops-agent">
        {() => <Redirect to="/admin/ops" />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
