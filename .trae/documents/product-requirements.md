# SoulNet - Rede das Consciências Digitais
## Documento de Requisitos do Produto - Fase 1: Fundação

## 1. Visão Geral do Produto

SoulNet é uma rede social inovadora de consciências digitais que permite aos usuários criar, gerenciar e interagir com suas memórias digitais de forma estruturada. O produto visa resolver o problema da fragmentação de informações pessoais e conhecimento, oferecendo uma plataforma centralizada para capturar, organizar e acessar memórias digitais.

O objetivo é criar a base tecnológica para uma futura rede social de consciências digitais com capacidades de IA e embeddings vetoriais.

## 2. Funcionalidades Principais

### 2.1 Papéis de Usuário

| Papel | Método de Registro | Permissões Principais |
|-------|-------------------|----------------------|
| Usuário Autenticado | Registro por email/senha via Supabase | Pode criar, visualizar e excluir suas próprias memórias, completar onboarding, acessar dashboard e perfil |

### 2.2 Módulos de Funcionalidades

Nossos requisitos do SoulNet consistem nas seguintes páginas principais:

1. **Página de Login**: formulário de autenticação, integração com Supabase Auth, redirecionamento pós-login.
2. **Página de Onboarding**: 10 perguntas estruturadas, criação automática de memórias, validação de completude.
3. **Dashboard**: boas-vindas personalizadas, cards de navegação (Memórias, Interações, Snapshots), estatísticas básicas.
4. **Página de Memórias**: listagem paginada, criação de novas memórias, exclusão de memórias, filtros por tipo.
5. **Página de Perfil**: dados do usuário, avatar placeholder, configurações de timezone, edição de informações básicas.

### 2.3 Detalhes das Páginas

| Nome da Página | Nome do Módulo | Descrição da Funcionalidade |
|----------------|----------------|-----------------------------|
| Login | Formulário de Autenticação | Validar credenciais via Supabase, manter sessão, redirecionar para onboarding ou dashboard |
| Login | Gerenciamento de Sessão | Detectar usuário logado, persistir estado de autenticação |
| Onboarding | Questionário Estruturado | Apresentar 10 perguntas (nome, bio, objetivos, preferências, habilidades, estilo), validar respostas |
| Onboarding | Criação de Memórias | Converter respostas em 6-10 memórias categorizadas, salvar no banco via API |
| Dashboard | Painel de Boas-vindas | Exibir nome do usuário, estatísticas básicas, navegação principal |
| Dashboard | Cards de Navegação | Mostrar cards para Memórias, Interações e Snapshots (placeholders) |
| Memórias | Listagem de Memórias | Paginar memórias do usuário, filtrar por tipo, ordenar por data |
| Memórias | CRUD de Memórias | Criar novas memórias, excluir memórias existentes, validar tipos permitidos |
| Perfil | Dados do Usuário | Exibir e editar nome, email, avatar placeholder, timezone |
| Perfil | Configurações | Gerenciar preferências básicas do usuário |

## 3. Processo Principal

**Fluxo do Usuário Autenticado:**

1. Usuário acessa a aplicação e é direcionado para login se não autenticado
2. Após login bem-sucedido, sistema verifica se usuário completou onboarding (mínimo 5 memórias)
3. Se não completou, redireciona para onboarding; se completou, vai para dashboard
4. No onboarding, usuário responde 10 perguntas que geram 6-10 memórias automaticamente
5. No dashboard, usuário pode navegar para Memórias, Perfil ou outras seções
6. Na página de Memórias, usuário pode criar, visualizar e excluir suas memórias
7. Na página de Perfil, usuário pode visualizar e editar suas informações pessoais

```mermaid
graph TD
    A[Página Inicial] --> B{Usuário Logado?}
    B -->|Não| C[Login]
    B -->|Sim| D{Onboarding Completo?}
    C --> E[Autenticação Supabase]
    E --> D
    D -->|Não| F[Onboarding]
    D -->|Sim| G[Dashboard]
    F --> H[Criar Memórias]
    H --> G
    G --> I[Memórias]
    G --> J[Perfil]
    I --> K[CRUD Memórias]
    J --> L[Editar Perfil]
```

## 4. Design da Interface do Usuário

### 4.1 Estilo de Design

- **Cores Primárias**: Tema escuro/claro com toggle, usando paleta neutra do Tailwind
- **Cores Secundárias**: Acentos em azul/roxo para elementos interativos
- **Estilo de Botões**: Componentes shadcn/ui com bordas arredondadas, estados hover/focus
- **Fonte**: Inter ou system fonts, tamanhos 14px (corpo), 16px (botões), 24px+ (títulos)
- **Layout**: Design baseado em cards, navegação lateral fixa, header superior
- **Ícones**: Lucide React icons, estilo minimalista e consistente

### 4.2 Visão Geral do Design das Páginas

| Nome da Página | Nome do Módulo | Elementos da UI |
|----------------|----------------|----------------|
| Login | Formulário Central | Card centralizado, inputs com validação, botão primário, tema escuro/claro |
| Onboarding | Questionário Progressivo | Stepper de progresso, cards de perguntas, inputs variados, navegação anterior/próximo |
| Dashboard | Layout Principal | Header com avatar, sidebar fixa, grid de cards 3x1, estatísticas em badges |
| Memórias | Lista e Formulário | Tabela/grid responsivo, modal de criação, botões de ação, filtros dropdown |
| Perfil | Formulário de Dados | Layout de duas colunas, avatar grande, inputs agrupados, botões de ação |

### 4.3 Responsividade

O produto é desktop-first com adaptação mobile completa. Layout responsivo com breakpoints do Tailwind (sm, md, lg, xl). Sidebar colapsa em menu hambúrguer no mobile. Cards se reorganizam em coluna única em telas pequenas. Otimização para touch em dispositivos móveis.
