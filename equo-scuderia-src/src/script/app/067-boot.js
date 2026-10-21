/* ---------- BOOT ---------- */
async function boot(){
  initCookieConsent();
  try{
    const { data } = await sb.auth.getSession();
    if(data?.session?.user){
      currentUser = { id: data.session.user.id, email: data.session.user.email };
      await afterLogin();
    }
  } catch(e){ /* nessuna sessione, resta su auth */ }
}
boot();
