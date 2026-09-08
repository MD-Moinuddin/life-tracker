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

More details, like the tech stack and setup instructions, will be added to this README as the project grows.
