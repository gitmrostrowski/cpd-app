# Optional cleanup after copying the release over an older checkout.
# Removes only archived, byte-identical prototype files; never directories.
$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (!(Test-Path -LiteralPath (Join-Path $repoRoot 'app/page.tsx'))) { throw 'Uruchom skrypt z kompletnego repo CRPE.' }
$pairs = @{
  'app/home-v14-source.css' = 'design/home-v14/prototype.css'
  'public/home/v14/crpe-hero-lekarka.png' = 'design/home-v14/crpe-hero-lekarka.png'
  'public/home/v14/crpe-certyfikat-tablet.png' = 'design/home-v14/crpe-certyfikat-tablet.png'
  'public/home/v14/crpe-certyfikat-tablet.webp' = 'design/home-v14/crpe-certyfikat-tablet.webp'
  'public/home/v14/rola-medyk.png' = 'design/home-v14/rola-medyk.png'
  'public/home/v14/rola-placowka.png' = 'design/home-v14/rola-placowka.png'
  'public/home/v14/rola-organizator.png' = 'design/home-v14/rola-organizator.png'
}
foreach ($entry in $pairs.GetEnumerator()) {
  $oldFile = [IO.Path]::GetFullPath((Join-Path $repoRoot $entry.Key))
  $archive = [IO.Path]::GetFullPath((Join-Path $repoRoot $entry.Value))
  if (!$oldFile.StartsWith($repoRoot + [IO.Path]::DirectorySeparatorChar)) { throw 'Niepoprawna sciezka.' }
  if (!(Test-Path -LiteralPath $oldFile -PathType Leaf)) { continue }
  if (!(Test-Path -LiteralPath $archive -PathType Leaf)) { throw "Brak kopii: $archive" }
  if ((Get-FileHash -LiteralPath $oldFile).Hash -ne (Get-FileHash -LiteralPath $archive).Hash) {
    Write-Warning "Pominieto zmodyfikowany plik: $oldFile"
    continue
  }
  Remove-Item -LiteralPath $oldFile
  Write-Output "Usunieto duplikat: $($entry.Key)"
}
