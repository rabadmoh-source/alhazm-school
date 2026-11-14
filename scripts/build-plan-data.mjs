import fs from 'node:fs';

// Preserve the previously published plan records, which include historic statuses.
// This exporter never mutates those records or their browser storage key.
const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const encoded = html.match(/id="embedded-plan">([^<]+)/)?.[1];
if (!encoded) throw new Error('Existing plan source was not found');
const old = Buffer.from(encoded, 'base64').toString('utf8');
const match = old.match(/const SEED=(\[[\s\S]*?\]),GOALS=(\[[\s\S]*?\]);const MONTHS=/);
if (!match) throw new Error('Existing plan data structure changed');
const procedures = JSON.parse(match[1]);
const goals = JSON.parse(match[2]);

const addedGoal = {
  id: '18', area: 'القيادة والإدارة والحوكمة',
  name: 'تطوير كفاءة العمليات الإدارية والإشرافية من خلال توظيف الأنظمة الرقمية في المتابعة والتوثيق وقياس الأداء المدرسي.',
  indicator: 'تمكّن 80% من أعضاء الهيئة الإدارية والتدريسية المستهدفين من توظيف الأنظمة الرقمية في عمليات المتابعة والتوثيق، بما يسهم في تحسين كفاءة الأداء المدرسي خلال العام الدراسي 2026/2027م.'
};

const additions = [
  { task: 'تفعيل «بوابة الحزم الرقمية الموحدة» لتنظيم ومتابعة العمليات الإدارية والإشرافية وتوثيقها إلكترونيًا.', owner: 'مديرة المدرسة', category: 'projects', start: '2026-10-19', end: '2027-05-07' },
  { task: 'توظيف أدوات رقمية لتحليل مؤشرات الأداء المدرسي وإعداد تقارير دورية تدعم اتخاذ القرارات التطويرية.', owner: 'فريق التقويم الذاتي', category: 'projects', start: '2026-11-03', end: '2027-01-27' },
  { task: 'تنفيذ برامج تدريبية وتطبيقية لتنمية مهارات الهيئة الإدارية والتدريسية في استخدام الأنظمة الرقمية وتوظيفها في تحسين كفاءة العمل المدرسي.', owner: 'فريق الإنماء المهني', category: 'development' }
];

function classify(s) {
  if (/إنماء|تدريب|ورشة|دورة|تبادل زيارات|مشغل|مجتمع تعلم|تطوير مهني/i.test(s)) return 'development';
  if (/مبادرة/i.test(s)) return 'initiatives';
  if (/مشروع|فعالي|مسابقة|معرض|برنامج|احتفال|ملتقى|حملة|إذاعة|ندوة|لقاء|تكريم/i.test(s)) return 'projects';
  return null;
}

const renumber = id => /^\d+$/.test(String(id)) && Number(id) >= 18 ? String(Number(id) + 1) : String(id || '');
const rows = procedures.map(p => ({
  id: 'old-' + p.id,
  title: p.task,
  owner: p.owner || '',
  area: p.area || '',
  goal: p.goal ? renumber(p.goal) : '',
  category: classify(p.task),
  previousStatus: p.status || '',
  previousNotes: p.notes || '',
  months: p.months || [],
  source: 'previous-plan'
}));
for (let i = 0; i < additions.length; i++) {
  const row = additions[i];
  rows.push({ id: 'new-18-' + (i + 1), title: row.task, owner: row.owner,
    area: addedGoal.area, goal: addedGoal.id, category: row.category,
    previousStatus: '', previousNotes: '', months: [], start: row.start || '',
    end: row.end || '', source: 'updated-plan' });
}
const output = { schoolYear: '2026/2027', updatedPlan: 'school-plan-2026-2027.pdf',
  goals: [...goals.map(g => ({...g, id:renumber(g.id)})), addedGoal].sort((a,b)=>Number(a.id)-Number(b.id)), rows,
  notice: 'السجلات السابقة محفوظة من النسخة القديمة، وتُراجع مقابل ملف الخطة المعتمد عند تحديثها.' };
fs.writeFileSync(new URL('school-plan-data.json', root), JSON.stringify(output, null, 2));
console.log(`Prepared ${rows.length} records and ${output.goals.length} goals`);
