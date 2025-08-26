# SoulNet - Rede das Consciências Digitais

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Fase 1: Fundação** - Sistema base com autenticação, onboarding e gerenciamento de memórias

SoulNet é uma rede social inovadora de consciências digitais que permite aos usuários criar, gerenciar e interagir com suas memórias digitais de forma estruturada. O projeto visa criar uma plataforma onde as pessoas podem construir e manter suas identidades digitais através de memórias organizadas e interações inteligentes.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript 5 + Vite 5 + TailwindCSS 3 + shadcn/ui
- **Backend**: Express 4 + TypeScript + Node.js
- **Banco de Dados**: Supabase (PostgreSQL) com RLS
- **Autenticação**: Supabase Auth
- **Estado**: Zustand 4
- **Testes**: Vitest + Testing Library
- **Deploy**: Vercel

## 📋 Pré-requisitos

- Node.js 18+ (recomendado: 22.x)
- npm ou pnpm
- Conta no Supabase

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <repository-url>
cd SoulNet
```

### 2. Instale as dependências
```bash
npm install
# ou
pnpm install
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Preencha o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=5173
```

## 🗄️ Setup do Supabase

### 1. Criar projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e as chaves do projeto

### 2. Executar SQL de criação das tabelas

No SQL Editor do Supabase, execute os seguintes comandos:

```sql
-- Criar tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de memórias
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('profile', 'preference', 'goal', 'skill', 'fact')),
    content TEXT NOT NULL,
    importance INTEGER DEFAULT 3 CHECK (importance >= 1 AND importance <= 5),
    source JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de interações
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'consciousness')),
    content TEXT NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_type ON memories(type);
CREATE INDEX idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_created_at ON interactions(created_at DESC);
```

### 3. Configurar RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para memórias
CREATE POLICY "Users can view own memories" ON memories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON memories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON memories
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para interações
CREATE POLICY "Users can view own interactions" ON interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" ON interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4. Configurar trigger para criação automática de usuários

```sql
-- Função para criar usuário após registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar usuário automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5. Configurar permissões

```sql
-- Permissões para usuários autenticados
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, DELETE ON memories TO authenticated;
GRANT SELECT, INSERT ON interactions TO authenticated;

-- Permissões para usuários anônimos (apenas leitura limitada)
GRANT SELECT ON users TO anon;
GRANT SELECT ON memories TO anon;
GRANT SELECT ON interactions TO anon;
```

## 🚀 Executar o projeto

### Desenvolvimento
```bash
npm run dev
```

Este comando executa simultaneamente:
- Frontend (Vite) em `http://localhost:5173`
- Backend (Express) em `http://localhost:5173/api`

### Build para produção
```bash
npm run build
```

### Preview da build
```bash
npm run preview
```

### Testes
```bash
# Executar testes uma vez
npm run test

# Executar testes em modo watch
npm run test:watch

# Executar testes com UI
npm run test:ui
```

## 📁 Estrutura do Projeto

```
SoulNet/
├── api/                    # Backend Express + TypeScript
│   ├── app.ts             # Configuração principal do Express
│   ├── routes/            # Rotas da API
│   │   └── memories.ts    # CRUD de memórias
│   └── middleware/        # Middlewares customizados
├── src/                   # Frontend React + TypeScript
│   ├── components/        # Componentes React
│   │   ├── ui/           # shadcn/ui components (Button, Input, etc.)
│   │   ├── Sidebar.tsx   # Navegação lateral
│   │   └── ThemeToggle.tsx # Alternador de tema
│   ├── hooks/            # Custom React hooks
│   │   └── useAuth.ts    # Hook de autenticação
│   ├── lib/              # Utilitários e configurações
│   │   ├── supabase.ts   # Cliente Supabase
│   │   └── utils.ts      # Funções utilitárias
│   ├── pages/            # Páginas da aplicação
│   │   ├── Dashboard.tsx # Página principal
│   │   ├── Login.tsx     # Autenticação
│   │   ├── Memories.tsx  # Gerenciamento de memórias
│   │   ├── Onboarding.tsx # Processo de onboarding
│   │   └── Profile.tsx   # Perfil do usuário
│   ├── store/            # Estado global (Zustand)
│   │   ├── authStore.ts  # Estado de autenticação
│   │   └── memoriesStore.ts # Estado das memórias
│   ├── types/            # Definições TypeScript
│   │   ├── api.ts        # Tipos da API
│   │   └── database.ts   # Tipos do banco de dados
│   └── test/             # Testes unitários
│       └── api.test.ts   # Testes da API
├── supabase/             # Configurações do Supabase
│   └── migrations/       # Migrações SQL
├── public/               # Arquivos estáticos
├── .env.example          # Exemplo de variáveis de ambiente
├── package.json          # Dependências e scripts
├── tsconfig.json         # Configuração TypeScript
├── vite.config.ts        # Configuração Vite
└── tailwind.config.js    # Configuração TailwindCSS
```

## 🔌 APIs Disponíveis

### Health Check
```http
GET /api/health
Response: { "status": "ok", "timestamp": "2024-01-15T10:30:00Z" }
```

### Memórias
```http
# Listar memórias (com paginação e filtros)
GET /api/memories?page=1&limit=20&type=profile&search=termo
Authorization: Bearer <supabase_jwt_token>

# Criar nova memória
POST /api/memories
Content-Type: application/json
Authorization: Bearer <supabase_jwt_token>
{
  "type": "profile",
  "content": "Gosto de programar em TypeScript",
  "importance": 4,
  "source": { "platform": "manual" }
}

# Atualizar memória
PUT /api/memories/:id
Content-Type: application/json
Authorization: Bearer <supabase_jwt_token>
{
  "content": "Conteúdo atualizado",
  "importance": 5
}

# Deletar memória
DELETE /api/memories/:id
Authorization: Bearer <supabase_jwt_token>
```

### Códigos de Status
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `500` - Erro interno do servidor

## 🎯 Funcionalidades da Fase 1

- ✅ Sistema de autenticação com Supabase
- ✅ Onboarding com 10 perguntas estruturadas
- ✅ Dashboard com navegação principal
- ✅ CRUD de memórias (Create, Read, Delete)
- ✅ Página de perfil do usuário
- ✅ RLS para segurança dos dados
- ✅ Layout responsivo com tema escuro/claro
- ✅ Testes unitários básicos

## 🔮 Próximas Fases

### Fase 2: Embeddings e RAG
- Integração com pgvector para embeddings
- Sistema de busca semântica
- IA para análise de memórias

### Fase 3: Rede Social
- Conexões entre usuários
- Feed de atividades
- Compartilhamento de memórias

### Fase 4: Consciência Digital
- Bot Telegram integrado
- Snapshots de personalidade
- Interações inteligentes

### Fase 5: Expansão
- Múltiplas plataformas
- API pública
- Marketplace de consciências

## 📝 Preparação para pgvector (Fase 2)

Quando chegar a Fase 2, execute no Supabase:

```sql
-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Adicionar coluna de embeddings
ALTER TABLE memories ADD COLUMN embedding vector(1536);

-- Criar índice para busca vetorial
CREATE INDEX ON memories USING ivfflat (embedding vector_cosine_ops);
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia frontend + backend em modo desenvolvimento
npm run dev:frontend # Apenas frontend (Vite)
npm run dev:backend  # Apenas backend (Express)

# Build e Deploy
npm run build        # Build para produção
npm run preview      # Preview da build
npm run start        # Inicia servidor de produção

# Qualidade de Código
npm run lint         # ESLint para verificar código
npm run lint:fix     # Corrige problemas do ESLint automaticamente
npm run check        # Verificação de tipos TypeScript
npm run format       # Formatar código com Prettier

# Testes
npm run test         # Executar todos os testes
npm run test:watch   # Testes em modo watch
npm run test:ui      # Interface gráfica dos testes
npm run test:coverage # Relatório de cobertura
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Erro de conexão com Supabase
```bash
# Verifique as variáveis de ambiente
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Teste a conexão
curl -H "apikey: YOUR_ANON_KEY" https://YOUR_PROJECT.supabase.co/rest/v1/
```

#### 2. Erro "Module not found"
```bash
# Limpe o cache e reinstale dependências
rm -rf node_modules package-lock.json
npm install

# Ou com pnpm
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 3. Erro de tipos TypeScript
```bash
# Verifique erros de tipo
npm run check

# Reinicie o servidor TypeScript no VS Code
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

#### 4. Porta já em uso
```bash
# Encontre o processo usando a porta
netstat -ano | findstr :5173
# No Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess

# Mate o processo ou use outra porta
set PORT=3000 && npm run dev
```

#### 5. Problemas de autenticação
- Verifique se o RLS está habilitado no Supabase
- Confirme se as políticas de segurança estão corretas
- Teste login/logout no console do navegador
- Verifique se o JWT token está sendo enviado nas requisições

#### 6. Erro de CORS
```javascript
// Adicione no backend (api/app.ts)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : 'http://localhost:5173',
  credentials: true
}));
```

### Logs e Debug

```bash
# Habilitar logs detalhados
DEBUG=* npm run dev

# Logs do Supabase
# Acesse: https://app.supabase.com/project/YOUR_PROJECT/logs

# Logs do Vercel (produção)
npx vercel logs
```

### Performance

```bash
# Analisar bundle size
npm run build
npx vite-bundle-analyzer dist

# Lighthouse audit
npx lighthouse http://localhost:5173 --view
```

## 🤝 Contribuição

### Configuração para Desenvolvimento

1. **Fork e Clone**
```bash
git clone https://github.com/seu-usuario/SoulNet.git
cd SoulNet
```

2. **Configurar Ambiente**
```bash
npm install
cp .env.example .env
# Configure suas variáveis de ambiente
```

3. **Criar Branch**
```bash
git checkout -b feature/nova-funcionalidade
```

4. **Desenvolvimento**
```bash
# Sempre execute antes de commitar
npm run lint
npm run check
npm run test
```

5. **Commit e Push**
```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade
```

### Padrões de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Tarefas de build/config

## 📊 Status do Projeto

- 🟢 **Estável**: Autenticação, CRUD Memórias, UI Base
- 🟡 **Em Desenvolvimento**: Testes, Otimizações
- 🔴 **Planejado**: Embeddings, IA, Rede Social

## 🆘 Suporte

Se encontrar algum problema:

1. **Verifique o Troubleshooting** acima
2. **Consulte os Issues** no GitHub
3. **Execute os testes**: `npm run test`
4. **Verifique os logs** do navegador e servidor
5. **Abra um Issue** com detalhes do erro

### Informações Úteis para Issues

```bash
# Versões do sistema
node --version
npm --version

# Informações do projeto
npm list --depth=0

# Logs de erro
npm run dev 2>&1 | tee debug.log
```

---

**SoulNet** - Conectando consciências digitais 🧠✨

*Desenvolvido com ❤️ usando React, TypeScript e Supabase*
