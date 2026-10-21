# Screenshot di ogni ruolo e pagina, per confrontare due versioni dell'app.
import sys, os, json
from playwright.sync_api import sync_playwright
html, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True); d=os.getcwd()
RUOLI=["proprietario","maniscalco","istruttore","veterinario"]
with sync_playwright() as p:
    b=p.chromium.launch(args=["--allow-file-access-from-files"])
    for r in RUOLI:
        ctx=b.new_context(viewport={'width':390,'height':844}, reduced_motion='reduce')
        pg=ctx.new_page()
        def h(route):
            u=route.request.url
            if 'supabase-js' in u: route.fulfill(path=d+'/supabase.js', content_type='application/javascript')
            elif u.startswith('file://') or u.startswith('data:'): route.continue_()
            else: route.abort()
        pg.route("**/*", h)
        pg.add_init_script("Date.now=()=>1792600000000; const _D=Date; Math.random=()=>0.42;")
        pg.goto('file://'+d+'/'+html); pg.wait_for_timeout(1200)
        pg.evaluate("startDemo()"); pg.wait_for_timeout(500)
        pg.evaluate("async(r)=>{currentUser.ruolo=r; await enterApp(r)}", r); pg.wait_for_timeout(2500)
        pg.add_style_tag(content="*{animation:none!important;transition:none!important;caret-color:transparent!important}.hm-slides{transform:none!important}#cookie-banner,.cookie-banner{display:none!important}")
        pagine=pg.evaluate("""()=>{const n=[...document.querySelectorAll('.bottom-nav')].find(n=>getComputedStyle(n).display!=='none'&&n.getBoundingClientRect().height>0);return n?[...n.querySelectorAll('.nav-btn[data-page]')].map(b=>b.dataset.page):[]}""")
        for pgn in pagine:
            pg.evaluate("(p)=>showPage(p)", pgn); pg.wait_for_timeout(900); pg.evaluate("window.scrollTo(0,0)")
            pg.screenshot(path=f"{out}/{r}-{pgn}.png", full_page=True)
        ctx.close()
    b.close()
