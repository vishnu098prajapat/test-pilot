
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, BarChartBig, PieChart, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// This is a placeholder page for the "Student Analytics" feature for teachers.
// It will be expanded upon when plan-based features are fully implemented.

export default function StudentAnalyticsPage() {
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
              Track and analyze your students' progress across your tests.
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
            The comprehensive Student Performance Dashboard is part of our Teacher Basic and Premium plans. 
            It will provide detailed insights into how your students are performing on the tests you've created, including:
          </p>
          <ul className="list-disc list-inside text-left max-w-md mx-auto text-muted-foreground space-y-1">
            <li>Overall class performance per test</li>
            <li>Individual student progress tracking</li>
            <li>Question-wise analysis</li>
            <li>Identifying areas where students might be struggling</li>
            <li>(Premium) Advanced trends, comparisons, and data export</li>
          </ul>
          <Button asChild className="mt-6">
            <Link href="/dashboard">Explore Other Features</Link>
          </Button>
           <p className="text-xs text-muted-foreground mt-4">
            For now, you can view individual test leaderboards from the &quot;Results&quot; page or your main dashboard.
          </p>
        </CardContent>
      </Card>

      {/* Placeholder for future content based on plan */}
      {/* 
      Example of what might be shown based on plan:
      if (user.plan === 'Teacher Basic') {
        // Show basic student analytics
      } else if (user.plan === 'Teacher Premium') {
        // Show advanced student analytics
      } else {
        // Show upgrade prompt
      }
      */}
    </div>
  );
}
