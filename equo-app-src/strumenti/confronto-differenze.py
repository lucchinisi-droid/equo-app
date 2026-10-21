import sys, os
from PIL import Image, ImageChops
a,b=sys.argv[1],sys.argv[2]; diff=0
for f in sorted(os.listdir(a)):
    pa,pb=os.path.join(a,f),os.path.join(b,f)
    if not os.path.exists(pb): print("MANCA", f); diff+=1; continue
    ia,ib=Image.open(pa).convert('RGB'),Image.open(pb).convert('RGB')
    if ia.size!=ib.size: print("DIMENSIONE DIVERSA", f, ia.size, ib.size); diff+=1; continue
    bb=ImageChops.difference(ia,ib).getbbox()
    if bb: print("DIVERSO", f, bb); diff+=1
print("pagine confrontate:", len(os.listdir(a)), "diverse:", diff)
