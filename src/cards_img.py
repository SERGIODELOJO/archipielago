import os,sys
from PIL import Image
src='/mnt/project-files/juegos/cartas/arte';dst=sys.argv[1]+'/cartas/arte';os.makedirs(dst,exist_ok=True)
for f in sorted(os.listdir(src)):
    if not f.endswith('.png'):continue
    im=Image.open(os.path.join(src,f)).convert('RGB');im=im.resize((400,600),Image.LANCZOS)
    im.save(os.path.join(dst,f[:-4]+'.jpg'),quality=82,optimize=True,progressive=True)
print(len(os.listdir(dst)),sum(os.path.getsize(os.path.join(dst,x)) for x in os.listdir(dst))//1024,'KB')
