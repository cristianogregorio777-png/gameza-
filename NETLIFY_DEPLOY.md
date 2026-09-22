# Deploy no Netlify

## Pasta correta

Use esta pasta como a raiz do projeto:

`c:\Users\crist\Documents\gameza-frontend`

Ela precisa conter `package.json`, `package-lock.json`, `netlify.toml`, `app/`, `components/` e `public/`.

Nao selecione `app/`, `components/`, `.next/` ou `node_modules/` como pasta base.

## Configuracao recomendada

No Netlify, use **Add new site > Import an existing project** e conecte o repositorio GitHub. A configuracao ja esta no `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `.next`
- Plugin: `@netlify/plugin-nextjs`
- Node version: `20`

Se usar configuracao manual no painel, deixe **Base directory** vazio e informe:

- Build command: `npm run build`
- Publish directory: `.next`

O ficheiro local deve chamar-se `.env.local` para ser lido pelo Next.js. Ele e ignorado pelo Git e nao deve ser enviado para o Netlify.

## Variaveis de ambiente

Cadastre no Netlify, em **Site configuration > Environment variables**:

- `GROQ_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

Os nomes das variaveis precisam ser exatamente iguais aos acima. No Netlify, configure-as no painel do site, nao dentro do `netlify.toml`.

Nao envie `env.local`, `node_modules` ou `.next` no upload manual.

## Sobre upload por pasta

O deploy por arrastar uma pasta e adequado para sites estaticos. Este projeto tem uma rota de API e autenticacao Supabase, por isso o deploy completo deve ser feito pelo repositorio GitHub ou pela Netlify CLI, permitindo que o plugin Next.js crie as funcoes e rotas corretamente.
