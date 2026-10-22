/* ---------- INCASSI (pro) ---------- */
// Premium da proprietario: vale solo nella vista proprietario; nella vista professionista serve quello da professionista
function premiumSoloProprietario(){ return !!(currentUser && currentUser.piano === "premium" && currentUser.premiumLivello === "proprietario"); }
function isPremium(){
  if(!(currentUser && currentUser.piano === "premium")) return false;
  if(premiumSoloProprietario() && PRO_ROLES.includes(currentUser.vistaAttiva || currentUser.ruolo)) return false;
  return true;
}

