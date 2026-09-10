import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { PawPrint, AlertTriangle, Wallet, Plus } from "lucide-react";
import type { Horse, HealthRecord, Expense } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const horsesQuery = supabase.from("horses").select("*").order("created_at", { ascending: false });
  const upcomingQuery = supabase
    .from("health_records")
    .select("*")
    .not("next_due_at", "is", null)
    .order("next_due_at", { ascending: true })
    .limit(5);
  const expensesQuery = supabase
    .from("expenses")
    .select("*")
    .gte("expense_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

  const [horsesRes, upcomingRes, expensesRes] = await Promise.all([horsesQuery, upcomingQuery, expensesQuery]);

  const horses = (horsesRes.data ?? []) as Horse[];
  const upcoming = (upcomingRes.data ?? []) as HealthRecord[];
  const expenses = (expensesRes.data ?? []) as Expense[];

  const monthTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ciao{user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋</h1>
        <p className="text-muted-foreground">Ecco la situazione dei tuoi cavalli.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cavalli</CardTitle>
            <PawPrint className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{horses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scadenze imminenti</CardTitle>
            <AlertTriangle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcoming.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Spese questo mese</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Prossime scadenze</CardTitle>
            <CardDescription>Vaccini, ferrature, sverminazioni e Coggins test</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!upcoming.length && (
            <p className="text-sm text-muted-foreground">Nessuna scadenza registrata. Aggiungi un cavallo per iniziare.</p>
          )}
          {upcoming.map((record) => {
            const days = daysUntil(record.next_due_at!);
            return (
              <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{record.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(record.next_due_at!)}</p>
                </div>
                <Badge variant={days < 7 ? "destructive" : days < 30 ? "secondary" : "outline"}>
                  {days < 0 ? "Scaduto" : `tra ${days}gg`}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-center sm:justify-start">
        <Button asChild>
          <Link href="/horses/new">
            <Plus className="size-4" /> Aggiungi un cavallo
          </Link>
        </Button>
      </div>
    </div>
  );
}
