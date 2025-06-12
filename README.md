# Todo App

Um aplicativo de lista de tarefas com autenticação, construído com React, Node.js e sqlite3.

## 🚀 Configuração do Projeto

### Pré-requisitos
- Node.js (versão 16 ou superior)
- NPM (versão 8 ou superior)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/todo-app.git
cd todo-app
```

2. Instale as dependências:
```bash
npm install
```

3. Instale as dependências dos subprojetos:
```bash
cd packages/frontend
npm install

cd ../backend
npm install
```

### Executando o Projeto

Na pasta raiz do projeto, execute:
```bash
npm run dev
```

Isso iniciará:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

## 📁 Estrutura do Projeto

```
Todo_App/
├── packages/
│   ├── frontend/     # Aplicação React
│   └── backend/      # API Node.js com SQLite
└── package.json      # Configuração do monorepo
```