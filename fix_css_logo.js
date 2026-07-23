const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'services', 'user-service', 'src', 'modules', 'email', 'templates');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.hbs'));

const newLogoHtml = `                <!-- Premium CSS Logo -->
                <div style="margin-bottom: 25px; text-align: center;">
                    <div style="display: inline-block; width: 72px; height: 72px; background: rgba(255, 255, 255, 0.15); border: 2px solid rgba(255, 255, 255, 0.4); border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); position: relative; text-align: center; line-height: 72px;">
                        <span style="font-size: 38px; vertical-align: middle;">🛍️</span>
                        <div style="position: absolute; top: -4px; right: -4px; width: 14px; height: 14px; background: #fbbf24; border-radius: 50%; box-shadow: 0 0 10px rgba(251, 191, 36, 0.8);"></div>
                    </div>
                </div>
                <div style="font-size: 36px; font-weight: 900; letter-spacing: -1.5px; color: #ffffff; font-family: 'Outfit', sans-serif; margin-bottom: 15px; text-align: center;">
                    Micro<span style="color: #a5b4fc;">Cart</span><span style="color: #fbbf24;">.</span>
                </div>`;

const newLogoHtmlForOrderStatus = `                <!-- Premium CSS Logo -->
                <div style="margin-bottom: 25px; text-align: center;">
                    <div style="display: inline-block; width: 72px; height: 72px; background: rgba(255, 255, 255, 0.15); border: 2px solid rgba(255, 255, 255, 0.4); border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); position: relative; text-align: center; line-height: 72px;">
                        <span style="font-size: 38px; vertical-align: middle;">🛍️</span>
                        <div style="position: absolute; top: -4px; right: -4px; width: 14px; height: 14px; background: #fbbf24; border-radius: 50%; box-shadow: 0 0 10px rgba(251, 191, 36, 0.8);"></div>
                    </div>
                </div>
                <div style="font-size: 36px; font-weight: 900; letter-spacing: -1.5px; color: #ffffff; font-family: 'Outfit', sans-serif; margin-bottom: 15px; text-align: center;">
                    Micro<span style="color: #a5b4fc;">Cart</span><span style="color: #fbbf24;">.</span>
                </div>
                <span class="status-icon">`;

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    const regex1 = /<div style="margin-bottom: 15px; text-align: center;">\s*<img src=".*?" alt="MicroCart Logo" style=".*?" \/>\s*<\/div>\s*<span class="logo">Micro<span>Cart<\/span><\/span>/g;
    
    const regex2 = /<div style="margin-bottom: 15px; text-align: center;">\s*<img src=".*?" alt="MicroCart Logo" style=".*?" \/>\s*<\/div>\s*<span class="status-icon">/g;
    
    let updated = false;
    
    if (regex1.test(content)) {
        content = content.replace(regex1, newLogoHtml);
        updated = true;
    }
    
    if (regex2.test(content)) {
        content = content.replace(regex2, newLogoHtmlForOrderStatus);
        updated = true;
    }
    
    if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file}`);
    } else {
        console.log(`Skipped ${file} (already updated or no match)`);
    }
}
console.log('Done');
