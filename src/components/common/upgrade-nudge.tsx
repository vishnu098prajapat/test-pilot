
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Zap, Sparkles } from 'lucide-react';

interface UpgradeNudgeProps {
  featureName: string;
  description: string;
  requiredPlan?: string;
}

export default function UpgradeNudge({ featureName, description, requiredPlan }: UpgradeNudgeProps) {
  return (
    <div className="container mx-auto py-10 flex items-center justify-center">
      <Card className="w-full max-w-lg text-center shadow-lg border-primary/50">
        <CardHeader>
          <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl font-headline">
            Upgrade to Access {featureName}
          </CardTitle>
          <CardDescription className="pt-2">
            {description}
            {requiredPlan && ` This feature is available on the ${requiredPlan} plan and higher.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Unlock powerful features and remove limits by upgrading your plan.
          </p>
          <Button size="lg" asChild>
            <Link href="/dashboard/plans">
              <Zap className="mr-2 h-5 w-5" /> View Plans & Upgrade
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
