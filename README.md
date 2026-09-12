# Life Tracker

Life Tracker is a personal app for tracking daily life. This first version covers user authentication and a dashboard. Later versions will add work scheduling, fitness tracking, nutrition tracking, and personal finance tracking.

## Why this project exists

I built this project for two reasons.

First, I want to use it myself. I want one place to track my daily routine instead of using several different apps.

Second, this project is part of my software engineering portfolio. My other public projects use older tools like plain HTML, CSS, and Bootstrap. They do not show my experience with React, Node.js, Docker, or CI/CD pipelines. This project is built with those tools from the start. It also follows real industry practices, like automated testing, pull request reviews, and accessibility standards.

## What is in version 1

Version 1 only has two features, but they are built properly:

- User authentication, including signup, login, and secure sessions
- A dashboard that shows the logged in user's profile and placeholder cards for features that are coming later

## What comes next

After version 1 is finished, future versions will add:

- Work and shift scheduling
- Fitness and workout tracking
- Nutrition and protein tracking
- Personal finance tracking

## Project layout

This repository has two main folders: `backend` and `frontend`. Each one is its own separate project with its own `package.json`.

I chose not to use workspace tooling, like pnpm workspaces or a monorepo tool. A plain two-folder repo is simpler to set up and easier to understand. It also fits the time I have for this project. If the project grows a lot in the future, I may switch to workspace tooling then.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma |
| Containers | Docker, Docker Compose |
| CI | GitHub Actions |
| Testing | Vitest |
| Code quality | ESLint, Prettier, Husky |

## Running this locally

You need Docker installed. You do not need Node or PostgreSQL installed on your own machine, since Docker runs both for you.

1. Clone the repository.
2. Copy `backend/.env.example` to `backend/.env`, and `frontend/.env.example` to `frontend/.env`.
3. From the repository root, run:
   ```
   docker compose up --build
   ```
4. The first time you run this, the database exists but has no tables yet. In a separate terminal, run the first migration:
   ```
   cd backend
   npx prisma migrate dev
   ```
5. Open `http://localhost:5173` for the frontend, and `http://localhost:4000` for the backend.

## Running tests

Backend tests use Vitest:

```
cd backend
npm run test
```
