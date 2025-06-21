
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import type { Test } from '@/lib/types'; 
import { getTestsByTeacher } from '@/lib/store';


// This is a mock implementation. In a real app, this would come from a database.
const USER_PLANS_STORAGE_KEY = "test_pilot_user_plans";

export type PlanId = 'free' | 'student_lite' | 'teacher_basic' | 'teacher_premium';

export interface Plan {
  id: PlanId;
  name: string;
  testCreationLimit: number; // Use Infinity for unlimited
  canUseAI: boolean;
  canUseGroups: boolean;
  canViewStudentAnalytics: boolean;
}

const plans: Record<PlanId, Plan> = {
  free: { id: 'free', name: 'Free Trial', testCreationLimit: 3, canUseAI: false, canUseGroups: false, canViewStudentAnalytics: false },
  student_lite: { id: 'student_lite', name: 'Student Lite', testCreationLimit: 30, canUseAI: false, canUseGroups: false, canViewStudentAnalytics: false },
  teacher_basic: { id: 'teacher_basic', name: 'Teacher Basic', testCreationLimit: 50, canUseAI: true, canUseGroups: false, canViewStudentAnalytics: false },
  teacher_premium: { id: 'teacher_premium', name: 'Teacher Premium', testCreationLimit: Infinity, canUseAI: true, canUseGroups: true, canViewStudentAnalytics: true },
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

export function useSubscription() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [planId, setPlanId] = useState<PlanId>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [userTests, setUserTests] = useState<Test[]>([]);
  const [isTestCountLoading, setIsTestCountLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      return;
    }
    if (user) {
      const userPlanId = getMockUserPlan(user.id);
      setPlanId(userPlanId);
      
      // Fetch user's tests to check limits if they are a teacher
      if (user.role === 'teacher') {
        setIsTestCountLoading(true);
        getTestsByTeacher(user.id).then(tests => {
          setUserTests(tests);
          setIsTestCountLoading(false);
        });
      } else {
          // Students don't create tests, so we don't need to load their test count
          setUserTests([]);
          setIsTestCountLoading(false);
      }

    } else {
      setPlanId('free');
      setUserTests([]);
      setIsTestCountLoading(false);
    }
    setIsLoading(false);
  }, [user, isAuthLoading]);

  const plan = plans[planId];
  
  const canCreateTest = plan.testCreationLimit === Infinity || userTests.length < plan.testCreationLimit;
  const remainingTests = plan.testCreationLimit === Infinity ? Infinity : Math.max(0, plan.testCreationLimit - userTests.length);

  return { 
    plan, 
    isLoading: isLoading || isTestCountLoading, 
    userTests,
    canCreateTest,
    remainingTests
  };
}
