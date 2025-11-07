# Code Keeper

A modern full-stack application for managing and organizing code repositories, snippets, and development resources.

## 🚀 Overview

Code Keeper is a comprehensive platform designed to help developers manage, organize, and access their code repositories and development resources efficiently. Built with modern web technologies, it provides a seamless experience for code management and collaboration.

## ✨ Features

- **Modern Web Interface** - Built with Next.js 16 and React 19
- **RESTful API Backend** - Scalable Node.js backend service
- **Docker Support** - Fully containerized for easy deployment
- **Documentation Site** - Comprehensive documentation with Docker support
- **TypeScript** - Type-safe development across the entire stack
- **Dark Mode** - Built-in dark mode support

## 📁 Project Structure

```
code-keeper/
├── web/          # Next.js frontend application
├── backend/      # Backend API service
├── docs/         # Documentation site
└── docker-compose.yml  # Docker orchestration
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling framework
- **Geist Font** - Modern typography

### Backend
- **Node.js** - Runtime environment
- **TypeScript** - Type-safe backend development

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Service orchestration
- **Nginx** - Web server for documentation

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm/yarn/pnpm
- Docker Engine 20.10+
- Docker Compose 2.0+

### Local Development

#### Web Application

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Backend Service

```bash
cd backend
npm install
npm start
```

The backend will run on `http://localhost:3001`.

### Docker Deployment

#### Start All Services

```bash
docker-compose up --build
```

This will start:
- **Web** on `http://localhost:3000`
- **Backend** on `http://localhost:3001`
- **Docs** on `http://localhost:8080` (optional, use `--profile docs`)

#### Start Specific Services

```bash
# Start only web and backend
docker-compose up web backend

# Start with documentation
docker-compose --profile docs up
```

#### Stop Services

```bash
docker-compose down
```

For more detailed Docker instructions, see [docs/docker.md](./docs/docker.md).

## 📚 Documentation

All documentation is available in the `docs/` directory:

- [Docker Setup Guide](./docs/docker.md) - Docker and Docker Compose setup
- [Web Application Guide](./docs/web.md) - Next.js application documentation
- [Documentation Index](./docs/README.md) - Complete documentation index

## 🧪 Development

### Available Scripts

#### Web
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Code Style

This project follows strict coding standards:
- TypeScript with strict mode enabled
- ESLint for code quality
- Functional programming patterns
- Component-based architecture

See [.cursor/rules](./.cursor/rules) for detailed coding guidelines.

## 🔧 Configuration

### Environment Variables

#### Web
Create `web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Backend
Create `backend/.env`:
```env
NODE_ENV=development
PORT=3001
```

## 🐳 Docker Services

| Service | Port | Description |
|--------|------|-------------|
| Web | 3000 | Next.js frontend application |
| Backend | 3001 | Node.js API service |
| Docs | 8080 | Documentation site (optional) |

## 📦 Building for Production

### Web

```bash
cd web
npm run build
npm start
```

### Docker

```bash
docker-compose build
docker-compose up -d
```

## 🤝 Contributing

1. Follow the coding standards defined in `.cursor/rules`
2. Write clear commit messages
3. Test your changes thoroughly
4. Update documentation as needed

## 📝 License

[Add your license here]

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📧 Contact

[Add contact information here]

---

Built with ❤️ using Next.js, TypeScript, and Docker

