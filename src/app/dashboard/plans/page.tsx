
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle, Zap, Star, DollarSign, ArrowLeft, BarChart3, Edit3, Eye, User, Shield, Sparkles, Download, Users as UsersIcon } from 'lucide-react'; // Added more icons
import { Badge } from '@/components/ui/badge'; // For "Most Popular" tag

const plans = [
  {
    name: "Free Trial",
    price: "₹0",
    priceDetails: "First 3 Tests Free",
    features: [
      { text: "3 Total Test Creations (Manual or AI)", icon: Edit3 },
      { text: "Basic Results Viewing (Leaderboards)", icon: BarChart3 },
      { text: "My Personal Progress Tracking", icon: User },
      { text: "Contains Ads", icon: Zap, iconColor: "text-yellow-500" }, // Example of different icon color
    ],
    cta: "Continue with Free Plan",
    ctaLink: "/dashboard",
    variant: "outline" as "outline",
  },
  {
    name: "Creator Lite",
    price: "₹69",
    priceDetails: "per month",
    features: [
      { text: "30 Manual Tests/Month", icon: Edit3 },
      { text: "Unlimited Test Attempts (as student)", icon: CheckCircle },
      { text: "Full 'My Personal Progress' Tracking", icon: User },
      { text: "Basic Results Viewing (for created tests)", icon: Eye },
      { text: "Minimal Ads", icon: Zap, iconColor: "text-yellow-500" },
    ],
    cta: "Choose Creator Lite",
    ctaLink: "#", 
    variant: "default" as "default",
  },
  {
    name: "Teacher Basic",
    price: "₹499",
    priceDetails: "per month",
    features: [
      { text: "50 Manual Tests/Month", icon: Edit3 },
      { text: "10 AI-Generated Tests/Month", icon: Sparkles },
      { text: "Basic Student Performance Dashboard", icon: UsersIcon },
      { text: "Ad-Free (Teacher & their Tests)", icon: Shield },
    ],
    cta: "Upgrade to Basic",
    ctaLink: "#",
    variant: "default" as "default",
  },
  {
    name: "Teacher Premium",
    price: "₹1999",
    priceDetails: "per month",
    features: [
      { text: "Unlimited Manual & AI Test Creation", icon: Edit3 },
      { text: "Advanced Student Performance Dashboard", icon: UsersIcon },
      { text: "Detailed Reports & Data Export", icon: Download },
      { text: "Priority Support", icon: Star },
      { text: "Ad-Free (Teacher & their Tests)", icon: Shield },
    ],
    cta: "Go Premium",
    ctaLink: "#",
    variant: "default" as "default",
    isPopular: true,
  },
];

export default function PlansPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline text-primary mb-3">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select the Test Pilot plan that best suits your needs, from free trials for individuals to comprehensive tools for educators.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`relative flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden ${plan.isPopular ? 'border-primary' : 'border-border'}`}
          >
            {plan.isPopular && (
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
                MOST POPULAR
              </Badge>
            )}
            <CardHeader className="text-center pt-8 pb-4 bg-muted/30">
              <CardTitle className="text-2xl font-bold font-headline mb-2">{plan.name}</CardTitle>
              <div className="my-2">
                <span className="text-4xl font-extrabold text-primary">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.priceDetails.startsWith("per") ? "/" : ""} {plan.priceDetails.replace("per month", "mo")}</span>
              </div>
              <CardDescription className="min-h-[40px] px-2">{`Key features for the ${plan.name}.`}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3 p-6">
              <ul className="space-y-2.5 text-sm">
                {plan.features.map((feature, i) => {
                  const IconComponent = feature.icon;
                  return (
                    <li key={i} className="flex items-start">
                      <IconComponent className={`h-5 w-5 ${feature.iconColor || 'text-green-500'} mr-2.5 shrink-0 mt-0.5`} />
                      <span>{feature.text}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto p-6 bg-muted/30">
              <Button className="w-full text-base py-3" variant={plan.variant} asChild={plan.ctaLink === "/dashboard"}>
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
      
      <div className="text-center mt-16">
        <Button variant="ghost" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
