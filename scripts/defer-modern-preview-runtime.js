const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const indexPath=path.join(root,'index.html');
let html=fs.readFileSync(indexPath,'utf8');

const marker='<!-- VG MODERN DEPLOY PREVIEW -->';
const start=html.indexOf(marker);
const bodyEnd=html.lastIndexOf('</body>');

if(start<0)throw new Error('Modern preview marker not found');
if(bodyEnd<0||bodyEnd<=start)throw new Error('Invalid modern preview injection position');

const loader=`${marker}
<script>
(function(){
  var started=false;
  function loadScript(src,module){
    return new Promise(function(resolve,reject){
      var s=document.createElement('script');
      s.src=src;
      if(module)s.type='module';
      s.async=false;
      s.onload=function(){resolve();};
      s.onerror=function(){reject(new Error('Failed to load '+src));};
      document.body.appendChild(s);
    });
  }
  function start(){
    if(started)return;
    started=true;
    var files=[
      ['assets/js/modules/occupancy-modern-bridge-v40.js',false],
      ['assets/js/modules/reputation-modern-bridge-v40.js',false],
      ['assets/js/modules/revenue-modern-bridge-v40.js',false],
      ['assets/js/modules/portfolio-modern-bridge-v40.js',false],
      ['/dist-modern/assets/modern-main.js',true],
      ['assets/js/ui/modern-preview-bootstrap.js',false],
      ['assets/js/ui/hotel-single-selection-v49.js',false],
      ['assets/js/ui/reputation-modern-preview-v46.js',false],
      ['assets/js/modules/reputation-upload-center-v48.js',false],
      ['assets/js/ui/ab-integration-stability-v40.js',false],
      ['assets/js/modules/city-ledger-panorama-v40.js',false],
      ['assets/js/modules/city-ledger-panorama-enhancements-v42.js',false],
      ['assets/js/modules/city-ledger-upload-center-v42.js',false],
      ['assets/js/ui/sidebar-governance-v43.js',false]
    ];
    var chain=Promise.resolve();
    files.forEach(function(item){
      chain=chain.then(function(){return loadScript(item[0],item[1]);});
    });
    chain.catch(function(err){
      console.error('[VG modern] post-load asset bootstrap failed',err);
      window.dispatchEvent(new CustomEvent('vg-modern-preview-error',{detail:String(err&&err.message||err)}));
    });
  }
  if(document.readyState==='complete')setTimeout(start,0);
  else window.addEventListener('load',function(){setTimeout(start,0);},{once:true});
})();
</script>
`;

html=html.slice(0,start)+loader+html.slice(bodyEnd);
fs.writeFileSync(indexPath,html,'utf8');
console.log('✓ Modern runtime deferred until after initial page load');
