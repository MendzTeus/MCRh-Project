# Andamento do plano de melhorias

Branch de trabalho: `claude/adoring-franklin-0mhq0q`. Cada fase é revisada e
aprovada antes da próxima. Regras combinadas:

- Não mudar o design das páginas públicas (o `/admin` pode ser redesenhado).
- Nada vai direto para a `main`; deploy é manual na VPS (ver `OPERATIONS.md`).
- Gravações/migrations só no projeto Supabase **de teste**; produção só leitura.
- Credenciais nunca no chat — ficam nas variáveis do ambiente
  (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY` apontam para o projeto de TESTE).
- Admin em português do Brasil.

## Concluídas (na branch, aguardando deploy)

| Fase | O quê | Commit |
|---|---|---|
| 0 | Testes sem banco, `dev:all`, `/api/health?deep=1`, `check:leads`, OPERATIONS.md | 8ff77ff, 481cd2f |
| 1 | Formulário de contato volta a salvar leads (3 defeitos: rota 404, corpo não lido, coluna `unitslug`); status new/contacted/closed | 9dd384b, d2a9865 |
| 2 | Páginas de coleção/apartamento nunca em branco; 404 para endereços inválidos | cabb186 |
| 3 | Edição de textos no admin sem recarregar; campos mostram o texto do site; "Restaurar padrão" | 3ebcf42 |
| 4 | Mapa do apartamento usa coordenadas salvas e só o pin do prédio; campos da coleção (headline, amenidades, distâncias, specs) ligados ao site | cb49879 |
| 5 | Admin unificado (uma rota por seção), todo em português, código morto removido | 6c558df, 4e41ed3 |

SQL já rodado em produção: diagnóstico da tabela `Enquiry` (estava vazia) e a
migration 004 (sem efeito, tabela vazia). Pendente opcional:
`ALTER TABLE "Enquiry" ALTER COLUMN status SET DEFAULT 'new';`

Antes do deploy da Fase 4: conferir `SELECT key, value FROM "SiteContent" WHERE key LIKE 'property.%'`.

## Próximas

- **6 — Conteúdo fixo para o banco** (properties.ts etc.; criar prédios/apartamentos
  pelo admin). Precisa do projeto de teste com a estrutura do banco de produção
  (dump só do schema) antes de qualquer gravação.
- **7 — Painel com dados reais** (ocupação a partir do `BlockedDate`/iCal, alertas).
- **8 — Limpeza** (README, restos do AI Studio, Docker `/media`, validação do
  upload de imagens de slot, `db.js` com erro claro sem env).

## Em aberto com o dono do site

- Print/página/aparelho do problema do mapa ("pedindo API"), se ainda ocorrer após o deploy.
- Backup do Supabase de produção (Database → Backups) ainda não confirmado.
