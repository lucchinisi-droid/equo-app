"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HORSE_SEX_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function HorseForm() {
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
      setError("Sessione scaduta, effettua di nuovo il login.");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("horses")
      .insert({
        owner_id: user.id,
        name: formData.get("name") as string,
        breed: (formData.get("breed") as string) || null,
        birth_date: (formData.get("birth_date") as string) || null,
        sex: (formData.get("sex") as string) || null,
        color: (formData.get("color") as string) || null,
        microchip_code: (formData.get("microchip_code") as string) || null,
        notes: (formData.get("notes") as string) || null,
      })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push(`/horses/${data.id}`);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" required placeholder="Es. Ares" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="breed">Razza</Label>
          <Input id="breed" name="breed" placeholder="Es. Maremmano" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birth_date">Data di nascita</Label>
          <Input id="birth_date" name="birth_date" type="date" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sex">Sesso</Label>
          <select
            id="sex"
            name="sex"
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            )}
          >
            <option value="">Seleziona...</option>
            {HORSE_SEX_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Mantello</Label>
          <Input id="color" name="color" placeholder="Es. Baio" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="microchip_code">Microchip</Label>
        <Input id="microchip_code" name="microchip_code" placeholder="15 cifre" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Note</Label>
        <Textarea id="notes" name="notes" placeholder="Allergie, comportamento, altro..." />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Salvataggio..." : "Salva cavallo"}
      </Button>
    </form>
  );
}
