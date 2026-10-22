$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Item -LiteralPath (Join-Path $PSScriptRoot "..\..")).FullName
Set-Location -LiteralPath $ProjectDir

if (-not (Test-Path -LiteralPath ".env")) {
    throw "Falta $ProjectDir\.env. Créalo desde .env.example."
}

pnpm install --frozen-lockfile --prod=false
if ($LASTEXITCODE -ne 0) { throw "Falló pnpm install." }
pnpm db:generate
if ($LASTEXITCODE -ne 0) { throw "Falló Prisma generate." }
pnpm build:standalone
if ($LASTEXITCODE -ne 0) { throw "Falló el build standalone." }
pnpm db:migrate:deploy
if ($LASTEXITCODE -ne 0) { throw "Fallaron las migraciones." }
New-Item -ItemType Directory -Force -Path "private" | Out-Null

Write-Host "Build listo. Inicia con: pnpm start:standalone" -ForegroundColor Green
