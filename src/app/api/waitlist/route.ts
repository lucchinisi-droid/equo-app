import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { waitlistConfirmationHtml } from "@/lib/resend/templates";

// Client con service role: la tabella waitlist accetta insert pubblici via RLS,
// ma usiamo la service key lato server per evitare di esporre l'anon key qui.
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const { email, name, role } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email non valida" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("waitlist").insert({ email, name, role });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Questa email è già in lista." }, { status: 409 });
    }
    return NextResponse.json({ error: "Errore, riprova." }, { status: 500 });
  }

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "Benvenuto nella waitlist di Equo 🐴",
        html: waitlistConfirmationHtml({ name }),
      });
    } catch (e) {
      console.error("Errore invio email waitlist:", e);
    }
  }

  return NextResponse.json({ success: true });
}
