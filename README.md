# TiFlinks - Personal Knowledge Base

TiFlinks is a personal knowledge base application that allows you to create, manage, and link different types of information units.

## Features

- Create and manage information units (text, images, URLs)
- Create links between information units
- Support for different link types:
  - Navigational links
  - Semantic reference links (ontosense links)
- Link descriptions and metadata
- Cross-platform access (Web, iOS, Android)
- Progressive Web App (PWA) support for mobile installation

## Technology Stack

- **Frontend**:
  - React
  - TypeScript
  - Tailwind CSS
  - PWA capabilities
  - Vite (for build tooling)

- **Backend**:
  - ASP.NET Core Web API
  - Entity Framework Core
  - SQL Server

## Development Setup

### Prerequisites

- Node.js 18+
- .NET 8 SDK
- Docker (optional, for containerized deployment)
- SQL Server (local or Docker)

### Local Development

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   dotnet restore
   ```
4. Start the development servers:
   - Frontend: `npm run dev` (runs on http://localhost:5173)
   - Backend: `dotnet run` (runs on http://localhost:5000)

### Docker Deployment

```bash
docker-compose up
```

## Project Structure

```
tiflinks-app/
├── frontend/           # React frontend application
├── backend/           # ASP.NET Core backend
├── docker/           # Docker configuration files
└── docs/            # Documentation
```

## License

MIT