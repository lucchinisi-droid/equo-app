import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crea il tuo account Equo</CardTitle>
        <CardDescription>Inizia a digitalizzare la gestione del tuo cavallo</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
