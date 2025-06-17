
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Info } from 'lucide-react'; // Using Info icon

export default function GroupsPagePlaceholder() {
  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center">
          <Users className="w-10 h-10 text-primary mr-3 hidden sm:block" />
          <div>
            <h1 className="text-3xl font-bold font-headline flex items-center">
              <Users className="mr-3 h-8 w-8 text-primary sm:hidden" /> Manage Groups
            </h1>
            <p className="text-muted-foreground">Create and manage your student groups.</p>
          </div>
        </div>
        {/* Button can be re-added when feature is active */}
      </div>
      <Card className="text-center py-12 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center justify-center">
            <Info className="mr-2 h-6 w-6 text-primary" /> Groups Feature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The groups feature is currently under development and will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
