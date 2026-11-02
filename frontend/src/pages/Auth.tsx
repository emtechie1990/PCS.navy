import { useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogoMark, VerifiedRibbon } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiPost } from "@/lib/api";
import { useBrand } from "@/lib/hooks";
import { beginSession } from "@/lib/session";
import type { MessageOut, UserPublic } from "@/lib/types";

function errMsg(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    const d = (e.body as { detail?: unknown })?.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d) && d[0]?.msg) return String(d[0].msg).replace("Value error, ", "");
  }
  return fallback;
}

function Shell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  const { members, verified } = useBrand();
  return (
    <div className="mx-auto grid max-w-5xl gap-0 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
      <div className="camo relative hidden overflow-hidden rounded-l-md text-paper md:block">
        <div className="camo-veil absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-8">
          <LogoMark className="h-16 w-14" />
          <div>
            <h2 className="text-3xl font-bold uppercase leading-tight">Built for {members}<br /><span className="text-gold">and their families.</span></h2>
            <p className="mt-3 text-sm text-paper/70">Sign up with your {verified} email to earn the ribbon on every listing you post.</p>
            <div className="mt-4"><VerifiedRibbon /></div>
          </div>
        </div>
      </div>
      <div className="rounded-md border border-border bg-card p-8 md:rounded-l-none">
        <h1 className="text-3xl font-bold uppercase">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const m = useMutation({
    mutationFn: () => apiPost<UserPublic>("/auth/login", { email, password }),
    onSuccess: (u) => {
      beginSession(u);
      toast.success(`Welcome back, ${u.name}`);
      navigate(u.role === "admin" ? "/admin" : "/my-listings");
    },
    onError: (e) => toast.error(errMsg(e, "Sign-in failed")),
  });
  return (
    <Shell title="Sign in" sub="Manage your listings and saved posts.">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email-input" /></div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><Link to="/forgot-password" className="text-xs text-ocp hover:underline" data-testid="login-forgot-link">Forgot password?</Link></div>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password-input" />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={m.isPending} data-testid="login-submit-button">{m.isPending ? "Signing in…" : "Sign in"}</Button>
        <p className="text-center text-sm text-muted-foreground">New here? <Link to="/register" className="font-semibold text-ocp hover:underline" data-testid="login-register-link">Create an account</Link></p>
      </form>
    </Shell>
  );
}

export function Register() {
  const { verified } = useBrand();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const m = useMutation({
    mutationFn: () => apiPost<UserPublic>("/auth/register", { name, email, password }),
    onSuccess: (u) => {
      beginSession(u);
      toast.success("Account created");
      navigate("/create");
    },
    onError: (e) => toast.error(errMsg(e, "Could not create account")),
  });
  return (
    <Shell title="Create account" sub="Free for service members, spouses, veterans and civilians.">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
        <div className="space-y-1.5"><Label htmlFor="name">Name / rank</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} data-testid="register-name-input" /></div>
        <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="register-email-input" /><p className="text-xs text-muted-foreground">Use your {verified} address to get Verified Military.</p></div>
        <div className="space-y-1.5"><Label htmlFor="password">Password (8+ characters)</Label><Input id="password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="register-password-input" /></div>
        <Button type="submit" className="h-11 w-full" disabled={m.isPending} data-testid="register-submit-button">{m.isPending ? "Creating…" : "Create account"}</Button>
        <p className="text-center text-sm text-muted-foreground">Have an account? <Link to="/login" className="font-semibold text-ocp hover:underline" data-testid="register-login-link">Sign in</Link></p>
      </form>
    </Shell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const m = useMutation({
    mutationFn: () => apiPost<MessageOut>("/auth/forgot-password", { email }),
    onError: (e) => toast.error(errMsg(e, "Could not send reset email")),
  });
  return (
    <Shell title="Reset password" sub="We'll email you a secure link that expires in 1 hour.">
      {m.isSuccess ? (
        <div className="rounded-md border border-ocp/40 bg-accent p-4 text-sm" data-testid="forgot-success">{m.data.message}</div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
          <div className="space-y-1.5"><Label htmlFor="email">Account email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="forgot-email-input" /></div>
          <Button type="submit" className="h-11 w-full" disabled={m.isPending} data-testid="forgot-submit-button">{m.isPending ? "Sending…" : "Email me a reset link"}</Button>
        </form>
      )}
      <p className="mt-4 text-center text-sm"><Link to="/login" className="text-ocp hover:underline" data-testid="forgot-back-login">Back to sign in</Link></p>
    </Shell>
  );
}

export function ResetPassword() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const token = sp.get("token") ?? "";
  const m = useMutation({
    mutationFn: () => apiPost<MessageOut>("/auth/reset-password", { token, password }),
    onSuccess: (r) => { toast.success(r.message); navigate("/login"); },
    onError: (e) => toast.error(errMsg(e, "Reset failed")),
  });
  return (
    <Shell title="Choose a new password" sub="Pick something you don't use anywhere else.">
      {!token ? (
        <p className="text-sm text-destructive" data-testid="reset-missing-token">This reset link is missing its token. Request a new one.</p>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (password !== confirm) { toast.error("Passwords don't match"); return; } m.mutate(); }}>
          <div className="space-y-1.5"><Label htmlFor="pw">New password</Label><Input id="pw" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="reset-password-input" /></div>
          <div className="space-y-1.5"><Label htmlFor="pw2">Confirm password</Label><Input id="pw2" type="password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} data-testid="reset-confirm-input" /></div>
          <Button type="submit" className="h-11 w-full" disabled={m.isPending} data-testid="reset-submit-button">{m.isPending ? "Saving…" : "Update password"}</Button>
        </form>
      )}
    </Shell>
  );
}
