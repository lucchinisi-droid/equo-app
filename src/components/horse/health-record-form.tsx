"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HEALTH_RECORD_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function HealthRecordForm({ horseId, onSaved }: { horseId: string; onSaved?: () => void }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sessione scaduta.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("health_records").insert({
      horse_id: horseId,
      owner_id: user.id,
      type: formData.get("type") as string,
      title: formData.get("title") as string,
      performed_at: formData.get("performed_at") as string,
      next_due_at: (formData.get("next_due_at") as string) || null,
      vet_name: (formData.get("vet_name") as string) || null,
      cost: formData.get("cost") ? Number(formData.get("cost")) : null,
      notes: (formData.get("notes") as string) || null,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.refresh();
    onSaved?.();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo *</Label>
          <select
            id="type"
            name="type"
            required
            className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm")}
          >
            {HEALTH_RECORD_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Titolo *</Label>
          <Input id="title" name="title" required placeholder="Es. Vaccino antinfluenzale" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="performed_at">Data effettuazione *</Label>
          <Input id="performed_at" name="performed_at" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="next_due_at">Prossima scadenza</Label>
          <Input id="next_due_at" name="next_due_at" type="date" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vet_name">Veterinario / operatore</Label>
          <Input id="vet_name" name="vet_name" placeholder="Nome" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost">Costo (€)</Label>
          <Input id="cost" name="cost" type="number" step="0.01" placeholder="0.00" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Note</Label>
        <Textarea id="notes" name="notes" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Salvataggio..." : "Aggiungi al libretto"}
      </Button>
    </form>
  );
}
