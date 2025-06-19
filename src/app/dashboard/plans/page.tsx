
"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Zap, Star, DollarSign, ArrowLeft } from 'lucide-react';

const plans = [
  {
    name: "Free Trial",
    price: "₹0",
    priceDetails: "Always Free (for core features)",
    features: [
      "3 Total Test Creations (Manual or AI)",
      "Limited AI Question Generation (per test)",
      "Basic Results Viewing (Leaderboards)",
      "My Personal Progress Tracking",
      "Contains Ads",
    ],
    cta: "Continue with Free Plan",
    ctaLink: "/dashboard",
    variant: "outline" as "outline",
  },
  {
    name: "Student Plan",
    price: "₹69",
    priceDetails: "per month",
    features: [
      "Unlimited Test Attempts",
      "Full 'My Personal Progress' Tracking",
      "Live Leaderboard Access",
      "Ad-Free Test-Taking Experience",
      "No Test Creation Features",
    ],
    cta: "Choose Student Plan",
    ctaLink: "#", // Placeholder for payment integration
    variant: "default" as "default",
  },
  {
    name: "Teacher Basic",
    price: "₹499",
    priceDetails: "per month",
    features: [
      "50 Manual Tests/Month",
      "10 AI-Generated Tests/Month",
      "Basic Student Performance Dashboard",
      "Ad-Free Experience for Teacher & Students",
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
      "Unlimited Manual & AI Test Creation",
      "Advanced Student Performance Dashboard",
      "Detailed Reports & Data Export",
      "Priority Support",
      "Ad-Free for All",
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
        {plans.map((plan, index) => (
          <Card 
            key={plan.name} 
            className={`flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 ${plan.isPopular ? 'border-2 border-primary ring-2 ring-primary/50' : ''}`}
          >
            <CardHeader className="text-center">
              {plan.isPopular && (
                <div className="text-xs font-semibold uppercase text-primary mb-2 tracking-wider">Most Popular</div>
              )}
              <CardTitle className="text-2xl font-bold font-headline">{plan.name}</CardTitle>
              <div className="my-4">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.priceDetails.startsWith("per") ? "/" : ""} {plan.priceDetails.replace("per month", "mo")}</span>
              </div>
              <CardDescription>{plan.description || `Key features for the ${plan.name}.`}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full" variant={plan.variant} asChild={plan.ctaLink === "/dashboard"}>
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
