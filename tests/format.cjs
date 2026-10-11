const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('theme/codela-storefront/assets/scripts/format.js','utf8');
const context={
  URL,Intl,location:{href:'https://store.test/current/'},
  document:{documentElement:{lang:'tr-TR'},createElement(){
    return {value:'',set innerHTML(value){
      this.value=String(value).replace(/&amp;/g,'&').replace(/&lt;/g,'<')
        .replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
    }};
  }}
};
const {escape,decode,safeURL,money}=vm.runInNewContext(source.replace(/^export /gm,'')+'\n({escape,decode,safeURL,money})',context);
assert.equal(escape('<strong>x&y</strong>'),'&lt;strong&gt;x&amp;y&lt;/strong&gt;');
assert.equal(escape(null),'');
assert.equal(escape('"quoted"'), '&quot;quoted&quot;');
assert.equal(decode('Shoes &amp; Boots'),'Shoes & Boots');
assert.equal(safeURL('javascript:alert(1)'),'');
assert.equal(safeURL('data:text/html,x'),'');
assert.equal(safeURL('/product/?q=<x>'),'https://store.test/product/?q=%3Cx%3E');
assert.equal(safeURL('https://store.test/cart/'),'https://store.test/cart/');
assert.match(money('1000',{currency_minor_unit:2,currency_code:'TRY'}),/10,00/);
assert.ok(fs.readFileSync('theme/codela-storefront/assets/storefront.js','utf8').includes("from './scripts/format.js'"));
console.log('Shared format module: escaping, URL safety, HTML decoding and currency rendering passed.');
