const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'services', 'user-service', 'src', 'modules', 'email', 'templates');
const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.hbs'));

const logoHtml = `
                <div style="margin-bottom: 15px; text-align: center;">
                    <img src="http://localhost:3000/logo.png" alt="MicroCart Logo" style="height: 50px; width: auto; display: inline-block;" />
                </div>
`;

for (const file of files) {
  const filePath = path.join(templatesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('<span class="logo">Micro<span>Cart</span></span>')) {
    content = content.replace('<span class="logo">Micro<span>Cart</span></span>', logoHtml + '                <span class="logo">Micro<span>Cart</span></span>');
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  } else if (file === 'order-status-update.hbs') {
    // Add inside header for order-status-update
    if (!content.includes('logo.png')) {
       content = content.replace('<span class="status-icon">', logoHtml + '                <span class="status-icon">');
       fs.writeFileSync(filePath, content);
       console.log(`Updated ${file}`);
    }
  } else if (!content.includes('logo.png')) {
      // generic fallback
      if (content.includes('<div class="header">')) {
         content = content.replace('<div class="header">', '<div class="header">\n' + logoHtml);
         fs.writeFileSync(filePath, content);
         console.log(`Updated fallback ${file}`);
      }
  }
}
console.log('Done');
