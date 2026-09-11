import { exigirAdmin } from "@/lib/dal";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const usuario = await exigirAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-background sm:flex-row">
      <AdminNav nome={usuario.nome} />
      <div className="min-w-0 flex-1 overflow-x-auto">{children}</div>
    </div>
  );
}
