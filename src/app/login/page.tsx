import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Entrar — Mercadão O.S.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden w-[42%] flex-col items-center justify-center overflow-hidden bg-charcoal px-14 md:flex">
        <div className="relative flex flex-col items-center gap-7 text-center">
          <Logo size={64} />
          <div className="h-px w-16 bg-white/15" />
          <div>
            <h2 className="font-display text-2xl font-semibold leading-snug text-white">
              Central de O.S. e Aprovações
            </h2>
            <p className="mt-2.5 text-sm text-[#B7BABD]">
              Obras · Manutenção · Despesas internas · Aprovações da rede
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center bg-background px-6">
        <LoginForm />
      </div>
    </div>
  );
}
