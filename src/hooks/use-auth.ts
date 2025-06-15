
"use client";

import type { User } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const USER_STORAGE_KEY = "test_pilot_user";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  signup: (userData: User) => void; 
}

// Helper to ensure user object integrity
function ensureUserIntegrity(user: User): User {
  let { id, displayName, email, dob, role } = user;

  // Ensure ID is present (should always be, but as a fallback)
  id = id || `temp-${Date.now()}`;

  if (!displayName) {
    if (email) {
      const namePart = email.split('@')[0];
      displayName = namePart
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } else {
      // Fallback if no email and no displayName, use part of ID
      displayName = `User-${id.substring(0, 5)}`;
    }
  }

  return {
    id,
    displayName,
    email: email || undefined, // Ensure email is undefined if it's an empty string or null
    dob: dob || "1900-01-01", // Default DOB if missing
    role: role || "student", // Default role if missing
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
        // Validate the parsed user object more thoroughly
        if (
          parsedUser && 
          typeof parsedUser.id === 'string' && parsedUser.id.trim() !== '' &&
          (typeof parsedUser.displayName === 'string' && parsedUser.displayName.trim() !== '') && // displayName is mandatory
          (typeof parsedUser.dob === 'string' && parsedUser.dob.trim() !== '') && // dob is mandatory
          (typeof parsedUser.role === 'string' && (parsedUser.role === 'teacher' || parsedUser.role === 'student')) // role is mandatory
        ) {
          setUser(ensureUserIntegrity(parsedUser as User));
        } else {
          console.warn("Stored user data in localStorage is invalid or incomplete. Clearing session.", JSON.stringify(parsedUser));
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
        typeof userData.dob === 'string' && userData.dob.trim() !== '' &&
        typeof userData.role === 'string' && (userData.role === 'teacher' || userData.role === 'student')
      ) {
        const userToStore = ensureUserIntegrity(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
        setUser(userToStore);
      } else {
        console.error("Attempted to login with invalid userData. Data received:", JSON.stringify(userData), "Expected id, displayName, dob, role to be valid strings.");
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
        typeof userData.dob === 'string' && userData.dob.trim() !== '' &&
        typeof userData.role === 'string' && (userData.role === 'teacher' || userData.role === 'student')
      ) {
        const userToStore = ensureUserIntegrity(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
        setUser(userToStore);
      } else {
        console.error("Attempted to signup with invalid userData. Data received:", JSON.stringify(userData), "Expected id, displayName, dob, role to be valid strings.");
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

  return { user, isLoading, login, logout, signup };
}
