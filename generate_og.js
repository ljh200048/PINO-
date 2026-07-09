import sharp from 'sharp';
import fs from 'fs';

const svgLogo = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Import beautiful handwriting and round fonts for the subtitles -->
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Gowun+Dodum&amp;family=Nanum+Pen+Script&amp;display=swap');
      .sub-text {
        font-family: 'Gowun Dodum', 'Nanum Pen Script', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
        font-weight: 800;
        fill: #345171;
      }
      .insta-text {
        font-family: 'Gowun Dodum', 'Nanum Pen Script', sans-serif;
        font-weight: 700;
        fill: #345171;
        letter-spacing: 0.5px;
      }
    </style>
  </defs>

  <!-- Centered container group with scaling and translation to center inside 1200x630 -->
  <g transform="translate(350, 45) scale(1.05)">
    <!-- Group for hand-drawn logo sketch -->
    <g stroke="#345171" fill="none" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
      
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
      <circle cx="346" cy="204" r="4.5" fill="#345171" stroke="none" />
      <circle cx="364" cy="204" r="4.5" fill="#345171" stroke="none" />
      <circle cx="346" cy="222" r="4.5" fill="#345171" stroke="none" />
      <circle cx="364" cy="222" r="4.5" fill="#345171" stroke="none" />

      <!-- Korean word '공방' (Hand-sketched style) -->
      <!-- '공' -->
      <!-- ㄱ -->
      <path d="M 198 290 Q 220 290 220 300 Q 220 308 208 312" stroke-width="12" />
      <!-- ㅗ -->
      <path d="M 211 312 L 211 320" stroke-width="12" />
      <path d="M 193 322 L 233 322" stroke-width="12" />
      <!-- ㅇ -->
      <circle cx="213" cy="340" r="14" stroke-width="12" />

      <!-- '방' -->
      <!-- ㅂ -->
      <path d="M 255 290 L 255 326" stroke-width="12" />
      <path d="M 275 290 L 275 326" stroke-width="12" />
      <path d="M 255 304 L 275 304" stroke-width="12" />
      <path d="M 255 318 L 275 318" stroke-width="12" />
      <!-- ㅏ -->
      <path d="M 292 284 L 292 328" stroke-width="12" />
      <path d="M 292 304 L 302 304" stroke-width="12" />
      <!-- ㅇ -->
      <circle cx="277" cy="344" r="14" stroke-width="12" />

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

      <!-- Decorative Dot Clusters (5 dots) -->
      <!-- Left cluster above 'P' -->
      <g fill="#345171" stroke="none">
        <circle cx="115" cy="130" r="4.5" />
        <circle cx="135" cy="130" r="4.5" />
        <circle cx="125" cy="142" r="4.5" />
        <circle cx="115" cy="154" r="4.5" />
        <circle cx="135" cy="154" r="4.5" />
      </g>
      <!-- Right cluster above button 'O' -->
      <g fill="#345171" stroke="none">
        <circle cx="365" cy="130" r="4.5" />
        <circle cx="385" cy="130" r="4.5" />
        <circle cx="375" cy="142" r="4.5" />
        <circle cx="365" cy="154" r="4.5" />
        <circle cx="385" cy="154" r="4.5" />
      </g>

      <!-- Leafy Branches (sketched style) -->
      <!-- Left leafy branch -->
      <path d="M 80 205 C 70 190 60 170 50 160" stroke-width="7" />
      <path d="M 70 190 C 55 190 55 175 60 170" stroke-width="7" />
      <path d="M 60 175 C 45 175 45 160 50 155" stroke-width="7" />
      <path d="M 80 205 C 75 185 80 180 85 175" stroke-width="7" />

      <!-- Right leafy branch -->
      <path d="M 435 205 C 445 190 455 170 465 160" stroke-width="7" />
      <path d="M 445 190 C 460 190 460 175 455 170" stroke-width="7" />
      <path d="M 455 175 C 470 175 470 160 465 155" stroke-width="7" />
      <path d="M 435 205 C 440 185 435 180 430 175" stroke-width="7" />

      <!-- Dashed lines & central heart separator -->
      <path d="M 160 418 L 225 418" stroke-width="3.5" stroke-dasharray="6,6" />
      <!-- Separator Heart -->
      <path d="M 250 418 C 246 413 239 413 239 418 C 239 423 250 430 250 430 C 250 430 261 423 261 418 C 261 413 254 413 250 418 Z" fill="#345171" stroke="none" />
      <path d="M 275 418 L 340 418" stroke-width="3.5" stroke-dasharray="6,6" />
    </g>

    <!-- Subtitle Korean texts centered exactly under the heart divider -->
    <text x="250" y="454" class="sub-text" font-size="16.5" text-anchor="middle">손수 한 땀 한 땀 만드는</text>
    <text x="250" y="484" class="sub-text" font-size="16.5" text-anchor="middle">세상 하나뿐인 양모 펠트 인형과 키링 ♥</text>

    <!-- Instagram Handle below subtitles -->
    <text x="250" y="520" class="insta-text" font-size="14.5" text-anchor="middle">@mushroom.pino</text>
  </g>
</svg>
`;

async function main() {
  try {
    let bgBuffer;
    const backgroundUrl = 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=1200&h=630&auto=format&fit=crop';
    
    console.log('Downloading background wrinkled paper image...');
    try {
      const response = await fetch(backgroundUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        bgBuffer = Buffer.from(arrayBuffer);
        console.log('Successfully downloaded background from Unsplash!');
      } else {
        throw new Error('Unsplash download failed');
      }
    } catch (e) {
      console.warn('Could not load background from Unsplash, generating procedural paper background...', e.message);
      // Generate elegant procedural cream paper background using sharp
      bgBuffer = await sharp({
        create: {
          width: 1200,
          height: 630,
          channels: 3,
          background: { r: 247, g: 245, b: 240 } // beautiful soft cream paper color
        }
      })
      .jpeg()
      .toBuffer();
    }

    // Overlay the beautiful SVG vector details onto the paper background
    const outputBuffer = await sharp(bgBuffer)
      .composite([
        {
          input: Buffer.from(svgLogo),
          blend: 'over'
        }
      ])
      .jpeg({ quality: 95 })
      .toBuffer();

    // Ensure directories exist
    if (!fs.existsSync('./public')) {
      fs.mkdirSync('./public', { recursive: true });
    }

    // Write to public and dist folders
    fs.writeFileSync('./public/og-image.jpg', outputBuffer);
    console.log('Successfully generated public/og-image.jpg');

    if (fs.existsSync('./dist')) {
      fs.writeFileSync('./dist/og-image.jpg', outputBuffer);
      console.log('Successfully copied to dist/og-image.jpg');
    }
    
    console.log('Open Graph image updated successfully!');
  } catch (err) {
    console.error('Error generating Open Graph image:', err);
    process.exit(1);
  }
}

main();
