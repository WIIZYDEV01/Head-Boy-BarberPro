import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8">
        <p className="font-serif text-3xl text-gold">Head Boy BarberPro</p>
        <h1 className="mt-2 font-serif text-3xl">Reset password</h1>
        <p className="mt-2 text-sm text-muted">
          We email a reset link if the address is registered. The link returns through the auth callback.
        </p>
        <div className="mt-8">
          <ActionForm action={forgotPasswordAction} submitLabel="Send reset link" submitClassName="w-full rounded-full">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
          </ActionForm>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="hover:text-gold">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
