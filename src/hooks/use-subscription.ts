
"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useAuth } from './use-auth';
import type { Test } from '@/lib/types'; 
import { getTestsByTeacher } from '@/lib/store';
import { startOfMonth, isWithinInterval } from 'date-fns';
import { usePathname } from 'next/navigation';


// This is a mock implementation. In a real app, this would come from a database.
const USER_PLANS_STORAGE_KEY = "test_pilot_user_plans";

export type PlanId = 'free' | 'student_lite' | 'teacher_basic' | 'teacher_premium';

export interface Plan {
  id: PlanId;
  name: string;
  testCreationLimit: number; // Use Infinity for unlimited
  aiTestCreationLimit: number; // Use Infinity for unlimited
  canUseAI: boolean;
  canUseGroups: boolean;
  canViewStudentAnalytics: boolean;
}

const plans: Record<PlanId, Plan> = {
  free: { id: 'free', name: 'Free Trial', testCreationLimit: 5, aiTestCreationLimit: 1, canUseAI: true, canUseGroups: false, canViewStudentAnalytics: false },
  student_lite: { id: 'student_lite', name: 'Student Lite', testCreationLimit: 30, aiTestCreationLimit: 5, canUseAI: true, canUseGroups: false, canViewStudentAnalytics: false },
  teacher_basic: { id: 'teacher_basic', name: 'Teacher Basic', testCreationLimit: 50, aiTestCreationLimit: 20, canUseAI: true, canUseGroups: true, canViewStudentAnalytics: false },
  teacher_premium: { id: 'teacher_premium', name: 'Teacher Premium', testCreationLimit: Infinity, aiTestCreationLimit: Infinity, canUseAI: true, canUseGroups: true, canViewStudentAnalytics: true },
};

function getMockUserPlan(userId: string): PlanId {
  // This is NOT secure and for demonstration only.
  try {
    const storedPlans = localStorage.getItem(USER_PLANS_STORAGE_KEY);
    if (storedPlans) {
      const userPlans = JSON.parse(storedPlans);
      if (userPlans[userId] && plans[userPlans[userId]]) {
        return userPlans[userId];
      }
    }
  } catch (e) {
    console.error("Failed to read mock user plans from localStorage", e);
  }
  return 'free';
}

interface SubscriptionContextType {
  plan: Plan;
  isLoading: boolean;
  canCreateTest: boolean;
  remainingTests: number;
  canCreateAiTest: boolean;
  remainingAiTests: number;
  addCreatedTest: (test: Test) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [planId, setPlanId] = useState<PlanId>('free');
    const [isLoading, setIsLoading] = useState(true);
    const [lifetimeUserTests, setLifetimeUserTests] = useState<Test[]>([]);
    const [isTestCountLoading, setIsTestCountLoading] = useState(true);
    const pathname = usePathname();

     const fetchAndSetTests = useCallback(async (userId: string) => {
        setIsTestCountLoading(true);
        try {
            const tests = await getTestsByTeacher(userId);
            setLifetimeUserTests(tests);
        } catch (error) {
            console.error("Failed to fetch teacher tests:", error);
            setLifetimeUserTests([]);
        } finally {
            setIsTestCountLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthLoading) {
            setIsLoading(true);
            return;
        }
        if (user) {
            const userPlanId = getMockUserPlan(user.id);
            setPlanId(userPlanId);
            
            if (user.role === 'teacher') {
                fetchAndSetTests(user.id);
            } else {
                setLifetimeUserTests([]);
                setIsTestCountLoading(false);
            }
        } else {
            setPlanId('free');
            setLifetimeUserTests([]);
            setIsTestCountLoading(false);
        }
        setIsLoading(false);
    }, [user, isAuthLoading, fetchAndSetTests, pathname]); // Added pathname to re-fetch on navigation
    
    const addCreatedTest = useCallback((newTest: Test) => {
        setLifetimeUserTests(prev => [...prev, newTest]);
    }, []);

    const plan = plans[planId];
    
    const now = new Date();
    const currentMonthStart = startOfMonth(now);

    const monthlyUserTests = lifetimeUserTests.filter(t => 
        !t.deletedAt && isWithinInterval(new Date(t.createdAt), { start: currentMonthStart, end: now })
    );

    const monthlyManualTestsCount = monthlyUserTests.filter(t => !t.isAiGenerated).length;
    const monthlyAiTestsCount = monthlyUserTests.filter(t => t.isAiGenerated).length;

    const canCreateTest = plan.testCreationLimit === Infinity || monthlyManualTestsCount < plan.testCreationLimit;
    const remainingTests = plan.testCreationLimit === Infinity ? Infinity : Math.max(0, plan.testCreationLimit - monthlyManualTestsCount);

    const canCreateAiTest = plan.canUseAI && (plan.aiTestCreationLimit === Infinity || monthlyAiTestsCount < plan.aiTestCreationLimit);
    const remainingAiTests = plan.aiTestCreationLimit === Infinity ? Infinity : Math.max(0, plan.aiTestCreationLimit - monthlyAiTestsCount);

    const value = {
        plan, 
        isLoading: isLoading || isTestCountLoading, 
        canCreateTest,
        remainingTests,
        canCreateAiTest,
        remainingAiTests,
        addCreatedTest
    };

    return React.createElement(SubscriptionContext.Provider, { value }, children);
}

export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
