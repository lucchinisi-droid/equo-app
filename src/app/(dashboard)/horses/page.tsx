import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, PawPrint } from "lucide-react";
import type { Horse } from "@/types/database";

export default async function HorsesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("horses").select("*").order("created_at", { ascending: false });
  const horses = (data ?? []) as Horse[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">I miei cavalli</h1>
        <Button asChild size="sm">
          <Link href="/horses/new">
            <Plus className="size-4" /> Nuovo
          </Link>
        </Button>
      </div>

      {!horses.length && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <PawPrint className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">Non hai ancora aggiunto nessun cavallo.</p>
            <Button asChild>
              <Link href="/horses/new">Aggiungi il primo cavallo</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {horses.map((horse) => (
          <Link key={horse.id} href={`/horses/${horse.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl">
                  🐴
                </div>
                <div>
                  <p className="font-semibold">{horse.name}</p>
                  <p className="text-sm text-muted-foreground">{horse.breed ?? "Razza non specificata"}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
