from pathlib import Path
import hashlib, json, shutil, zipfile
root = Path(__file__).resolve().parents[1]
out = root / 'entrega'
out.mkdir(exist_ok=True)
build = root / 'dist'
assert (build / 'index.html').exists(), 'Execute npm run build antes de empacotar.'
assert '127.0.0.1' not in (build / 'config.js').read_text(), 'Endpoint de teste no build!'
legacy_hosting = out / 'hospedagem'
if legacy_hosting.exists(): shutil.rmtree(legacy_hosting)
shutil.copy2(root / 'google-apps-script/Code.gs', out / 'Code.gs')
shutil.copy2(root / 'google-apps-script/Code.gs', out / 'code.js')
for name in ['PUBLICAR.md', 'ENTREGA-2.0.md', 'exemplo-importacao.csv']:
    shutil.copy2(root / 'docs' / name, out / name)
with zipfile.ZipFile(out / 'hospedagem.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(build.rglob('*')):
        if file.is_file(): archive.write(file, file.relative_to(build))
files = ['Code.gs','code.js','hospedagem.zip','PUBLICAR.md','ENTREGA-2.0.md','exemplo-importacao.csv']
checks = []
for name in files:
    checks.append(f'{hashlib.sha256((out / name).read_bytes()).hexdigest()}  {name}')
(out / 'SHA256SUMS.txt').write_text('\n'.join(checks)+'\n')
with zipfile.ZipFile(out / 'escola-de-saberes-2.0-completo.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for name in files + ['SHA256SUMS.txt']:
        archive.write(out / name, name)
    if (out / 'previa-mobile.png').exists(): archive.write(out / 'previa-mobile.png','previa-mobile.png')
with zipfile.ZipFile(out / 'hospedagem.zip') as archive:
    assert archive.testzip() is None
    assert 'index.html' in archive.namelist() and 'config.js' in archive.namelist()
    assert not any('tests/' in name or name.endswith('.gs') for name in archive.namelist())
print(json.dumps({'release':str(out),'arquivos':[{ 'nome':p.name,'bytes':p.stat().st_size} for p in sorted(out.iterdir()) if p.is_file()]},ensure_ascii=False,indent=2))
