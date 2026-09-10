import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { HorseForm } from "@/components/horse/horse-form";

export default function NewHorsePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Nuovo cavallo</h1>
      <Card>
        <CardHeader>
          <CardTitle>Dati anagrafici</CardTitle>
        </CardHeader>
        <CardContent>
          <HorseForm />
        </CardContent>
      </Card>
    </div>
  );
}
