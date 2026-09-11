-- CreateTable
CREATE TABLE "sla_prioridade" (
    "prioridade" "Prioridade" NOT NULL,
    "dias" INTEGER NOT NULL,

    CONSTRAINT "sla_prioridade_pkey" PRIMARY KEY ("prioridade")
);

-- CreateTable
CREATE TABLE "config_sistema" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "lembrete_whatsapp_ativo" BOOLEAN NOT NULL DEFAULT true,
    "lembrete_whatsapp_dias" INTEGER NOT NULL DEFAULT 3,
    "notificacao_email_ativo" BOOLEAN NOT NULL DEFAULT true,
    "resumo_diario_diretoria_ativo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "config_sistema_pkey" PRIMARY KEY ("id")
);
