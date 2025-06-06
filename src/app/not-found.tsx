import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background">
      <AlertTriangle className="w-20 h-20 text-destructive mb-6" />
      <h1 className="text-5xl font-bold font-headline text-primary mb-4">404 - Page Not Found</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been moved or deleted.
      </p>
      <div className="flex space-x-4">
        <Button asChild size="lg">
          <Link href="/">Go to Homepage</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        If you believe this is an error, please contact support.
      </p>
    </div>
  );
}
