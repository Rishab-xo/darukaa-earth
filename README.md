# Darukaa.Earth - Geospatial Analytics Platform

A full-stack, geospatial data analytics platform for managing and visualizing carbon and biodiversity projects. Built for the Darukaa.Earth Full-Stack Developer Hackathon.

## High-Level Architecture

- **Frontend**: React (Vite) + Tailwind CSS. Uses `mapbox-gl` and `@mapbox/mapbox-gl-draw` for interactive geographical polygon mapping. Analytics are visualized using `chart.js` and `react-chartjs-2`.
- **Backend**: Python (FastAPI). Provides robust validation via Pydantic and generates automated OpenAPI documentation. Authentication is handled via JWT (JSON Web Tokens) with Argon2 password hashing.
- **Database**: PostgreSQL with the PostGIS extension (hosted on Supabase).
- **ORM**: SQLAlchemy with GeoAlchemy2 (`ST_GeomFromGeoJSON`) for direct translation of frontend Mapbox drawing data into WGS84 (SRID 4326) PostGIS polygons.

## Database Schema

The database consists of 4 relational tables:

1. **users**: `id`, `email`, `hashed_password`, `created_at`
2. **projects**: `id`, `user_id` (FK), `title`, `description`, `created_at`
3. **sites**: `id`, `project_id` (FK), `name`, `boundary` (GEOMETRY Polygon 4326), `created_at`
4. **site_analytics**: `id`, `site_id` (FK), `recorded_date`, `carbon_sequestration`, `biodiversity_index`, `created_at`

## CI/CD Pipeline & Code Quality

- **Pre-commit Hooks**: Husky and `lint-staged` are configured at the repository root. Before every commit, Prettier auto-formats frontend code, ESLint checks for JavaScript/React issues, and Ruff lints the Python backend. This guarantees zero broken or unformatted code enters the repository.
- **GitHub Actions**: Automated workflows are triggered on `push` and `pull_request` to the `main` branch, installing dependencies and running formatting/linting verification in an isolated Ubuntu environment.

## Datasets & Mock Data

For the analytics visualization, this application auto-generates 12 months of synthetic Carbon Sequestration and Biodiversity Index data upon the creation of any new site. This mocking strategy was chosen to guarantee that reviewers immediately experience a fully populated, interactive Chart.js dashboard without needing to manually upload external CSV datasets or run complex database seeding scripts.

## Local Setup Instructions

### Backend (FastAPI)

1. `cd backend`
2. `python -m venv venv`
3. Activate virtual environment: `venv\Scripts\activate` (Windows)
4. `pip install -r requirements.txt`
5. Create a `.env` file with `DATABASE_URL` (PostgreSQL connection string with PostGIS enabled) and `SECRET_KEY`.
6. Run server: `uvicorn main:app --reload` (Runs on http://127.0.0.1:8000)

### Frontend (React + Vite)

1. `cd frontend`
2. `npm install`
3. Create a `.env` file with `VITE_API_URL=http://127.0.0.1:8000` and `VITE_MAPBOX_TOKEN=your_public_token`.
4. Run dev server: `npm run dev` (Runs on http://localhost:5173)
