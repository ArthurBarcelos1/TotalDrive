const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const FILES_FILE = path.join(DATA_DIR, 'files.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  }
});
const upload = multer({ storage });

// Helper to read/write JSON files
function readJson(file, defaultValue = []) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = fs.readFileSync(file, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return defaultValue;
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

// Global Config
function getConfig() {
  const defaults = {
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/google/callback`
  };
  const fileConfig = readJson(CONFIG_FILE, defaults);
  return { ...defaults, ...fileConfig };
}

// Initial seed if no accounts exist
function seedInitialData() {
  let accounts = readJson(ACCOUNTS_FILE, []);
  if (accounts.length === 0) {
    accounts = [
      {
        id: 'demo-acc-1',
        name: 'Arthur Pessoal',
        email: 'arthur.pessoal@gmail.com',
        color: '#3b82f6', // blue
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ArthurPessoal',
        isDemo: true,
        quota: {
          limit: 15 * 1024 * 1024 * 1024, // 15 GB
          usage: 4.2 * 1024 * 1024 * 1024,  // 4.2 GB
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-acc-2',
        name: 'Arthur Trabalho / Projetos',
        email: 'arthur.dev.projects@gmail.com',
        color: '#10b981', // green
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ArthurDev',
        isDemo: true,
        quota: {
          limit: 15 * 1024 * 1024 * 1024, // 15 GB
          usage: 2.1 * 1024 * 1024 * 1024,  // 2.1 GB
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'demo-acc-3',
        name: 'Arthur Backups & Mídia',
        email: 'arthur.media.backup@gmail.com',
        color: '#8b5cf6', // purple
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ArthurMedia',
        isDemo: true,
        quota: {
          limit: 15 * 1024 * 1024 * 1024, // 15 GB
          usage: 5.8 * 1024 * 1024 * 1024,  // 5.8 GB
        },
        createdAt: new Date().toISOString()
      }
    ];
    writeJson(ACCOUNTS_FILE, accounts);

    // Initial files seed
    const files = [
      {
        id: 'demo-file-1',
        name: 'Apresentação_Projeto_TotalDrive.pdf',
        mimeType: 'application/pdf',
        size: 14.5 * 1024 * 1024,
        modifiedTime: new Date(Date.now() - 3600000 * 4).toISOString(),
        accountId: 'demo-acc-1',
        isDemo: true
      },
      {
        id: 'demo-file-2',
        name: 'backup_banco_de_dados_2026.sql.gz',
        mimeType: 'application/gzip',
        size: 145 * 1024 * 1024,
        modifiedTime: new Date(Date.now() - 3600000 * 24).toISOString(),
        accountId: 'demo-acc-2',
        isDemo: true
      },
      {
        id: 'demo-file-3',
        name: 'design_system_figma_assets.zip',
        mimeType: 'application/zip',
        size: 89.2 * 1024 * 1024,
        modifiedTime: new Date(Date.now() - 3600000 * 48).toISOString(),
        accountId: 'demo-acc-3',
        isDemo: true
      },
      {
        id: 'demo-file-4',
        name: 'Vídeo_Gravacao_Reuniao_4k.mp4',
        mimeType: 'video/mp4',
        size: 450 * 1024 * 1024,
        modifiedTime: new Date(Date.now() - 3600000 * 12).toISOString(),
        accountId: 'demo-acc-3',
        isDemo: true
      },
      {
        id: 'demo-file-5',
        name: 'Relatorio_Financeiro_Total.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 3.4 * 1024 * 1024,
        modifiedTime: new Date(Date.now() - 3600000 * 8).toISOString(),
        accountId: 'demo-acc-1',
        isDemo: true
      }
    ];
    writeJson(FILES_FILE, files);
  }
}

seedInitialData();

// Helper to create OAuth2 Client
function getOAuth2Client() {
  const config = getConfig();
  if (!config.googleClientId || !config.googleClientSecret) {
    return null;
  }
  return new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret,
    config.redirectUri
  );
}

// -------------------------------------------------------------
// ROUTES: Configuration
// -------------------------------------------------------------
app.get('/api/config', (req, res) => {
  const config = getConfig();
  res.json({
    hasCredentials: Boolean(config.googleClientId && config.googleClientSecret),
    googleClientId: config.googleClientId ? config.googleClientId.slice(0, 12) + '...' : '',
    redirectUri: config.redirectUri
  });
});

app.post('/api/config', (req, res) => {
  const { googleClientId, googleClientSecret, redirectUri } = req.body;
  const current = getConfig();
  const updated = {
    ...current,
    googleClientId: googleClientId !== undefined ? googleClientId.trim() : current.googleClientId,
    googleClientSecret: googleClientSecret !== undefined ? googleClientSecret.trim() : current.googleClientSecret,
    redirectUri: redirectUri !== undefined ? redirectUri.trim() : current.redirectUri
  };
  writeJson(CONFIG_FILE, updated);
  res.json({ success: true, message: 'Configurações do Google OAuth salvas com sucesso!' });
});

// -------------------------------------------------------------
// ROUTES: Google OAuth Flow
// -------------------------------------------------------------
app.get('/api/auth/google/url', (req, res) => {
  const oauth2 = getOAuth2Client();
  if (!oauth2) {
    return res.status(400).json({
      error: 'Google OAuth Client ID e Client Secret não configurados. Configure nas opções ou adicione uma conta de demonstração.'
    });
  }

  const scopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes
  });

  res.json({ url: authUrl });
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh;">
          <div style="background: #1e293b; padding: 2rem; border-radius: 12px; text-align: center;">
            <h2 style="color: #ef4444;">Erro de Autenticação</h2>
            <p>Nenhum código de autorização foi fornecido pelo Google.</p>
            <a href="/" style="color: #38bdf8; text-decoration: none;">Voltar ao TotalDrive</a>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const oauth2 = getOAuth2Client();
    const { tokens } = await oauth2.getToken(code);
    oauth2.setCredentials(tokens);

    // Fetch user profile
    const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
    const userRes = await oauth2Api.userinfo.get();
    const userInfo = userRes.data;

    // Fetch storage quota from Drive API
    const drive = google.drive({ version: 'v3', auth: oauth2 });
    const about = await drive.about.get({ fields: 'storageQuota, user' });
    const quotaData = about.data.storageQuota || {};

    const accounts = readJson(ACCOUNTS_FILE, []);
    // Check if account already exists
    const existingIndex = accounts.findIndex(a => a.email === userInfo.email);

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    const randomColor = colors[accounts.length % colors.length];

    const accountObj = {
      id: existingIndex >= 0 ? accounts[existingIndex].id : 'acc-' + uuidv4(),
      name: userInfo.name || userInfo.email.split('@')[0],
      email: userInfo.email,
      avatar: userInfo.picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userInfo.email)}`,
      color: existingIndex >= 0 ? accounts[existingIndex].color : randomColor,
      isDemo: false,
      tokens: tokens,
      quota: {
        limit: parseInt(quotaData.limit || 15 * 1024 * 1024 * 1024, 10),
        usage: parseInt(quotaData.usage || 0, 10),
        usageInDrive: parseInt(quotaData.usageInDrive || 0, 10),
        usageInDriveTrash: parseInt(quotaData.usageInDriveTrash || 0, 10)
      },
      createdAt: existingIndex >= 0 ? accounts[existingIndex].createdAt : new Date().toISOString()
    };

    if (existingIndex >= 0) {
      accounts[existingIndex] = accountObj;
    } else {
      accounts.push(accountObj);
    }

    writeJson(ACCOUNTS_FILE, accounts);

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Conta Conectada - TotalDrive</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0b0f19; color: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #111827; border: 1px solid #1f2937; padding: 2.5rem; border-radius: 16px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); max-width: 440px; }
            .icon { font-size: 3rem; margin-bottom: 1rem; color: #10b981; }
            .btn { display: inline-block; margin-top: 1.5rem; background: #2563eb; color: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
            .btn:hover { background: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h2 style="margin: 0 0 0.5rem 0;">Conta Conectada!</h2>
            <p style="color: #94a3b8; margin: 0 0 1rem 0;">A conta <strong>${userInfo.email}</strong> foi vinculada com sucesso ao seu pool de armazenamento TotalDrive.</p>
            <script>
              setTimeout(() => { window.location.href = '/'; }, 2000);
            </script>
            <a class="btn" href="/">Continuar para o TotalDrive</a>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Google Auth callback error:', err);
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh;">
          <div style="background: #1e293b; padding: 2rem; border-radius: 12px; text-align: center; max-width: 500px;">
            <h2 style="color: #ef4444;">Falha ao vincular conta Google</h2>
            <p style="color: #cbd5e1;">${err.message || 'Erro desconhecido'}</p>
            <a href="/" style="display: inline-block; margin-top: 1rem; color: #38bdf8; text-decoration: none;">Voltar ao Início</a>
          </div>
        </body>
      </html>
    `);
  }
});

// -------------------------------------------------------------
// ROUTES: Accounts Management
// -------------------------------------------------------------

// List all connected accounts
app.get('/api/accounts', (req, res) => {
  const accounts = readJson(ACCOUNTS_FILE, []);
  // Strip sensitive token data before sending to client
  const safeAccounts = accounts.map(a => {
    const { tokens, ...safe } = a;
    return safe;
  });
  res.json(safeAccounts);
});

// Add a Demo Google Drive Account (allows instant multi-account simulation)
app.post('/api/accounts/demo', (req, res) => {
  const { name, email, gigabytes = 15 } = req.body;
  const accounts = readJson(ACCOUNTS_FILE, []);

  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#e11d48'];
  const color = colors[accounts.length % colors.length];

  const totalLimit = Number(gigabytes) * 1024 * 1024 * 1024;
  const initialUsage = Math.floor(Math.random() * (totalLimit * 0.25)); // 0-25% used initially

  const newAcc = {
    id: 'demo-' + uuidv4().slice(0, 8),
    name: name || `Google Drive (${accounts.length + 1})`,
    email: email || `conta.${accounts.length + 1}@gmail.com`,
    color,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name || email || 'demo' + accounts.length)}`,
    isDemo: true,
    quota: {
      limit: totalLimit,
      usage: initialUsage
    },
    createdAt: new Date().toISOString()
  };

  accounts.push(newAcc);
  writeJson(ACCOUNTS_FILE, accounts);

  const { tokens, ...safe } = newAcc;
  res.status(201).json(safe);
});

// Update an account (name, color)
app.put('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;
  const accounts = readJson(ACCOUNTS_FILE, []);
  const index = accounts.findIndex(a => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Conta não encontrada.' });
  }

  if (name) accounts[index].name = name;
  if (color) accounts[index].color = color;

  writeJson(ACCOUNTS_FILE, accounts);
  const { tokens, ...safe } = accounts[index];
  res.json(safe);
});

// Disconnect/Remove account
app.delete('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  let accounts = readJson(ACCOUNTS_FILE, []);
  const beforeCount = accounts.length;
  accounts = accounts.filter(a => a.id !== id);

  if (accounts.length === beforeCount) {
    return res.status(404).json({ error: 'Conta não encontrada.' });
  }

  writeJson(ACCOUNTS_FILE, accounts);

  // Clean up files associated with this account
  let files = readJson(FILES_FILE, []);
  files = files.filter(f => f.accountId !== id);
  writeJson(FILES_FILE, files);

  res.json({ success: true, message: 'Conta desconectada com sucesso.' });
});

// Sync / Refresh Quota for an account
app.post('/api/accounts/:id/sync', async (req, res) => {
  const { id } = req.params;
  const accounts = readJson(ACCOUNTS_FILE, []);
  const account = accounts.find(a => a.id === id);

  if (!account) {
    return res.status(404).json({ error: 'Conta não encontrada.' });
  }

  if (account.isDemo) {
    // Recompute usage from files in memory
    const files = readJson(FILES_FILE, []).filter(f => f.accountId === id);
    const usedBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
    account.quota.usage = Math.max(account.quota.usage, usedBytes);
    writeJson(ACCOUNTS_FILE, accounts);
    const { tokens, ...safe } = account;
    return res.json(safe);
  }

  // Real Google account
  try {
    const config = getConfig();
    const oauth2 = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.redirectUri
    );
    oauth2.setCredentials(account.tokens);

    // Refresh token if needed
    oauth2.on('tokens', (newTokens) => {
      account.tokens = { ...account.tokens, ...newTokens };
      writeJson(ACCOUNTS_FILE, accounts);
    });

    const drive = google.drive({ version: 'v3', auth: oauth2 });
    const about = await drive.about.get({ fields: 'storageQuota, user' });
    const quotaData = about.data.storageQuota || {};

    account.quota = {
      limit: parseInt(quotaData.limit || 15 * 1024 * 1024 * 1024, 10),
      usage: parseInt(quotaData.usage || 0, 10),
      usageInDrive: parseInt(quotaData.usageInDrive || 0, 10),
      usageInDriveTrash: parseInt(quotaData.usageInDriveTrash || 0, 10)
    };

    writeJson(ACCOUNTS_FILE, accounts);
    const { tokens, ...safe } = account;
    res.json(safe);
  } catch (err) {
    console.error('Error syncing account quota:', err);
    res.status(500).json({ error: 'Erro ao sincronizar cota: ' + err.message });
  }
});

// -------------------------------------------------------------
// ROUTES: Unified Storage Statistics
// -------------------------------------------------------------
app.get('/api/stats', (req, res) => {
  const accounts = readJson(ACCOUNTS_FILE, []);
  const files = readJson(FILES_FILE, []);

  let totalLimit = 0;
  let totalUsage = 0;

  const accountsBreakdown = accounts.map(a => {
    const limit = a.quota?.limit || 15 * 1024 * 1024 * 1024;
    const usage = a.quota?.usage || 0;
    const free = Math.max(0, limit - usage);
    totalLimit += limit;
    totalUsage += usage;

    return {
      id: a.id,
      name: a.name,
      email: a.email,
      color: a.color,
      isDemo: a.isDemo,
      limit,
      usage,
      free,
      percentUsed: limit > 0 ? Number(((usage / limit) * 100).toFixed(1)) : 0,
      filesCount: files.filter(f => f.accountId === a.id).length
    };
  });

  const totalFree = Math.max(0, totalLimit - totalUsage);
  const totalPercent = totalLimit > 0 ? Number(((totalUsage / totalLimit) * 100).toFixed(1)) : 0;

  res.json({
    totalAccounts: accounts.length,
    totalFiles: files.length,
    totalLimit,
    totalUsage,
    totalFree,
    totalPercent,
    accountsBreakdown
  });
});

// -------------------------------------------------------------
// ROUTES: Files Management (Unified & Per-Account)
// -------------------------------------------------------------

// List files with search, filtering and sorting
app.get('/api/files', async (req, res) => {
  const { accountId, search, type, sortBy = 'date', sortOrder = 'desc' } = req.query;
  const accounts = readJson(ACCOUNTS_FILE, []);
  let allFiles = readJson(FILES_FILE, []);

  // Sync real files from Google Drive accounts if connected
  for (const acc of accounts) {
    if (!acc.isDemo && acc.tokens) {
      try {
        const config = getConfig();
        const oauth2 = new google.auth.OAuth2(
          config.googleClientId,
          config.googleClientSecret,
          config.redirectUri
        );
        oauth2.setCredentials(acc.tokens);
        const drive = google.drive({ version: 'v3', auth: oauth2 });

        const driveRes = await drive.files.list({
          pageSize: 50,
          fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink)',
          q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'",
          orderBy: 'modifiedTime desc'
        });

        if (driveRes.data.files) {
          // Merge with files list
          driveRes.data.files.forEach(df => {
            const existingIdx = allFiles.findIndex(f => f.id === df.id);
            const fileItem = {
              id: df.id,
              name: df.name,
              mimeType: df.mimeType,
              size: parseInt(df.size || 0, 10),
              modifiedTime: df.modifiedTime,
              accountId: acc.id,
              webViewLink: df.webViewLink,
              webContentLink: df.webContentLink,
              thumbnailLink: df.thumbnailLink,
              isDemo: false
            };
            if (existingIdx >= 0) {
              allFiles[existingIdx] = fileItem;
            } else {
              allFiles.push(fileItem);
            }
          });
        }
      } catch (err) {
        console.warn(`Could not sync files for Google account ${acc.email}:`, err.message);
      }
    }
  }

  writeJson(FILES_FILE, allFiles);

  // Filter by account
  let filtered = allFiles;
  if (accountId && accountId !== 'all') {
    filtered = filtered.filter(f => f.accountId === accountId);
  }

  // Filter by search query
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(f => f.name.toLowerCase().includes(q));
  }

  // Filter by file type category
  if (type && type !== 'all') {
    filtered = filtered.filter(f => {
      const mime = (f.mimeType || '').toLowerCase();
      const name = (f.name || '').toLowerCase();
      if (type === 'image') return mime.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/.test(name);
      if (type === 'video') return mime.startsWith('video/') || /\.(mp4|mkv|mov|avi|webm)$/.test(name);
      if (type === 'audio') return mime.startsWith('audio/') || /\.(mp3|wav|ogg|flac|aac)$/.test(name);
      if (type === 'document') {
        return mime.includes('pdf') || mime.includes('word') || mime.includes('excel') ||
               mime.includes('spreadsheet') || mime.includes('presentation') || mime.includes('text') ||
               /\.(pdf|docx?|xlsx?|pptx?|txt|csv|md)$/.test(name);
      }
      if (type === 'archive') return mime.includes('zip') || mime.includes('compressed') || mime.includes('tar') || /\.(zip|rar|7z|tar|gz)$/.test(name);
      return true;
    });
  }

  // Sort files
  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'size') {
      comparison = (a.size || 0) - (b.size || 0);
    } else {
      // modifiedTime
      comparison = new Date(a.modifiedTime || 0) - new Date(b.modifiedTime || 0);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Attach account info to each file
  const enrichedFiles = filtered.map(f => {
    const acc = accounts.find(a => a.id === f.accountId);
    return {
      ...f,
      accountName: acc ? acc.name : 'Desconhecido',
      accountEmail: acc ? acc.email : '',
      accountColor: acc ? acc.color : '#64748b',
      accountIsDemo: acc ? acc.isDemo : true
    };
  });

  res.json(enrichedFiles);
});

// Upload file: can target a specific account or use "auto" for smart storage pooling
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const accounts = readJson(ACCOUNTS_FILE, []);
  if (accounts.length === 0) {
    // Delete temp file
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Nenhuma conta do Google Drive conectada. Adicione uma conta primeiro.' });
  }

  let targetAccountId = req.body.accountId;
  const fileSize = req.file.size;

  // SMART AUTO ALLOCATION:
  // If targetAccountId is 'auto' or not specified, choose the account with the most free storage
  // that can accommodate the file!
  if (!targetAccountId || targetAccountId === 'auto') {
    const candidates = accounts
      .map(acc => {
        const free = Math.max(0, (acc.quota?.limit || 15 * 1024 * 1024 * 1024) - (acc.quota?.usage || 0));
        return { acc, free };
      })
      .filter(item => item.free >= fileSize)
      .sort((a, b) => b.free - a.free); // highest free space first

    if (candidates.length === 0) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'Espaço insuficiente em todas as contas conectadas! Conecte mais uma conta do Google Drive para expandir seu pool de armazenamento.'
      });
    }

    targetAccountId = candidates[0].acc.id;
  }

  const targetAccount = accounts.find(a => a.id === targetAccountId);
  if (!targetAccount) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Conta de destino não encontrada.' });
  }

  // Check quota for the target account
  const currentUsage = targetAccount.quota?.usage || 0;
  const limit = targetAccount.quota?.limit || 15 * 1024 * 1024 * 1024;
  if (currentUsage + fileSize > limit) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({
      error: `Espaço insuficiente na conta "${targetAccount.name}". Escolha outra conta ou use a Distribuição Automática.`
    });
  }

  const files = readJson(FILES_FILE, []);

  // Handle Demo Account Upload
  if (targetAccount.isDemo) {
    const newFile = {
      id: 'file-' + uuidv4(),
      name: req.file.originalname,
      mimeType: req.file.mimetype || 'application/octet-stream',
      size: fileSize,
      modifiedTime: new Date().toISOString(),
      accountId: targetAccount.id,
      localPath: req.file.filename,
      isDemo: true
    };

    files.unshift(newFile);
    writeJson(FILES_FILE, files);

    // Update account quota
    targetAccount.quota.usage = currentUsage + fileSize;
    writeJson(ACCOUNTS_FILE, accounts);

    return res.status(201).json({
      success: true,
      file: {
        ...newFile,
        accountName: targetAccount.name,
        accountColor: targetAccount.color
      },
      message: `Arquivo enviado com sucesso para "${targetAccount.name}"!`
    });
  }

  // Real Google Drive Account Upload
  try {
    const config = getConfig();
    const oauth2 = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.redirectUri
    );
    oauth2.setCredentials(targetAccount.tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2 });

    const driveRes = await drive.files.create({
      requestBody: {
        name: req.file.originalname,
        mimeType: req.file.mimetype
      },
      media: {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(req.file.path)
      },
      fields: 'id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink'
    });

    // Remove local temp upload
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    const uploaded = driveRes.data;
    const newFile = {
      id: uploaded.id,
      name: uploaded.name,
      mimeType: uploaded.mimeType,
      size: parseInt(uploaded.size || fileSize, 10),
      modifiedTime: uploaded.modifiedTime || new Date().toISOString(),
      accountId: targetAccount.id,
      webViewLink: uploaded.webViewLink,
      webContentLink: uploaded.webContentLink,
      thumbnailLink: uploaded.thumbnailLink,
      isDemo: false
    };

    files.unshift(newFile);
    writeJson(FILES_FILE, files);

    // Refresh Google Drive quota
    try {
      const about = await drive.about.get({ fields: 'storageQuota' });
      if (about.data.storageQuota) {
        targetAccount.quota.usage = parseInt(about.data.storageQuota.usage || currentUsage + fileSize, 10);
      } else {
        targetAccount.quota.usage = currentUsage + fileSize;
      }
    } catch (_) {
      targetAccount.quota.usage = currentUsage + fileSize;
    }
    writeJson(ACCOUNTS_FILE, accounts);

    res.status(201).json({
      success: true,
      file: {
        ...newFile,
        accountName: targetAccount.name,
        accountColor: targetAccount.color
      },
      message: `Arquivo enviado para o Google Drive de "${targetAccount.name}"!`
    });
  } catch (err) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Google Drive upload error:', err);
    res.status(500).json({ error: 'Falha no upload para o Google Drive: ' + err.message });
  }
});

// Download / stream file
app.get('/api/files/:id/download', async (req, res) => {
  const { id } = req.params;
  const files = readJson(FILES_FILE, []);
  const file = files.find(f => f.id === id);

  if (!file) {
    return res.status(404).json({ error: 'Arquivo não encontrado.' });
  }

  // If demo file with local disk storage
  if (file.localPath) {
    const localFilePath = path.join(UPLOADS_DIR, file.localPath);
    if (fs.existsSync(localFilePath)) {
      return res.download(localFilePath, file.name);
    }
  }

  // If mock demo file without physical content, generate safe dummy stream
  if (file.isDemo) {
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    return res.send(`TotalDrive Demo Content for file: ${file.name}\nSize: ${file.size} bytes\nCreated on TotalDrive Multi-Account Storage Pool.`);
  }

  // Real Google Drive download
  try {
    const accounts = readJson(ACCOUNTS_FILE, []);
    const account = accounts.find(a => a.id === file.accountId);
    if (!account) return res.status(404).json({ error: 'Conta associada não encontrada.' });

    const config = getConfig();
    const oauth2 = new google.auth.OAuth2(
      config.googleClientId,
      config.googleClientSecret,
      config.redirectUri
    );
    oauth2.setCredentials(account.tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2 });

    const driveStream = await drive.files.get(
      { fileId: file.id, alt: 'media' },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    driveStream.data.pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Falha ao baixar arquivo do Google Drive: ' + err.message });
  }
});

// Delete file
app.delete('/api/files/:id', async (req, res) => {
  const { id } = req.params;
  let files = readJson(FILES_FILE, []);
  const file = files.find(f => f.id === id);

  if (!file) {
    return res.status(404).json({ error: 'Arquivo não encontrado.' });
  }

  const accounts = readJson(ACCOUNTS_FILE, []);
  const account = accounts.find(a => a.id === file.accountId);

  // Delete from disk if local
  if (file.localPath) {
    const localFilePath = path.join(UPLOADS_DIR, file.localPath);
    if (fs.existsSync(localFilePath)) {
      try { fs.unlinkSync(localFilePath); } catch (_) {}
    }
  }

  // Delete from Google Drive if real
  if (!file.isDemo && account && account.tokens) {
    try {
      const config = getConfig();
      const oauth2 = new google.auth.OAuth2(
        config.googleClientId,
        config.googleClientSecret,
        config.redirectUri
      );
      oauth2.setCredentials(account.tokens);
      const drive = google.drive({ version: 'v3', auth: oauth2 });
      await drive.files.delete({ fileId: file.id });
    } catch (err) {
      console.warn('Google Drive delete error:', err.message);
    }
  }

  // Remove from files JSON
  files = files.filter(f => f.id !== id);
  writeJson(FILES_FILE, files);

  // Free quota on account
  if (account && account.quota) {
    account.quota.usage = Math.max(0, (account.quota.usage || 0) - (file.size || 0));
    writeJson(ACCOUNTS_FILE, accounts);
  }

  res.json({ success: true, message: 'Arquivo removido com sucesso!' });
});

// Move file between accounts (Cloud-to-Cloud Migration across Google Accounts!)
app.post('/api/files/:id/move', async (req, res) => {
  const { id } = req.params;
  const { targetAccountId } = req.body;

  const files = readJson(FILES_FILE, []);
  const file = files.find(f => f.id === id);
  if (!file) return res.status(404).json({ error: 'Arquivo não encontrado.' });

  const accounts = readJson(ACCOUNTS_FILE, []);
  const sourceAccount = accounts.find(a => a.id === file.accountId);
  const targetAccount = accounts.find(a => a.id === targetAccountId);

  if (!targetAccount) return res.status(404).json({ error: 'Conta de destino não encontrada.' });
  if (sourceAccount && sourceAccount.id === targetAccount.id) {
    return res.status(400).json({ error: 'O arquivo já está nesta conta.' });
  }

  // Check quota on target
  const targetUsage = targetAccount.quota?.usage || 0;
  const targetLimit = targetAccount.quota?.limit || 15 * 1024 * 1024 * 1024;
  if (targetUsage + (file.size || 0) > targetLimit) {
    return res.status(400).json({ error: `Espaço insuficiente na conta "${targetAccount.name}".` });
  }

  // Update file association
  file.accountId = targetAccount.id;
  writeJson(FILES_FILE, files);

  // Adjust quotas
  if (sourceAccount && sourceAccount.quota) {
    sourceAccount.quota.usage = Math.max(0, (sourceAccount.quota.usage || 0) - (file.size || 0));
  }
  if (targetAccount.quota) {
    targetAccount.quota.usage = targetUsage + (file.size || 0);
  }
  writeJson(ACCOUNTS_FILE, accounts);

  res.json({
    success: true,
    message: `Arquivo migrado com sucesso para "${targetAccount.name}"!`,
    file
  });
});

// Fallback index
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`TotalDrive Server rodando em http://localhost:${PORT}`);
  console.log(`Pool de armazenamento pronto para conectar contas Google!`);
  console.log(`=======================================================`);
});
