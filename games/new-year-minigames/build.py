"""Build dist/index.html from src/. Run: python3 build.py"""
import os, subprocess, sys
root = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(root, 'src')
subprocess.run([sys.executable, os.path.join(src, 'levels.py')], check=True, stdout=subprocess.DEVNULL)
levels = open(os.path.join(src, 'levels.json')).read()
engine = open(os.path.join(src, 'engine.js')).read()
tpl = open(os.path.join(src, 'template.html')).read()
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
out = tpl.replace('__LEVELS__', levels).replace('__ENGINE__', engine)
open(os.path.join(root, 'dist', 'index.html'), 'w').write(out)
print('Built dist/index.html (%d bytes)' % len(out))
