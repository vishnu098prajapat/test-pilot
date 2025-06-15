
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function SelectAccountPage() {
  console.log("SelectAccountPage: This page is no longer in use with Name/DOB authentication.");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md bg-card rounded-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline text-center text-foreground">Page Not Used</CardTitle>
          <CardDescription className="text-center text-muted-foreground pt-2">
            This account selection page is no longer used with the current Name & Date of Birth login system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
            <Info className="mx-auto h-12 w-12 text-primary" />
          <p className="text-muted-foreground">
            Please use the main login page to sign in with your Name and Date of Birth.
          </p>
          <Button asChild>
            <Link href="/auth/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
