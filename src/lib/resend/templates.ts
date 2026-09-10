/**
 * Template email semplici (HTML inline, no dipendenze extra).
 * In futuro si può migrare a react-email se serve qualcosa di più ricco.
 */

export function reminderEmailHtml(params: {
  horseName: string;
  title: string;
  dueDate: string;
  type: string;
}) {
  const { horseName, title, dueDate, type } = params;
  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
    <h2 style="color: #1a1a1a;">🐴 Promemoria per ${horseName}</h2>
    <p style="font-size: 16px; color: #333;">
      <strong>${title}</strong> (${type}) scade il <strong>${dueDate}</strong>.
    </p>
    <p style="font-size: 14px; color: #666;">
      Apri Equo per aggiornare il libretto sanitario o segnare l'attività come completata.
    </p>
  </div>`;
}

export function waitlistConfirmationHtml(params: { name?: string }) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
    <h2 style="color: #1a1a1a;">Benvenuto in Equo 🐴</h2>
    <p style="font-size: 16px; color: #333;">
      ${params.name ? `Ciao ${params.name}, grazie` : "Grazie"} per esserti iscritto/a alla waitlist!
      Ti avviseremo non appena l'app sarà disponibile.
    </p>
  </div>`;
}
