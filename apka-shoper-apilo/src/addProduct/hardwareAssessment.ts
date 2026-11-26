import { escapeCopy } from '../templateCopy';

export type Assessment = { key:string; label:string; score:number | null; reason:string };
export const scoreLabel = (score:number | null) => score === null ? 'Brak danych' :
    ['','Słaby wybór','Ograniczone możliwości','Wystarczający','Dobry','Bardzo dobry'][Math.ceil(score / 2)];
export const assessmentTitle = 'Do czego sprawdzi się ten komputer?';
export const assessmentNote = 'Ocena orientacyjna wygenerowana przez AI na podstawie specyfikacji technicznej, a nie testów wydajności.';
const chartStyles = `
.ss-assessment-chart{display:block;width:100%;min-width:0;box-sizing:border-box;container-type:inline-size;font-family:Poppins,Arial,sans-serif;font-weight:400;color:var(--ss-body,#494949);background:#f7f7f7;text-align:left;border-radius:18px}
.ss-assessment-chart .ss-layout{display:grid;grid-template-columns:minmax(0,31%) minmax(0,1fr);align-items:center;gap:5%;padding:36px 32px}
.ss-assessment-chart .ss-intro h2{font-size:var(--ss-title-size,30px);font-weight:var(--ss-title-weight,410);line-height:1.25;color:#313131;margin:0 0 24px;max-width:20ch}
.ss-assessment-chart .ss-intro p{font-size:var(--ss-intro-size,20px);line-height:1.5;margin:0;max-width:40ch;color:var(--ss-body,#494949)}
.ss-assessment-chart .ss-intro .ss-note{margin-top:12px;font-size:13px;color:var(--ss-muted,#6a6a6a)}
.ss-assessment-chart details{margin:0;padding:0;border:0}
.ss-assessment-chart details{--ss-label-width:34%;--ss-gap:14px}
.ss-assessment-chart summary{display:grid;grid-template-columns:minmax(0,var(--ss-label-width)) minmax(0,1fr) 52px;gap:var(--ss-gap);align-items:center}
.ss-assessment-chart summary{min-height:54px;list-style:none;cursor:pointer;font-size:var(--ss-label-size,16px);line-height:1.35}
.ss-assessment-chart summary::-webkit-details-marker{display:none}
.ss-assessment-chart summary:focus-visible{outline:2px solid #4194d9}
.ss-assessment-chart summary:hover .ss-label,.ss-assessment-chart details[open] .ss-label{text-decoration:underline}
.ss-assessment-chart .ss-label{display:flex;align-items:center;justify-content:flex-end;gap:8px;text-align:right;font-weight:var(--ss-label-weight,600);overflow-wrap:anywhere}
.ss-assessment-chart .ss-label::after{content:"";box-sizing:border-box;flex:0 0 8px;height:8px;border:solid currentColor;border-width:0 1.5px 1.5px 0;transform:translateY(-2px) rotate(45deg)}
.ss-assessment-chart details[open]>summary .ss-label::after{transform:translateY(2px) rotate(225deg)}
.ss-assessment-chart .ss-plot{display:block;height:16px;border-radius:12px;background:#e4e6e9}
.ss-assessment-chart .ss-bar{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#92c8ae,#50b4de)}
.ss-assessment-chart .ss-score{font-size:14px;line-height:1.2;font-weight:var(--ss-label-weight,600);color:#313131;font-variant-numeric:tabular-nums;white-space:nowrap}
.ss-assessment-chart .ss-missing{grid-column:span 2}
.ss-assessment-chart .ss-reason{padding:8px 4px 14px;margin:0;font-size:16px;line-height:1.55}
@container (min-width:421px){
 .ss-assessment-chart:not(.ss-gaming) .ss-reason{margin-inline-start:calc(var(--ss-label-width) + var(--ss-gap));padding:0 0 16px;text-align:start}
}
@container (max-width:680px){
 .ss-assessment-chart .ss-layout{grid-template-columns:1fr;gap:20px;padding:22px 16px}
 .ss-assessment-chart .ss-intro h2{margin:0 0 8px;max-width:none;font-size:22px}
}
@container (max-width:420px){
 .ss-assessment-chart summary{grid-template-columns:minmax(0,1fr) 52px}
 .ss-assessment-chart summary{row-gap:4px;padding-top:8px}
 .ss-assessment-chart .ss-label{grid-column:1/-1;justify-content:flex-start;text-align:left}
}`;

export type ChartTheme = 'pc' | 'gaming' | 'laptop-new' | 'damaged-laptop';
const typography: Record<ChartTheme,string> = {
    pc: '',
    'laptop-new': '--ss-title-size:35px;--ss-title-weight:500;--ss-intro-size:16px;--ss-label-size:15px;--ss-label-weight:500;--ss-body:#3c3c3c;--ss-muted:#717171',
    'damaged-laptop': '--ss-title-weight:400;--ss-label-weight:400;--ss-body:#313131;--ss-muted:#717171',
    gaming: '--ss-intro-size:17px;--ss-label-size:15px;--ss-label-weight:300',
};
const gamingStyles = `
.ss-assessment-chart.ss-gaming{border-radius:0;border-top:6px solid;border-image:linear-gradient(90deg,#bcbb26,#524762,#7d2725,#332c2c) 1;background:linear-gradient(90deg,#25251f,#252229 36%,#282223 68%,#202525);color:#e1e0df;font-family:Poppins,Arial,sans-serif}
.ss-gaming .ss-intro h2{color:#d9d9d9;font-weight:300;text-transform:uppercase}
.ss-gaming .ss-intro h2::after{content:"";display:block;width:78px;height:12px;margin-top:20px;background:linear-gradient(30deg,#82817d 49%,transparent 50%) top left/13px 50% repeat-x,linear-gradient(150deg,#82817d 49%,transparent 50%) bottom left/13px 50% repeat-x}
.ss-gaming .ss-intro p,.ss-gaming .ss-reason{color:#e6e6e6;font-weight:300}
.ss-gaming .ss-intro .ss-note{color:#9fbfd0}
.ss-gaming .ss-plot{height:12px;border-radius:0;background:#41494d;mask-image:repeating-linear-gradient(to right,#000 0 calc(10% - 2px),transparent calc(10% - 2px) 10%)}
.ss-gaming .ss-bar{background:linear-gradient(90deg,#649bb0,#66d1ee)}
.ss-gaming .ss-score{color:#f5f4ed;text-align:right;font-weight:500}
.ss-gaming details+details{border-top:1px solid #ffffff12}
.ss-gaming summary:focus-visible{outline-color:#66d1ee}
.g_specBox2 .ss-assessment-chart.ss-gaming{border:0;background:transparent}
.g_specBox2 .ss-gaming .ss-intro h2::after{display:none}
@container (min-width:681px){
 .ss-gaming .ss-layout{padding:36px 50px}
 .ss-gaming summary{grid-template-columns:minmax(0,40%) minmax(0,1fr) 44px}
 .ss-gaming .ss-label{justify-content:space-between;text-align:left}
}
`;
export function assessmentChart(rows:Assessment[], theme:ChartTheme = 'pc') {
    if (!rows.length) return '';
    const gaming = theme === 'gaming';
    return '<div class="ss-assessment-chart'+(gaming?' ss-gaming':'')+'" style="'+typography[theme]+'"><style>'+chartStyles+(gaming?gamingStyles:'')+'</style><div class="ss-layout"><div class="ss-intro"><h2>'+
        assessmentTitle+'</h2><p>Im wyższa ocena, tym lepiej sprzęt pasuje do danego zadania.</p><p class="ss-note">'+assessmentNote+'</p></div><div>'+rows.map(({label,score,reason}) => {
        const value = typeof score === 'number' && Number.isInteger(score) && score >= 1 && score <= 10 ? score : null;
        const bar = value === null ? '<span class="ss-missing">Brak danych</span>' :
            '<span class="ss-plot" aria-hidden="true"><span class="ss-bar" style="width:'+value*10+'%"></span></span> <span class="ss-score">'+value+'/10</span>';
        return '<details><summary><span class="ss-label">'+escapeCopy(label)+'</span> '+bar+
            '</summary><p class="ss-reason">'+
            (value === null ? '' : '<strong>'+value+'/10 · '+scoreLabel(value)+'.</strong> ')+escapeCopy(reason)+'</p></details>';
    }).join('')+'</div></div></div>';
}
export function shoperAssessmentDescription(base:string, rows:Assessment[], include:boolean, theme:ChartTheme = 'pc') {
    if (!include || !rows.length) return base;
    const clean = (base ?? '').replace(/<section class="hardware-assessment"[^>]*>[\s\S]*?<\/section>/g,'');
    const section = formatAssessment(rows,'shoper',theme);
    const slot = '<!--shopsync:gaming-assessment-->';
    if (theme === 'gaming' && clean.includes(slot)) return clean.replace(slot, () => slot + section);
    return clean + section;
}
export function formatAssessment(rows: Assessment[], channel:'shoper'|'allegro', theme:ChartTheme = 'pc') {
    if (!rows.length) return '';
    const title = '<h2>' + assessmentTitle + '</h2><p>' + assessmentNote + '</p>';
    if (channel === 'shoper') return '<section class="hardware-assessment" style="display:block;box-sizing:border-box;width:100%;min-width:0;'+(theme === 'gaming'?'max-width:1200px;margin:0':'max-width:none;margin:24px 0')+';grid-column:1/-1;align-self:stretch;clear:both">' + assessmentChart(rows,theme) + '</section>';
    const items = rows.map(({label,score,reason}) => {
        const mark = score === null ? scoreLabel(null) : score + '/10 · ' + scoreLabel(score);
        return '<p><b>' + escapeCopy(label) + ': ' + mark + '</b></p><p>' + escapeCopy(reason) + '</p>';
    }).join('');
    return title + items;
}
