"use client";

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/");
      } else {
        // Handle incomplete status (2FA, etc.)
        setError("Additional verification required. Please check your email or authenticator app.");
      }
    } catch (err: unknown) {
      console.error("Sign in error:", err);
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors)) {
        const clerkError = err.errors[0] as { longMessage?: string; message?: string };
        setError(clerkError?.longMessage ?? clerkError?.message ?? "Sign in failed");
      } else {
        setError("Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "oauth_google" | "oauth_github") => {
    if (!isLoaded) return;

    setSocialLoading(provider);
    setError("");

    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: unknown) {
      console.error("Social sign in error:", err);
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors)) {
        const clerkError = err.errors[0] as { longMessage?: string; message?: string };
        setError(clerkError?.longMessage ?? clerkError?.message ?? "Social sign in failed");
      } else {
        setError("Social sign in failed. Please try again.");
      }
      setSocialLoading(null);
    }
  };

  if (!isLoaded) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-gray-900 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Sign In</h1>
          <p className="text-gray-400">Welcome back to Recipe Vault</p>
        </div>

        {/* Social Sign In Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            onClick={() => handleSocialSignIn("oauth_google")}
            disabled={!!socialLoading}
          >
            {socialLoading === "oauth_google" ? "Signing in..." : "Continue with Google"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            onClick={() => handleSocialSignIn("oauth_github")}
            disabled={!!socialLoading}
          >
            {socialLoading === "oauth_github" ? "Signing in..." : "Continue with GitHub"}
          </Button>
          
          {/* Account Selection Hint */}
          <p className="text-xs text-gray-500 text-center mt-2">
            Tip: If you need to switch accounts, sign out of Google/GitHub first
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-900 px-2 text-gray-400">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-gray-800 text-white border-gray-700"
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="bg-gray-800 text-white border-gray-700"
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-gray-400">
            Don&apos;t have an account?{" "}
            <a href="/sign-up" className="text-blue-400 hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}