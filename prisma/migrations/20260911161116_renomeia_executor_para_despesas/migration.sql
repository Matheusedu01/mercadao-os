-- Renomeia o papel "executor" para "despesas": o time de Despesas (financeiro)
-- passa a ser quem fecha a O.S. quando a nota do fornecedor chega, em vez de
-- um "executor" que nunca teve acesso ao sistema de verdade. RENAME VALUE
-- preserva os dados existentes (linhas com papel = 'executor' passam a ter
-- papel = 'despesas' automaticamente).
ALTER TYPE "Papel" RENAME VALUE 'executor' TO 'despesas';

ALTER TABLE "ordens_servico" RENAME COLUMN "executor_id" TO "despesas_id";
ALTER TABLE "ordens_servico" RENAME CONSTRAINT "ordens_servico_executor_id_fkey" TO "ordens_servico_despesas_id_fkey";
