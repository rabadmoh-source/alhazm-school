#!/usr/bin/env python3
"""Check Noor addition is strictly additive. Run from repository root after checkout."""
from pathlib import Path
import base64,re,subprocess,sys

new=Path("index.html").read_text(encoding="utf-8")
old=subprocess.check_output(["git","show","origin/main:index.html"],text=True,encoding="utf-8")
service="{id:'noor',icon:'🔭',name:'مرصد نور',desc:'متابعة التحضير الإلكتروني والأنشطة الداعمة وسجل الدرجات بألوان الإنجاز.',tags:['admin'],active:true}"
assert new.count(service)==1, "Noor service card missing or duplicated"
assert new.count("id=\"embedded-noor\"")==1, "Noor embedded code missing or duplicated"
m=re.search(r'<script type="text/plain" id="embedded-noor">([^<]+)</script>\s*',new)
assert m, "Noor module missing"
decoded=base64.b64decode(m.group(1)).decode("utf-8")
for term in ("مرصد نور","التحضير","سجل الدرجات"):
    assert term in decoded, "Noor module text missing: "+term
without=new.replace(m.group(0),"")
without=without.replace("quality:document.getElementById('embedded-quality').textContent.trim(),noor:document.getElementById('embedded-noor').textContent.trim()","quality:document.getElementById('embedded-quality').textContent.trim()")
without=without.replace(",\n"+service,"")
assert without==old,"Unexpected change to original portal; do not merge"
assert len(re.findall(r'<script type="text/plain" id="embedded-[a-z]+">',new))==10
assert len(re.findall(r'<script type="text/plain" id="embedded-[a-z]+">',old))==9
print("PASS: Noor is additive; all 9 existing modules unchanged. Does NOT verify production access control.")
