# OrtFlow

Aplicação de gestão de equipas, horários e mapa de férias, construída com [Nuxt](https://nuxt.com) e [Nuxt UI](https://ui.nuxt.com).

## Funcionalidades

- **Dashboard** — visão geral com estatísticas, escala do dia e próximas férias.
- **Equipas** — criação de equipas e gestão de colaboradores.
- **Horários** — planeamento semanal de turnos (manhã / tarde / noite / folga) por colaborador.
- **Mapa de férias** — calendário mensal e gestão de pedidos de férias (pendente / aprovado / rejeitado).

Os dados são guardados numa base de dados SQLite/[Turso](https://turso.tech) (via [Drizzle ORM](https://orm.drizzle.team)) no servidor — ver [server/database/schema.ts](server/database/schema.ts) e [server/api](server/api). O acesso é feito com login real (email + password), usando [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils).

## Setup

```bash
npm install
npm run db:migrate
npm run db:seed
```

O `db:seed` cria a empresa, lojas e colaboradores de exemplo, todos com a password `ortflow123` (o comando imprime a lista de emails no final).

## Servidor de desenvolvimento

Arranca em `http://localhost:3000`:

```bash
npm run dev
```

Em desenvolvimento, se `NUXT_SESSION_PASSWORD` não estiver definida, é gerada automaticamente e guardada em `.env` (não versionado). Em produção define-a explicitamente — ver [.env.example](.env.example).

## Produção

```bash
npm run build
npm run preview
```

Consulta a [documentação de deployment do Nuxt](https://nuxt.com/docs/getting-started/deployment) para mais informações.

### Deploy (Vercel ou outro serverless)

Um ficheiro SQLite local não sobrevive em ambientes serverless (disco efémero) — em produção é obrigatório usar Turso:

1. Instala a CLI da Turso e cria a base de dados: `turso db create ortflow`
2. Obtém a URL: `turso db show ortflow --url`
3. Cria um token: `turso db tokens create ortflow`
4. Define `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` e `NUXT_SESSION_PASSWORD` nas variáveis de ambiente do projeto (ex: dashboard da Vercel)
5. Aplica as migrações contra essa base de dados antes do primeiro deploy: `TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:migrate` (e `db:seed` se quiseres os dados de exemplo)
