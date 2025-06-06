"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/app/loading'; // Use your global loading component

// This page might become a more detailed test listing/management view in the future.
// For now, the main dashboard page handles listing tests.
export default function MyTestsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main dashboard page which already lists tests
    router.replace('/dashboard');
  }, [router]);

  // Show loading state while redirecting
  return <Loading />;
}
