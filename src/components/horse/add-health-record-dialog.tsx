"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HealthRecordForm } from "@/components/horse/health-record-form";
import { Plus } from "lucide-react";

export function AddHealthRecordDialog({ horseId }: { horseId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" /> Aggiungi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo record sanitario</DialogTitle>
        </DialogHeader>
        <HealthRecordForm horseId={horseId} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
