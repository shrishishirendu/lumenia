import type { RequestHandler } from "express";
import { tutoringStorage } from "../storage";

export type UserRole = "student" | "parent" | "teacher" | "owner" | "admin";

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized - not logged in" });
      }

      const profile = await tutoringStorage.getProfileByUserId(userId);
      
      if (!profile) {
        return res.status(403).json({ error: "Forbidden - no profile found" });
      }

      const userRole = profile.role as UserRole;
      const isAllowed = allowedRoles.some(role => 
        role === userRole || 
        (role === "admin" && userRole === "owner") ||
        (role === "owner" && userRole === "admin")
      );
      
      if (!isAllowed) {
        console.log(`Access denied: User ${userId} with role ${userRole} tried to access route requiring ${allowedRoles.join(", ")}`);
        return res.status(403).json({ 
          error: "Forbidden - insufficient permissions",
          requiredRoles: allowedRoles,
          userRole: userRole
        });
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error("Role auth middleware error:", error);
      res.status(500).json({ error: "Internal server error during authorization" });
    }
  };
}

export const requireAdmin: RequestHandler = requireRole("owner", "teacher", "admin");
export const requireTeacher: RequestHandler = requireRole("teacher", "owner");
export const requireStudent: RequestHandler = requireRole("student");
export const requireParent: RequestHandler = requireRole("parent");
