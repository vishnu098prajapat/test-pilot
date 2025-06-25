
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
  let { id, displayName, email, dob, role, profileImageUrl, signupIp, signupTimestamp } = user;

  // Ensure ID exists, generate if temporary or missing
  id = id || `temp-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;

  // Ensure displayName, fallback to email or generic
  if (!displayName || displayName.trim() === "") {
    if (email && email.includes('@')) {
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


  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    dob = "1900-01-01"; 
  }

  // Ensure role is valid or default
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
    signupIp: signupIp || undefined,
    signupTimestamp: signupTimestamp || undefined,
  };
}


export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
        // Key was removed or set to null, meaning logout happened in another tab
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
        // Validate crucial fields before setting user
        if (
          parsedUser && 
          typeof parsedUser.id === 'string' && parsedUser.id.trim() !== '' &&
          typeof parsedUser.displayName === 'string' && parsedUser.displayName.trim() !== '' &&
          typeof parsedUser.dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsedUser.dob) && 
          typeof parsedUser.role === 'string' && (parsedUser.role === 'teacher' || parsedUser.role === 'student')
        ) {
          setUser(ensureUserIntegrityForContext(parsedUser)); // Use ensured user
        } else {
          console.warn("Stored user data in localStorage is invalid or incomplete. Clearing session. Data:", JSON.stringify(parsedUser));
          localStorage.removeItem(USER_STORAGE_KEY);
          setUser(null);
        }
      } else {
        setUser(null); // No user in storage
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage during auth init:", error);
      localStorage.removeItem(USER_STORAGE_KEY); // Clear potentially corrupted data
      setUser(null); // Ensure user is null on error
    } finally {
      setIsLoading(false); 
    }
    
    // Add event listener for cross-tab sync
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleStorageChange]);

  const login = useCallback((userData: User) => { 
    try {
      // Validate incoming userData before processing
      if (
        userData && 
        typeof userData.id === 'string' && userData.id.trim() !== '' &&
        typeof userData.displayName === 'string' && userData.displayName.trim() !== '' &&
        typeof userData.dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(userData.dob) &&
        typeof userData.role === 'string' && (userData.role === 'teacher' || userData.role === 'student')
      ) {
        const userToStore = ensureUserIntegrityForContext(userData); // Ensure integrity before storing
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
        setUser(userToStore);
      } else {
        console.error("Attempted to login with invalid userData. Data received:", JSON.stringify(userData), "Expected id, displayName, dob (YYYY-MM-DD), role to be valid strings.");
      }
    } catch (error) {
        console.error("Failed to save user to localStorage on login:", error);
    }
  }, []);
  
  const signup = useCallback((userData: User) => { // Similar to login, ensure data for signup
    try {
       if (
        userData && 
        typeof userData.id === 'string' && userData.id.trim() !== '' &&
        typeof userData.displayName === 'string' && userData.displayName.trim() !== '' &&
        typeof userData.dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(userData.dob) &&
        typeof userData.role === 'string' && (userData.role === 'teacher' || userData.role === 'student')
      ) {
        const userToStore = ensureUserIntegrityForContext(userData); // Ensure integrity
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
      const updatedUser = ensureUserIntegrityForContext(result.user); // Ensure integrity of user from server
      setUser(updatedUser); // Update local state
      try {
        // This will trigger the 'storage' event for other tabs
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser)); 
      } catch (error) {
        console.error("Failed to update user in localStorage:", error);
        // Non-critical error for this mock, proceed
      }
    }
    return result;
  }, [user]);


  return { user, isLoading, login, logout, signup, updateUserProfileData };
}
