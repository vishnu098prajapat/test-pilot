
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BarChartBig, Info, TrendingUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function StudentPerformancePage() {
  return (
    <div className="container mx-auto py-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center">
          <BarChartBig className="w-10 h-10 text-primary mr-3 hidden sm:block" />
          <div>
            <h1 className="text-3xl font-bold font-headline flex items-center">
              <BarChartBig className="mr-3 h-8 w-8 text-primary sm:hidden" /> Student Performance
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
            <Info className="mr-2 h-6 w-6 text-primary" /> Student Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground max-w-lg mx-auto">
            The Student Performance Dashboard is available on our **Teacher Basic** and **Teacher Premium** plans.
            It provides detailed insights into how your students are performing on the tests you've created.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto text-left text-sm">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-primary mb-1 flex items-center"><Users className="h-4 w-4 mr-2"/>Teacher Basic Plan Features:</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                <li>Overall class performance metrics</li>
                <li>Individual student scores per test</li>
                <li>Pass/fail rates for your tests</li>
              </ul>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-primary mb-1 flex items-center"><TrendingUp className="h-4 w-4 mr-2"/>Teacher Premium Plan Features:</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-4">
                <li>All Basic plan features</li>
                <li>Advanced trends and comparisons</li>
                <li>Detailed question-level analysis</li>
                <li>Data export options (e.g., CSV, PDF)</li>
              </ul>
            </div>
          </div>
          <Button asChild className="mt-6">
            <Link href="/dashboard/plans">View Upgrade Options</Link>
          </Button>
           <p className="text-xs text-muted-foreground mt-4">
            Currently, you can view individual test leaderboards from the &quot;Results & Leaderboards&quot; page or your main Dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
