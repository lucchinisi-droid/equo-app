"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Horse } from "@/types/database";

export function ExpenseForm({ horses }: { horses: Horse[] }) {
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

    const { error: insertError } = await supabase.from("expenses").insert({
      owner_id: user.id,
      horse_id: (formData.get("horse_id") as string) || null,
      category: formData.get("category") as string,
      description: (formData.get("description") as string) || null,
      amount: Number(formData.get("amount")),
      expense_date: formData.get("expense_date") as string,
      recurring: formData.get("recurring") === "on",
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    (document.getElementById("expense-form") as HTMLFormElement)?.reset();
    router.refresh();
  }

  return (
    <form id="expense-form" action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria *</Label>
          <select
            id="category"
            name="category"
            required
            className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm")}
          >
            {EXPENSE_CATEGORIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="horse_id">Cavallo</Label>
          <select
            id="horse_id"
            name="horse_id"
            className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm")}
          >
            <option value="">Generale / scuderia</option>
            {horses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Importo (€) *</Label>
          <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expense_date">Data *</Label>
          <Input id="expense_date" name="expense_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <Input id="description" name="description" placeholder="Es. Mangime mensile" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="recurring" className="size-4 rounded border-input" />
        Spesa ricorrente
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Salvataggio..." : "Aggiungi spesa"}
      </Button>
    </form>
  );
}
