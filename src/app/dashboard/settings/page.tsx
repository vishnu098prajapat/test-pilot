import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import Image from "next/image";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-2">
      <h1 className="text-3xl font-bold font-headline mb-8">Settings</h1>
      <Card className="text-center">
        <CardHeader>
          <Settings className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl font-headline">Account & Application Settings - Coming Soon!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            This section will allow you to manage your account details, preferences, and application-wide settings.
          </p>
           <Image 
            src="https://placehold.co/800x400.png" 
            alt="Settings page placeholder" 
            width={800} 
            height={400}
            className="rounded-lg shadow-md mx-auto"
            data-ai-hint="settings interface" 
          />
          <p className="mt-6 text-sm text-muted-foreground">We appreciate your patience as we build these features.</p>
        </CardContent>
      </Card>
    </div>
  );
}
