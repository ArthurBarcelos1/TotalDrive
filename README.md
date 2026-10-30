# TotalDrive - Pool de Armazenamento Multi-Contas Google Drive

Sistema completo para conectar múltiplas contas do Google Drive e unificar o armazenamento em um único painel centralizado ("storage ilimitado").

## ✨ Funcionalidades

1. **Pool de Armazenamento Agregado**:
   - Cada conta conectada (15 GB grátis, 100 GB, 2 TB, etc.) soma sua capacidade ao total do pool.
   - Gráfico de visualização multi-segmentado com cores exclusivas por conta.
   - Indicadores de capacidade total, espaço usado, espaço livre e porcentagem de uso.

2. **Gerenciamento e Conexão de Múltiplas Contas**:
   - Conexão oficial via **Google OAuth 2.0** com sincronização em tempo real de cota de disco e arquivos.
   - Suporte a contas instantâneas personalizadas (simulação de pool para testes imediatos sem burocracia de chaves).
   - Botão de sincronização forçada de cota (`Sync Quota`).
   - Possibilidade de desconectar contas individualmente.

3. **Central de Upload Inteligente**:
   - **✨ Distribuição Inteligente (Auto-Pool)**: O sistema analisa automaticamente qual conta do Google Drive possui maior espaço livre e direciona o arquivo para ela.
   - **Escolha Manual**: O usuário pode selecionar explicitamente qualquer uma das contas conectadas para receber o upload.
   - Suporte a Drag & Drop (arrastar e soltar múltiplos arquivos).

4. **Gerenciador de Arquivos Centralizado**:
   - Visualização em Grade (Grid) ou Lista (Table).
   - Filtro por tipo de arquivo (Documentos, Imagens, Vídeos, Áudios, Compactados).
   - Filtro por conta de origem ou pool unificado.
   - Busca em tempo real por nome de arquivo.
   - Download direto do arquivo.
   - **Migração Cloud-to-Cloud**: Permite transferir arquivos entre contas do Google Drive diretamente pela interface.
   - Exclusão com liberação automática de espaço na conta respectiva.

5. **Configuração de OAuth 2.0**:
   - Assistente integrado na própria interface para inserir Client ID e Client Secret do Google Cloud Console.

---

## 🚀 Como Iniciar

### Opção 1: Deixar a Inteligência Artificial Configurar para Você 🤖
Se você está usando uma IA (ChatGPT, Claude, Gemini, Cursor, Copilot, etc.), basta copiar e colar as instruções prontas de:
👉 **[PROMPT_CONFIGURAR_IA.md](PROMPT_CONFIGURAR_IA.md)**

### Opção 2: Configuração Manual Passo a Passo 📘
Para o guia completo com imagens e detalhes de como gerar o Google Client ID e Secret no Google Cloud Console, leia:
👉 **[COMO_CONFIGURAR.md](COMO_CONFIGURAR.md)**

---

### Início Rápido no Terminal

1. Certifique-se de que as dependências estejam instaladas:
   ```bash
   npm install
   ```

2. Inicie o servidor:
   ```bash
   npm start
   ```

3. Abra o navegador em:
   ```
   http://localhost:3000
   ```

---

## 🔑 Como Configurar Contas Reais do Google Drive

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um projeto e ative a **Google Drive API** em **APIs e Serviços > Biblioteca**.
3. Em **Tela de consentimento OAuth**, configure o aplicativo como **Externo** e adicione o escopo:
   `https://www.googleapis.com/auth/drive`
4. Em **Credenciais > Criar Credenciais > ID do cliente OAuth**, escolha **Aplicativo da Web**.
5. Adicione em **URIs de redirecionamento autorizados**:
   `http://localhost:3000/api/auth/google/callback`
6. No painel do TotalDrive, clique no botão **"Google OAuth"** no topo da página e cole o **Client ID** e o **Client Secret**.
7. Pronto! Clique em **"+ Conectar Conta"** e depois em **"Entrar com o Google"**.
