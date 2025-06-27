import React from "react";

export default function StudentTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
