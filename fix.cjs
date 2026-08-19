const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src/pages/admin');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
let totalReplaced = 0;

const replacements = [
    { regex: /bg-white\s+p-4\s+rounded-xl\s+border\s+border-slate-200\s+shadow-sm/g, replace: 'card' },
    { regex: /bg-white\s+rounded-xl\s+border\s+border-slate-200\s+shadow-sm/g, replace: 'card p-0' },
    { regex: /bg-white\s+rounded-lg\s+shadow-sm\s+border\s+border-slate-200\s+p-4/g, replace: 'card' },
    { regex: /bg-white\s+rounded-lg\s+shadow-sm\s+border\s+border-slate-200/g, replace: 'card p-0' },
    { regex: /text-slate-[45]00/g, replace: 'text-muted' },
    { regex: /w-full/g, replace: 'full-width' },
    { regex: /max-w-7xl/g, replace: 'max-w-7xl' },
    { regex: /bg-slate-50/g, replace: 'bg-surface-alt' },
];

files.forEach(f => {
    let content = fs.readFileSync(path.join(dir, f), 'utf8');
    let original = content;
    
    replacements.forEach(r => {
        content = content.replace(r.regex, r.replace);
    });
    
    if(original !== content) {
        fs.writeFileSync(path.join(dir, f), content, 'utf8');
        console.log('Updated ' + f);
        totalReplaced++;
    }
});
console.log('Total files updated: ' + totalReplaced);
