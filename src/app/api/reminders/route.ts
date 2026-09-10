import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend, EMAIL_FROM } from "@/lib/resend/client";
import { reminderEmailHtml } from "@/lib/resend/templates";

/**
 * Endpoint da chiamare via cron (es. Netlify Scheduled Functions / cron-job.org)
 * una volta al giorno. Invia una email per ogni scadenza sanitaria nei prossimi 7 giorni.
 *
 * Protezione: richiede header "x-cron-secret" uguale a CRON_SECRET.
 */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);

  const { data: records, error } = await supabaseAdmin
    .from("health_records")
    .select("id, title, type, next_due_at, horse_id, owner_id, horses(name), profiles(id)")
    .not("next_due_at", "is", null)
    .lte("next_due_at", in7Days.toISOString().slice(0, 10))
    .gte("next_due_at", new Date().toISOString().slice(0, 10));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const record of records ?? []) {
    const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(record.owner_id as string);
    const email = userResp?.user?.email;
    if (!email) continue;

    const horseName = (record as { horses?: { name?: string } }).horses?.name ?? "il tuo cavallo";

    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Promemoria: ${record.title} in scadenza`,
      html: reminderEmailHtml({
        horseName,
        title: record.title as string,
        dueDate: record.next_due_at as string,
        type: record.type as string,
      }),
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
