import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SENHA_PADRAO = "mercadao123";

async function main() {
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);

  // Lojas reais da rede, informadas pelo usuário (prints do sistema antigo).
  // Cidade/UF ficam em branco por enquanto - dá pra completar depois pela
  // tela de Lojas, sem precisar chutar aqui.
  const LOJAS_FISICAS = [
    { codigo: "LJ01", nome: "Pereque" },
    { codigo: "LJ02", nome: "Cotia" },
    { codigo: "LJ03", nome: "Guarujá" },
    { codigo: "LJ04", nome: "Peruíbe" },
    { codigo: "LJ05", nome: "Praia Grande" },
    { codigo: "LJ06", nome: "Santos" },
    { codigo: "LJ07", nome: "Pirajussara" },
    { codigo: "LJ08", nome: "Itanhaém" },
    { codigo: "LJ09", nome: "M. Boi Mirim" },
    { codigo: "LJ10", nome: "Mongaguá" },
    { codigo: "LJ11", nome: "Morumbi" },
    { codigo: "LJ12", nome: "Registro" },
    { codigo: "LJ13", nome: "Enseada" },
    { codigo: "LJ14", nome: "Bertioga" },
    { codigo: "LJ15", nome: "Barueri" },
    { codigo: "LJ16", nome: "Campo Limpo" },
  ];

  // Outras unidades do grupo (não são pontos de venda, mas também abrem
  // O.S. no sistema). Os códigos 902/904/905 foram inferidos pela posição
  // na lista original (apareciam como "P - NOME", sem número visível) -
  // vale confirmar/corrigir depois na tela de Lojas se algum estiver errado.
  const OUTRAS_UNIDADES = [
    { codigo: "LJ901", nome: "Top Fruit" },
    { codigo: "LJ902", nome: "Holding Manager X" },
    { codigo: "LJ903", nome: "Mad Serv" },
    { codigo: "LJ904", nome: "Holding Force X" },
    { codigo: "LJ905", nome: "Holding Toledo" },
    { codigo: "LJ906", nome: "Beef Bom" },
    { codigo: "LJ907", nome: "KLM Comercio" },
    { codigo: "LJ918", nome: "Veg Mix" },
    { codigo: "LJ919", nome: "Merc Balanças" },
    { codigo: "LJ920", nome: "Mister Egg" },
    { codigo: "LJ999", nome: "Matriz" },
  ];

  const todasAsLojas = [];
  for (const l of [...LOJAS_FISICAS, ...OUTRAS_UNIDADES]) {
    const loja = await prisma.loja.upsert({
      where: { codigo: l.codigo },
      update: { nome: l.nome },
      create: { codigo: l.codigo, nome: l.nome },
    });
    todasAsLojas.push(loja);
  }
  const lojaPrincipal = todasAsLojas.find((l) => l.codigo === "LJ01")!;

  const setorObras = await prisma.setor.upsert({
    where: { nome: "Obras" },
    update: {},
    create: { nome: "Obras", slaPadraoDias: 3 },
  });
  const setorManutencao = await prisma.setor.upsert({
    where: { nome: "Manutenção" },
    update: {},
    create: { nome: "Manutenção", slaPadraoDias: 3 },
  });
  const setorEletrica = await prisma.setor.upsert({
    where: { nome: "Elétrica" },
    update: {},
    create: { nome: "Elétrica", slaPadraoDias: 2 },
  });
  const setorTI = await prisma.setor.upsert({
    where: { nome: "TI" },
    update: {},
    create: { nome: "TI", slaPadraoDias: 5 },
  });

  // Habilita todos os setores em todas as lojas (simples o suficiente pro seed).
  const setores = [setorObras, setorManutencao, setorEletrica, setorTI];
  for (const loja of todasAsLojas) {
    for (const setor of setores) {
      await prisma.lojaSetor.upsert({
        where: { lojaId_setorId: { lojaId: loja.id, setorId: setor.id } },
        update: {},
        create: { lojaId: loja.id, setorId: setor.id },
      });
    }
  }

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@mercadao.com" },
    update: {},
    create: {
      nome: "Adriana Dias",
      email: "admin@mercadao.com",
      senhaHash,
      papel: "admin",
      telefone: "11999990000",
    },
  });

  const solicitante = await prisma.usuario.upsert({
    where: { email: "rafael.souza@mercadao.com" },
    update: {},
    create: {
      nome: "Rafael Souza",
      email: "rafael.souza@mercadao.com",
      senhaHash,
      papel: "solicitante",
      telefone: "11999990001",
      usuarioLojas: { create: [{ lojaId: lojaPrincipal.id }] },
    },
  });

  // Garante que quem deve ter escopo "rede completa" continue com todas as
  // lojas vinculadas mesmo ao rodar o seed de novo (upsert não atualiza
  // relações aninhadas por padrão - por isso o deleteMany + create aqui).
  const escopoRedeCompleta = {
    usuarioLojas: {
      deleteMany: {},
      create: todasAsLojas.map((loja) => ({ lojaId: loja.id })),
    },
  };

  const supervisor = await prisma.usuario.upsert({
    where: { email: "marcos.cunha@mercadao.com" },
    update: escopoRedeCompleta,
    create: {
      nome: "Marcos Cunha",
      email: "marcos.cunha@mercadao.com",
      senhaHash,
      papel: "supervisor",
      telefone: "11999990002",
      usuarioSetores: {
        create: [{ setorId: setorObras.id }, { setorId: setorManutencao.id }],
      },
      usuarioLojas: {
        create: todasAsLojas.map((loja) => ({ lojaId: loja.id })),
      },
    },
  });

  const diretor = await prisma.usuario.upsert({
    where: { email: "eduardo.pereira@mercadao.com" },
    update: escopoRedeCompleta,
    create: {
      nome: "Eduardo Pereira",
      email: "eduardo.pereira@mercadao.com",
      senhaHash,
      papel: "diretor_dono",
      telefone: "11999990003",
      usuarioLojas: {
        create: todasAsLojas.map((loja) => ({ lojaId: loja.id })),
      },
    },
  });

  // Despesas (financeiro) fecha a O.S. quando a nota do fornecedor chega -
  // escopo é sempre rede completa, não faz sentido restringir por setor.
  const despesas = await prisma.usuario.upsert({
    where: { email: "joao.pedro@mercadao.com" },
    update: escopoRedeCompleta,
    create: {
      nome: "João Pedro",
      email: "joao.pedro@mercadao.com",
      senhaHash,
      papel: "despesas",
      telefone: "11999990004",
      usuarioLojas: {
        create: todasAsLojas.map((loja) => ({ lojaId: loja.id })),
      },
    },
  });

  // Setores apontam seus supervisores responsáveis (etapa 1 de aprovação).
  await prisma.setor.update({
    where: { id: setorObras.id },
    data: { supervisorId: supervisor.id },
  });
  await prisma.setor.update({
    where: { id: setorManutencao.id },
    data: { supervisorId: supervisor.id },
  });

  const SLA_PADRAO = [
    { prioridade: "baixa", dias: 5 },
    { prioridade: "media", dias: 3 },
    { prioridade: "alta", dias: 2 },
    { prioridade: "urgente", dias: 1 },
  ] as const;
  for (const { prioridade, dias } of SLA_PADRAO) {
    await prisma.slaPrioridade.upsert({
      where: { prioridade },
      update: {},
      create: { prioridade, dias },
    });
  }

  await prisma.configSistema.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  console.log("Seed concluído. Usuários criados (senha para todos: %s):", SENHA_PADRAO);
  console.log(`  admin        -> ${admin.email}`);
  console.log(`  solicitante  -> ${solicitante.email}`);
  console.log(`  supervisor   -> ${supervisor.email}`);
  console.log(`  diretor/dono -> ${diretor.email}`);
  console.log(`  despesas     -> ${despesas.email}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
