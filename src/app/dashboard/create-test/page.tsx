
import TestBuilderForm from "@/components/test/test-builder-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function CreateTestPage() {
  return (
    <div className="container mx-auto py-2">
      <Alert className="mb-6 border-primary/50 text-primary bg-primary/5 dark:bg-primary/10">
        <Info className="h-4 w-4" />
        <AlertTitle className="font-semibold">Free Trial Information</AlertTitle>
        <AlertDescription>
          Users on the free trial can create up to 3 tests in total. 
          This includes both manually created and AI-generated tests. 
          Upgrade to a paid plan for more creations and features! 
          <span className="italic text-xs block mt-1">(This is a UI note; actual limits are not yet enforced.)</span>
        </AlertDescription>
      </Alert>
      <TestBuilderForm />
    </div>
  );
}
