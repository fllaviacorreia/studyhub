# StudyHub

Plataforma web multiusuário e multiobjetivo para organizar estudos, editais, conteúdos, questões, planejamento e evolução. SEFAZ-BA e ANPD são apenas exemplos de uso.

O projeto está na fase de fundação. Consulte [a arquitetura](docs/architecture.md) e [o plano incremental](docs/implementation-plan.md).

## Desenvolvimento

Copie `.env.example` para `.env`, inicie o PostgreSQL e prepare o Prisma:

```bash
docker compose up -d postgres
npm install
npm run db:generate
npm run dev
```

Validação local:

```bash
npm run check
```
