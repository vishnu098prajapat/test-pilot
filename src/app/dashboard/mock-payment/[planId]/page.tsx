
"use client";

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, CreditCard, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function MockPaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const planId = params.planId as string;
  const planName = searchParams.get('name') || 'Selected Plan';

  const handleSimulatePayment = () => {
    // Simulate a delay for payment processing
    toast({
      title: "Processing Payment...",
      description: "Please wait while we simulate your payment.",
      duration: 1500,
    });

    setTimeout(() => {
      toast({
        title: "Payment Successful! (Simulation)",
        description: `Your subscription to ${planName} is now active.`,
        variant: "default", // Ensuring it's a success-like style
        duration: 3000,
      });
      // Here you would typically update the user's subscription status in your backend/context
      // For this mock, we'll just redirect.
      router.push('/dashboard/plans?status=success');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl rounded-lg">
        <CardHeader className="text-center">
          <CreditCard className="w-12 h-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl font-headline">Confirm Your Plan</CardTitle>
          <CardDescription>You are about to subscribe to: <span className="font-semibold text-primary">{planName}</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            This is a simulated payment page for demonstration purposes.
            No real payment will be processed.
          </p>
          <div className="p-4 bg-muted/50 rounded-md border border-dashed">
            <h3 className="font-semibold text-lg mb-1">Plan Details:</h3>
            <p className="text-sm">ID: {planId}</p>
            <p className="text-sm">Name: {planName}</p>
            {/* Add more plan details here if needed, e.g., price */}
          </div>
           <Button 
            onClick={handleSimulatePayment} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <ShieldCheck className="mr-2 h-5 w-5" /> Simulate Successful Payment
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/plans">Cancel and Go Back to Plans</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
