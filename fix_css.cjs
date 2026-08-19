const fs = require('fs');
const path = require('path');

const dirs = ['src/pages', 'src/components'];
const replacements = {
    'var(--color-gray-50)': 'var(--color-slate-50)',
    'var(--color-gray-100)': 'var(--color-slate-100)',
    'var(--color-gray-200)': 'var(--color-border)',
    'var(--color-gray-300)': 'var(--color-slate-300)',
    'var(--color-gray-400)': 'var(--color-slate-400)',
    'var(--color-gray-500)': 'var(--color-slate-500)',
    'var(--color-gray-600)': 'var(--color-slate-600)',
    'var(--color-gray-700)': 'var(--color-slate-700)',
    'var(--color-gray-800)': 'var(--color-slate-800)',
    'var(--color-gray-900)': 'var(--color-slate-900)'
};

let count = 0;
dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) return;
    const files = fs.readdirSync(fullPath);
    files.forEach(file => {
        if (file.endsWith('.css')) {
            const filePath = path.join(fullPath, file);
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            for (const [key, value] of Object.entries(replacements)) {
                if (content.includes(key)) {
                    content = content.split(key).join(value);
                    modified = true;
                }
            }
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Updated ${file}`);
                count++;
            }
        }
    });
});
console.log('Total files updated: ' + count);
