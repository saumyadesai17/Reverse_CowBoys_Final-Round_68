"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Network, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const benefits = [
    "12 AI modules at your fingertips",
    "Visual workflow builder",
    "Unlimited campaigns",
    "Real-time execution monitoring",
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const colors = ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B"];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animationFrameId: number;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = "rgba(2, 6, 23, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    // CRITICAL: Ensure all content is visible immediately
    const signupCard = document.querySelector('.signup-card') as HTMLElement;
    if (signupCard) {
      signupCard.style.opacity = '1';
      signupCard.style.visibility = 'visible';
    }

    const benefitItems = document.querySelectorAll('.benefit-item');
    benefitItems.forEach(el => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.visibility = 'visible';
    });

    // Small delay to ensure DOM is ready
    const animationTimeout = setTimeout(() => {
      // Smooth card entrance with power easing
      const cardAnimation = gsap.fromTo(".signup-card", 
        {
          scale: 0.95,
          opacity: 0,
        },
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );

      // Smooth benefit items entrance (but don't animate opacity to avoid conflict with cycling)
      const benefitAnimation = gsap.fromTo(".benefit-item", 
        {
          x: -20,
        },
        {
          x: 0,
          stagger: 0.15,
          duration: 0.6,
          ease: "power2.out",
          delay: 0.2,
        }
      );

      return () => {
        cardAnimation.kill();
        benefitAnimation.kill();
      };
    }, 100);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      clearTimeout(animationTimeout);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % benefits.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [benefits.length]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during sign up";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex">
      <canvas ref={canvasRef} className="absolute inset-0 opacity-30" />

      <div className="w-1/2 relative z-10 flex items-center justify-center p-12">
        <div className="max-w-md w-full">
          <Link href="/landing" className="inline-flex items-center space-x-2 mb-8 group">
            <Network className="w-8 h-8 text-violet-500 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-2xl font-bold text-white">CampaignAI</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">Create your account</h1>
            <p className="text-slate-300">Start building intelligent campaigns today</p>
          </div>

          <Card className="signup-card bg-slate-900/50 backdrop-blur-xl border-slate-800 p-8">
            <form onSubmit={handleSignUp} className="space-y-6">
              <div>
                <Label htmlFor="fullName" className="text-slate-200">
                  Full Name
                </Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-slate-200">
                  Email Address
                </Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-200">
                  Password
                </Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Must be at least 6 characters</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                {loading ? (
                  "Creating account..."
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-300 text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-violet-400 hover:text-violet-300">
                  Sign in
                </Link>
              </p>
            </div>
          </Card>

          <p className="text-xs text-slate-400 text-center mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      <div className="w-1/2 relative z-10 bg-gradient-to-br from-violet-600/20 to-blue-600/20 backdrop-blur-sm flex items-center justify-center p-12">
        <div className="max-w-lg">
          <div className="mb-8">
            <Sparkles className="w-12 h-12 text-violet-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Join thousands of marketers building smarter campaigns
            </h2>
            <p className="text-slate-300">
              Transform your marketing workflow with AI-powered automation and visual campaign building.
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className={`benefit-item flex items-start space-x-3 transition-all duration-700 ease-out`}
                style={{ 
                  opacity: idx === currentStep ? 1 : 0.5,
                  transform: idx === currentStep ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-700 ease-out ${
                    idx === currentStep ? "bg-violet-500 shadow-lg shadow-violet-500/50" : "bg-slate-700"
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <p className={`text-slate-200 text-lg transition-all duration-700 ease-out ${
                  idx === currentStep ? 'font-semibold' : 'font-normal'
                }`}>{benefit}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-1">12</div>
              <div className="text-sm text-slate-300">AI Modules</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">10k+</div>
              <div className="text-sm text-slate-300">Campaigns</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-sm text-slate-300">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}