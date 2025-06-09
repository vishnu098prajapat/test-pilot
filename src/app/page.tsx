
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Edit3, LogIn, UserPlus, Zap, BrainCircuit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-4 px-6 md:px-10 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold font-headline text-primary">
            Test Pilot
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 w-6 h-6 text-accent"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </Link>
          <nav className="space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4"/> Login
              </Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">
                <UserPlus className="mr-2 h-4 w-4"/> Sign Up
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section Updated */}
        <section className="py-12 md:py-20 text-center bg-gradient-to-br from-background to-secondary/30">
          <div className="container mx-auto px-6 flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-6 text-primary dark:text-primary-foreground">
              The Future of Online Assessments is Here
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 dark:text-muted-foreground mb-10 max-w-2xl mx-auto">
              Test Pilot empowers educators to create, distribute, and manage secure online tests with ease, backed by AI-powered proctoring.
            </p>
            <div className="mb-10 shadow-xl rounded-lg overflow-hidden">
              <Image
                src="/home-page.jpg" // CORRECTED: Assuming you rename "home page.jpg" to "home-page.jpg" in /public
                width={800} 
                height={500} // Adjusted height for better aspect ratio with 800 width
                alt="Illustrative image of a person studying or working on a laptop for Test Pilot" 
                quality={85}
                className="object-cover" // Ensures image covers the dimensions without distortion
                data-ai-hint="student illustration" 
                priority
              />
            </div>
            <Button size="lg" variant="default" asChild> {/* Changed variant to default for better visibility */}
              <Link href="/auth/signup">
                Get Started Free <Zap className="ml-2 h-5 w-5"/>
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-16 text-foreground">
              Why Choose Test Pilot?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Edit3 className="w-10 h-10 text-primary" />}
                title="Intuitive Test Builder"
                description="Easily create diverse question types (MCQ, Short Answer, True/False) with a drag-and-drop interface."
              />
              <FeatureCard
                icon={<BrainCircuit className="w-10 h-10 text-primary" />}
                title="AI-Powered Proctoring"
                description="Advanced anti-cheat system analyzes student activity to ensure test integrity."
              />
              <FeatureCard
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
                title="Seamless User Experience"
                description="Clean, distraction-free interface for users with direct test access via unique links."
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section (Placeholder) */}
        <section id="testimonials" className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-16 text-foreground">
              Loved by Users
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <TestimonialCard
                quote="Test Pilot has revolutionized how I conduct online assessments. The AI proctoring gives me peace of mind."
                author="Dr. Jane Doe"
                role="Professor of Computer Science"
                avatarSrc="https://placehold.co/100x100.png"
                data-ai-hint="educator portrait"
              />
              <TestimonialCard
                quote="Creating and managing tests is so much simpler now. My students find the interface very user-friendly."
                author="John Smith"
                role="High School Teacher" // This can stay or be generalized later
                avatarSrc="https://placehold.co/100x100.png"
                data-ai-hint="teacher profile"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 border-t bg-background">
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
    <Card className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
      <CardHeader className="items-center">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          {icon}
        </div>
        <CardTitle className="font-headline text-xl text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  avatarSrc: string;
  "data-ai-hint": string;
}

function TestimonialCard({ quote, author, role, avatarSrc, "data-ai-hint": aiHint }: TestimonialCardProps) {
  return (
    <Card className="shadow-lg bg-card">
      <CardContent className="pt-6">
        <blockquote className="italic text-lg mb-4 text-card-foreground">&ldquo;{quote}&rdquo;</blockquote>
        <div className="flex items-center">
          <Image
            src={avatarSrc}
            alt={author}
            width={50}
            height={50}
            className="rounded-full mr-4"
            data-ai-hint={aiHint}
          />
          <div>
            <p className="font-semibold text-card-foreground">{author}</p>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

    