// NOTE: This error.js applies to the root segment.
// For more granular error handling, create error.js files in specific route segments.
"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html lang="en"><body>
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background">
          <AlertTriangle className="w-20 h-20 text-destructive mb-6" />
          <h1 className="text-4xl font-bold font-headline text-destructive mb-4">
            Something went wrong!
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg">
            We encountered an unexpected issue. Please try again. If the problem persists, contact support.
          </p>
          {error?.message && (
            <pre className="mb-4 p-2 bg-muted text-destructive-foreground text-xs rounded-md max-w-full overflow-auto">
              Error: {error.message}
            </pre>
          )}
           <Button
            onClick={
              // Attempt to recover by trying to re-render the segment
              () => reset()
            }
            size="lg"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Try again
          </Button>
        </div>
      </body></html>
  );
}
