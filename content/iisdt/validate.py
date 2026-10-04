"""Structural checks for authored IISDT-aligned courses. Run: python3 content/iisdt/validate.py"""
import sys,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]; sys.path.insert(0,str(ROOT/'content')); sys.path.insert(0,str(ROOT/'content/source'))
from clusters import C
BUILTIN={'notebook','web','data','prompt','flow','api','design','board','budget','json','contrast'}
EXTERNAL={'canva','figma','capcut','adobe','blender','chatgpt','claude','huggingface','ollama','opencode','replit','lovable','github','vscode','render','vercel','godaddy','hostinger','cloudflare','supabase','n8n','make','zapier','notion','sheets','bitwarden','gumroad','stripe'}
def load():
    import importlib,pkgutil,iisdt
    out=[]
    for m in sorted(pkgutil.iter_modules(iisdt.__path__),key=lambda m:m.name):
        if m.name in('validate',):continue
        out+=importlib.import_module('iisdt.'+m.name).COURSES
    return out
def check(courses=None,expect_all=False):
    courses=courses or load(); errs=[]; ids=set(); clusters={c[0]:c for c in C}
    for c in courses:
        i=c['id']
        if i in ids:errs.append(f'{i}: duplicate');continue
        ids.add(i)
        if i not in clusters:errs.append(f'{i}: not in clusters');continue
        if len(c['nodes'])!=4:errs.append(f'{i}: need 4 diagram nodes')
        if len(c['modules'])!=5:errs.append(f'{i}: need 5 module titles')
        if c['tool'] not in BUILTIN:errs.append(f"{i}: tool {c['tool']}")
        for t in c['tools']:
            if t not in BUILTIN|EXTERNAL:errs.append(f'{i}: unknown tool {t}')
        if len(c['summary'])<50 or len(c['summary'])>260:errs.append(f'{i}: summary length {len(c["summary"])}')
        rows=c['rows'].strip().split('\n')
        if len(rows)!=10:errs.append(f'{i}: {len(rows)} rows');continue
        titles=set()
        for n,r in enumerate(rows,1):
            p=r.split('|')
            if len(p) not in(5,6):errs.append(f'{i}#{n}: {len(p)} fields');continue
            title,principle,task,crit,ex=p[:5]
            if title in titles:errs.append(f'{i}#{n}: duplicate title')
            titles.add(title)
            if len(crit.split(';'))!=3 or any(len(x.strip())<4 for x in crit.split(';')):errs.append(f'{i}#{n}: criteria must be 3 items')
            if len(ex)<=60:errs.append(f'{i}#{n}: example too short')
            if len(principle)<60 or len(task)<80:errs.append(f'{i}#{n}: thin principle/task')
            if len(p)==6 and p[5] not in BUILTIN:errs.append(f'{i}#{n}: tool override {p[5]}')
            if not re.search(r'fictional|imaginary|invented|case rules|practice only',task):errs.append(f'{i}#{n}: task must state fictional or practice data')
        s=c['src']
        if len(s['modules'])!=6:errs.append(f'{i}: src modules {len(s["modules"])}')
    if expect_all:
        miss=set(clusters)-ids
        if miss:errs.append('missing courses: '+', '.join(sorted(miss)))
    return errs
if __name__=='__main__':
    e=check(expect_all='--all' in sys.argv)
    print('\n'.join(e) if e else 'OK',len(load()),'courses')
    sys.exit(1 if e else 0)
