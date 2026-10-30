# 📘 Guia Definitivo de Configuração - TotalDrive

Este guia detalha passo a passo como configurar o ambiente do **TotalDrive**, desde a instalação local até a criação e conexão oficial das suas contas com a **Google Drive API**.

---

## 📋 Sumário
1. [Requisitos Mínimos](#1-requisitos-mínimos)
2. [Instalação e Execução Rápida](#2-instalação-e-execução-rápida)
3. [Como Configurar o Google Cloud Console (OAuth 2.0)](#3-como-configurar-o-google-cloud-console-oauth-20)
4. [Configurando as Chaves no TotalDrive](#4-configurando-as-chaves-no-totaldrive)
5. [Como Conectar e Usar Múltiplas Contas](#5-como-conectar-e-usar-múltiplas-contas)
6. [Resolução de Problemas Frequentes](#6-resolução-de-problemas-frequentes)

---

## 1. Requisitos Mínimos

- **Node.js**: Versão 18.x ou superior (Recomendado v20+).
- **NPM**: Versão 9.x ou superior.
- **Navegador Web**: Chrome, Edge, Firefox, Brave ou Safari.
- **Conta(s) Google**: Contas gratuitas ou pagas (cada conta gratuita oferece 15 GB).

---

## 2. Instalação e Execução Rápida

Abra o terminal (PowerShell, Prompt de Comando ou Bash) na pasta do projeto:

```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Iniciar o servidor
npm start
```

O servidor iniciará exibindo:
```
=======================================================
TotalDrive Server rodando em http://localhost:3000
Pool de armazenamento pronto para conectar contas Google!
=======================================================
```

Abra seu navegador no endereço: **[http://localhost:3000](http://localhost:3000)**

> [!NOTE]
> O TotalDrive já vem configurado com **Modo Demonstração Instantâneo**. Você pode testar upload, distribuição inteligente, exclusão e criação de novas contas mesmo antes de gerar as chaves do Google!

---

## 3. Como Configurar o Google Cloud Console (OAuth 2.0)

Para conectar suas contas reais do Google Drive e sincronizar arquivos na nuvem real, siga estes passos no Google Cloud:

### Passo 1: Criar ou Selecionar um Projeto
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Faça login com qualquer uma das suas contas Google.
3. No topo da página, clique no menu seletor de projetos e clique em **Novo Projeto** (New Project).
4. Dê o nome de `TotalDrive` e clique em **Criar**.

### Passo 2: Ativar a Google Drive API
1. No menu lateral esquerdo (hambúrguer ☰), vá em **APIs e Serviços > Biblioteca** (APIs & Services > Library).
2. Na barra de pesquisa, digite `Google Drive API`.
3. Clique em **Google Drive API** e depois no botão azul **Ativar** (Enable).

### Passo 3: Configurar a Tela de Permissão OAuth
1. No menu lateral esquerdo, vá em **APIs e Serviços > Tela de permissão OAuth** (OAuth consent screen).
2. Selecione o tipo de usuário: **Externo** (External) e clique em **Criar**.
3. Preencha as informações básicas do aplicativo:
   - **Nome do app**: `TotalDrive`
   - **E-mail de suporte do usuário**: seu e-mail.
   - **Dados de contato do desenvolvedor**: seu e-mail.
   - Clique em **Salvar e Continuar**.
4. Na aba **Escopos** (Scopes):
   - Clique em **Adicionar ou remover escopos** (Add or remove scopes).
   - Localize e marque o escopo:
     `https://www.googleapis.com/auth/drive` (Ver, editar, criar e excluir todos os seus arquivos do Google Drive).
   - Clique em **Atualizar** e depois em **Salvar e Continuar**.
5. Na aba **Usuários de teste** (Test users):
   - Clique em **+ Adicionar Usuários** (Add Users).
   - **IMPORTANTE**: Digite os endereços de e-mail de **todas as contas do Google Drive** que você pretende conectar ao pool!
   - Clique em **Salvar e Continuar**.

### Passo 4: Criar as Credenciais OAuth (Client ID e Secret)
1. No menu lateral esquerdo, vá em **APIs e Serviços > Credenciais** (Credentials).
2. No topo, clique em **+ Criar Credenciais > ID do cliente OAuth** (+ Create Credentials > OAuth client ID).
3. Em **Tipo de aplicativo** (Application type), escolha **Aplicativo da Web** (Web application).
4. Em **Nome**: `TotalDrive Web Client`.
5. Em **Origens JavaScript autorizadas** (Authorized JavaScript origins), adicione:
   ```
   http://localhost:3000
   ```
6. Em **URIs de redirecionamento autorizados** (Authorized redirect URIs), adicione exatamente:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
7. Clique em **Criar**.
8. Uma janela se abrirá exibindo:
   - **Seu ID de cliente** (Client ID)
   - **Sua chave secreta do cliente** (Client Secret)
9. Copie esses dois valores!

---

## 4. Configurando as Chaves no TotalDrive

Você tem duas formas fáceis de aplicar suas credenciais:

### Opção A: Pela própria Interface Web (Recomendado)
1. Abra o TotalDrive em `http://localhost:3000`.
2. No canto superior direito, clique no botão **Google OAuth**.
3. Cole o **Client ID** e o **Client Secret** nos respectivos campos.
4. Clique em **Salvar Credenciais**.

### Opção B: Via Arquivo `.env`
1. Na pasta raiz do projeto, crie um arquivo chamado `.env` (ou duplique o `.env.example`).
2. Preencha com os seus dados:
   ```env
   PORT=3000
   GOOGLE_CLIENT_ID=seu_client_id_aqui.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-seu_client_secret_aqui
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
   ```
3. Reinicie o servidor (`npm start`).

---

## 5. Como Conectar e Usar Múltiplas Contas

1. Clique no botão **`+ Conectar Conta`** no topo da página.
2. Clique no botão **`Entrar com o Google`**.
3. Faça login com a sua conta Google e confirme as permissões de acesso ao Google Drive.
4. Você será redirecionado de volta e verá a nova conta adicionada com a cota exata (ex: 15 GB).
5. **Para adicionar mais contas**:
   - Clique novamente em **`+ Conectar Conta`** > **`Entrar com o Google`**.
   - No pop-up do Google, escolha *"Usar outra conta"* e autentique sua segunda, terceira ou décima conta!
   - O TotalDrive somará automaticamente todas elas no **Pool Agregado**.

### Como Funciona o Upload:
- **Distribuição Inteligente (Auto-Pool)**: O sistema detecta automaticamente qual conta Google tem mais espaço livre e sobe o arquivo para ela.
- **Manual**: Você pode escolher especificamente uma das contas no seletor *"Destino do Upload"*.

---

## 6. Resolução de Problemas Frequentes

### Erro: `redirect_uri_mismatch`
- **Causa**: A URL de redirecionamento no Google Cloud Console não bate exatamente com a URL do app.
- **Solução**: No Google Cloud Console, em Credenciais do Cliente Web, certifique-se de que a URI de redirecionamento está exatamente:
  `http://localhost:3000/api/auth/google/callback` (sem barra no final).

### Erro: `Acesso bloqueado: o app não concluiu o processo de verificação`
- **Causa**: O app está em modo de teste e o e-mail que está tentando entrar não está na lista de usuários de teste.
- **Solução**: Vá em **Tela de permissão OAuth > Usuários de teste** no Google Cloud Console e adicione o e-mail da conta que você quer conectar.

### Porta 3000 já em uso
- Se a porta 3000 estiver ocupada por outro programa, você pode mudar no `.env`:
  ```env
  PORT=3001
  GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
  ```
  *(Lembre-se de atualizar também a URI de redirecionamento no Google Cloud Console).*
