// Costruisce con Vite i moduli ES dell'app (allenatore, maniscalco, proprietario) in un unico file che unisci.cjs inserisce nella pagina.
// Uso (serve Vite installato): node equo-app-src/strumenti/costruisci-moduli.mjs [--verifica]
//   VITE_DIR = cartella che contiene node_modules/vite (se Vite non e installato accanto al progetto)
// Il risultato (ruoli/allenatore/costruito.js) si salva nel repository: cosi unisci.cjs resta senza dipendenze.
import fs from "fs"; import path from "path"; import os from "os"; import { pathToFileURL, fileURLToPath } from "url";
const QUI = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(QUI, "..", "src");
const viteDir = process.env.VITE_DIR || path.resolve(QUI, "..");
const { build } = await import(pathToFileURL(path.join(viteDir, "node_modules", "vite", "dist", "node", "index.js")).href);
const MODULI = [
  { nome: "allenatore", ingresso: "ruoli/allenatore/moduli/index.js", uscita: "ruoli/allenatore/costruito.js", globale: "EquoAllenatore" },
  { nome: "maniscalco", ingresso: "ruoli/maniscalco/moduli/index.js", uscita: "ruoli/maniscalco/costruito.js", globale: "EquoManiscalco" },
  { nome: "proprietario", ingresso: "ruoli/proprietario/moduli/index.js", uscita: "ruoli/proprietario/costruito.js", globale: "EquoProprietario" },
  { nome: "chat", ingresso: "comune/chat/moduli/index.js", uscita: "comune/chat/costruito.js", globale: "EquoChat" },
];
let diversi = 0;
for(const m of MODULI){
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "equo-vite-"));
  await build({
    configFile: false, logLevel: "warn", root: path.join(SRC, path.dirname(m.ingresso)),
    build: { outDir: tmp, emptyOutDir: true, minify: false, target: "esnext", reportCompressedSize: false, copyPublicDir: false,
      lib: { entry: path.join(SRC, m.ingresso), formats: ["iife"], name: m.globale, fileName: () => m.nome + ".js" } },
  });
  const codice = "\n// === GENERATO da equo-app-src/strumenti/costruisci-moduli.mjs: NON modificare qui, modificare " + path.dirname(m.ingresso) + "/ ===\n"
    + fs.readFileSync(path.join(tmp, m.nome + ".js"), "utf8") + "\n";
  const dest = path.join(SRC, m.uscita);
  if(process.argv.includes("--verifica")){
    if(!fs.existsSync(dest) || fs.readFileSync(dest, "utf8") !== codice){ console.error("Da ricostruire: " + m.uscita); diversi++; }
    else console.log("OK: " + m.uscita + " corrisponde ai moduli");
  } else { fs.writeFileSync(dest, codice); console.log("Costruito " + m.uscita + " (" + codice.length + " caratteri)"); }
}
if(diversi) process.exit(1);
