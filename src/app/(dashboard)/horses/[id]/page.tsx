import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddHealthRecordDialog } from "@/components/horse/add-health-record-dialog";
import { HEALTH_RECORD_TYPES } from "@/lib/constants";
import { formatDate, daysUntil } from "@/lib/utils";
import type { Horse, HealthRecord } from "@/types/database";

export default async function HorseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const horseRes = await supabase.from("horses").select("*").eq("id", id).single();
  const recordsRes = await supabase
    .from("health_records")
    .select("*")
    .eq("horse_id", id)
    .order("performed_at", { ascending: false });

  const horse = horseRes.data as Horse | null;
  const records = (recordsRes.data ?? []) as HealthRecord[];

  if (!horse) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-secondary text-3xl">🐴</div>
        <div>
          <h1 className="text-2xl font-bold">{horse.name}</h1>
          <p className="text-sm text-muted-foreground">
            {horse.breed ?? "Razza non specificata"}
            {horse.birth_date ? ` · nato il ${formatDate(horse.birth_date)}` : ""}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Libretto sanitario</CardTitle>
          <AddHealthRecordDialog horseId={horse.id} />
        </CardHeader>
        <CardContent className="space-y-3">
          {!records.length && (
            <p className="text-sm text-muted-foreground">Nessun record ancora. Aggiungi vaccini, ferrature, ecc.</p>
          )}
          {records.map((record) => {
            const typeLabel = HEALTH_RECORD_TYPES.find((t) => t.value === record.type)?.label ?? record.type;
            const days = record.next_due_at ? daysUntil(record.next_due_at) : null;
            return (
              <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {record.title} <Badge variant="outline" className="ml-2">{typeLabel}</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">Effettuato il {formatDate(record.performed_at)}</p>
                </div>
                {days !== null && (
                  <Badge variant={days < 7 ? "destructive" : days < 30 ? "secondary" : "outline"}>
                    {days < 0 ? "Scaduto" : `tra ${days}gg`}
                  </Badge>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
