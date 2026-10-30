# 📋 Copia-e-Cola: Instruções para a IA Configurar o Ambiente

> **Como usar este arquivo:**  
> Copie todo o texto dentro da caixa abaixo e cole no seu assistente de inteligência artificial favorito (**ChatGPT, Claude, Gemini, Cursor, Copilot, Antigravity, etc.**).  
> A IA executará ou guiará toda a configuração do seu ambiente automaticamente!

---

```markdown
Você é meu assistente especialista em desenvolvimento de software e DevOps.
Preciso que você configure e inicialize o projeto **TotalDrive** no meu computador.

O **TotalDrive** é uma aplicação web completa em Node.js/Express que unifica múltiplas contas do Google Drive em um pool centralizado de armazenamento (storage ilimitado), permitindo conectar várias contas, somar cotas de disco e escolher para qual conta fazer upload (ou usar alocação inteligente).

Por favor, siga rigorosamente o checklist abaixo para preparar meu ambiente:

---

### 1. Diagnóstico do Sistema Operacional e Ferramentas
Execute os comandos necessários no meu terminal para verificar:
- Versão do Node.js (`node -v` -> requer v18+)
- Versão do NPM (`npm -v`)
- Se o diretório atual contém os arquivos do TotalDrive (`server.js`, `package.json`, `public/`, etc.)

---

### 2. Instalação de Dependências
Se a pasta `node_modules` não existir ou faltar dependências, execute:
```bash
npm install
```
As dependências principais são: `express`, `cors`, `multer`, `googleapis`, `dotenv`, `uuid`.

---

### 3. Configuração de Variáveis de Ambiente (.env)
Verifique se o arquivo `.env` existe na raiz do projeto.
- Se não existir, copie a partir de `.env.example`:
  - No Windows PowerShell: `Copy-Item .env.example .env`
  - No Linux/macOS: `cp .env.example .env`
- Conteúdo padrão esperado no `.env`:
  ```env
  PORT=3000
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
  ```
- Nota: O sistema funciona perfeitamente mesmo sem credenciais do Google no primeiro momento, utilizando o modo de simulação/pool virtual para testes imediatos. Se eu fornecer um Client ID e Client Secret, preencha no `.env`.

---

### 4. Inicialização e Teste do Servidor
1. Inicie o servidor em segundo plano ou em uma sessão do terminal:
   ```bash
   npm start
   ```
2. O servidor deve escutar na porta 3000 (ou na porta configurada no `.env`).
3. Verifique se o endpoint de saúde responde corretamente:
   - Requisição GET para `http://localhost:3000/api/stats`
   - Requisição GET para `http://localhost:3000/api/accounts`
4. Confirme se a página inicial `http://localhost:3000` está acessível e respondendo com código HTTP 200.

---

### 5. Resumo e Próximos Passos
Após concluir, informe:
1. Status da inicialização (se está rodando em http://localhost:3000).
2. Quantas contas e quanto de espaço agregado estão ativos no momento.
3. Se eu quiser conectar contas reais do Google Drive, me guie brevemente sobre como preencher o Client ID e Client Secret obtidos no Google Cloud Console.

Pode começar!
```
