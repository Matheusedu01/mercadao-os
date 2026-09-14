# Mercadão O.S.

Sistema interno de ordens de serviço e aprovações, construído para uma rede de atacado com 27 lojas/unidades, substituindo um sistema de tickets antigo (osTicket) que não refletia mais o fluxo real de aprovação da empresa.

Toda solicitação de obra, manutenção ou despesa passa pelo mesmo fluxo, sem exceção por valor: **Solicitante → Supervisor → Diretor/Dono → Despesas**, com comparação de orçamentos de fornecedores, anexos, controle de SLA por prioridade, dashboards por papel e relatórios financeiros.

**🔗 No ar:** [mercadao-os.onrender.com](https://mercadao-os.onrender.com) — banco de dados real (Neon), sem login público por enquanto. Se quiser testar, me chame que eu passo um acesso de demonstração.

<p align="center">
  <img src="docs/screenshots/01-login.png" width="90%" alt="Tela de login">
</p>

---

## Capturas de tela

| | |
|---|---|
| ![Dashboard do Supervisor](docs/screenshots/02-dashboard-supervisor.png) | ![Detalhe da O.S.](docs/screenshots/03-detalhe-os.png) |
| Dashboard do Supervisor — métricas, fila de aprovação com ação rápida | Detalhe da O.S. — trilha de aprovação, orçamentos comparados, histórico |
| ![Abrir Nova O.S.](docs/screenshots/04-nova-os.png) | ![Usuários & Permissões](docs/screenshots/05-admin-usuarios.png) |
| Abertura de O.S. — orçamentos comparados e anexos | Painel admin — usuários, papéis e escopo |
| ![Relatórios Financeiros](docs/screenshots/06-relatorios.png) | |
| Relatórios financeiros — despesas por loja/setor, status, período | |

---

## Índice

- [Fluxo de aprovação](#fluxo-de-aprovação)
- [Papéis e permissões](#papéis-e-permissões)
- [Funcionalidades](#funcionalidades)
- [Stack técnica](#stack-técnica)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Modelo de dados](#modelo-de-dados)
- [Como rodar localmente](#como-rodar-localmente)
- [Extensão de navegador](#extensão-de-navegador)

---

## Fluxo de aprovação

```
Solicitante          Supervisor           Diretor/Dono          Despesas
─────────────        ─────────────        ─────────────        ─────────────
Abre a O.S. com   →   Aprova, rejeita   →  Aprovação final   →  Confere a nota
1+ orçamentos de      ou pede ajuste       (mesmas regras)       do fornecedor
fornecedor            (comentário                                e fecha a O.S.
comparados            obrigatório se                             como concluída
                       não aprovar)
```

- **Rejeitar** ou **pedir ajuste** sempre exige um comentário — a O.S. volta pro Solicitante, que edita e reenvia.
- Depois da 2ª aprovação, a O.S. vai pra **"Em execução"**; o serviço acontece fisicamente fora do sistema (quem executa não tem acesso — decisão deliberada, não limitação técnica).
- Quando a nota do fornecedor chega, o time de **Despesas** confere e marca como **Concluída**, registrando quem fechou e um comentário opcional.
- Todo o histórico (quem fez o quê e quando) fica registrado e auditável na própria O.S.

## Papéis e permissões

| Papel | Escopo | O que faz |
|---|---|---|
| **Solicitante** | Própria loja | Abre O.S. com orçamentos comparados e anexos (fotos/documentos), acompanha status, reenvia se pedirem ajuste |
| **Supervisor** | Rede completa | Aprova a 1ª etapa, aprovação rápida direto na lista, vê todas as O.S. da rede e os relatórios financeiros |
| **Diretor/Dono** | Rede completa | Aprovação final, mesma visão de rede completa e relatórios do Supervisor |
| **Despesas** | Rede completa | Vê tudo que está "Em execução", confere e fecha a O.S. quando a nota chega |
| **Admin (T.I.)** | Tudo | Usuários e permissões, lojas, setores, SLA por prioridade, configurações gerais, visão geral com O.S. vencidas |

Cada papel tem sua própria tela inicial com dashboard e menu — nada de uma única tela genérica pra todo mundo.

## Funcionalidades

**Abrir e decidir**
- Comparação de múltiplos orçamentos por fornecedor (valor, parcelas, seleção do vencedor)
- Anexo de fotos e documentos na abertura da O.S. (até 15MB, imagem/PDF/Word/Excel), protegido por permissão — só quem pode ver aquela O.S. consegue baixar o arquivo
- Edição da O.S. pelo solicitante antes da aprovação
- Rejeição e pedido de ajuste sempre exigem comentário
- Histórico completo de cada decisão

**Prazos e prioridade**
- 4 níveis de prioridade, cada um com SLA (dias) configurável
- Aba "Vencidas" na Visão Geral do admin, calculada a partir do SLA configurado
- Busca e filtros (status, prioridade, loja, texto) em todas as listas
- "Todas as O.S." com filtros completos pra Supervisor e Diretor

**Relatórios e dashboards**
- Painel com métricas relevantes pra cada papel na tela inicial (pendências, valores, tempo médio de decisão)
- Relatórios financeiros: total de O.S., valor aprovado, tempo médio até decisão, taxa de rejeição, despesas por loja/setor, distribuição por status — com filtro de período

**No dia a dia**
- Extensão de navegador (Chrome, Manifest V3) com uma bolha flutuante que aparece em qualquer site, mostrando pendências e permitindo aprovar/rejeitar sem trocar de aba
- PWA instalável (ícone, funciona como app)
- Interface 100% responsiva, com menu retrátil em telas pequenas
- Recuperação de senha mediada pelo admin (sem infraestrutura de e-mail ainda)

**Administração**
- CRUD completo de usuários (papel, escopo de lojas/setores, e-mail, senha, ativar/desativar), lojas e setores
- Configuração de SLA por prioridade e preferências de notificação

## Stack técnica

| Camada | Tecnologia | Por quê |
|---|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions, Turbopack) | Front e back num único projeto — cada tela já carrega os dados prontos do servidor, mutações via Server Actions sem precisar montar uma API REST à parte |
| UI | [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com) | Configuração de tema 100% em CSS (`@theme inline`), sem arquivo de config separado |
| Banco de dados | [PostgreSQL](https://www.postgresql.org) + [Prisma 7](https://www.prisma.io) (com driver adapter `@prisma/adapter-pg`) | Schema tipado, migrations versionadas, todas as relações (usuários, lojas, setores, O.S., orçamentos, aprovações, histórico, anexos) com integridade referencial |
| Autenticação | Sessão própria via JWT assinado ([`jose`](https://github.com/panva/jose)) + senha com [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js) | Implementação direta (sem NextAuth/Clerk) seguindo o padrão oficial de auth do Next.js — cookie httpOnly, checagem "otimista" no proxy e "segura" na Data Access Layer |
| Validação | [Zod](https://zod.dev) | Validação de todo input de Server Action antes de tocar no banco |
| Anexos | Disco local em dev; [Cloudflare R2](https://developers.cloudflare.com/r2/) (S3-compatible) em produção, via [`aws4fetch`](https://github.com/kotx/aws4fetch) | Serve tudo por uma Route Handler autenticada (checagem de permissão a cada download); troca de armazenamento é só variável de ambiente, sem mudar código de quem chama |
| Extensão | Chrome Manifest V3 (content script + service worker) | Content script injeta a UI em qualquer página via Shadow DOM (isolado do CSS do site); service worker é quem de fato tem `host_permissions` pra chamar a API sem CORS |

## Estrutura do projeto

```
src/
├── app/
│   ├── (raiz)/                  # Home por papel, Nova O.S., detalhe/edição de O.S.
│   ├── admin/                   # Usuários, Lojas, Setores, Configurações, Visão Geral, Relatórios
│   ├── api/
│   │   ├── anexos/[id]/         # Serve os arquivos anexados, com checagem de permissão
│   │   └── extensao/            # Endpoints usados pela extensão de navegador
│   ├── esqueci-senha/
│   ├── login/
│   ├── os/                      # Todas as O.S., Nova O.S., detalhe/edição
│   └── relatorios/               # Relatórios financeiros (Supervisor/Diretor)
├── components/                  # PainelNav, AdminNav, OSLista, RelatoriosConteudo...
├── lib/                          # dal.ts, session.ts, os-decisao.ts, os-permissoes.ts, anexos.ts, sla.ts...
└── generated/prisma/             # Prisma Client gerado (não versionado)

prisma/
├── schema.prisma
├── migrations/
└── seed.ts

extensao-chrome/                  # Extensão Chrome (Manifest V3)
```

## Modelo de dados

Principais entidades (ver `prisma/schema.prisma` para o schema completo):

- **Usuario** — papel (`solicitante` / `supervisor` / `diretor_dono` / `despesas` / `admin`), escopo de lojas e setores
- **Loja**, **Setor**, e as tabelas de vínculo (`LojaSetor`, `UsuarioLoja`, `UsuarioSetor`)
- **OrdemServico** — tipo, prioridade, status, relacionada a loja/setor/solicitante
- **Orcamento** — cada orçamento de fornecedor comparado numa O.S.
- **Aprovacao** — uma linha por decisão tomada em cada etapa (supervisor/diretor)
- **HistoricoOS** — timeline completa de eventos da O.S.
- **Anexo** — metadados dos arquivos anexados (o arquivo em si fica em disco)
- **SlaPrioridade**, **ConfigSistema** — configurações administráveis

## Como rodar localmente

Pré-requisitos: [Node.js](https://nodejs.org) 20+, [PostgreSQL](https://www.postgresql.org/download/) 17+.

```bash
# 1. Clonar e instalar dependências
git clone https://github.com/Matheusedu01/mercadao-os.git
cd mercadao-os
npm install

# 2. Criar o banco de dados
createdb mercadao_os
# (ou: psql -U postgres -c "CREATE DATABASE mercadao_os;")

# 3. Configurar variáveis de ambiente (.env na raiz)
echo 'DATABASE_URL="postgresql://postgres:SUASENHA@127.0.0.1:5432/mercadao_os?schema=public"' >> .env
echo 'SESSION_SECRET="'$(openssl rand -base64 32)'"' >> .env

# 4. Rodar migrations, gerar o client e popular dados de teste
npx prisma migrate deploy
npx prisma generate
npx tsx prisma/seed.ts

# 5. Rodar
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O seed cria um usuário de cada papel (senha `mercadao123` para todos) — os e-mails aparecem no terminal ao final do seed.

### Variáveis de ambiente do R2 (opcionais)

Sem essas variáveis, anexos vão pro disco local (`uploads/`) — bom pra desenvolvimento. Em produção "sem servidor fixo" (Vercel, Render free tier, etc.), o disco não é permanente, então é necessário configurar um bucket [Cloudflare R2](https://developers.cloudflare.com/r2/) (10GB grátis):

```bash
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
```

## Deploy em produção sem custo

Combinação usada pra manter isso no ar de graça:

| Peça | Serviço | Status |
|---|---|---|
| App (Next.js) | [Render](https://render.com) (free web service) | ✅ No ar — processo persistente, dorme após inatividade no plano grátis |
| Banco de dados | [Neon](https://neon.tech) (free tier Postgres) | ✅ Em uso — schema migrado e populado |
| Anexos | [Cloudflare R2](https://developers.cloudflare.com/r2/) | ⏳ Suportado pelo código (variáveis `R2_*` acima), ainda não ativado — anexos em produção usam o disco do Render por enquanto |

## Extensão de navegador

Em `extensao-chrome/`. Pra testar:

1. `chrome://extensions` → ativar "Modo do desenvolvedor"
2. "Carregar sem compactação" → selecionar a pasta `extensao-chrome/`
3. Nas Opções da extensão, apontar o "Endereço do sistema" pra URL onde o app está rodando
4. Estar logado no sistema (Supervisor, Diretor/Dono ou Admin) numa aba normal

A bolha flutuante aparece em qualquer site, mostrando o número de O.S. pendentes; clicando, expande um painel com aprovação/rejeição inline.

---

Desenvolvido por **Matheus Eduardo**.
