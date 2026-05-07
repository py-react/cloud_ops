docker-compose down
docker-compose up -d --build
uv sync --active --reinstall
kill -9 $(lsof -ti:5001)
npm run sync_db
npm run dev