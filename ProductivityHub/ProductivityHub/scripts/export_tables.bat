@echo off
REM Windows batch script to export PostgreSQL tables to CSV

echo Creating migrations directory...
if not exist "..\server\migrations" mkdir ..\server\migrations

echo Exporting PostgreSQL schema...
docker exec refyneo-postgres pg_dump -U postgres -d refyneo_db -s > ..\server\migrations\pg_schema.sql

echo Exporting table data...
set tables=notes users assignments flashcards journal_entries pomodoro_sessions bell_schedule classes mood_entries ai_summaries

for %%t in (%tables%) do (
    echo Exporting %%t...
    docker exec refyneo-postgres psql -U postgres -d refyneo_db -c "\COPY %%t TO '/tmp/%%t.csv' WITH CSV HEADER"
    docker cp refyneo-postgres:/tmp/%%t.csv ..\server\migrations\
)

echo Export complete! Check ..\server\migrations\ for all files.
echo.
echo Files created:
dir ..\server\migrations\*.csv /b