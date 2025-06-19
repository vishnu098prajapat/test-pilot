
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BarChartBig, Info } from 'lucide-react'; // Changed PieChart to BarChartBig for relevance
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function StudentPerformancePage() { // Renamed component
  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center">
          <Users className="w-10 h-10 text-primary mr-3 hidden sm:block" /> {/* Changed Icon */}
          <div>
            <h1 className="text-3xl font-bold font-headline flex items-center">
              <Users className="mr-3 h-8 w-8 text-primary sm:hidden" /> Student Performance {/* Changed Icon */}
            </h1>
            <p className="text-muted-foreground">
              Track and analyze your students' overall progress across all your tests.
            </p>
          </div>
        </div>
      </div>

      <Card className="text-center py-12 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center justify-center">
            <Info className="mr-2 h-6 w-6 text-primary" /> Feature Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground max-w-lg mx-auto">
            The comprehensive Student Performance Dashboard is a premium feature.
            It will provide detailed insights into how your students are performing on the tests you've created, including:
          </p>
          <ul className="list-disc list-inside text-left max-w-md mx-auto text-muted-foreground space-y-1">
            <li>Overall class performance metrics</li>
            <li>Individual student progress tracking over time</li>
            <li>Identifying common areas of difficulty</li>
            <li>(Premium) Advanced trends, comparisons, and data export</li>
          </ul>
          <Button asChild className="mt-6">
            <Link href="/dashboard/plans">View Upgrade Options</Link>
          </Button>
           <p className="text-xs text-muted-foreground mt-4">
            For now, you can view individual test leaderboards from the &quot;Results & Leaderboards&quot; page or your main Dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
