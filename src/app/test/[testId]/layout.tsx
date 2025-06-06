import React from "react";

export default function StudentTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Optional: A very minimal header for test name or branding */}
      {/* <header className="p-4 border-b">
        <h1 className="text-xl font-semibold text-center font-headline">Test Pilot</h1>
      </header> */}
      <main className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 md:p-8">
        {children}
      </main>
      {/* Optional: Minimal footer */}
      {/* <footer className="p-4 text-center text-xs text-muted-foreground">
        Powered by Test Pilot
      </footer> */}
    </div>
  );
}
