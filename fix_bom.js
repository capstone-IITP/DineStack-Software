const fs = require('fs');

function stripBom(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Strip BOM if present
        const newContent = content.replace(/^\uFEFF/, '');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Stripped BOM from ${filePath}`);
    } catch (e) {
        console.error(`Error processing ${filePath}:`, e);
    }
}

stripBom('backend/server.ts');
stripBom('backend/prisma/schema.prisma');
