# Hamburgueria e Comedoria

Projeto com frontend em `index.html` e backend Express em `server.js`. A Vercel detecta o Express automaticamente e publica o aplicativo como uma função.

## Deploy na Vercel

1. Envie este projeto para o GitHub.
2. Importe o repositório na Vercel.
3. Em **Settings > Environment Variables**, crie `MP_ACCESS_TOKEN` com o Access Token do Mercado Pago.
4. Faça o deploy.

O cardápio e as rotas `/criar-pix` e `/status-pix/:id` usam o mesmo domínio. Não existe mais `localhost:3000` no frontend publicado.

## Teste local

```bash
npm install
```

Crie um `.env` com seu `MP_ACCESS_TOKEN` e execute:

```bash
npm start
```

Depois abra `http://localhost:3000`.
