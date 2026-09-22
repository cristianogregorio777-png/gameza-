# Gameza — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion.

## Setup

```bash
npm install
cp .env.example .env.local   # adiciona a tua GROQ_API_KEY
npm run dev
```

## Variáveis de ambiente

```
GROQ_API_KEY=gsk_xxx
```

A chave é lida apenas em `lib/groq.ts`, chamado a partir do Route Handler
`app/api/moderate/route.ts` — nunca é exposta ao client.

## Estrutura

```
app/
  layout.tsx            fontes (Anton + Inter), ToastProvider
  page.tsx               troca entre Explorar / Criar Time / Perfil
  api/moderate/route.ts  Route Handler -> Groq (llama-3.3-70b-versatile)
components/
  HeroBanner.tsx          hero com slot para atleta (ver nota abaixo)
  SearchFilters.tsx       busca + pills deslizantes
  TeamCard.tsx            bento card
  ExploreScreen.tsx       tela "Explorar / Match"
  MatchModal.tsx          bottom sheet -> gera link wa.me
  CreateTeamFlow.tsx       onboarding em 4 passos + moderação IA
  BottomNav.tsx           navegação flutuante
  Toast.tsx               toast notifications (Context + Framer Motion)
lib/
  types.ts, mock-data.ts, groq.ts
```

## Nota sobre imagens de atletas

O brief pedia para reservar espaço no Hero Banner e nos empty states para
fotos de jogadores (Neymar, Mbappé, Vinicius Jr., Haaland, Bellingham, Lamine
Yamal). O componente `HeroBanner` já tem o slot pronto (`athleteSrc`), com
`drop-shadow` e recorte para se integrar ao fundo escuro — mas não incluí as
fotos reais desses atletas como assets do projeto: são imagens oficiais de
patrocinador (Nike/Adidas), protegidas por direitos autorais e de imagem, e
usá-las para promover um produto comercial exige licenciamento que a startup
provavelmente não tem.

Três caminhos práticos para preencher esse slot:
1. Ilustração original no estilo da marca (o fallback em SVG já está lá).
2. Fotos reais dos próprios times/jogadores cadastrados na Gameza — reforça
   a identidade "casual/amador" do produto, sem risco de licenciamento.
3. Banco de imagens licenciado (ex: fotos genéricas de futebol de rua/campo).

## Moderação de conteúdo

`CreateTeamFlow` bloqueia o envio final se `POST /api/moderate` devolver
`flagged: true`, mostrando um Toast de erro com o motivo. Em caso de falha
da própria API da Groq (timeout, chave inválida etc.), o comportamento é
"falhar seguro": bloqueia o envio e pede para tentar novamente, em vez de
aprovar às cegas.

## Banco de dados

O schema do Supabase está em `supabase/schema.sql`. Ele cria as tabelas,
índices, sincronização de perfis com `auth.users` e políticas RLS. Execute-o
no SQL Editor do projeto Supabase antes de conectar o fluxo de criação de
times.

O endpoint `POST /api/moderate` recebe `{ "textToModerate": "..." }` e retorna
`{ "flagged": true|false, "reason": "..." }`. A rota usa o SDK oficial
`groq-sdk` no runtime Edge e mantém `GROQ_API_KEY` somente no servidor.
