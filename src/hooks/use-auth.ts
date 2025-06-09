
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

// Helper to generate display name if not present, for localStorage consistency
function ensureDisplayName(user: User): User {
  if (user && !user.displayName && user.email) {
    const namePart = user.email.split('@')[0];
    return {
      ...user,
      displayName: namePart
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    };
  }
  return user;
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
        let parsedUser = JSON.parse(storedUserString) as User;
        // Validate the parsed user object
        if (parsedUser && typeof parsedUser.id === 'string' && typeof parsedUser.email === 'string' && typeof parsedUser.role === 'string') {
          parsedUser = ensureDisplayName(parsedUser); // Ensure displayName
          setUser(parsedUser);
        } else {
          console.warn("Stored user data in localStorage is invalid or incomplete. Clearing session.");
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
      // Ensure userData is valid before storing
      if (userData && typeof userData.id === 'string' && typeof userData.email === 'string') {
        const userToStore = ensureDisplayName(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
        setUser(userToStore);
      } else {
        console.error("Attempted to login with invalid userData:", userData);
      }
    } catch (error) {
        console.error("Failed to save user to localStorage on login:", error);
    }
  }, []);
  
  const signup = useCallback((userData: User) => {
    try {
       // Ensure userData is valid before storing
      if (userData && typeof userData.id === 'string' && typeof userData.email === 'string') {
        const userToStore = ensureDisplayName(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
        setUser(userToStore);
      } else {
        console.error("Attempted to signup with invalid userData:", userData);
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
