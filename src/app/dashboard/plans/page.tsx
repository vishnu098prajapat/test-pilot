
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // CardDescription removed as it's not directly used for each plan's title section now
import { CheckCircle, Zap, Star, Edit3, BarChart3, TrendingUp as TrendingUpIcon, Shield, Sparkles, Download, Users as UsersIcon, Briefcase, Edit2, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: "Free Trial",
    price: "₹0",
    priceDetails: "First 3 Tests Free",
    mainDescription: "Get a taste of Test Pilot with essential features for creating and taking tests.", // Kept for internal structure, but won't be displayed directly under title
    features: [
      { text: "3 Total Test Creations (Manual or AI)", icon: Edit3 },
      { text: "Basic Results Viewing", icon: BarChart3 },
      { text: "My Personal Progress Tracking", icon: TrendingUpIcon },
      { text: "Contains Ads", icon: Zap, iconColor: "text-yellow-500" },
    ],
    cta: "Activate Free Plan",
    ctaLink: "/dashboard",
    variant: "default" as "default", // Purple button
    buttonSize: "default" as "default",
  },
  {
    name: "Student Lite", // Changed from Creator Lite
    price: "₹69",
    priceDetails: "per month",
    mainDescription: "For students needing more test attempt flexibility and progress tracking.", // Updated description
    features: [
      { text: "30 Manual Test Creations/Month", icon: Edit3 }, // As per user's last detailed plan
      { text: "Unlimited Test Attempts (as student)", icon: CheckCircle },
      { text: "Full 'My Personal Progress' Tracking", icon: TrendingUpIcon },
      { text: "Basic Results Viewing (for created tests)", icon: BarChart3 }, // If they create tests
      { text: "Minimal Ads", icon: Zap, iconColor: "text-yellow-500" },
    ],
    cta: "Choose Student Lite",
    ctaLink: "#", 
    variant: "default" as "default",
    buttonSize: "lg" as "lg",
  },
  {
    name: "Teacher Basic",
    price: "₹499",
    priceDetails: "per month",
    mainDescription: "Essential tools for educators to create, manage tests, and track student performance.",
    features: [
      { text: "50 Manual Tests/Month", icon: Edit3 },
      { text: "10 AI-Generated Tests/Month", icon: Sparkles },
      { text: "Basic Student Performance Dashboard", icon: UsersIcon },
      { text: "Ad-Free (Teacher & their Tests)", icon: Shield },
    ],
    cta: "Upgrade to Basic",
    ctaLink: "#",
    variant: "default" as "default",
    buttonSize: "lg" as "lg",
  },
  {
    name: "Teacher Premium",
    price: "₹1999",
    priceDetails: "per month",
    mainDescription: "Comprehensive features for educators and institutions requiring advanced capabilities.",
    features: [
      { text: "Unlimited Manual & AI Test Creation", icon: Edit2 },
      { text: "Advanced Student Performance Dashboard", icon: Briefcase },
      { text: "Detailed Reports & Data Export", icon: Download },
      { text: "Priority Support", icon: Star },
      { text: "Ad-Free (Teacher & their Tests)", icon: Shield },
    ],
    cta: "Go Premium",
    ctaLink: "#",
    variant: "default" as "default",
    buttonSize: "lg" as "lg",
    isPopular: true,
  },
];

export default function PlansPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline text-primary mb-3">Test Pilot Plans</h1>
        {/* Removed the introductory paragraph as requested */}
      </div>

      {/* Adjusted grid for better responsiveness: md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`relative flex flex-col shadow-md hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden border-border hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50`}
          >
            <CardHeader className="text-center pt-6 pb-4 bg-muted/20 relative"> {/* Added relative for badge positioning */}
              {plan.isPopular && (
                <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-0.5 text-xs font-semibold z-10">
                  MOST POPULAR
                </Badge>
              )}
              <CardTitle className="text-2xl font-bold font-headline mt-2 mb-1">{plan.name}</CardTitle> {/* Added mt-2 to give space for badge if needed */}
              <div className="my-1">
                <span className="text-3xl font-extrabold text-primary">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.priceDetails.startsWith("per") ? "/" : ""} {plan.priceDetails.replace("per month", "mo")}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2.5 p-6">
              {/* Removed plan.mainDescription from here */}
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, i) => {
                  const IconComponent = feature.icon;
                  return (
                    <li key={i} className="flex items-start">
                      <IconComponent className={`h-4 w-4 ${feature.iconColor || 'text-green-500'} mr-2 shrink-0 mt-0.5`} />
                      <span className="text-foreground/90">{feature.text}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto p-6 bg-muted/20 border-t">
              <Button 
                className="w-full" 
                variant={plan.variant} 
                size={plan.buttonSize || 'lg'}
                asChild={plan.ctaLink === "/dashboard"}
              >
                {plan.ctaLink === "/dashboard" ? (
                  <Link href={plan.ctaLink}>{plan.cta}</Link>
                ) : (
                  <a href={plan.ctaLink} onClick={(e) => { if (plan.ctaLink === "#") e.preventDefault(); alert('Payment integration coming soon!'); }}>{plan.cta}</a>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-12">
        <Button variant="ghost" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
