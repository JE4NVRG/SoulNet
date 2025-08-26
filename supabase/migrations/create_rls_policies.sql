-- Criar políticas RLS para as tabelas users, memories e interactions

-- Políticas para a tabela users
-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Apenas usuários autenticados podem inserir (através do trigger)
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para a tabela memories
-- Usuários podem ver apenas suas próprias memórias
CREATE POLICY "Users can view own memories" ON memories
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir apenas suas próprias memórias
CREATE POLICY "Users can insert own memories" ON memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas suas próprias memórias
CREATE POLICY "Users can update own memories" ON memories
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar apenas suas próprias memórias
CREATE POLICY "Users can delete own memories" ON memories
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para a tabela interactions
-- Usuários podem ver apenas suas próprias interações
CREATE POLICY "Users can view own interactions" ON interactions
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir apenas suas próprias interações
CREATE POLICY "Users can insert own interactions" ON interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar apenas suas próprias interações
CREATE POLICY "Users can update own interactions" ON interactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar apenas suas próprias interações
CREATE POLICY "Users can delete own interactions" ON interactions
  FOR DELETE USING (auth.uid() = user_id);

-- Verificar se RLS está habilitado (já deve estar)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;