#!/usr/bin/env bash
set -o errexit

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate