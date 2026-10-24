// Browser contract regression for late meta boxes and WordPress media states.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN,args:['--no-sandbox']}:{});try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<main></main>');
 await page.addScriptTag({content:`
 const image=id=>({id,type:'image',url:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',alt:'Image '+id});
 window.frames=[];window.fetches=[];
 function frame(options){const handlers={};const selected=[];const collection={add:item=>selected.push(image(item.id)),toJSON:()=>selected};
 const f={options,on:(event,fn)=>{handlers[event]=fn;return f},open:()=>{handlers.open?.();return f},state:()=>({get:name=>name==='selection'?collection:{toJSON:()=>[image(99)]}}),emit:(event,value)=>handlers[event]?.(value)};window.frames.push(f);return f;}
 window.wp={media:frame};wp.media.attachment=id=>({id,fetch:()=>window.fetches.push(id)});
 wp.media.gallery={edit:shortcode=>frame({shortcode,hydrated:true})};
 window.image=image;
 `});
 // Execute before fields are mounted, as with asynchronously loaded meta boxes.
 await page.addScriptTag({content:fs.readFileSync('theme/codela-storefront/assets/scripts/product-mobile-media-admin.js','utf8')});
 await page.locator('main').evaluate(el=>{el.innerHTML=['featured','gallery'].map(key=>`<div data-sf-mobile-field="${key}"><strong>${key}</strong><input name="${key}" value="${key==='featured'?'12':'13,14'}"><div data-sf-mobile-preview></div><button data-sf-mobile-select>Select</button><button data-sf-mobile-clear>Remove</button></div>`).join('');});
 const field=key=>page.locator(`[data-sf-mobile-field="${key}"]`);
 await field('featured').getByText('Select',{exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>fetches),[12]);
 await page.evaluate(()=>{const f=frames.at(-1);f.state().get('selection').toJSON=()=>[image(21)];f.emit('select');});
 assert.equal(await field('featured').locator('input').inputValue(),'21');
 assert.equal(await field('gallery').locator('input').inputValue(),'13,14');
 await field('gallery').getByText('Select',{exact:true}).click();
 assert.equal(await page.evaluate(()=>frames.at(-1).options.shortcode),'[gallery ids="13,14"]');
 // Gallery selection is empty; update supplies all images in reordered order.
 await page.evaluate(()=>frames.at(-1).emit('update',{toJSON:()=>[image(14),image(13),image(22)]}));
 assert.equal(await field('gallery').locator('input').inputValue(),'14,13,22');
 assert.equal(await field('gallery').locator('img').count(),3);
 // Closing without update must preserve values.
 await field('gallery').getByText('Select',{exact:true}).click();
 assert.equal(await field('gallery').locator('input').inputValue(),'14,13,22');
 await field('gallery').getByText('Remove',{exact:true}).click();
 await field('gallery').getByText('Select',{exact:true}).click();
 assert.equal(await page.evaluate(()=>frames.at(-1).options.state),'gallery');
 await page.evaluate(()=>frames.at(-1).emit('update',{toJSON:()=>[image(31),image(32)]}));
 assert.equal(await field('gallery').locator('input').inputValue(),'31,32');
 await field('featured').getByText('Remove',{exact:true}).click();
 assert.equal(await field('featured').locator('input').inputValue(),'');
 assert.equal(await field('gallery').locator('input').inputValue(),'31,32');
 assert.deepEqual(errors,[]);
 console.log('Late meta boxes, featured preselection, complete ordered gallery update, reopen/cancel, create and independent clear passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
