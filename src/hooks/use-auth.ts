
"use client";

import type { User } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateUserProfile as updateUserProfileServerAction } from "@/lib/auth-actions";


const USER_STORAGE_KEY = "test_pilot_user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  signup: (userData: User) => void; 
  updateUserProfileData: (updates: { displayName?: string; dob?: string; profileImageUrl?: string }) => Promise<{success: boolean; message: string; user?: User}>;
}

// Helper to ensure user object integrity, especially for data from localStorage or passed to login/signup
function ensureUserIntegrityForContext(user: Partial<User>): User {
  let { id, displayName, email, dob, role, profileImageUrl } = user;

  id = id || `temp-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;

  if (!displayName) {
    if (email) {
      const namePart = email.split('@')[0];
      displayName = namePart
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } else {
      displayName = `User-${id.substring(0, 5)}`;
    }
  }
  
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    dob = "1900-01-01"; 
  }

  role = role || "student";
  if (role !== "teacher" && role !== "student") {
      role = "student";
  }

  return {
    id,
    displayName,
    email: email || undefined,
    dob,
    role,
    profileImageUrl: profileImageUrl || undefined,
  };
}


export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true); 
    try {
      const storedUserString = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUserString) {
        let parsedUser = JSON.parse(storedUserString) as Partial<User>;
        if (
          parsedUser && 
          typeof parsedUser.id === 'string' && parsedUser.id.trim() !== '' &&
          typeof parsedUser.displayName === 'string' && parsedUser.displayName.trim() !== '' &&
          typeof parsedUser.dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsedUser.dob) && 
          typeof parsedUser.role === 'string' && (parsedUser.role === 'teacher' || parsedUser.role === 'student')
        ) {
          setUser(ensureUserIntegrityForContext(parsedUser as User));
        } else {
          console.warn("Stored user data in localStorage is invalid or incomplete. Clearing session. Data:", JSON.stringify(parsedUser));
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
        }
      } else {
        setUser(null); 
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage during auth init:", error);
      localStorage.removeItem(USER_STORAGE_KEY); 
      setUser(null); 
    } finally {
      setIsLoading(false); 
    }
  }, []);

  const login = useCallback((userData: User) => { 
    try {
      if (
        userData && 
        typeof userData.id === 'string' && userData.id.trim() !== '' &&
        typeof userData.displayName === 'string' && userData.displayName.trim() !== '' &&
        typeof userData.dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(userData.dob) &&
        typeof userData.role === 'string' && (userData.role === 'teacher' || userData.role === 'student')
      ) {
        const userToStore = ensureUserIntegrityForContext(userData); 
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
        setUser(userToStore);
      } else {
        console.error("Attempted to login with invalid userData. Data received:", JSON.stringify(userData), "Expected id, displayName, dob (YYYY-MM-DD), role to be valid strings.");
      }
    } catch (error) {
        console.error("Failed to save user to localStorage on login:", error);
    }
  }, []);
  
  const signup = useCallback((userData: User) => { 
    try {
       if (
        userData && 
        typeof userData.id === 'string' && userData.id.trim() !== '' &&
        typeof userData.displayName === 'string' && userData.displayName.trim() !== '' &&
        typeof userData.dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(userData.dob) &&
        typeof userData.role === 'string' && (userData.role === 'teacher' || userData.role === 'student')
      ) {
        const userToStore = ensureUserIntegrityForContext(userData); 
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
        setUser(userToStore);
      } else {
        console.error("Attempted to signup with invalid userData. Data received:", JSON.stringify(userData), "Expected id, displayName, dob (YYYY-MM-DD), role to be valid strings.");
      }
    } catch (error) {
        console.error("Failed to save user to localStorage on signup:", error);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
        console.error("Failed to remove user from localStorage on logout:", error);
    }
    setUser(null);
    router.push("/auth/login");
  }, [router]);

  const updateUserProfileData = useCallback(async (updates: { displayName?: string; dob?: string; profileImageUrl?: string }) => {
    if (!user) {
      return { success: false, message: "No user logged in." };
    }
    const result = await updateUserProfileServerAction(user.id, updates);
    if (result.success && result.user) {
      const updatedUser = ensureUserIntegrityForContext(result.user);
      setUser(updatedUser);
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      } catch (error) {
        console.error("Failed to update user in localStorage:", error);
        // Non-critical error, proceed
      }
    }
    return result;
  }, [user]);


  return { user, isLoading, login, logout, signup, updateUserProfileData };
}
