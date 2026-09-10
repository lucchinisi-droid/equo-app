import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key_not_configured");

export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Equo <onboarding@resend.dev>";
