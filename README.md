# 🌍 Darukaa.Earth — Geospatial Analytics Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostGIS](https://img.shields.io/badge/PostgreSQL-PostGIS-336791?logo=postgresql&logoColor=white)](https://postgis.net/)
[![Mapbox](https://img.shields.io/badge/Mapbox-GL_JS-000000?logo=mapbox&logoColor=white)](https://www.mapbox.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.5-FF6384?logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![CI/CD](https://img.shields.io/badge/GitHub_Actions-Automated_CI-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Code Quality](https://img.shields.io/badge/Pre--commit-Husky_%26_lint--staged-4A154B?logo=git&logoColor=white)](https://typicode.github.io/husky/)

> **Darukaa.Earth** is a full-stack geospatial data analytics platform built for the **Darukaa.Earth Full-Stack Developer Hackathon Challenge**. It empowers environmental administrators to manage land conservation projects, delineate spatial site boundaries on high-resolution satellite maps, and analyze 12-month carbon sequestration and biodiversity telemetry.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Database Schema & PostGIS Model](#-database-schema--postgis-model)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Datasets & Mock Data Strategy](#-datasets--mock-data-strategy)
- [CI/CD & Developer Experience](#-cicd--developer-experience)
- [Local Setup & Installation](#-local-setup--installation)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup (FastAPI + PostGIS)](#1-backend-setup-fastapi--postgis)
  - [2. Frontend Setup (React + Vite)](#2-frontend-setup-react--vite)
- [Submission & Verification Checklist](#-submission--verification-checklist)

---

## ✨ Key Features

- **🛰️ Interactive Satellite Geospatial Mapping**: Integrated with Mapbox GL JS and `@mapbox/mapbox-gl-draw`. Draw and modify polygon boundaries directly over high-resolution satellite imagery with automatic SRID 4326 PostGIS geometry persistence.
- **📊 12-Month Telemetry & Data Visualization**: Dual-metric interactive Chart.js graphs displaying simulated monthly carbon sequestration (Tons) and biodiversity indices with gradient fills and metric toggle chips.
- **📁 Full Project & Site Lifecycle Management**: Create, search/filter, rename, and delete projects and sites with live confirmation modals and automated database cascade cleanup.
- **🧭 Interactive Product Walkthrough**: Built-in interactive onboarding guide highlighting core workflows (drawing boundaries, inspecting telemetry, and managing projects).
- **🔐 JWT-Secured Authentication**: User registration and login flow utilizing JSON Web Tokens (JWT) with Argon2/bcrypt password hashing.
- **⚡ Obsidian Dark Glassmorphism UI**: Curated dark aesthetic built with responsive typography, smooth animations, Lucide icons, and mobile sidebar drawers.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Darukaa.Earth Platform                          │
└────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│        Frontend (SPA)         │   HTTP/JSON   │       Backend (REST API)      │
│  • React 19 + Vite            │ ────────────> │  • Python 3.11 + FastAPI      │
│  • Tailwind CSS               │ <──────────── │  • Pydantic v2 Validation     │
│  • Mapbox GL JS (Spatial)     │    Bearer     │  • JWT Authentication         │
│  • Chart.js (Visualization)   │     Token     │  • SQLAlchemy ORM + GeoAlchemy│
└───────────────────────────────┘               └───────────────────────────────┘
                                                                │
                                                                ▼
                                                ┌───────────────────────────────┐
                                                │      Database (Supabase)      │
                                                │  • PostgreSQL 15+             │
                                                │  • PostGIS Spatial Extension  │
                                                │  • WGS84 (SRID 4326) Geometry │
                                                └───────────────────────────────┘
```

---

## 🗄️ Database Schema & PostGIS Model

The application models its relational and geospatial domain across 4 PostgreSQL tables:

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "owns (1:N)"
    PROJECTS ||--o{ SITES : "contains (1:N)"
    SITES ||--o{ SITE_ANALYTICS : "tracks (1:N)"

    USERS {
        int id PK
        string email UK
        string hashed_password
        timestamp created_at
    }

    PROJECTS {
        int id PK
        int user_id FK
        string title
        text description
        timestamp created_at
    }

    SITES {
        int id PK
        int project_id FK
        string name
        geometry boundary "Polygon (SRID 4326)"
        timestamp created_at
    }

    SITE_ANALYTICS {
        int id PK
        int site_id FK
        timestamp recorded_date
        float carbon_sequestration
        int biodiversity_index
        timestamp created_at
    }
```

- **Spatial Coordinate Reference System (CRS)**: All site boundaries are validated and stored as `GEOMETRY(POLYGON, 4326)` in WGS84 standard coordinates using PostGIS `ST_GeomFromGeoJSON` and `ST_AsGeoJSON` for seamless translation between frontend GeoJSON and spatial database columns.

---

## 🔌 API Endpoints Reference

All `/projects` endpoints are protected and require a `Bearer <token>` HTTP header.

| Method   | Endpoint                              | Description                                                  | Auth Required |
| :------- | :------------------------------------ | :----------------------------------------------------------- | :-----------: |
| `POST`   | `/auth/register`                      | Register a new user account                                  |      No       |
| `POST`   | `/auth/login`                         | Login and obtain JWT access token                            |      No       |
| `GET`    | `/projects/`                          | Retrieve all projects owned by the authenticated user        |    **Yes**    |
| `POST`   | `/projects/`                          | Create a new project                                         |    **Yes**    |
| `PATCH`  | `/projects/{project_id}`              | Rename/update an existing project                            |    **Yes**    |
| `DELETE` | `/projects/{project_id}`              | Delete a project (cascade deletes all sites & analytics)     |    **Yes**    |
| `GET`    | `/projects/{project_id}/sites`        | List all conservation sites with GeoJSON boundaries          |    **Yes**    |
| `POST`   | `/projects/{project_id}/sites`        | Add a site with Mapbox polygon and auto-seed 12-mo telemetry |    **Yes**    |
| `PATCH`  | `/projects/sites/{site_id}`           | Rename/update a site name                                    |    **Yes**    |
| `DELETE` | `/projects/sites/{site_id}`           | Delete a site and its analytics records                      |    **Yes**    |
| `GET`    | `/projects/sites/{site_id}/analytics` | Get 12-month historical carbon & biodiversity time series    |    **Yes**    |

---

## 📈 Datasets & Mock Data Strategy

For analytics visualization, this application auto-generates 12 months of synthetic Carbon Sequestration (Tons) and Biodiversity Index telemetry immediately upon the creation of any new site.

**Why this choice was made:**

- **Zero Friction Review**: Reviewers can immediately test drawing custom polygons anywhere on Earth and instantly inspect populated, responsive Chart.js time-series without needing manual CSV uploads or database seeding scripts.
- **Dynamic PostGIS Association**: Each telemetry point is strictly tied to the newly created PostGIS `site_id` foreign key with realistic variance matching environmental monitoring benchmarks.

---

## 🛠️ CI/CD & Developer Experience

- **Husky & lint-staged Pre-Commit Hooks**: Configured at the repository root to automatically format staged files with **Prettier** and enforce **ESLint** rules before every commit. This guarantees zero broken syntax or unformatted code enters the repository.
- **GitHub Actions CI Pipeline** (`.github/workflows/main.yml`): Triggers automatically on `push` and `pull_request` to `main`, installing dependencies in an isolated Ubuntu environment, running linting checks, and verifying the Vite production build.

---

## 🚀 Local Setup & Installation

### Prerequisites

- **Node.js**: v18.0 or higher
- **Python**: v3.10 or higher
- **PostgreSQL**: With PostGIS extension enabled (or a Supabase / Neon cloud PostgreSQL database)
- **Mapbox Access Token**: Free public token from [mapbox.com](https://account.mapbox.com/)

---

### 1. Backend Setup (FastAPI + PostGIS)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate a Python virtual environment
# On Windows:
python -m venv venv
.\venv\Scripts\activate

# On macOS/Linux:
python3 -m venv venv
source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Create .env file in the backend directory
# Example .env:
# DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres
# SECRET_KEY=your_super_secret_jwt_key_here
# CORS_ORIGINS=http://localhost:5173

# 5. Start the FastAPI backend server
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- **Backend API**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 2. Frontend Setup (React + Vite)

```bash
# 1. Open a new terminal and navigate to frontend
cd frontend

# 2. Install Node dependencies
npm install

# 3. Create .env file in the frontend directory
# Example .env:
# VITE_API_URL=http://127.0.0.1:8000
# VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNseHh4eHh4In0.xxxxxx

# 4. Start the Vite development server
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)

---

## ✅ Submission & Verification Checklist

- [x] **JWT Authentication**: User registration, login, token persistence, and protected routes.
- [x] **Project Management**: CRUD operations for projects with search, filter, and live rename.
- [x] **Geospatial Boundaries**: Interactive polygon drawing with Mapbox Draw and PostGIS SRID 4326 storage.
- [x] **Data Analytics**: Dual-axis Chart.js telemetry with carbon & biodiversity curves and stat cards.
- [x] **Pre-Commit Code Quality**: Husky + lint-staged pre-commit hooks running Prettier & ESLint.
- [x] **Automated CI/CD**: GitHub Actions workflow verifying Python and React build pipelines.
- [x] **Architecture & Schema Documentation**: Full database breakdown and local setup guide included in README.
