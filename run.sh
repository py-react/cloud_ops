docker compose down --volumes --remove-orphans

docker compose up -d --build

echo "Waiting for PostgreSQL..."

until docker exec cloud_ops-db-1 pg_isready -U example -d cloud_ops > /dev/null 2>&1; do
  sleep 2
done

echo "Postgres is ready"

uv sync --active --reinstall

kill -9 $(lsof -ti:5002) 2>/dev/null

source .venv/bin/activate

npm run reset_db
npm run sync_db
OAUTHLIB_RELAX_TOKEN_SCOPE=1 npm run dev