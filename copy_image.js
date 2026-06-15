const fs = require('fs');
fs.mkdirSync('Frontend/public/images', { recursive: true });
fs.copyFileSync('C:/Users/Vaishnavi/.gemini/antigravity/brain/2ffbd483-27e2-4198-8882-1336ba590ffe/indian_dresses_hero_1777449752542.png', 'Frontend/public/images/hero-indian.png');
console.log('Image copied successfully!');
