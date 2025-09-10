"use client";

import { useSignUp } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
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
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err: unknown) {
      console.error("Sign up error:", err);
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors)) {
        const clerkError = err.errors[0] as { longMessage?: string; message?: string };
        setError(clerkError?.longMessage ?? clerkError?.message ?? "Sign up failed");
      } else {
        setError("Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: "oauth_google" | "oauth_github") => {
    if (!isLoaded) return;

    setSocialLoading(provider);
    setError("");

    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: unknown) {
      console.error("Social sign up error:", err);
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors)) {
        const clerkError = err.errors[0] as { longMessage?: string; message?: string };
        setError(clerkError?.longMessage ?? clerkError?.message ?? "Social sign up failed");
      } else {
        setError("Social sign up failed. Please try again.");
      }
      setSocialLoading(null);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push("/");
      }
    } catch (err: unknown) {
      console.error("Verification error:", err);
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors)) {
        const clerkError = err.errors[0] as { longMessage?: string; message?: string };
        setError(clerkError?.longMessage ?? clerkError?.message ?? "Verification failed");
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-gray-900 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">
            {verifying ? "Verify Email" : "Sign Up"}
          </h1>
          <p className="text-gray-400">
            {verifying 
              ? "Enter the verification code sent to your email"
              : "Create your Recipe Vault account"
            }
          </p>
        </div>

        {!verifying ? (
          <>
            {/* Social Sign Up Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                onClick={() => handleSocialSignUp("oauth_google")}
                disabled={!!socialLoading}
              >
                {socialLoading === "oauth_google" ? "Signing up..." : "Continue with Google"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                onClick={() => handleSocialSignUp("oauth_github")}
                disabled={!!socialLoading}
              >
                {socialLoading === "oauth_github" ? "Signing up..." : "Continue with GitHub"}
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
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
          </>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
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
              {loading ? "Verifying..." : "Verify Email"}
            </Button>
          </form>
        )}

        <div className="text-center">
          <p className="text-gray-400">
            {verifying ? (
              <button
                type="button"
                onClick={() => setVerifying(false)}
                className="text-blue-400 hover:underline"
              >
                Back to sign up
              </button>
            ) : (
              <>
                Already have an account?{" "}
                <a href="/sign-in" className="text-blue-400 hover:underline">
                  Sign in
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}