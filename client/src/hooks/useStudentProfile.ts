import { useQuery } from "@tanstack/react-query";

interface StudentProfile {
  id: number;
  userId: string;
  displayName: string | null;
  role: string;
  grade: number | null;
  avatarUrl: string | null;
}

export function useStudentProfile() {
  const { data: profile, isLoading, error } = useQuery<StudentProfile>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const grade = profile?.grade || 9;

  return {
    profile,
    grade,
    isLoading,
    error,
  };
}
