import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseList } from "@/components/expenses/expense-list";
import { formatCurrency } from "@/lib/utils";
import type { Horse, Expense } from "@/types/database";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const horsesRes = await supabase.from("horses").select("*").order("name");
  const expensesRes = await supabase
    .from("expenses")
    .select("*")
    .gte("expense_date", startOfMonth)
    .order("expense_date", { ascending: false });

  const horses = (horsesRes.data ?? []) as Horse[];
  const expenses = (expensesRes.data ?? []) as Expense[];
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Registro spese</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuova spesa</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm horses={horses} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questo mese</CardTitle>
            <CardDescription>Totale: {formatCurrency(total)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseList expenses={expenses} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
