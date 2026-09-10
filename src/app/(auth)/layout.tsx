import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 px-4">
      <Link href="/">
        <Image src="/logo-equo.png" alt="Equo" width={140} height={47} priority className="h-10 w-auto" />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
