"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Network, Mail, Lock, ArrowRight, Zap, TrendingUp, BarChart3 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // CRITICAL: Ensure all content is visible immediately
    const animatedElements = document.querySelectorAll('.login-card, .stats-card, .floating-icon');
    animatedElements.forEach(el => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.visibility = 'visible';
    });

    // Small delay to ensure DOM is ready
    const animationTimeout = setTimeout(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(".login-card",
        { x: -60, opacity: 0 },
        { x: 0, opacity: 1, duration: 1 }
      )
      .fromTo(".stats-card",
        { x: 60, opacity: 0 },
        { x: 0, opacity: 1, duration: 1 },
        "-=0.7"
      );

      const floatingAnimation = gsap.to(".floating-icon", {
        y: -15,
        duration: 2.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.4,
      });

      const shapes = containerRef.current?.querySelectorAll(".shape");
      const shapeAnimations: gsap.core.Tween[] = [];
      
      shapes?.forEach((shape, idx) => {
        const anim = gsap.to(shape, {
          x: Math.random() * 80 - 40,
          y: Math.random() * 80 - 40,
          rotation: Math.random() * 360,
          duration: 6 + idx * 0.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        shapeAnimations.push(anim);
      });

      return () => {
        tl.kill();
        floatingAnimation.kill();
        shapeAnimations.forEach(anim => anim.kill());
      };
    }, 100);

    return () => {
      clearTimeout(animationTimeout);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      if (data.user) {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Invalid email or password";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden"
    >
      <div className="shape absolute top-20 left-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="shape absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="shape absolute top-1/2 left-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

      <nav className="relative z-50 px-6 py-4">
        <Link href="/landing" className="inline-flex items-center space-x-2 group">
          <Network className="w-8 h-8 text-violet-500 group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-2xl font-bold text-white">CampaignAI</span>
        </Link>
      </nav>

      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
          <div className="login-card">
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-white mb-4">Welcome back</h1>
              <p className="text-xl text-slate-300">Continue building amazing campaigns</p>
            </div>

            <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-slate-200 text-base">
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
                      className="pl-11 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 text-base"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="password" className="text-slate-200 text-base">
                      Password
                    </Label>
                    <Link
                      href="/auth/reset-password"
                      className="text-sm text-violet-400 hover:text-violet-300"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-violet-500 text-base"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white text-base"
                >
                  {loading ? (
                    "Signing in..."
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-slate-300">
                  Don't have an account?{" "}
                  <Link href="/auth/signup" className="text-violet-400 hover:text-violet-300 font-medium">
                    Sign up for free
                  </Link>
                </p>
              </div>
            </Card>
          </div>

          <div className="stats-card hidden md:block">
            <div className="space-y-6">
              <div className="flex items-start space-x-4 floating-icon">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-7 h-7 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Lightning Fast Workflows</h3>
                  <p className="text-slate-300">
                    Build complete campaigns in minutes with our visual workflow builder and AI modules.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 floating-icon">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Proven Results</h3>
                  <p className="text-slate-300">
                    Join 10,000+ marketers who have generated over 50,000 successful campaigns.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 floating-icon">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Real-Time Analytics</h3>
                  <p className="text-slate-300">
                    Monitor campaign performance with live dashboards and automated reporting.
                  </p>
                </div>
              </div>

              <Card className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 backdrop-blur-sm border-violet-500/30 p-6 mt-8">
                <blockquote className="text-white">
                  <p className="text-lg mb-4">
                    "CampaignAI reduced our campaign creation time from weeks to hours. The visual workflow
                    builder is a game-changer."
                  </p>
                  <footer className="text-slate-200">
                    <strong>Sarah Chen</strong>
                    <span className="text-slate-300"> • Marketing Director, TechCorp</span>
                  </footer>
                </blockquote>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}