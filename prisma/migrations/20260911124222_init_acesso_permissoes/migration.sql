-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('solicitante', 'supervisor', 'diretor_dono', 'executor', 'admin');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "telefone" TEXT,
    "papel" "Papel" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lojas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "telefone" TEXT,
    "gerente_id" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lojas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "supervisor_id" TEXT,
    "sla_padrao_dias" INTEGER NOT NULL DEFAULT 3,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "setores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loja_setor" (
    "loja_id" TEXT NOT NULL,
    "setor_id" TEXT NOT NULL,

    CONSTRAINT "loja_setor_pkey" PRIMARY KEY ("loja_id","setor_id")
);

-- CreateTable
CREATE TABLE "usuario_setor" (
    "usuario_id" TEXT NOT NULL,
    "setor_id" TEXT NOT NULL,

    CONSTRAINT "usuario_setor_pkey" PRIMARY KEY ("usuario_id","setor_id")
);

-- CreateTable
CREATE TABLE "usuario_loja" (
    "usuario_id" TEXT NOT NULL,
    "loja_id" TEXT NOT NULL,

    CONSTRAINT "usuario_loja_pkey" PRIMARY KEY ("usuario_id","loja_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lojas_codigo_key" ON "lojas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "setores_nome_key" ON "setores"("nome");

-- AddForeignKey
ALTER TABLE "lojas" ADD CONSTRAINT "lojas_gerente_id_fkey" FOREIGN KEY ("gerente_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "setores" ADD CONSTRAINT "setores_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loja_setor" ADD CONSTRAINT "loja_setor_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loja_setor" ADD CONSTRAINT "loja_setor_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_setor" ADD CONSTRAINT "usuario_setor_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_setor" ADD CONSTRAINT "usuario_setor_setor_id_fkey" FOREIGN KEY ("setor_id") REFERENCES "setores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_loja" ADD CONSTRAINT "usuario_loja_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_loja" ADD CONSTRAINT "usuario_loja_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
