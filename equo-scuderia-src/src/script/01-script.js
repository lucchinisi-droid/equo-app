
  (function(){
    try{
      var t = localStorage.getItem("equo-scuderia-theme") || "light";
      document.documentElement.setAttribute("data-theme", t);
    }catch(e){}
  })();
