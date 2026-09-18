<#
.SYNOPSIS
Construye y publica una imagen. Ejemplo: ./docker-build-push.ps1 -Username miusuario
#>
param(
    [string]$Username = $env:DOCKERHUB_USERNAME,
    [string]$Tag,
    [string]$Platform = "linux/amd64",
    [switch]$SkipPush
)
$ErrorActionPreference = "Stop"
if ($Username -notmatch '^[a-z0-9][a-z0-9_-]*$') { throw "Indica -Username con tu usuario de Docker Hub." }
$Release = git -C $PSScriptRoot rev-parse HEAD
if ($LASTEXITCODE -ne 0 -or $Release -notmatch '^[a-f0-9]{40}$') { throw "No se pudo obtener el commit." }
$Changes = git -C $PSScriptRoot status --porcelain
if ($LASTEXITCODE -ne 0 -or $Changes) { throw "Confirma los cambios antes de construir una versión." }
if (-not $Tag) { $Tag = $Release.Substring(0,12) }
if ($Tag -eq "latest" -or $Tag -notmatch '^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$') { throw "Usa una etiqueta de versión; no latest." }
$Name = (Split-Path $PSScriptRoot -Leaf).ToLower()
$Image = "${Username}/${Name}:$Tag"
docker build --platform $Platform --target runner --build-arg "RELEASE_ID=$Release" -t $Image $PSScriptRoot
if ($LASTEXITCODE -ne 0) { throw "Falló la construcción." }
if (-not $SkipPush) {
    # Autenticarse previamente con docker login.
    docker push $Image
    if ($LASTEXITCODE -ne 0) { throw "Falló la publicación. Comprueba docker login." }
}
Write-Host "Imagen: $Image"
Write-Host "En el servidor: bash deploy.sh $Image"