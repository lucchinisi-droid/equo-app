"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function Topbar({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
      <Image src="/logo-equo.png" alt="Equo" width={100} height={33} className="h-7 w-auto md:hidden" />
      <div className="ml-auto flex items-center gap-3">
        {userEmail && <span className="hidden text-sm text-muted-foreground sm:inline">{userEmail}</span>}
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Esci">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
