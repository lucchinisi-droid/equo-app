import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SERVICE_TYPES } from "@/lib/constants";
import { MapPin, Phone, Globe } from "lucide-react";
import type { Service } from "@/types/database";

export default async function ServicesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("services").select("*").order("name");
  const services = (data ?? []) as Service[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Servizi vicino a te</h1>
        <p className="text-muted-foreground">Cliniche 24h, maneggi e maniscalchi.</p>
      </div>

      {!services.length && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nessun servizio ancora censito nella tua zona.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((s) => {
          const label = SERVICE_TYPES.find((t) => t.value === s.type)?.label ?? s.type;
          const mapsUrl = s.lat && s.lng
            ? `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`
            : s.address
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`
              : undefined;

          return (
            <Card key={s.id}>
              <CardContent className="space-y-2 pt-6">
                <div className="flex items-start justify-between">
                  <p className="font-semibold">{s.name}</p>
                  <Badge variant={s.type === "clinica_24h" ? "destructive" : "outline"}>{label}</Badge>
                </div>
                {s.address && (
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" /> {s.address}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 pt-1 text-sm">
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                      <Phone className="size-3.5" /> {s.phone}
                    </a>
                  )}
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <MapPin className="size-3.5" /> Indicazioni
                    </a>
                  )}
                  {s.website && (
                    <a href={s.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="size-3.5" /> Sito
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
