# 🎓 Escola de Saberes

Plataforma de aprendizado online e gestão de cursos para o **Terreiro Iansã Guerreira**. Desenvolvida com foco em alta performance, usabilidade moderna e integração serverless com Google Apps Script.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?logo=javascript&logoColor=black)
![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-Backend-4285F4?logo=google&logoColor=white)

---

## 📌 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação e Execução Local](#-instalação-e-execução-local)
- [Configuração do Backend (Google Apps Script)](#-configuração-do-backend-google-apps-script)
- [Deploy](#-deploy)
- [Licença](#-licença)

---

## 🚀 Visão Geral

A **Escola de Saberes** é uma aplicação web progressiva e intuitiva destinada ao ensino de saberes ancestrais e conteúdos educativos do Terreiro Iansã Guerreira. A plataforma disponibiliza áreas dedicadas para alunos e administradores, incluindo catálogo de cursos, tocador de videoaulas e materiais de apoio em PDF, além de painel de controle administrativo completo.

---

## ✨ Funcionalidades Principais

### 🔒 Autenticação & Gestão de Usuários
- Autenticação segura de alunos e administradores.
- Controle de acesso baseado em papéis (Role-Based Access Control).

### 📚 Painel do Aluno (Dashboard & Player)
- **Catálogo de Cursos**: Visualização de cursos disponíveis e em andamento.
- **Player de Curso**: Visualizador interativo de aulas com suporte a vídeos e leitura de materiais PDF integrados (`pdfjs-dist`).
- **Acompanhamento de Progresso**: Controle visual das aulas concluídas.

### ⚙️ Painel de Administração (`AdminPage`)
- Gestão completa de cursos, módulos e lições.
- Gerenciamento de inscrições de alunos.
- Upload e associação de materiais didáticos (PDFs e links de vídeo).

---

## 🛠️ Arquitetura do Sistema

O projeto utiliza uma arquitetura **JAMstack / Serverless**:
- **Frontend**: SPA leve e ultrarrápida construída com HTML5, CSS3 modular e Vanilla JavaScript (ES Modules), empacotada via **Vite**.
- **Backend / Database**: API Serverless em **Google Apps Script (`Code.gs`)**, utilizando a infraestrutura do Google Drive / Google Sheets para persistência e armazenamento confiável sem custos de servidor de banco de dados.

---

## 🧰 Tecnologias Utilizadas

- **Frontend**: [Vite](https://vitejs.dev/) | Vanilla JavaScript | CSS3 (Modern Utility & Flexbox/Grid)
- **Visualizador de PDF**: [PDF.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`)
- **Backend & Database**: [Google Apps Script](https://developers.google.com/apps-script)
- **Fontes & Design**: Outfit & Inter (Google Fonts)

---

## 📁 Estrutura do Projeto

```
escola-de-sabares/
├── google-apps-script/
│   └── Code.gs              # Backend serverless em Apps Script
├── public/                  # Ativos estáticos públicos
├── src/
│   ├── assets/              # Imagens e ícones
│   ├── components/          # Componentes reusáveis de UI
│   ├── pages/               # Páginas da aplicação (Login, Dashboard, Player, Admin)
│   ├── styles/              # Estilos globais e temas
│   ├── utils/               # Utilitários e helpers
│   ├── api.js               # Cliente HTTP e integração com a API Backend
│   ├── auth.js              # Gerenciador de estado de autenticação
│   ├── main.js              # Ponto de entrada do aplicativo
│   ├── router.js            # Roteador SPA customizado
│   └── style.css            # Estilo principal
├── index.html               # Documento HTML principal
├── package.json             # Dependências e scripts npm
└── vite.config.js           # Configuração de build do Vite
```

---

## 🔧 Instalação e Execução Local

### Pré-requisitos
- **Node.js** (versão 18+ recomendada)
- **npm** ou **yarn**

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Viniguerra19/Escola-de-saberes.git
   cd Escola-de-saberes
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse no navegador através de `http://localhost:5173`.

4. **Gerar build de produção:**
   ```bash
   npm run build
   ```

---

## ⚙️ Configuração do Backend (Google Apps Script)

1. Crie um novo projeto no [Google Apps Script](https://script.google.com/).
2. Copie o conteúdo do arquivo `google-apps-script/Code.gs` para o editor.
3. Faça a implantação como **Web App** (Aplicativo da Web):
   - **Executar como**: *Sua conta*
   - **Quem tem acesso**: *Qualquer pessoa*
4. Copie a URL do Web App implantado e configure na constante da API no arquivo `src/api.js`.

---

## 📄 Licença

Este projeto é desenvolvido para o **Terreiro Iansã Guerreira**. Todos os direitos reservados.
