@echo off
set WEBHOOK_URL=https://pockmarked-michale-intranuclear.ngrok-free.dev

echo Starting n8n...
echo Data directory: D:\N8NInstall 
:: Set the n8n data folder to your chosen drive
set N8N_USER_FOLDER=D:\N8NInstall

:: Start n8n using npx
npx n8n

