
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
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null); 
      }
    } catch (error) {
      console.error("Failed to load user from localStorage during auth init:", error);
      localStorage.removeItem(USER_STORAGE_KEY); 
      setUser(null); 
    } finally {
      setIsLoading(false); 
    }
  }, []);

  const login = useCallback((userData: User) => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
        console.error("Failed to save user to localStorage on login:", error);
        // Optionally, inform the user about the session save failure
    }
  }, []);
  
  const signup = useCallback((userData: User) => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
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

