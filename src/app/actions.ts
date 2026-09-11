"use server";

import { redirect } from "next/navigation";
import { encerrarSessao } from "@/lib/session";

export async function logout() {
  await encerrarSessao();
  redirect("/login");
}
