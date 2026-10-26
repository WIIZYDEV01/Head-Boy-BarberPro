import { updatePasswordAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="glass-panel w-full max-w-md rounded-3xl p-8">
        <h1 className="font-serif text-3xl">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted">This form updates the currently authenticated recovery session.</p>
        <div className="mt-8">
          <ActionForm action={updatePasswordAction} submitLabel="Update password" submitClassName="w-full rounded-full">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
          </ActionForm>
        </div>
      </div>
    </div>
  );
}
