import sharp from 'sharp';
import fs from 'fs';

const svgLogo = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <!-- Translate the 500x500 hand-drawn logo content to be perfectly centered inside the 1200x630 canvas -->
  <g transform="translate(350, 65)">
    <!-- Group for hand-drawn logo sketch -->
    <g stroke="#537293" fill="none" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
      
      <!-- PINO Text outlines (sketched style) -->
      <!-- 'P' -->
      <path d="M 148 178 C 147 200 146 225 145 248" />
      <path d="M 145 178 C 172 173 186 186 182 204 C 178 219 155 219 145 218" />
      
      <!-- 'I' -->
      <path d="M 218 178 C 217 200 216 225 215 248" />
      
      <!-- 'N' -->
      <path d="M 248 178 C 247 200 246 225 245 248" />
      <path d="M 248 181 C 268 204 286 226 295 246" />
      <path d="M 296 178 C 295 200 294 225 293 248" />
      
      <!-- Button 'O' -->
      <circle cx="355" cy="213" r="36" stroke-width="12" />
      <!-- Stitched-line inner circle -->
      <circle cx="355" cy="213" r="24" stroke-width="3" stroke-dasharray="6,5" />
      <!-- Button holes -->
      <circle cx="346" cy="204" r="4.5" fill="#537293" stroke="none" />
      <circle cx="364" cy="204" r="4.5" fill="#537293" stroke="none" />
      <circle cx="346" cy="222" r="4.5" fill="#537293" stroke="none" />
      <circle cx="364" cy="222" r="4.5" fill="#537293" stroke="none" />

      <!-- Korean word '공방' (Hand-sketched style) -->
      <!-- '공' -->
      <!-- ㄱ -->
      <path d="M 198 290 Q 220 290 220 300 Q 220 308 208 312" stroke-width="11" />
      <!-- ㅗ -->
      <path d="M 211 312 L 211 320" stroke-width="11" />
      <path d="M 193 322 L 233 322" stroke-width="11" />
      <!-- ㅇ -->
      <circle cx="213" cy="340" r="14" stroke-width="11" />

      <!-- '방' -->
      <!-- ㅂ -->
      <path d="M 255 290 L 255 326" stroke-width="11" />
      <path d="M 275 290 L 275 326" stroke-width="11" />
      <path d="M 255 304 L 275 304" stroke-width="11" />
      <path d="M 255 318 L 275 318" stroke-width="11" />
      <!-- ㅏ -->
      <path d="M 292 284 L 292 328" stroke-width="11" />
      <path d="M 292 304 L 302 304" stroke-width="11" />
      <!-- ㅇ -->
      <circle cx="277" cy="344" r="14" stroke-width="11" />

      <!-- Left Mushroom -->
      <!-- Cap -->
      <path d="M 112 334 C 112 290 170 290 170 334 Q 160 344 141 340 Q 122 336 112 334 Z" stroke-width="10" />
      <!-- Gills -->
      <path d="M 126 333 L 126 341" stroke-width="4.5" />
      <path d="M 134 334 L 134 345" stroke-width="4.5" />
      <path d="M 142 334 L 142 344" stroke-width="4.5" />
      <path d="M 150 334 L 150 342" stroke-width="4.5" />
      <path d="M 158 333 L 158 339" stroke-width="4.5" />
      <!-- Stalk -->
      <path d="M 132 342 C 132 374 117 394 147 399 C 157 399 152 374 152 342" stroke-width="10" />

      <!-- Right Mushroom 1 (Medium) -->
      <!-- Cap -->
      <path d="M 314 330 C 314 290 368 290 368 330 Q 358 340 341 336 Q 324 332 314 330 Z" stroke-width="10" />
      <!-- Gills -->
      <path d="M 326 329 L 326 337" stroke-width="4.5" />
      <path d="M 334 330 L 334 341" stroke-width="4.5" />
      <path d="M 342 330 L 342 340" stroke-width="4.5" />
      <path d="M 350 330 L 350 338" stroke-width="4.5" />
      <!-- Stalk -->
      <path d="M 334 338 C 334 370 329 385 349 388 C 359 388 352 370 352 338" stroke-width="10" />

      <!-- Right Mushroom 2 (Small) -->
      <!-- Cap -->
      <path d="M 372 342 C 372 310 412 310 412 342 Q 402 350 392 347 Q 382 344 372 342 Z" stroke-width="8" />
      <!-- Stalk -->
      <path d="M 387 347 C 387 367 382 377 397 379 C 404 379 400 367 400 347" stroke-width="8" />
    </g>
  </g>
  
  <!-- Instagram Handle centered in bottom safe area or right-aligned beautifully -->
  <text x="1150" y="580" font-family="'Nanum Pen Script', 'Comic Sans MS', cursive, sans-serif" font-size="28" font-weight="bold" fill="#537293" text-anchor="end">@mushroom.pino</text>
</svg>
`;

async function main() {
  try {
    const bg = sharp('/tmp/bg.jpg');
    
    // Composite the SVG onto the 1200x630 background
    const outputBuffer = await bg
      .composite([
        {
          input: Buffer.from(svgLogo),
          blend: 'over'
        }
      ])
      .jpeg({ quality: 95 })
      .toBuffer();
      
    // Write to public folder
    fs.writeFileSync('./public/og-image.jpg', outputBuffer);
    console.log('Successfully generated public/og-image.jpg');
    
    // If dist folder exists, copy it there as well
    if (fs.existsSync('./dist')) {
      fs.writeFileSync('./dist/og-image.jpg', outputBuffer);
      console.log('Successfully copied to dist/og-image.jpg');
    }
  } catch (err) {
    console.error('Error generating image:', err);
    process.exit(1);
  }
}

main();
