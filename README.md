# 🖥️ Screen Share App

Aplicação web para **compartilhamento de tela e áudio em tempo real**, com suporte a múltiplas salas (públicas e privadas com senha), chat ao vivo e controle de participantes utilizando **WebRTC**, **Socket.io**, **React 19** e **Express**.

---

## 🚀 Instruções de Inicialização

### 📋 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:
- **Node.js** (versão 18.0.0 ou superior recomendada) - [Download Node.js](https://nodejs.org/)
- Um gerenciador de pacotes: `npm`, `pnpm` ou `bun`

---

### 📥 1. Instalar Dependências

Abra o terminal na pasta raiz do projeto e instale as dependências:

```bash
# Usando npm
npm install

# Ou usando pnpm
pnpm install

# Ou usando bun
bun install
```

---

### 💻 2. Executar em Modo de Desenvolvimento

Para iniciar o servidor de desenvolvimento (Express + Vite dev server integrado na porta 3000):

```bash
npm run dev
```

Após o servidor iniciar, acesse no seu navegador:
👉 **[http://localhost:3000](http://localhost:3000)**

---

### 🌐 3. Compartilhar na Internet via Túnel (Opcional)

Para permitir que outras pessoas fora da sua rede local acessem a sua transmissão sem necessidade de deploy:

```bash
npm run share
```

Esse comando iniciará um túnel seguro via Cloudflare (`cloudflared`) e gerará uma URL pública (ex: `https://xxxx.trycloudflare.com`) conectada diretamente ao seu `localhost:3000`.

---

### 📦 4. Build e Execução em Produção

Para compilar e rodar a aplicação em ambiente de produção:

#### Compilar a Aplicação:
```bash
npm run build
```
*Este comando compila o frontend React via Vite e empacota o servidor Node.js em `dist/server.cjs` via esbuild.*

#### Executar em Produção:
```bash
npm run start
```
A aplicação estará disponível em `http://localhost:3000`.

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor backend TypeScript e o Vite em modo desenvolvimento na porta 3000. |
| `npm run share` | Cria um túnel público temporário via Cloudflare Tunnel para a porta 3000. |
| `npm run build` | Compila o frontend React (`vite build`) e empacota o servidor Node (`esbuild`). |
| `npm run start` | Executa a versão compilada em produção (`node dist/server.cjs`). |
| `npm run lint` | Verifica erros de tipagem TypeScript (`tsc --noEmit`). |
| `npm run clean` | Remove os diretórios de build (`dist`). |

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Motion (Framer Motion), Lucide Icons
- **Backend**: Node.js, Express, Socket.io
- **Streaming**: WebRTC (transmissão de áudio/vídeo Peer-to-Peer)
- **Ferramentas de Bundling**: `tsx`, `esbuild`

---

## 💡 Dicas de Uso

- **Compartilhamento de Áudio**: Ao iniciar o compartilhamento de tela no seu navegador, lembre-se de marcar a caixa **"Compartilhar áudio da aba"** ou **"Compartilhar áudio do sistema"** para que o som seja enviado aos outros participantes.
- **Porta**: A aplicação utiliza por padrão a porta `3000`.
