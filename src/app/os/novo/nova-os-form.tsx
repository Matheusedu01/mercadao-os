"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { criarOS } from "@/app/os/actions";

function formatarTamanho(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Loja = { id: string; nome: string; codigo: string };
type Setor = { id: string; nome: string };

const TIPOS = [
  { valor: "obra", label: "Obra" },
  { valor: "manutencao", label: "Manutenção" },
  { valor: "despesa", label: "Despesa" },
  { valor: "outro", label: "Outro" },
] as const;

const PRIORIDADES = [
  { valor: "baixa", label: "Baixa" },
  { valor: "media", label: "Média" },
  { valor: "alta", label: "Alta" },
  { valor: "urgente", label: "Urgente" },
] as const;

type LinhaOrcamento = { chave: number; fornecedor: string; valor: string; parcelas: string };

let proximaChave = 1;

export function NovaOSForm({
  lojas,
  setoresPorLoja,
}: {
  lojas: Loja[];
  setoresPorLoja: Record<string, Setor[]>;
}) {
  const [state, action, pending] = useActionState(criarOS, undefined);
  const [lojaId, setLojaId] = useState(lojas[0]?.id ?? "");
  const [local, setLocal] = useState("");
  const [linhas, setLinhas] = useState<LinhaOrcamento[]>([
    { chave: proximaChave++, fornecedor: "", valor: "", parcelas: "À vista" },
  ]);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const inputArquivosRef = useRef<HTMLInputElement>(null);

  // Input de arquivo é "uncontrolled" por segurança - cada vez que o usuário
  // escolhe arquivos de novo, o navegador SUBSTITUI a seleção anterior (não
  // acumula). Pra permitir escolher em vários momentos e ainda assim
  // remover um item específico depois, mantemos a lista acumulada aqui no
  // estado e reescrevemos o FileList real do input via DataTransfer sempre
  // que ela muda - assim o que aparece na tela é exatamente o que é enviado.
  function sincronizarInput(lista: File[]) {
    const dt = new DataTransfer();
    lista.forEach((f) => dt.items.add(f));
    if (inputArquivosRef.current) inputArquivosRef.current.files = dt.files;
  }

  function adicionarArquivos(novos: FileList | null) {
    if (!novos || novos.length === 0) return;
    setArquivos((atual) => {
      const combinados = [...atual, ...Array.from(novos)];
      sincronizarInput(combinados);
      return combinados;
    });
  }

  function removerArquivo(index: number) {
    setArquivos((atual) => {
      const restantes = atual.filter((_, i) => i !== index);
      sincronizarInput(restantes);
      return restantes;
    });
  }

  const lojaSelecionada = lojas.find((l) => l.id === lojaId);
  const setoresDisponiveis = setoresPorLoja[lojaId] ?? [];

  const tituloPreview = useMemo(() => {
    const codigo = lojaSelecionada?.codigo ?? "LOJA";
    const fornecedor = linhas[0]?.fornecedor.trim() || "FORNECEDOR";
    const localPreview = local.trim() || "LOCAL";
    return `${codigo}-${fornecedor.toUpperCase()}-${localPreview.toUpperCase()}`;
  }, [lojaSelecionada, linhas, local]);

  function atualizarLinha(chave: number, campo: keyof LinhaOrcamento, valor: string) {
    setLinhas((atual) =>
      atual.map((l) => (l.chave === chave ? { ...l, [campo]: valor } : l)),
    );
  }

  function adicionarLinha() {
    setLinhas((atual) => [
      ...atual,
      { chave: proximaChave++, fornecedor: "", valor: "", parcelas: "À vista" },
    ]);
  }

  function removerLinha(chave: number) {
    setLinhas((atual) => (atual.length > 1 ? atual.filter((l) => l.chave !== chave) : atual));
  }

  return (
    <form action={action} encType="multipart/form-data" className="flex flex-col gap-6">
      <div>
        <span className="mb-2 block text-xs font-semibold text-text-2">
          Tipo de solicitação
        </span>
        <div className="flex gap-2">
          {TIPOS.map((t, i) => (
            <label
              key={t.valor}
              className="flex-1 cursor-pointer rounded-[9px] border border-border py-2.5 text-center text-sm font-semibold text-text-2 has-checked:border-charcoal has-checked:bg-charcoal has-checked:text-white"
            >
              <input
                type="radio"
                name="tipo"
                value={t.valor}
                defaultChecked={i === 0}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Loja</span>
          <select
            name="lojaId"
            value={lojaId}
            onChange={(e) => setLojaId(e.target.value)}
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          >
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-2">Setor responsável</span>
          <select
            name="setorId"
            required
            defaultValue=""
            className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
          >
            <option value="" disabled>
              Selecione o setor
            </option>
            {setoresDisponiveis.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text-2">
          Local / o que precisa (ex.: &quot;Depósito e estacionamento&quot;)
        </span>
        <input
          name="local"
          required
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
      </label>

      <div className="rounded-[9px] border border-dashed border-border bg-background px-3.5 py-3">
        <span className="block text-[10.5px] font-semibold text-text-3">
          Título gerado automaticamente
        </span>
        <span className="font-display text-sm font-bold text-foreground">
          {tituloPreview}
        </span>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text-2">Descrição detalhada</span>
        <textarea
          name="descricao"
          required
          rows={4}
          placeholder="Explique o que precisa ser feito, motivo da solicitação e urgência..."
          className="rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
      </label>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs font-semibold text-text-2">Anexos (opcional)</span>
          <span className="text-[11px] text-text-3">Fotos do local, orçamento em PDF, etc.</span>
        </div>
        <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[9px] border border-dashed border-border bg-background px-3.5 py-4 text-center hover:border-orange">
          <span className="text-xs font-semibold text-text-2">
            Clique para escolher arquivos
          </span>
          <span className="text-[10.5px] text-text-3">
            Foto, PDF, Word ou Excel · até 15MB cada
          </span>
          <input
            ref={inputArquivosRef}
            type="file"
            name="anexos"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={(e) => adicionarArquivos(e.target.files)}
            className="sr-only"
          />
        </label>
        {arquivos.length > 0 && (
          <div className="mt-2.5 flex flex-col gap-1.5">
            {arquivos.map((arquivo, i) => (
              <div
                key={`${arquivo.name}-${i}`}
                className="flex items-center gap-2.5 rounded-[8px] border border-border bg-white px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  {arquivo.name}
                </span>
                <span className="shrink-0 text-[10.5px] text-text-3">
                  {formatarTamanho(arquivo.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removerArquivo(i)}
                  className="shrink-0 text-xs font-semibold text-text-3 hover:text-red-600"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs font-semibold text-text-2">Orçamentos de fornecedores</span>
          <span className="text-[11px] text-text-3">
            Anexe pelo menos 1 — quanto mais opções, mais rápida a aprovação
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {linhas.map((linha, i) => (
            <div
              key={linha.chave}
              className="flex flex-wrap items-end gap-2.5 rounded-[10px] border border-border bg-background p-3"
            >
              <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-charcoal font-display text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <label className="flex basis-full flex-col gap-1 sm:basis-0 sm:flex-1">
                <span className="text-[10.5px] text-text-3">Fornecedor</span>
                <input
                  name="fornecedor"
                  required={i === 0}
                  value={linha.fornecedor}
                  onChange={(e) => atualizarLinha(linha.chave, "fornecedor", e.target.value)}
                  className="rounded-[8px] border border-border bg-white px-2.5 py-2 text-sm outline-none focus:border-orange"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 sm:w-32 sm:flex-none">
                <span className="text-[10.5px] text-text-3">Valor (R$)</span>
                <input
                  name="valor"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required={i === 0}
                  value={linha.valor}
                  onChange={(e) => atualizarLinha(linha.chave, "valor", e.target.value)}
                  className="rounded-[8px] border border-border bg-white px-2.5 py-2 text-sm outline-none focus:border-orange"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 sm:w-32 sm:flex-none">
                <span className="text-[10.5px] text-text-3">Parcelas</span>
                <input
                  name="parcelas"
                  value={linha.parcelas}
                  onChange={(e) => atualizarLinha(linha.chave, "parcelas", e.target.value)}
                  className="rounded-[8px] border border-border bg-white px-2.5 py-2 text-sm outline-none focus:border-orange"
                />
              </label>
              {linhas.length > 1 && (
                <button
                  type="button"
                  onClick={() => removerLinha(linha.chave)}
                  className="pb-2 text-xs font-semibold text-text-3 hover:text-red-600"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={adicionarLinha}
          className="mt-2.5 text-xs font-semibold text-orange-dark hover:underline"
        >
          + Adicionar outro orçamento
        </button>
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold text-text-2">Prioridade</span>
        <div className="flex gap-2">
          {PRIORIDADES.map((p, i) => (
            <label
              key={p.valor}
              className="flex-1 cursor-pointer rounded-[9px] border border-border py-2.5 text-center text-sm font-semibold text-text-2 has-checked:border-orange has-checked:bg-orange-tint has-checked:text-orange-dark"
            >
              <input
                type="radio"
                name="prioridade"
                value={p.valor}
                defaultChecked={i === 1}
                className="sr-only"
              />
              {p.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-text-3">
          &quot;Urgente&quot; fica registrado no relatório e é revisado pelo supervisor.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text-2">Data desejada (opcional)</span>
        <input
          name="dataDesejada"
          type="date"
          className="w-48 rounded-[9px] border border-border px-3 py-2.5 text-sm outline-none focus:border-orange"
        />
      </label>

      {state?.erro && (
        <p role="alert" className="text-sm font-medium text-red-700">
          {state.erro}
        </p>
      )}

      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-[10px] bg-orange px-6 py-3 font-display text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Enviando..." : "Enviar para aprovação"}
        </button>
      </div>
    </form>
  );
}
