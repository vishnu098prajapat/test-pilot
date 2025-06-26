
"use client";

import type { User } from "@/lib/types";
import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { updateUserProfile as updateUserProfileServerAction } from "@/lib/auth-actions";


const USER_STORAGE_KEY = "test_pilot_user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUserProfileData: (updates: { displayName?: string; dob?: string; profileImageUrl?: string }) => Promise<{success: boolean; message: string; user?: User;}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Helper to ensure user object integrity from DB or other sources
  const ensureUserIntegrityForContext = (user: Partial<User>): User => {
    let { id, displayName, email, dob, role, profileImageUrl, signupIp, signupTimestamp } = user;
    id = id || `temp-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
    if (!displayName || String(displayName).trim() === "") {
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
  
    // Ensure displayName is a string before calling trim()
    displayName = String(displayName).trim();


    if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) dob = "1900-01-01";
    role = (role === 'teacher' || role === 'student') ? role : "student";
    return { id, displayName, email: email || undefined, dob, role, profileImageUrl: profileImageUrl || undefined, signupIp: signupIp || undefined, signupTimestamp: signupTimestamp || undefined };
  }

  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === USER_STORAGE_KEY) {
      console.log("[Auth] Storage event detected. Syncing auth state across tabs.");
      const newUserString = event.newValue;
      if (newUserString) {
        try {
          const newUser = JSON.parse(newUserString);
          setUser(ensureUserIntegrityForContext(newUser));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    setIsLoading(true); 
    try {
      const storedUserString = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUserString) {
        let parsedUser = JSON.parse(storedUserString) as Partial<User>;
        if (parsedUser && typeof parsedUser.id === 'string' && parsedUser.id.trim() !== '') {
          setUser(ensureUserIntegrityForContext(parsedUser));
        } else {
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
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleStorageChange]);

  const login = useCallback((userData: User) => { 
    try {
      if (userData && typeof userData.id === 'string' && userData.id.trim() !== '') {
        const userToStore = ensureUserIntegrityForContext(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
        setUser(userToStore);
      } else {
        console.error("Attempted to login with invalid userData. Data received:", JSON.stringify(userData));
      }
    } catch (error) {
        console.error("Failed to save user to localStorage on login:", error);
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
    if (!user) return { success: false, message: "No user logged in." };
    const result = await updateUserProfileServerAction(user.id, updates);
    if (result.success && result.user) {
      const updatedUser = ensureUserIntegrityForContext(result.user);
      setUser(updatedUser);
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser)); 
      } catch (error) {
        console.error("Failed to update user in localStorage:", error);
      }
    }
    return result;
  }, [user]);

  return React.createElement(
    AuthContext.Provider,
    { value: { user, isLoading, login, logout, updateUserProfileData } },
    children
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
