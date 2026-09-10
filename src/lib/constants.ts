export const HEALTH_RECORD_TYPES = [
  { value: "vaccino", label: "Vaccino" },
  { value: "coggins", label: "Coggins Test" },
  { value: "ferratura", label: "Ferratura" },
  { value: "sverminazione", label: "Sverminazione" },
  { value: "visita", label: "Visita veterinaria" },
  { value: "altro", label: "Altro" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "pensione", label: "Pensione" },
  { value: "mangime", label: "Mangime" },
  { value: "veterinario", label: "Veterinario" },
  { value: "maniscalco", label: "Maniscalco" },
  { value: "attrezzatura", label: "Attrezzatura" },
  { value: "assicurazione", label: "Assicurazione" },
  { value: "altro", label: "Altro" },
] as const;

export const SERVICE_TYPES = [
  { value: "clinica_24h", label: "Clinica 24h" },
  { value: "maneggio", label: "Maneggio" },
  { value: "maniscalco", label: "Maniscalco" },
  { value: "veterinario", label: "Veterinario" },
  { value: "negozio", label: "Negozio" },
] as const;

export const HORSE_SEX_OPTIONS = [
  { value: "stallone", label: "Stallone" },
  { value: "castrone", label: "Castrone" },
  { value: "giumenta", label: "Giumenta" },
] as const;
