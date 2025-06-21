
"use client";

import TestBuilderForm from "@/components/test/test-builder-form";
import UpgradeNudge from "@/components/common/upgrade-nudge";
import { useSubscription } from "@/hooks/use-subscription";
import Loading from "@/app/loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Sparkles } from "lucide-react";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default function CreateTestPage() {
  const { plan, isLoading, canCreateTest, remainingTests } = useSubscription();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);


  if (isLoading || !isClient) {
    return <Loading />;
  }

  if (!canCreateTest) {
    return (
      <UpgradeNudge 
        featureName="creating more tests"
        description={`You have reached your limit of ${plan.testCreationLimit} tests for the ${plan.name} plan.`}
        requiredPlan="a higher tier"
      />
    );
  }

  return (
    <div className="container mx-auto py-2">
      <Alert className="mb-6 border-primary/50 text-primary bg-primary/5 dark:bg-primary/10">
        <Info className="h-4 w-4" />
        <AlertTitle className="font-semibold">Plan Information</AlertTitle>
        <AlertDescription>
          You are on the <b>{plan.name}</b> plan. 
          {plan.testCreationLimit !== Infinity 
            ? ` You can create ${remainingTests} more test(s).`
            : ` You have unlimited test creations.`
          }
           {!plan.canUseAI && (
             <>
              <br />Upgrade to a Teacher plan to unlock the <Button variant="link" asChild className="p-0 h-auto -mx-1 -my-1 text-primary"><Link href="/dashboard/ai-generate-test"><Sparkles className="h-4 w-4 mr-1"/>AI Test Generator</Link></Button>.
             </>
           )}
        </AlertDescription>
      </Alert>
      <TestBuilderForm />
    </div>
  );
}
