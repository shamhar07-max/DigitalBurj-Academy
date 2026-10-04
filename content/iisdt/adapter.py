"""Turns the authored subject-area course files into inputs for build_atlas.py.

Only the subject area, programme codes, durations, eligibility and module headings of the
listings are recorded as provenance. Recipes, examples and summaries are original work.
"""
import json,pkgutil,importlib
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
import sys
sys.path.insert(0,str(ROOT/'content/source'))
from clusters import C
from . import validate
NOTICE_SAFETY='Theory and planning using fictional cases. Hands-on work in this field needs supervised training from a licensed or accredited provider. This course does not certify competence or legal authority to practise.'
NOTICES={
'Safety, fire & environment':NOTICE_SAFETY,
'Technical trades':NOTICE_SAFETY,
'Yoga, fitness & wellbeing':'Educational practice with fictional cases. It is not medical advice and does not replace a doctor or a supervised, qualified teacher. Practise hands-on skills only under qualified supervision.',
'Beauty & personal care':'Planning and theory with fictional cases. Hands-on client services need supervised practice and any licence required where you work.',
'Traditional & cultural studies':'Studied as cultural and symbolic traditions using fictional cases. No outcome is guaranteed, and nothing here replaces medical, legal, financial or mental health advice. Learn ritual and chanting practice with a qualified teacher.',
'Accounting & finance':'Educational practice with fictional data. It is not licensed financial, tax, audit or investment advice.',
'Law, governance & society':'Educational overview using fictional cases. It is not legal advice.',
}
OVERRIDES={
'counselling':'Communication principles with fictional cases. Counselling practice needs supervised training and professional registration where required.',
'healthcare-administration':'Administration practice with fictional records. It is not clinical advice.',
'health-family-welfare':'Public-health education using fictional cases. It is not medical advice.',
'cooking-baking':'Practise food handling under supervision and follow the food-safety licensing that applies where you work.',
'fitness-training':'Educational practice with fictional cases. It is not medical advice. Screen real clients and refer health concerns to a qualified professional.',
'weight-management':'Educational practice with fictional cases. It is not medical or dietetic advice. Refer health concerns to a qualified professional.',
}
def courses():
 out={}
 for m in pkgutil.iter_modules([str(HERE)]):
  if m.name in('validate','adapter'):continue
  for c in importlib.import_module('iisdt.'+m.name).COURSES:out[c['id']]=c
 errs=validate.check(list(out.values()),expect_all=True)
 if errs:raise SystemExit('Invalid subject-area courses:\n'+'\n'.join(errs))
 return out
def build():
 """Returns tracks, examples, modules, tools, diagrams, category, notice, aliases and provenance."""
 by=courses(); catalogue={e['url'].rstrip('/').split('/')[-1]:e for e in json.load(open(ROOT/'content/source/iisdt-catalogue.json'))}
 tracks,examples,modules,tools,diagrams,category,tool_for,notice,aliases,provenance=[],{},{},{},{},{},{},{},{},[]
 for cid,title,cat,slugs in C:
  c=by[cid]; rows=c['rows'].strip()
  tracks.append((cid,title,c['summary'],c['icon'],None,False,rows))
  examples[cid]='\n'.join(r.split('|')[4] for r in rows.splitlines()); modules[cid]=c['modules']; tools[cid]=c['tools']; diagrams[cid]=c['nodes']
  category[cid]=cat; tool_for[cid]=c['tool']
  if NOTICES.get(cat) or OVERRIDES.get(cid):notice[cid]=OVERRIDES.get(cid) or NOTICES[cat]
  listings=[catalogue[s] for s in slugs.split()]
  names=[]
  for e in listings:
   n=e['title'].strip()
   if n.lower()!=title.lower() and n not in names:names.append(n)
  aliases[cid]=names[:12]
  s=c['src']
  provenance.append({'id':cid,'title':title,'category':cat,'listings':[{'title':e['title'],'url':e['url']} for e in listings],'reference':{'url':'https://iisdt.in/product/'+s['page']+'/','code':s['code'],'duration':s['duration'],'eligibility':s['eligibility'],'moduleHeadings':s['modules']}})
 return dict(tracks=tracks,examples=examples,modules=modules,tools=tools,diagrams=diagrams,category=category,tool_for=tool_for,notice=notice,aliases=aliases,provenance=provenance)
