import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getSessionUser();
    if (!supabase || !user) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ error: "Choose a photo." }, { status: 400 });
    }
    if (file.size > 2.5 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo is too large. Try another picture." }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Photo storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY on Vercel, then retry." },
        { status: 500 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const path = `profile-avatars/${user.id}/${crypto.randomUUID()}.jpg`;
    const admin = createServiceRoleClient();
    const { error: uploadError } = await admin.storage.from("salon-assets").upload(path, bytes, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const publicUrl = admin.storage.from("salon-assets").getPublicUrl(path).data.publicUrl;
    const { error } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: "Photo updated.", url: publicUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Photo upload failed." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const { supabase, user } = await getSessionUser();
    if (!supabase || !user) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: "Photo removed." });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not remove photo." },
      { status: 500 },
    );
  }
}
