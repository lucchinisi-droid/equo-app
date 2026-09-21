import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/resend/client";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, email, phone, role, reason, stableName, horsesCount, message } = data;

    if (!email || !name || !message) {
      return NextResponse.json(
        { error: "Compila tutti i campi obbligatori (Nome, Email, Messaggio)." },
        { status: 400 }
      );
    }

    console.log("Nuova richiesta contatto Equo:", {
      name,
      email,
      phone,
      role,
      reason,
      stableName,
      horsesCount,
      message,
      timestamp: new Date().toISOString(),
    });

    // Se RESEND_API_KEY è configurata, invia notifica al team e conferma all'utente
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: "gestione.equo@gmail.com",
          replyTo: email,
          subject: `[Contatto Equo] ${reason.toUpperCase()} - ${name} (${role})`,
          html: `
            <h2>Nuova richiesta ricevuta dal sito Equo</h2>
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Telefono:</strong> ${phone || "Non specificato"}</p>
            <p><strong>Ruolo:</strong> ${role}</p>
            <p><strong>Motivo:</strong> ${reason}</p>
            ${stableName ? `<p><strong>Scuderia:</strong> ${stableName}</p>` : ""}
            ${horsesCount ? `<p><strong>Numero cavalli:</strong> ${horsesCount}</p>` : ""}
            <hr />
            <p><strong>Messaggio:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          `,
        });
      } catch (emailErr) {
        console.error("Errore invio email di contatto:", emailErr);
      }
    }

    return NextResponse.json({ success: true, message: "Messaggio inviato con successo" });
  } catch (err: any) {
    console.error("Errore API contact:", err);
    return NextResponse.json(
      { error: "Errore interno durante l'elaborazione della richiesta" },
      { status: 500 }
    );
  }
}
