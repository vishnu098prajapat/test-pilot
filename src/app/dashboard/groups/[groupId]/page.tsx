
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info, ArrowLeft } from 'lucide-react';

export default function GroupDetailPagePlaceholder() {
  return (
    <div className="container mx-auto py-2">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/dashboard"> {/* Changed link to dashboard as groups page is placeholder */}
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard 
        </Link>
      </Button>
      <Card className="text-center py-12 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center justify-center">
            <Info className="mr-2 h-6 w-6 text-primary" /> Group Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The group detail and management features are currently under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
