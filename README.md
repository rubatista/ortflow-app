# OrtFlow

Aplicação de gestão de equipas, horários e mapa de férias, construída com [Nuxt](https://nuxt.com) e [Nuxt UI](https://ui.nuxt.com).

## Funcionalidades

- **Dashboard** — visão geral com estatísticas, escala do dia e próximas férias.
- **Equipas** — criação de equipas e gestão de colaboradores.
- **Horários** — planeamento semanal de turnos (manhã / tarde / noite / folga) por colaborador.
- **Mapa de férias** — calendário mensal e gestão de pedidos de férias (pendente / aprovado / rejeitado).

Os dados são guardados em `localStorage` do browser (sem backend/base de dados por agora) — ver [app/composables/useAppData.ts](app/composables/useAppData.ts).

## Setup

```bash
npm install
```

## Servidor de desenvolvimento

Arranca em `http://localhost:3000`:

```bash
npm run dev
```

## Produção

```bash
npm run build
npm run preview
```

Consulta a [documentação de deployment do Nuxt](https://nuxt.com/docs/getting-started/deployment) para mais informações.
