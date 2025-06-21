
"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { CheckCircle, Zap, Star, Edit3, BarChart3, TrendingUp as TrendingUpIcon, Shield, Sparkles, Users as UsersIcon, Briefcase, Edit2, ArrowLeft, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    id: "free",
    name: "Free Trial",
    price: "₹0",
    priceDetails: "First 5 Tests",
    mainDescription: "For individuals trying out Test Pilot.",
    features: [
      { text: "5 Total Test Creations (Manual or AI)", icon: Edit3 },
      { text: "Unlimited Test Attempts", icon: CheckCircle }, 
      { text: "Basic Results Viewing", icon: BarChart3 },
      { text: "Personal Progress Tracking", icon: TrendingUpIcon },
      { text: "Contains Ads", icon: Info, iconColor: "text-muted-foreground" },
    ],
    cta: "Activate Free Trial",
    variant: "default" as "default",
    buttonSize: "default" as "default",
  },
  {
    id: "student_lite",
    name: "Student Lite",
    price: "₹69",
    priceDetails: "/month",
    mainDescription: "For students who primarily take tests.",
    features: [
      { text: "30 Manual Test Creations/Month", icon: Edit3 },
      { text: "Unlimited Test Attempts", icon: CheckCircle },
      { text: "Full 'My Personal Progress' Tracking", icon: TrendingUpIcon },
      { text: "Live Leaderboard Access", icon: BarChart3 },
      { text: <span className="font-semibold">Minimal Ads</span>, icon: Zap, iconColor: "text-yellow-500" },
    ],
    cta: "Choose Student Lite",
    variant: "default" as "default",
    buttonSize: "lg" as "lg",
  },
  {
    id: "teacher_basic",
    name: "Teacher Basic",
    price: "₹499",
    priceDetails: "/month",
    mainDescription: "For educators needing more test creation and student tracking.",
    features: [
      { text: "50 Manual Tests/Month", icon: Edit3 },
      { text: "20 AI-Generated Tests/Month", icon: Sparkles },
      { text: "Basic Student Performance Dashboard", icon: UsersIcon },
      { text: "Ad-Free", icon: Shield },
    ],
    cta: "Upgrade to Basic",
    variant: "default" as "default",
    buttonSize: "lg" as "lg",
  },
  {
    id: "teacher_premium",
    name: "Teacher Premium",
    price: "₹1999",
    priceDetails: "/month",
    mainDescription: "For Coaching Institutes & educators needing advanced capabilities.",
    features: [
      { text: "Unlimited Manual & AI Test Creation", icon: Edit2 },
      { text: "Advanced Student Performance Dashboard", icon: Briefcase },
      { text: "Create & Manage Student Groups", icon: UsersIcon },
      { text: "Priority Support", icon: Star },
      { text: "Ad-Free", icon: Shield },
    ],
    cta: "Go Premium",
    variant: "default" as "default",
    buttonSize: "lg" as "lg",
    isPopular: true,
  },
];

export default function PlansPage() {
  const router = useRouter();

  const handleChoosePlan = (plan: typeof plans[0]) => {
    if (plan.id === "free") {
      router.push("/dashboard"); 
      return;
    }
    router.push(`/dashboard/mock-payment/${plan.id}?name=${encodeURIComponent(plan.name)}&price=${encodeURIComponent(plan.price)}`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline text-primary mb-3">Test Pilot Plans</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative flex flex-col shadow-md hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden border-border hover:border-primary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50`}
          >
            <CardHeader className="text-center pt-6 pb-4 bg-muted/30 relative">
              {plan.isPopular && (
                <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-0.5 text-xs font-semibold z-10">
                  MOST POPULAR
                </Badge>
              )}
              <CardTitle className="text-2xl font-bold font-headline mt-2 mb-1">{plan.name}</CardTitle>
               <div className="my-1">
                <span className="text-3xl font-extrabold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.priceDetails}</span>
              </div>
              <CardDescription className="text-xs text-muted-foreground h-10"> 
                {plan.mainDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3.5 p-6">
              <ul className="space-y-2.5 text-sm">
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
            <CardFooter className="mt-auto p-6 bg-muted/30 border-t">
              <Button 
                className="w-full" 
                variant={plan.variant} 
                size={plan.buttonSize || 'lg'}
                onClick={() => handleChoosePlan(plan)}
              >
                {plan.cta}
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
