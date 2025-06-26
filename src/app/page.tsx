
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Edit3, LogIn, UserPlus, Zap, BrainCircuit, WifiOff, QrCode, Share2, Lightbulb, Eye, UserRoundCheck, MessageSquareText, Briefcase, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="py-4 px-6 md:px-10 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center text-2xl font-bold font-headline text-primary">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
            <span className="ml-2">Test Pilot</span>
          </Link>
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4"/> Login
              </Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/auth/signup">
                <UserPlus className="mr-2 h-4 w-4"/> Create Account
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 text-center overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 -z-10"></div>
           <div className="container mx-auto px-6 flex flex-col items-center relative z-10">
            <Badge variant="outline" className="mb-4 border-primary/50 text-primary bg-primary/10">
              <Zap className="mr-2 h-4 w-4" /> World's Fastest Quiz Generator
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold font-headline mb-6 text-foreground leading-tight">
              Craft Professional Assessments in Seconds
            </h1>
             <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl">
              From quick quizzes to comprehensive exams, Test Pilot empowers educators with AI-driven tools, advanced proctoring, and insightful analytics.
            </p>
             <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-lg py-7 px-8">
                  <Link href="/auth/signup">
                    Get Started Free
                  </Link>
                </Button>
                 <Button size="lg" variant="outline" asChild className="text-lg py-7 px-8">
                  <Link href="#features">
                    Explore Features
                  </Link>
                </Button>
             </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4 text-foreground">
                Why Choose Test Pilot?
                </h2>
                <p className="text-muted-foreground text-lg mb-16">
                    Our platform is built from the ground up to provide a seamless, secure, and insightful testing experience for both educators and students.
                </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Edit3 className="w-10 h-10 text-primary" />}
                title="Intuitive Test Builder"
                description="Easily create diverse question types (MCQ, Short Answer, True/False) with a user-friendly interface."
              />
              <FeatureCard
                icon={<BrainCircuit className="w-10 h-10 text-primary" />}
                title="AI-Powered Question Generation"
                description="Save hours of prep time. Generate high-quality, relevant questions on any topic in seconds."
              />
               <FeatureCard
                icon={<BarChart3 className="w-10 h-10 text-primary" />}
                title="Insightful Analytics"
                description="Go beyond scores. Track student performance, identify knowledge gaps, and view leaderboards."
              />
              <FeatureCard
                icon={<ShieldCheck className="w-10 h-10 text-primary" />}
                title="Advanced Proctoring"
                description="Ensure test integrity with tab switch detection, copy/paste prevention, and AI activity analysis."
              />
              <FeatureCard
                icon={<Users className="w-10 h-10 text-primary" />}
                title="Student Group Management"
                description="Organize students into groups or classes, assign tests, and monitor progress with ease."
              />
               <FeatureCard
                icon={<Share2 className="w-10 h-10 text-primary" />}
                title="Easy & Secure Sharing"
                description="Share tests securely via direct links, QR codes, or WhatsApp. Students can join groups with simple codes."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 border-t bg-secondary/50">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Test Pilot. All rights reserved.</p>
          <p className="text-sm mt-1">Built with 🚀 by Firebase Studio</p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="text-center shadow-sm hover:shadow-xl transition-shadow duration-300 bg-card flex flex-col">
      <CardHeader className="items-center">
        <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
          {icon}
        </div>
        <CardTitle className="font-headline text-xl text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
