# Operação — mcrh.co.uk

Guia para mexer no projeto com o site em produção. Itens marcados como **não confirmado**
dependem de informação que ainda não está no repositório.

## 1. Rodar localmente

```bash
cp .env.example .env      # preencha com um banco de TESTE (ver seção 3)
npm ci
npm run dev:all           # API em :3001 (reinicia sozinha) + site em :3000
```

- `npm run dev` sobe só o site. Sem a API, as páginas de coleção/apartamento
  ficam em branco (elas dependem de `/api/content/properties`).
- `npm run dev:api` sobe só a API.
- O `dev:all` mostra no início **qual banco está sendo usado**. Tudo que for
  salvo no admin local é gravado nesse banco.

## 2. Checagens antes de qualquer merge

```bash
npm run lint    # tsc --noEmit
npm test        # vitest — não precisa de banco, usa credenciais fictícias
npm run build
```

## 3. Banco de teste (obrigatório para gravações)

**Decisão:** gravações, migrations e uploads são testados só num projeto Supabase
separado, exclusivo para testes. Até ele existir, contra produção só se faz leitura
(ex.: `npm run check:leads`) e testes automáticos com dados fictícios — nunca
gravar em produção a partir de um ambiente de desenvolvimento.

O `.env` com as credenciais de produção faz o admin local gravar no site real.
Para montar o banco de teste:

1. Criar um segundo projeto no Supabase (plano grátis).
2. Recriar o schema (seção 4) e rodar as migrations de `database/migrations/`.
3. Copiar alguns dados (Property, Unit, SiteContent) — export CSV no Table Editor.
4. Criar o bucket de storage `property-media` (público).
5. Apontar o `.env` local para esse projeto.

## 4. Exportar o schema de produção (somente leitura)

O repositório não tem o schema base, só migrations incrementais. Para versioná-lo,
rode no **SQL Editor** do Supabase de produção (é só leitura) e salve o resultado
em `database/schema-snapshot.csv`:

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

## 5. Backup antes de migrations

- [ ] **Ainda não confirmado — não assumir que existe.** Verificar o plano do Supabase
      e se há backup diário / Point-in-Time Recovery (Dashboard → Database → Backups).
      Enquanto não estiver confirmado, toda migration que altera dados exige um export
      CSV manual das tabelas afetadas antes de rodar.
- [ ] Antes de uma migration que altera dados: exportar as tabelas afetadas em CSV.
- Regras das migrations:
  - só aditivas (`ADD COLUMN IF NOT EXISTS`, nunca `DROP`/`RENAME` no mesmo deploy);
  - o código antigo precisa continuar funcionando depois da migration;
  - mudança de valores (ex.: status de leads) em duas etapas: código aceita os
    dois valores → deploy → migra os dados → deploy que remove o valor antigo.

## 6. Deploy

**Merge no `main` NÃO publica.** Não há GitHub Actions nem webhook de deploy. O deploy
é manual, na VPS:

1. Atualizar o código na VPS para o commit desejado do `main`.
2. Build da imagem com o `Dockerfile` do repositório → `mcrh-website:preview`.
3. Atualizar o serviço Docker Swarm `mcrh-website-preview` com a nova imagem.

O `main` do GitHub corresponde ao que está publicado — manter assim: só publicar
commits que estão no `main`.

Recomendação (ainda não aplicada): marcar cada build também com o hash do commit,
para saber exatamente o que está no ar e poder voltar para uma versão anterior:

```bash
SHA=$(git rev-parse --short HEAD)
docker build -t mcrh-website:$SHA -t mcrh-website:preview .
docker service update --image mcrh-website:$SHA mcrh-website-preview
```

Logs: `docker service logs -f mcrh-website-preview` (nginx + API no mesmo container).

Checklist por deploy:
- [ ] PR revisado, `lint` + `test` + `build` verdes.
- [ ] Migration (se houver) já aplicada e compatível com o código atual.
- [ ] Fora do horário de pico.
- [ ] Depois do deploy: `/api/health?deep=1` responde `{"ok":true,"db":"ok"}`,
      abrir Home, /properties, uma coleção, um apartamento e o /admin.

## 7. Rollback

1. Mais rápido: `docker service rollback mcrh-website-preview` (volta para a imagem
   anterior do serviço, se ela ainda existir na VPS). Com builds marcados pelo hash
   do commit, também dá para `docker service update --image mcrh-website:<sha-anterior> mcrh-website-preview`.
2. Depois, `git revert <commit>` no `main` para o repositório continuar igual ao site.
3. Migrations são aditivas, então o código anterior continua funcionando com o
   banco novo — não é preciso desfazer a migration.

## 8. Monitoramento

- `GET /api/health` — a API está no ar.
- `GET /api/health?deep=1` — a API **e** o banco respondem (503 se o banco falhar).
- Sugestão: um monitor gratuito (UptimeRobot, Better Stack) chamando
  `https://mcrh.co.uk/api/health?deep=1` a cada 5 min, com alerta por e-mail.

## 9. Diagnóstico de leads

```bash
npm run check:leads   # somente leitura
```

Mostra quantos leads há por status e lista os recentes com status `novo`, que hoje
não aparecem como pendentes na página nova de Leads nem no Dashboard.

## 10. Histórico de deploys com passos especiais

### Fase 1 — Leads

1. **Deploy do código** (sem migration). A partir dele:
   - o formulário de contato volta a gravar leads (antes todo envio falhava);
   - leads novos entram com status `new`; os antigos `novo/lido/arquivado`
     aparecem como `new/contacted/closed` no admin, sem mexer no banco.
   - Conferir depois do deploy: enviar um teste pelo formulário em /contact →
     ver o lead em /admin/leads e no Dashboard → excluí-lo.
2. **Migration `004_enquiry_status.sql`** (opcional, pode ser dias depois):
   exportar a tabela `Enquiry` em CSV → rodar no projeto de teste → rodar em
   produção. Só limpa os valores antigos; nada muda na tela.
