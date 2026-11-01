"""从 Markdown 记录生成前端数据：python3 scripts/build.py。"""
import json,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
entries=[]
for file in sorted((root/'entries').glob('*.md')):
    content=file.read_text()
    def field(name):
        m=re.search(r'\*\*'+re.escape(name)+r'\*\*：([^\n]+)',content)
        return m.group(1).strip() if m else ''
    title=re.search(r'^#\s+(.+)',content,re.M)
    photo=re.search(r'!\[[^\]]*\]\(\.\./([^\)]+)\)',content)
    quote=re.findall(r'^>\s?(.*)',content,re.M)
    entries.append(dict(id=file.stem,title=title.group(1).split('·',1)[-1].strip() if title else file.stem,category=field('类别'),date=field('记录日期').split('（')[0],quote=' '.join(quote),image=photo.group(1) if photo else '',source=str(file.relative_to(root)),sweetness=field('甜度感受'),flavor=field('味道特点')))
(root/'data.js').write_text('window.DIARY_ENTRIES = '+json.dumps(entries,ensure_ascii=False,indent=2)+';\n')
print(f'已生成 {len(entries)} 条记录')
