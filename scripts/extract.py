"""Extract supplied source files without rewriting their wording. Python stdlib + pdftotext."""
import hashlib,json,re,subprocess,sys,zipfile
import xml.etree.ElementTree as E
from pathlib import Path

pdf,xlsx=map(Path,sys.argv[1:3])
text=subprocess.check_output(['pdftotext','-layout',str(pdf),'-']).decode().replace('\f','\n')
norm=lambda s:' '.join(s.split())
questions={int(m[1]):norm(m[2]) for m in re.finditer(r'(?m)^(\d{2})\.\s+(.*?)(?=\n\d{2}\. |\n\s*Блок |\n\s*Ключ\.|\Z)',text,re.S)}
titles={int(m[1]):norm(m[2]) for m in re.finditer(r'Блок (\d)\.\s+(.*?)(?=\n\d{2}\. )',text,re.S)}
assert len(questions)==56 and len(titles)==7
names=['Доводчик','Координатор','Творец','Генератор идей','Разведчик','Эксперт','Дипломат','Исполнитель']
role_text={m[1]:norm(m[0]) for m in re.finditer(r'(?m)^(Координатор|Творец|Генератор идей|Эксперт|Исполнитель|Разведчик|Дипломат|Доводчик)\s+\([^\n]*?\).*?(?=\n(?:Координатор|Творец|Генератор идей|Эксперт|Исполнитель|Разведчик|Дипломат|Доводчик)\s+\(|\Z)',text,re.S)}
assert len(role_text)==8
# Independently transcribed from the image of the PDF key, page 4.
key=[[16,13,15,12,10,17,11,14],[20,21,24,26,22,23,25,27],[37,30,32,33,35,36,34,31],[43,47,41,44,46,42,40,45],[51,55,53,57,54,50,52,56],[65,62,66,60,67,64,61,63],[74,76,70,75,73,71,77,72]]
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
fixture=[];differences=[];verified=0
with zipfile.ZipFile(xlsx) as z:
 strings=[''.join(n.itertext()) for n in E.fromstring(z.read('xl/sharedStrings.xml'))]
 for b in range(1,8):
  cells={c.get('r'):c for c in E.fromstring(z.read(f'xl/worksheets/sheet{b}.xml')).findall('.//m:c',ns)}
  row=[]
  for q in range(8):
   no=b*10+q;c=cells[f'A{q+3}'];original=strings[int(c.find('m:v',ns).text)]
   if norm(original[4:])!=questions[no]:differences.append(no)
   val=cells.get(f'B{q+3}');v=val.find('m:v',ns) if val is not None else None
   row.append(int(v.text) if v is not None else 0)
  fixture.append(row)
 assert differences==[13],differences
 for c in E.fromstring(z.read('xl/worksheets/sheet8.xml')).findall('.//m:c',ns):
  f=c.find('m:f',ns)
  if f is None:continue
  m=re.fullmatch(r'Блок_(\d)!B(\d+)',f.text)
  if not m:continue
  b,r=map(int,m.groups());col=ord(c.get('r')[0])-ord('B')
  assert key[b-1][col]==b*10+r-3
  verified+=1
assert verified==56
data={'version':1,'intro':norm(text.split('Инструкция.')[0]),'instruction':norm(text.split('Инструкция.')[1].split('Вопросы к тесту Белбина.')[0]),'blocks':[{'title':titles[b],'questions':[{'id':b*10+q,'text':questions[b*10+q]} for q in range(8)]} for b in range(1,8)],'roles':[{'name':n,'description':role_text[n]} for n in names],'key':key,'source':{'url':'https://drive.google.com/file/d/1quFSD4G7Qun2iRBbZ8xVw_5J2XpLscAJ/view','pdfSha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'xlsxSha256':hashlib.sha256(xlsx.read_bytes()).hexdigest()},'fixture':{'answers':fixture}}
out=Path(__file__).resolve().parents[1]/'src/data.json';out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Extracted: 56 questions, 7 titles, 8 descriptions. Verified: 56 Excel key references. Only statement difference: final dot in #13.')
