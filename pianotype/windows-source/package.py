"""Run after dotnet publish; packages the Windows executable for GitHub Pages."""
from pathlib import Path
import hashlib, json, sys, zipfile
root = Path(__file__).resolve().parent
destination = Path(sys.argv[1])
destination.mkdir(parents=True, exist_ok=True)
archive = destination / 'Pianotype-1.2.1-Windows.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as output:
    for source, name in [(root/'publish/win-x64/Pianotype.exe', 'Pianotype.exe'), (root/'README.md', 'README.txt'), (root/'Assets/CREDITS.txt', 'CREDITS.txt'), (root/'Assets/NAUDIO-LICENSE.txt', 'NAUDIO-LICENSE.txt')]:
        output.write(source, 'Pianotype/' + name)
with zipfile.ZipFile(archive) as output:
    assert output.testzip() is None
checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
checksums = destination/'SHA256SUMS.txt'
lines = checksums.read_text().splitlines() if checksums.exists() else []
checksums.write_text('\n'.join([s for s in lines if archive.name not in s] + [f'{checksum}  {archive.name}']) + '\n')
(destination/'windows-release.json').write_text(json.dumps({'version':'1.2.1','platform':'win-x64','file':archive.name,'bytes':archive.stat().st_size,'sha256':checksum},indent=2)+'\n')
print(f'{archive.name}: {archive.stat().st_size} bytes; SHA-256 {checksum}')
