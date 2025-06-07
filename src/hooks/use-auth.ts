
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

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true); 
    try {
      const storedUserString = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUserString) {
        const parsedUser = JSON.parse(storedUserString);
        // Validate the parsed user object
        if (parsedUser && typeof parsedUser.id === 'string' && typeof parsedUser.email === 'string' && typeof parsedUser.role === 'string') {
          setUser(parsedUser as User);
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
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
      } else {
        console.error("Attempted to login with invalid userData:", userData);
        // Optionally, inform the user or handle this error appropriately
      }
    } catch (error) {
        console.error("Failed to save user to localStorage on login:", error);
    }
  }, []);
  
  const signup = useCallback((userData: User) => {
    try {
       // Ensure userData is valid before storing
      if (userData && typeof userData.id === 'string' && typeof userData.email === 'string') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        setUser(userData);
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
