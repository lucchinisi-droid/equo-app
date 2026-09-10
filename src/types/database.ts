/**
 * Tipi manuali basati sullo schema in supabase/migrations/0001_init.sql.
 * Da sostituire/estendere con:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type HealthRecordType =
  | "vaccino"
  | "coggins"
  | "ferratura"
  | "sverminazione"
  | "visita"
  | "altro";

export type ExpenseCategory =
  | "pensione"
  | "mangime"
  | "veterinario"
  | "maniscalco"
  | "attrezzatura"
  | "assicurazione"
  | "altro";

export type ServiceType = "clinica_24h" | "maneggio" | "maniscalco" | "veterinario" | "negozio";

export interface Horse {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  birth_date: string | null;
  sex: "stallone" | "castrone" | "giumenta" | null;
  color: string | null;
  microchip_code: string | null;
  passport_number: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthRecord {
  id: string;
  horse_id: string;
  owner_id: string;
  type: HealthRecordType;
  title: string;
  performed_at: string;
  next_due_at: string | null;
  vet_name: string | null;
  cost: number | null;
  document_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  horse_id: string | null;
  owner_id: string;
  category: ExpenseCategory;
  description: string | null;
  amount: number;
  expense_date: string;
  recurring: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  created_at: string;
}

export interface AssistantMessage {
  id: string;
  owner_id: string;
  horse_id: string | null;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
