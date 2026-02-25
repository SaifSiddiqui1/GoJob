const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = ['client', 'server', '.'];
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.env'];

function walkAndReplace(dir) {
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const fullPath = path.join(dir, file);

        if (fs.statSync(fullPath).isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                walkAndReplace(fullPath);
            }
        } else {
            // Only process text files like .js, .jsx, .json, .md, .html, .yaml
            if (!file.match(/\.(js|jsx|json|md|html|yaml|yml|txt|example)$/i)) return;

            let originalContent = fs.readFileSync(fullPath, 'utf8');
            let content = originalContent;

            // Preserve casing:
            // 1. "JobVault" -> "JobVault"
            content = content.replace(/JobVault/g, 'JobVault');
            // 2. "jobvault" -> "jobvault"
            content = content.replace(/jobvault/g, 'jobvault');
            // 3. "JOBVAULT" -> "JOBVAULT"
            content = content.replace(/JOBVAULT/g, 'JOBVAULT');

            if (originalContent !== content) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    });
}

DIRECTORIES_TO_SCAN.forEach(dir => {
    let p = path.join(__dirname, dir);
    if (fs.existsSync(p)) {
        walkAndReplace(p);
    }
});
