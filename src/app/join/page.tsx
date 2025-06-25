
"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Loading from '@/app/loading';

export default function JoinRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    // Redirect to the new My Groups page, which now handles joining.
    // The dialog on that page can pick up the code from the URL.
    const redirectUrl = code ? `/dashboard/my-groups?join_code=${code}` : '/dashboard/my-groups';
    router.replace(redirectUrl);
  }, [router, searchParams]);

  return <Loading />;
}
