
(function(){
 var BK="sedute-media";
 var TR={cavalli:[],sedute:[],media:{},slot:{usati:0,limite:10},cur:null,ann:[],comm:[],vurl:null,tool:null,forme:[],lavCol:"#e2ab45",lavK:"linea",lente:null,rec:null,caricato:false,owner:false};
 var DEMO=function(){return typeof DEMO_MODE!=="undefined"&&DEMO_MODE;};
 function q(i){return document.getElementById(i);}
 function esc(s){return escapeHtml(String(s==null?"":s));}
 function isTr(){return typeof plRuolo==="function"&&plRuolo()==="istr";}
 function toast(m){if(typeof showToast==="function")showToast(m);}
 function fmt(t){t=Math.max(0,t||0);var m=Math.floor(t/60),s=Math.floor(t%60);return m+":"+String(s).padStart(2,"0");}
 var IC={film:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>',
  punto:'<svg viewBox="0 0 24 24"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>',
  voce:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  lente:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M8 11h6M11 8v6"/></svg>',
  lavagna:'<svg viewBox="0 0 24 24"><path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/></svg>',
  rallenta:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>'};
