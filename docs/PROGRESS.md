# Andamento do plano de melhorias

Branch de trabalho: `claude/adoring-franklin-0mhq0q`. Cada fase é revisada e
aprovada antes da próxima. Regras combinadas:

- Não mudar o design das páginas públicas (o `/admin` pode ser redesenhado).
- Nada vai direto para a `main`; deploy é manual na VPS (ver `OPERATIONS.md`).
- Não há projeto Supabase de teste (limite da conta). Decisão: opção B — o
  Claude só LÊ a produção; toda gravação é SQL/script revisado, com backup,
  rodado pelo dono do site.
- Credenciais nunca no chat. (Em 2026-09-28 as variáveis do ambiente apontavam
  para a PRODUÇÃO — projeto `stoh…`; o dono removeu a chave.)
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
| 6a | Conteúdo dos prédios (headline, amenidades, distâncias, specs) com fonte única na tabela `Property`; migration 005 | ver log |

SQL já rodado em produção: diagnóstico da tabela `Enquiry` (estava vazia) e a
migration 004 (sem efeito, tabela vazia). Pendente opcional:
`ALTER TABLE "Enquiry" ALTER COLUMN status SET DEFAULT 'new';`

Antes do deploy: rodar a migration 005 (ver OPERATIONS.md, "Fases 4 e 6").

## Próximas

- **6b — Criar prédios/apartamentos novos pelo admin** (páginas públicas passam a
  renderizar itens que não existem no código). Sem banco de teste (opção B):
  backup + scripts rodados pelo dono do site.
- **7 — Painel com dados reais** (ocupação a partir do `BlockedDate`/iCal, alertas).
- **8 — Limpeza** (README, restos do AI Studio, Docker `/media`, validação do
  upload de imagens de slot, `db.js` com erro claro sem env).

## Em aberto com o dono do site

- Print/página/aparelho do problema do mapa ("pedindo API"), se ainda ocorrer após o deploy.
- Backup do Supabase de produção (Database → Backups) ainda não confirmado.
