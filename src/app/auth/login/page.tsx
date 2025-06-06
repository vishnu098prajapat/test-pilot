import LoginForm from "@/components/auth/login-form";
import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="absolute top-4 left-4">
        <Button variant="outline" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" /> Home
          </Link>
        </Button>
      </div>
      <LoginForm />
    </div>
  );
}
