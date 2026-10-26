import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getMemberships } from "@/lib/auth/session";

export default async function AppHomePage() {
  const { profile, memberships } = await getMemberships();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl">Welcome{profile.full_name ? `, ${profile.full_name}` : ""}</h1>
        <p className="mt-2 text-sm text-muted">
          This overview lists salons you belong to. Customer bookings live under My bookings. Nothing here is generated
          for display.
        </p>
      </div>
      {!memberships.length ? (
        <EmptyState
          title="No salon memberships yet"
          description="Create a salon to manage staff and appointments, or book a published salon as a customer."
          action={
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/app/salons/new">Create a salon</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/salons">Find a salon</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {memberships.map((membership) => {
            const salon = Array.isArray(membership.salons) ? membership.salons[0] : membership.salons;
            return (
              <Card key={membership.id}>
                <CardHeader>
                  <CardTitle>{salon?.name ?? "Salon"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted">Your role: {membership.role}</p>
                  <Button asChild>
                    <Link href={`/app/salons/${membership.salon_id}`}>Open salon</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
