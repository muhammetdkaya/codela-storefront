<?php
define('ABSPATH', __DIR__);
$GLOBALS['options'] = [];
function add_action(...$args) {}
function get_option($key,$default=false){return $GLOBALS['options'][$key]??$default;}
function sanitize_text_field($v){return trim(strip_tags($v));}
require __DIR__.'/../theme/codela-storefront/inc/agency-quote.php';
function check_quote($ok,$msg){if(!$ok)throw new RuntimeException($msg);}
$defaults=codela_sf_quote_rules();
check_quote(count($defaults)===4,'Four services');
check_quote(codela_sf_quote_estimate($defaults['web'],'0',[])===null,'Unconfigured price never displayed');
$raw=$defaults;
$raw['web']['packages'][0]=['label'=>'WordPress','min'=>'12000','max'=>'18000'];
$raw['web']['extras'][0]=['label'=>'Ek sayfa','min'=>'1500','max'=>'2000'];
$raw['web']['extras'][1]=['label'=>'Entegrasyon','min'=>'','max'=>''];
$clean=codela_sf_quote_clean($raw);
check_quote($clean!==null,'Valid admin price configuration');
check_quote(codela_sf_quote_estimate($clean['web'],'0',['0','0'])===[13500,20000],'Server estimate, no duplicate extras');
check_quote(codela_sf_quote_estimate($clean['web'],'0',['1'])===null,'Unknown extra hides total');
check_quote(codela_sf_quote_estimate($clean['web'],'0',['5'])===null,'Unconfigured extra rejected');
check_quote(codela_sf_quote_estimate($clean['web'],'custom',[])===null,'Custom scope has no false price');
check_quote(codela_sf_quote_money([13500,20000])==='13.500 – 20.000 TL','Turkish price format');
$invalid=$raw;$invalid['web']['packages'][0]['min']='18001';
check_quote(codela_sf_quote_clean($invalid)===null,'Reversed range rejected');
$invalid=$raw;$invalid['web']['packages'][0]['min']='0';
check_quote(codela_sf_quote_clean($invalid)===null,'Free service price never inferred');
$invalid=$raw;$invalid['web']['packages'][0]['max']='';
check_quote(codela_sf_quote_clean($invalid)===null,'Half range rejected');
$invalid=$raw;$invalid['web']['packages'][0]['label']='';
check_quote(codela_sf_quote_clean($invalid)===null,'Orphan price rejected');
$raw['web']['packages'][0]=['label'=>'','min'=>'','max'=>''];
check_quote(!isset(codela_sf_quote_clean($raw)['web']['packages'][0]),'Package may be removed');
$GLOBALS['options']['codela_sf_quote_rules']=$clean;
$project=codela_sf_project_quote_calculate(['Web Tasarım','Optimizasyon / Destek'],['web'=>['packages'=>['0'],'extras'=>['0']],'support'=>['packages'=>['']]]);
check_quote($project['web']['estimate']==='13.500 – 20.000 TL','Project price recomputed');
check_quote($project['support']['estimate']==='Görüşmede belirlenecek','Unconfigured recurring scope never priced');
check_quote(codela_sf_project_quote_calculate(['Web Tasarım'],['web'=>['packages'=>['23']]])===null,'Forged scope rejected');
check_quote(codela_sf_project_quote_calculate(['Web Tasarım'],['web'=>['packages'=>['']]])['web']['estimate']==='Görüşmede belirlenecek','Unselected package accepted');
echo "Agency quote rules, ranges and no-price fallback passed.\n";
