// Public read-only discovery: QA must not depend on deleted demo products.
const assert=require('node:assert/strict');
async function liveProduct(){
 const response=await fetch('https://codela.dev/wp-json/wc/store/v1/products?per_page=100');
 assert(response.ok,'Public product discovery failed: '+response.status);
 const products=await response.json();
 const eligible=products.filter(p=>p.is_purchasable&&p.is_in_stock&&p.images?.length);
 const product=eligible.find(p=>p.images.length>1)||eligible.find(p=>/luna/i.test(p.name))||eligible[0];
 assert(product,'No published purchasable product with an image');
 assert.equal(new URL(product.permalink).origin,'https://codela.dev');
 return{url:product.permalink,name:product.name,images:product.images.length,search:product.name.split(/\s+/)[0]};
}
module.exports={liveProduct};
