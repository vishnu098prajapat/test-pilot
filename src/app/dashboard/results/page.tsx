import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import Image from "next/image";

export default function ResultsPage() {
  return (
    <div className="container mx-auto py-2">
      <h1 className="text-3xl font-bold font-headline mb-8">Test Results & Analytics</h1>
      <Card className="text-center">
        <CardHeader>
          <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl font-headline">Results Dashboard - Coming Soon!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            We are working hard to bring you comprehensive test analytics, including:
          </p>
          <ul className="list-disc list-inside text-left max-w-md mx-auto text-muted-foreground space-y-1 mb-6">
            <li>Live leaderboards</li>
            <li>Individual score breakdowns</li>
            <li>Question-wise performance analysis</li>
            <li>Export options (PDF/Excel)</li>
          </ul>
          <Image 
            src="https://placehold.co/800x400.png" 
            alt="Analytics dashboard placeholder" 
            width={800} 
            height={400}
            className="rounded-lg shadow-md mx-auto"
            data-ai-hint="analytics graph" 
          />
          <p className="mt-6 text-sm text-muted-foreground">Stay tuned for updates!</p>
        </CardContent>
      </Card>
    </div>
  );
}
