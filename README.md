# Casamento de Daiane & Augusto

Site completo de casamento com frontend em React/Vite/TypeScript e backend em Node.js/Express, com RSVP salvo em MySQL e painel administrativo protegido por senha.

## Estrutura

```text
client/                  Frontend React
client/public/fotos/     Fotos otimizadas usadas no site
client/src/data/         Configurações do casamento e seleção de fotos
server/                  Backend Express
Fotos pré-wedding/       Fotos originais
```

## Onde trocar informações

Os principais dados ficam em:

```text
client/src/data/siteConfig.ts
client/src/data/photos.ts
```

Para trocar fotos depois, coloque a nova imagem em `client/public/fotos` e altere apenas o nome do arquivo em `client/src/data/photos.ts`.

## Rodar localmente

Instale as dependências:

```bash
npm install
```

Rode frontend e backend juntos:

```bash
npm run dev
```

URLs locais:

```text
Site: http://localhost:5173
API: http://localhost:3333
Admin: http://localhost:5173/admin
```

## Variáveis de ambiente

O arquivo `.env` local já foi criado para facilitar os testes. Antes de publicar, troque principalmente:

```text
ADMIN_PASSWORD
JWT_SECRET
FRONTEND_ORIGIN
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
```

Nunca publique o `.env`. Ele já está no `.gitignore`.

Para desenvolvimento local com MySQL na máquina, o `.env` usa:

```text
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=casamento_daiane_augusto
DB_AUTO_CREATE=true
```

`DB_AUTO_CREATE=true` tenta criar o banco automaticamente. Na Hostinger, deixe como `false` e crie o banco pelo hPanel.

Se o MySQL local recusar o usuário `root` por plugin de autenticação, crie um usuário próprio pelo phpMyAdmin ou terminal:

```sql
CREATE DATABASE casamento_daiane_augusto
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'casamento_app'@'localhost' IDENTIFIED BY 'uma_senha_forte';
GRANT ALL PRIVILEGES ON casamento_daiane_augusto.* TO 'casamento_app'@'localhost';
FLUSH PRIVILEGES;
```

Depois ajuste o `.env`:

```text
DB_USER=casamento_app
DB_PASSWORD=uma_senha_forte
DB_AUTO_CREATE=false
```

## Build de produção

```bash
npm run build
```

Para iniciar o servidor em produção:

```bash
npm start
```

O Express também consegue servir o frontend gerado em `client/dist`, desde que o projeto seja publicado mantendo `client` e `server` na mesma estrutura. Se a Hostinger usar outro caminho, defina `CLIENT_DIST_PATH` no ambiente do servidor.

## Deploy na Hostinger

Opção recomendada: hospedagem com suporte a Node.js ou VPS.

1. Envie o projeto para o servidor.
2. Crie um banco MySQL no hPanel da Hostinger.
3. Configure as variáveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.
4. Rode `npm install`.
5. Rode `npm run build`.
6. Inicie o backend com `npm start`.
7. Aponte o domínio `daianeeaugusto.site` para a aplicação Node.

Se o frontend ficar separado do backend, crie `client/.env` com:

```text
VITE_API_URL=https://url-do-backend
```

Depois rode novamente `npm run build --workspace client`.

## Banco de Dados

O projeto usa MySQL via `mysql2`. Ao iniciar, o backend cria automaticamente a tabela `rsvps` dentro do banco configurado:

```sql
rsvps
```

Na Hostinger, crie o banco pelo hPanel antes de iniciar a aplicação e configure:

```text
DB_HOST=host_mysql_da_hostinger
DB_PORT=3306
DB_USER=usuario_do_banco
DB_PASSWORD=senha_do_banco
DB_NAME=nome_do_banco
DB_AUTO_CREATE=false
```

Faça backups pelo hPanel/phpMyAdmin antes de atualizações importantes.

## Fotos

As fotos originais permanecem em `Fotos pré-wedding`. O site usa cópias otimizadas em `client/public/fotos` para ficar mais leve.
