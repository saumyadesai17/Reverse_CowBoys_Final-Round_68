"use client";

import { useState, useEffect } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Network, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // CRITICAL: Ensure all content is visible immediately
    const resetCard = document.querySelector('.reset-card');
    if (resetCard) {
      (resetCard as HTMLElement).style.opacity = '1';
      (resetCard as HTMLElement).style.visibility = 'visible';
    }

    // Small delay to ensure DOM is ready
    const animationTimeout = setTimeout(() => {
      const animation = gsap.from(".reset-card", {
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.7)",
      });

      return () => {
        animation.kill();
      };
    }, 50);

    return () => {
      clearTimeout(animationTimeout);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send reset email";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <Link href="/landing" className="inline-flex items-center space-x-2 mb-8 group">
          <Network className="w-8 h-8 text-violet-500 group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-2xl font-bold text-white">CampaignAI</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">Reset your password</h1>
          <p className="text-slate-300">Enter your email and we'll send you a reset link</p>
        </div>

        <Card className="reset-card bg-slate-900/50 backdrop-blur-xl border-slate-800 p-8">
          {!success ? (
            <form onSubmit={handleReset} className="space-y-6">
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
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
              <p className="text-slate-300 mb-6">
                We've sent a password reset link to <strong className="text-white">{email}</strong>
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/login">
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to Login
                </Link>
              </Button>
            </div>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-slate-300 hover:text-white text-sm inline-flex items-center"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Login
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
