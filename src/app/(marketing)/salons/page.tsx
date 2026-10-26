import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function SalonsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <EmptyState
          title="Directory unavailable"
          description="Connect Supabase using the variables in .env.example to load published salons."
        />
      </div>
    );
  }

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("salons")
    .select("id, name, slug, city, description, logo_url")
    .eq("is_published", true)
    .eq("is_active", true)
    .order("name");
  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`name.ilike.${term},city.ilike.${term}`);
  }
  const { data: salons } = await query;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.35em] text-gold">Directory</p>
      <h1 className="mt-3 font-serif text-5xl">Find a salon</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Search live published shops the way Booksy and StyleSeat surface nearby chairs.
      </p>
      <form className="mt-8 max-w-md">
        <Input name="q" placeholder="Search by shop or city" defaultValue={q} />
      </form>
      {!salons?.length ? (
        <div className="mt-10">
          <EmptyState
            title="No published salons"
            description="When a salon owner publishes their shop, it will appear in this directory."
          />
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {salons.map((salon) => (
            <li key={salon.id} className="glass-panel rounded-2xl p-6">
              <div className="flex items-start gap-4">
                {salon.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={salon.logo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : null}
                <div>
                  <h2 className="font-serif text-2xl">{salon.name}</h2>
                  <p className="mt-2 text-sm text-muted">{salon.city || "City not provided"}</p>
                </div>
              </div>
              {salon.description ? <p className="mt-3 text-sm">{salon.description}</p> : null}
              <Link href={`/salons/${salon.slug}`} className="mt-4 inline-block text-sm text-gold">
                View details and book
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
