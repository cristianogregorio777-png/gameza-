# Raios: auditoria de UX e arquitetura

## 1. Diagnóstico

### Problemas atuais

- A navegação principal mistura descoberta, criação de time e conta numa barra inferior fixa.
- `app/page.tsx` usa estado local para simular rotas; refresh e deep links ficam frágeis.
- O perfil autenticado não tem um dashboard: após autenticar, `ClubOnboarding` continua a ser renderizado em ambos os ramos.
- O onboarding de clube está ligado ao perfil, embora seja uma tarefa de criação/configuração.
- `BottomNav` trata todos os itens como igualmente disponíveis, sem conhecer autenticação ou contexto.
- A interface usa uma direção visual escura + lime coerente, mas ainda depende de cartões e pills repetidos; falta contraste editorial e uma hierarquia de produto.

### Hipótese de produto

Raios é primeiro uma ferramenta de jogo e comunidade. O caminho principal deve ser:

1. descobrir um jogo/time;
2. entrar ou criar conta apenas quando uma ação exigir identidade;
3. criar o próprio clube num fluxo dedicado;
4. voltar a um dashboard de conta que mostra estado e próximos passos.

## 2. Identidade visual proposta

### Direção

**Campo noturno + sinal elétrico.** A base é quase preta, mas as superfícies não são todas iguais. O lime é reservado a ações primárias e estados ativos; ciano é informação, não decoração. A interface deve parecer uma ferramenta de jogo local, não um template SaaS.

### Tokens

| Papel | Token | Valor | Uso |
| --- | --- | --- | --- |
| Fundo | `base` | `#0A0A0A` | canvas principal |
| Superfície | `surface` | `#141613` | navegação e painéis |
| Superfície elevada | `surface-raised` | `#1C201A` | modal, formulário ativo |
| Texto | `ink` | `#F4F4EF` | títulos e conteúdo |
| Texto secundário | `ink-mute` | `#989A90` | metadados e ajuda |
| Primária | `lime` | `#B6FF3C` | CTA, seleção e sucesso |
| Informação | `cyan` | `#2BF0D9` | localização, estado informativo |
| Atenção | `amber` | `#F6C453` | validação e aviso |
| Erro | `red` | `#FF6B6B` | erro destrutivo |
| Divisor | `line` | `rgba(255,255,255,.09)` | bordas discretas |

### Tipografia e ritmo

- `Anton` apenas para títulos de impacto, números e nomes de competição.
- `Inter` para interface e leitura contínua.
- Escala: `12 / 14 / 16 / 20 / 28 / 40`; sem texto display em controles.
- Espaçamento base de 4 px; contentores com `16`, `24` ou `32` px.
- Cards apenas quando enquadram uma decisão ou item repetido. Não colocar cards dentro de cards.
- Pills apenas para estados, filtros e ações compactas. Botões de navegação devem parecer navegação, não etiquetas.

## 3. Mapa de navegação

```text
/
├── explorar                         público
│   ├── /times/[id]                  detalhe de time
│   └── /jogos/[id]                 detalhe de jogo
├── /entrar                          público
│   ├── email                        autenticação primária
│   └── google                       OAuth / seletor de conta do dispositivo
├── /clube                           autenticado
│   ├── /clube/novo                  criação e personalização do time
│   └── /clube/[id]                  dashboard do clube
├── /perfil                          autenticado
│   ├── resumo                       dashboard pessoal, padrão
│   ├── clubes                       times do utilizador
│   └── atividade                    jogos e pedidos
└── /definicoes                      autenticado, oculto no menu principal
    ├── conta                        email e sessão
    ├── notificacoes                 preferências
    └── seguranca                    providers e encerramento de sessão
```

### Navegação por dispositivo

- Desktop: sidebar persistente com `Explorar`, `Meu clube`, `Atividade`; conta e definições no rodapé.
- Mobile: bottom navigation com apenas `Explorar`, `Meu clube` e `Perfil`. `Criar time` é CTA contextual dentro de `Meu clube`, não uma aba global.
- O cabeçalho mostra contexto e uma única ação primária.

## 4. Regras de estado

```text
loading
└── mostrar shell neutro, sem decisões prematuras

anonymous
├── Explorar disponível
├── Meu clube abre /entrar com returnTo=/clube
└── Perfil abre /entrar com returnTo=/perfil

authenticated + firstLogin
├── /perfil/resumo mostra boas-vindas curta
├── exibir CTA "Criar meu clube"
├── não mostrar configurações nem onboarding repetido
└── permitir "Agora não"

authenticated + noClub
├── Meu clube mostra empty state contextual
└── CTA leva a /clube/novo

authenticated + hasClub
├── /perfil/resumo mostra clube, próximos jogos e atividade
├── /clube abre dashboard do clube
└── personalização fica em /clube/[id]/definicoes
```

O estado `firstLogin` deve ser persistido no perfil Supabase, por exemplo `onboarding_completed boolean not null default false`, e não inferido apenas pelo estado React. O frontend pode iniciar o estado como `loading` para evitar um flash de conteúdo errado.

## 5. Arquitetura de componentes

### Containers inteligentes

- `AppShell`: sessão, rota atual e responsividade.
- `NavigationContainer`: calcula itens visíveis a partir de `SessionState`.
- `ProfileContainer`: carrega perfil, clubes e atividade.
- `ClubContainer`: carrega um clube e coordena criação/edição.

### Componentes de apresentação

- `DesktopSidebar` / `MobileNav`.
- `ProfileSummary`.
- `EmptyClubState`.
- `ClubSetupForm`.
- `AccountMenu`.

Componentes de apresentação recebem dados e callbacks. Não devem chamar Supabase diretamente.

## 6. Plano de refatoração

1. Migrar `tab` para rotas reais ou um route model único com `returnTo`.
2. Criar `SessionState = loading | anonymous | authenticated`.
3. Criar `profile.onboarding_completed` e consultar clubes do utilizador.
4. Substituir `ClubOnboarding` no perfil por `ProfileSummary`.
5. Mover o onboarding para `/clube/novo`.
6. Fazer a navegação consumir permissões e dados, não apenas `isAuthenticated`.
7. Só depois aplicar a nova camada visual a todas as superfícies.

## 7. Critérios de aceitação

- Um utilizador autenticado não vê onboarding ao abrir o perfil pela segunda vez.
- Um utilizador sem clube vê um empty state com uma ação clara, não um menu de personalização genérico.
- `Meu clube` é o único lugar que inicia criação/personalização de time.
- Configurações não aparecem na navegação principal.
- O mesmo modelo de navegação funciona em desktop e mobile sem duplicar regras de negócio.
