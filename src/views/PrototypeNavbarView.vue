<script setup>
// ──────────────────────────────────────────────────────────────────────────
// PAGE PROTOTYPE (laboratoire UI) — itération 4 : UN SEUL design (Mix 1+4 /
// C2 Bridge), comparaison de PALETTES uniquement. Le même template navbar est
// rendu pour toutes les variantes ; seules des variables CSS de thème changent
// (fond, track, capsules, bordures, accent, texte) → layout strictement
// identique garanti. Aucune API, aucun store. TheNavbar.vue réel NON modifié.
// Route : /prototype-navbar
// ──────────────────────────────────────────────────────────────────────────
import { ref, computed } from 'vue';

const variants = [
  { key: 'mix', btn: 'Mix 1+4', name: 'Mix 1+4 — C2 Bridge (référence)', desc: 'Palette de référence gris-bleu.', palette: 'fond #d7e3f0→#eef4fb · track #cfdceb · actif blanc/texte #1d4ed8' },
  { key: 'b', btn: 'Navbar B', name: 'Sky Wash (conservée)', desc: 'Cite le SKY du header C2 (#7dd3fc) en version lavée : reprend l’accent du header, pas sa base navy.', palette: 'fond #dbeefc→#f0f9ff · track #c6e3f7 · actif blanc/texte #0284c7' },
  { key: 'g', btn: 'Navbar G', name: 'Champagne Navy (actif corrigé)', desc: 'Champagne chic, mark navy. ACTIF CORRIGÉ : le bleu est remplacé par un bronze profond #8a5a2b, dans la famille chaude du fond — l’actif reste visible et premium sans casser l’harmonie.', palette: 'fond #efe9df→#f8f4ec · track #e0d8c8 · actif blanc/texte bronze #8a5a2b · mark #1e293b' },
  { key: 'p1', btn: 'Navbar P1', name: 'Ink Shell · Orange Underline', desc: 'Base encre #0f172a (barre du labo). ACTIF SANS BLEU : surface sombre à peine éclaircie + LISERÉ orange #ea580c en bas + icône orange panier #fdba74, texte blanc — l’orange est un accent, le lien visuel navbar ↔ panier C2 se fait par une ligne.', palette: 'fond #0f172a→#16203a · actif rgba(255,255,255,.08) + underline #ea580c · icône active #fdba74' },
  { key: 'p2', btn: 'Navbar P2', name: 'Ink Shell · Cart Chip', desc: 'Base encre identique. L’actif CITE le bouton panier du header C2 : même surface #2b3a4f, texte/icône orange #fdba74, contour orangé discret + halo très doux — le bouton actif et le panier C2 parlent exactement la même langue.', palette: 'fond #0f172a→#16203a · actif surface #2b3a4f / texte #fdba74 · contour rgba(234,88,12,.55)' },
  { key: 'z', btn: 'Navbar Z', name: 'Z — C2 Native (finale)', desc: 'Construite UNIQUEMENT avec les tokens de C2, comme si C2 avait dessiné sa coque : matériau exact des en-têtes de zone C2 (#1e293b→#243246, bordure #3b4a61), track = le composant carttabs de la sidebar C2 (piste blanche translucide, ACTIF BLEU PLEIN #2563eb), sous-label « ERP Achat » en sky #7dd3fc comme le label STOCKS, survols = la matière des pills année (.12 blanc). L’orange reste réservé au panier (sémantique C2 préservée). Pas de double bande : le header C2 est une carte arrondie flottante, la coque ne la touche jamais.', palette: 'fond #1e293b→#243246 (matériau C2) · track rgba(255,255,255,.08) · actif #2563eb/texte blanc · sky #7dd3fc en signature' },
];

const variant = ref('mix');
const current = computed(() => variants.find(v => v.key === variant.value));

// 7 entrées (visuel uniquement — aucun lien réel)
const navItems = [
  { label: 'Comparateur', icon: 'pi pi-search-plus' },
  { label: 'Confirmation Achat', icon: 'pi pi-check-square', active: true },
  { label: 'B2B', icon: 'pi pi-users' },
  { label: 'Analyse B2B', icon: 'pi pi-chart-line' },
  { label: 'Sync Adaptable', icon: 'pi pi-sync' },
  { label: 'Partslink', icon: 'pi pi-desktop' },
  { label: 'Ancien Conf.', icon: 'pi pi-history' },
];

// Données fictives du mock C2 (statique)
const mockFrs = [
  { n: 1, frs: '401301', dp: 'DP26-00390', ref: '15-99-2001', desc: "Thermostat d'eau - Cayenne 9PA", stock: 0, cout: '4.11', prev: '20.288', pvte: '25.360', cf: 1, sel: true },
  { n: 2, frs: '401301', dp: 'DP26-00390', ref: '20-0742', desc: 'Pipette de liquide de refroidissement - E36', stock: 0, cout: '1.63', prev: '8.046', pvte: '10.587', cf: 1, sel: false },
  { n: 3, frs: '401301', dp: 'DP26-00390', ref: '20-2388', desc: "Durite d'eau - E71", stock: 0, cout: '20.72', prev: '102.279', pvte: '127.849', cf: 1, sel: false },
];
const mockEqv = [
  { frs: '401244', ref: 'TX3080D', desc: "Thermostat d'eau - Cayenne 9PA", stock: 0, prix: '7.88', cout: '33.076' },
  { frs: '401213', ref: '17898', desc: "Thermostat d'eau - Cayenne 9PA", stock: 0, prix: '5.84', cout: '25.376' },
];
</script>

<template>
  <div class="proto-page">
    <!-- ─── Sélecteur de variante (palette) ─── -->
    <div class="proto-switcher">
      <span class="proto-switcher-title"><i class="pi pi-palette"></i> Prototype Navbar — palettes (design Mix 1+4)</span>
      <div class="proto-switcher-btns">
        <button v-for="v in variants" :key="v.key" type="button" class="proto-switch-btn"
          :class="{ on: variant === v.key }" :title="v.desc" @click="variant = v.key">
          {{ v.btn }}
        </button>
      </div>
    </div>
    <!-- Bandeau descriptif de la palette courante -->
    <div class="proto-desc">
      <b>{{ current.name }}</b> — {{ current.desc }} <em>{{ current.palette }}</em>
    </div>

    <!-- ═══════════ NAVBAR UNIQUE (layout Mix 1+4) — thème par variable CSS ═══════════ -->
    <header class="pnav" :class="'t-' + variant">
      <div class="pnav-brandbox">
        <span class="pnav-mark">R</span>
        <div class="pnav-brandtxt"><b>Reapro</b><em>ERP Achat</em></div>
      </div>
      <nav class="pnav-track">
        <a v-for="it in navItems" :key="it.label" href="#" class="pnav-pill" :class="{ on: it.active }"
          @click.prevent><i :class="it.icon"></i><span>{{ it.label }}</span></a>
      </nav>
      <div class="pnav-spacer"></div>
      <div class="pnav-capsule">
        <button type="button" class="pnav-iconbtn"><i class="pi pi-cog"></i></button>
        <span class="pnav-div"></span>
        <button type="button" class="pnav-profile"><span class="pnav-avatar"><i class="pi pi-user"></i></span>
          <b>Ellouze</b><i class="pi pi-angle-down pnav-caret"></i></button>
      </div>
    </header>

    <!-- ═══════════════ MOCK STATIQUE C2 (aucune API, aucun store) ═══════════════ -->
    <div class="proto-c2">
      <div class="proto-c2-header">
        <button type="button" class="proto-c2-back"><i class="pi pi-arrow-left"></i></button>
        <div class="proto-c2-title">
          <b>Confirmation Commandes Achat</b>
          <span><i class="proto-c2-no">COMP26-00073</i> · Vaico 3</span>
        </div>
        <div class="proto-c2-stocks">
          <span class="proto-c2-stklbl">STOCKS</span>
          <div class="proto-c2-stk"><b>SFAX SILVER STAR</b><span><i class="r">0</i> | Dern. —</span></div>
          <div class="proto-c2-stk"><b>STE COPIM</b><span><i class="r">0</i> | Dern. 01/01/01</span></div>
          <div class="proto-c2-stk"><b>STE MPAA</b><span><i class="r">0</i> | Dern. 01/01/01</span></div>
        </div>
        <div class="proto-c2-right">
          <div class="proto-c2-total"><span>DP26-00390</span><b>40 820.60 <em>TND</em></b></div>
          <span class="proto-c2-oem"><i class="pi pi-sitemap"></i> OEM 1</span>
          <button type="button" class="proto-c2-cart"><i class="pi pi-shopping-cart"></i><span>0</span></button>
          <button type="button" class="proto-c2-confirm"><i class="pi pi-check"></i> Confirmer</button>
        </div>
      </div>

      <div class="proto-c2-body">
        <div class="proto-c2-left">
          <div class="proto-card">
            <div class="proto-card-head"><span class="proto-acc"></span>FOURNISSEURS
              <span class="proto-count">1250</span><span class="proto-badge dp">DP 1</span></div>
            <table class="proto-table">
              <thead><tr><th class="l">Frs</th><th class="l">Réf / Désignation</th><th>Stock</th><th>Coût Dir.</th>
                <th>Prix Rev.</th><th>Prix Vte</th><th>CF F</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="r in mockFrs" :key="r.n" :class="{ sel: r.sel }">
                  <td class="l"><span class="proto-idx" :class="{ on: r.sel }">{{ r.n }}</span><b>{{ r.frs }}</b>
                    <em class="proto-dp">{{ r.dp }}</em></td>
                  <td class="l"><b>{{ r.ref }}</b><em>{{ r.desc }}</em></td>
                  <td><span class="proto-stk">{{ r.stock }}</span></td>
                  <td class="n">{{ r.cout }}</td><td class="n">{{ r.prev }}</td><td class="n">{{ r.pvte }}</td>
                  <td><span class="proto-input">{{ r.cf }}</span><i class="pi pi-check-circle proto-ok"></i></td>
                  <td class="acts"><i class="pi pi-info-circle"></i><i class="pi pi-comment"></i><i
                      class="pi pi-flag"></i></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="proto-card">
            <div class="proto-card-head"><span class="proto-acc eqv"></span>ÉQUIVALENCE
              <span class="proto-count">6</span><span class="proto-badge cmd">CMD 0</span><span
                class="proto-badge imp">IMP 0</span></div>
            <table class="proto-table">
              <thead><tr><th class="l">Frs</th><th class="l">Réf / Désignation</th><th>Stock</th><th>Prix Dev.</th>
                <th>Coût Calc.</th><th>Panier</th><th>Actions</th></tr></thead>
              <tbody>
                <tr v-for="r in mockEqv" :key="r.ref">
                  <td class="l"><b>{{ r.frs }}</b></td>
                  <td class="l"><b>{{ r.ref }}</b><em>{{ r.desc }}</em></td>
                  <td><span class="proto-stk">{{ r.stock }}</span></td>
                  <td class="n">{{ r.prix }}</td><td class="n">{{ r.cout }}</td>
                  <td><span class="proto-input">1</span><i class="pi pi-shopping-cart proto-cartic"></i></td>
                  <td class="acts"><i class="pi pi-info-circle"></i><i class="pi pi-comment"></i></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="proto-card">
            <div class="proto-card-head"><span class="proto-acc kit"></span>KIT
              <span class="proto-count">0</span><span class="proto-badge cmd">CMD 0</span><span
                class="proto-badge imp">IMP 0</span></div>
            <div class="proto-empty"><i class="pi pi-inbox"></i> Aucun kit</div>
          </div>
        </div>

        <aside class="proto-hist">
          <div class="proto-hist-head"><i class="pi pi-history"></i> Historique
            <span class="proto-hist-year"><i class="pi pi-chevron-left"></i> 2026 <i
                class="pi pi-chevron-right"></i></span></div>
          <div class="proto-hist-ref"><b>15-99-2001</b><span>Thermostat d'eau - Cayenne 9PA</span></div>
          <div class="proto-hist-kpis">
            <span class="k"><i>Stock</i><b>0</b></span><span class="k"><i>Achat</i><b class="g">0</b></span>
            <span class="k"><i>Vente</i><b class="g">0</b></span><span class="k"><i>Rupt</i><b class="r">0</b></span>
          </div>
          <div class="proto-empty"><i class="pi pi-inbox"></i> Aucun mouvement</div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ════════════ Page laboratoire (styles 100% locaux, préfixés proto-/pnav) ════════════ */
.proto-page { min-height: 100vh; background: #f1f5f9; font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif; }

/* ─── Sélecteur ─── */
.proto-switcher {
  display: flex; align-items: center; gap: 16px; padding: 10px 16px;
  background: #0f172a; color: #fff; flex-wrap: wrap;
}
.proto-switcher-title { font-weight: 800; font-size: .9rem; display: inline-flex; align-items: center; gap: 8px; color: #93c5fd; }
.proto-switcher-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.proto-switch-btn {
  padding: 6px 12px; border-radius: 9px; border: 1px solid #334155; background: #1e293b;
  color: #cbd5e1; font-weight: 700; font-size: .78rem; cursor: pointer;
}
.proto-switch-btn:hover { background: #243246; color: #fff; }
.proto-switch-btn.on { background: #2563eb; border-color: #2563eb; color: #fff; }
.proto-desc {
  padding: 7px 16px; background: #1e293b; color: #cbd5e1; font-size: .78rem; border-bottom: 1px solid #334155;
}
.proto-desc b { color: #93c5fd; }
.proto-desc em { font-style: normal; color: #7c8aa5; margin-left: 8px; }

/* ════════════ NAVBAR UNIQUE — layout Mix 1+4, thèmes par variables CSS ════════════
   Le layout (structure, hauteurs, espacements) est défini UNE fois ci-dessous.
   Chaque variante ne change QUE les variables --nb-* (fond, track, capsule,
   bordures, accent, texte). */
.pnav {
  /* Thème par défaut = Mix 1+4 (C2 Bridge) */
  --nb-bg: linear-gradient(180deg, #d7e3f0, #eef4fb);
  --nb-border: #b7c6d8;
  --nb-track: #cfdceb;
  --nb-track-border: #b7c6d8;
  --nb-capsule: rgba(255, 255, 255, .75);
  --nb-text: #263445;
  --nb-icon: #51637c;
  --nb-accent: #1d4ed8;
  --nb-mark: #2563eb;
  --nb-hover: rgba(255, 255, 255, .65);

  position: relative; height: 58px; display: flex; align-items: center; gap: 16px; padding: 0 16px;
  background: var(--nb-bg); border-bottom: 1px solid var(--nb-border);
  box-shadow: 0 1px 3px rgba(16, 24, 40, .08);
}
/* ─── Thèmes — conservés : B (Sky Wash) telle quelle, G (Champagne Navy) avec
   ACTIF CORRIGÉ (bronze #8a5a2b au lieu du bleu). Nouvelles directions H→O :
   tons MOYENS chauds/froids non bleus (H taupe, J pétrole, L forêt, N charbon),
   neutres à accent non bleu (K carbone, M bordeaux, O cuivre). ─── */
.pnav.t-b { /* Sky Wash — citation du sky du header C2 (#7dd3fc) en version lavée */
  --nb-bg: linear-gradient(180deg, #dbeefc, #f0f9ff); --nb-border: #a8d3ef;
  --nb-track: #c6e3f7; --nb-track-border: #a8d3ef; --nb-capsule: rgba(255,255,255,.6);
  --nb-text: #0c4a6e; --nb-icon: #38709c; --nb-accent: #0284c7; --nb-mark: #0284c7;
}
.pnav.t-g { /* Champagne Navy — actif corrigé : bronze profond, plus de bleu actif */
  --nb-bg: linear-gradient(180deg, #efe9df, #f8f4ec); --nb-border: #d1c6b2;
  --nb-track: #e0d8c8; --nb-track-border: #d1c6b2; --nb-capsule: rgba(255,255,255,.7);
  --nb-text: #292524; --nb-icon: #8d7d62; --nb-accent: #8a5a2b; --nb-mark: #1e293b;
}
/* Ink Shell (P1/P2) — base #0f172a (barre du labo). L'ORANGE PANIER C2
   (#fdba74 / #ea580c, surface #2b3a4f) devient l'accent actif — jamais un fond
   dominant. Le mark reste bleu Reapro (le header C2 combine déjà navy + orange). */
.pnav.t-p1, .pnav.t-p2 {
  --nb-bg: linear-gradient(180deg, #0f172a, #16203a); --nb-border: #2a3650;
  --nb-track: rgba(255,255,255,.07); --nb-track-border: rgba(255,255,255,.13);
  --nb-capsule: rgba(255,255,255,.07);
  --nb-text: #cbd5e1; --nb-icon: #7c8aa5; --nb-accent: #ea580c; --nb-mark: #2563eb;
  --nb-hover: rgba(255,255,255,.10);
}
/* Survols adaptés au fond sombre (pas de fond blanc dur) + brand blanc */
.pnav.t-p1 .pnav-pill:hover, .pnav.t-p2 .pnav-pill:hover { color: #fff; }
.pnav.t-p1 .pnav-brandtxt b, .pnav.t-p2 .pnav-brandtxt b { color: #fff; }
.pnav.t-p1 .pnav-iconbtn:hover, .pnav.t-p2 .pnav-iconbtn:hover,
.pnav.t-p1 .pnav-profile:hover, .pnav.t-p2 .pnav-profile:hover { background: rgba(255,255,255,.12); color: #fff; box-shadow: none; }
/* P1 — actif : surface sombre à peine éclaircie + LISERÉ orange en bas, icône orange */
.pnav.t-p1 .pnav-pill.on { background: rgba(255,255,255,.08); color: #fff; border-color: rgba(255,255,255,.14); box-shadow: inset 0 -2px 0 #ea580c; }
.pnav.t-p1 .pnav-pill.on i { color: #fdba74; }
/* P2 — actif : citation du bouton panier C2 (surface #2b3a4f, texte orange, contour orangé) */
.pnav.t-p2 .pnav-pill.on { background: #2b3a4f; color: #fdba74; border-color: rgba(234,88,12,.55); box-shadow: 0 1px 4px rgba(234,88,12,.25); }
.pnav.t-p2 .pnav-pill.on i { color: #fdba74; }

/* ═══ Z — C2 Native (finale) : 100% tokens C2.
   Matériau = en-têtes de zone C2 (#1e293b→#243246, bordure #3b4a61).
   Track = composant .c2-carttabs de la sidebar C2 (piste rgba(255,255,255,.08),
   actif BLEU PLEIN #2563eb texte blanc). Survols = matière .c2-year (.12 blanc).
   Sous-label brand en sky #7dd3fc (comme le label STOCKS du header).
   Orange volontairement ABSENT de la navigation : il reste la sémantique du panier. ═══ */
.pnav.t-z {
  --nb-bg: linear-gradient(180deg, #1e293b, #243246); --nb-border: #3b4a61;
  --nb-track: rgba(255,255,255,.08); --nb-track-border: rgba(255,255,255,.12);
  --nb-capsule: rgba(255,255,255,.10);
  --nb-text: #cbd5e1; --nb-icon: #94a3b8; --nb-accent: #2563eb; --nb-mark: #2563eb;
  --nb-hover: rgba(255,255,255,.10);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 2px 10px rgba(15,23,42,.25);
}
.pnav.t-z .pnav-pill:hover { color: #fff; }
.pnav.t-z .pnav-pill.on { background: #2563eb; color: #fff; border-color: transparent; box-shadow: 0 1px 3px rgba(37,99,235,.4); }
.pnav.t-z .pnav-pill.on i { color: #bfdbfe; }
.pnav.t-z .pnav-brandtxt b { color: #fff; }
.pnav.t-z .pnav-brandtxt em { color: #7dd3fc; }
.pnav.t-z .pnav-iconbtn:hover, .pnav.t-z .pnav-profile:hover { background: rgba(255,255,255,.12); color: #fff; box-shadow: none; }

/* ─── Structure (commune à toutes les variantes) ─── */
.pnav a { text-decoration: none; }
.pnav-spacer { flex: 1; min-width: 0; }
.pnav-mark {
  display: inline-flex; align-items: center; justify-content: center; width: 31px; height: 31px;
  border-radius: 9px; background: var(--nb-mark); color: #fff; font-weight: 800;
  box-shadow: 0 1px 3px rgba(16, 24, 40, .25);
}
.pnav-brandbox {
  display: flex; align-items: center; gap: 10px; padding: 5px 12px 5px 5px;
  background: var(--nb-capsule); border: 1px solid var(--nb-border); border-radius: 12px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, .07); flex-shrink: 0;
}
.pnav-brandtxt { display: flex; flex-direction: column; line-height: 1.15; }
.pnav-brandtxt b { font-size: .95rem; font-weight: 800; color: var(--nb-text); letter-spacing: -.02em; }
.pnav-brandtxt em { font-style: normal; font-size: .6rem; font-weight: 700; color: var(--nb-icon); text-transform: uppercase; letter-spacing: .07em; }
.pnav-track {
  display: flex; align-items: center; gap: 2px; background: var(--nb-track);
  border: 1px solid var(--nb-track-border); border-radius: 12px; padding: 3px;
  overflow-x: auto; scrollbar-width: none;
}
.pnav-track::-webkit-scrollbar { height: 0; display: none; }
.pnav-pill {
  display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 12px;
  color: var(--nb-text); border-radius: 9px; border: 1px solid transparent;
  font-weight: 650; font-size: .84rem; white-space: nowrap; flex-shrink: 0;
}
.pnav-pill i { font-size: .9rem; color: var(--nb-icon); }
.pnav-pill:hover { color: #0f172a; background: var(--nb-hover); }
.pnav-pill.on { color: var(--nb-accent); background: #fff; border-color: var(--nb-track-border); box-shadow: 0 1px 2px rgba(16, 24, 40, .16); }
.pnav-pill.on i { color: var(--nb-accent); }
.pnav-capsule {
  display: flex; align-items: center; gap: 4px; background: var(--nb-capsule);
  border: 1px solid var(--nb-border); border-radius: 999px; padding: 3px;
  box-shadow: 0 1px 2px rgba(16, 24, 40, .06); flex-shrink: 0;
}
.pnav-iconbtn {
  display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px;
  border: none; background: transparent; border-radius: 999px; cursor: pointer; color: var(--nb-icon);
}
.pnav-iconbtn:hover { background: #fff; color: #0f172a; box-shadow: 0 1px 2px rgba(16, 24, 40, .12); }
.pnav-div { width: 1px; height: 18px; background: var(--nb-track); }
.pnav-profile {
  display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 10px 0 3px;
  border: none; background: transparent; border-radius: 999px; cursor: pointer;
  color: var(--nb-text); font-size: .84rem;
}
.pnav-profile:hover { background: #fff; box-shadow: 0 1px 2px rgba(16, 24, 40, .12); }
.pnav-avatar { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: #eff6ff; color: #1e40af; font-size: .85rem; }
.pnav-caret { font-size: .7rem !important; color: var(--nb-icon); }

/* ════════════ MOCK C2 (statique — inchangé) ════════════ */
.proto-c2 { padding: 12px 16px 40px; }
.proto-c2-header {
  display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-radius: 12px;
  background: linear-gradient(180deg, #1e293b, #243246); color: #fff; box-shadow: 0 4px 14px rgba(15,23,42,.25);
}
.proto-c2-back { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: 1px solid #3b4a61; background: #2b3a4f; color: #cbd5e1; cursor: pointer; flex-shrink: 0; }
.proto-c2-title { display: flex; flex-direction: column; line-height: 1.3; flex-shrink: 0; }
.proto-c2-title b { font-size: .95rem; font-weight: 800; }
.proto-c2-title span { font-size: .8rem; color: #94a3b8; }
.proto-c2-no { font-style: normal; color: #93c5fd; font-weight: 800; }
.proto-c2-stocks { display: flex; align-items: center; gap: 22px; flex: 1; justify-content: center; border: 1px solid #3b4a61; border-radius: 10px; padding: 8px 18px; min-width: 0; overflow: hidden; }
.proto-c2-stklbl { color: #7dd3fc; font-weight: 800; font-size: .78rem; letter-spacing: .08em; }
.proto-c2-stk { display: flex; flex-direction: column; line-height: 1.3; white-space: nowrap; }
.proto-c2-stk b { font-size: .74rem; color: #cbd5e1; font-weight: 700; }
.proto-c2-stk span { font-size: .74rem; color: #94a3b8; }
.proto-c2-stk .r { font-style: normal; color: #f87171; font-weight: 800; }
.proto-c2-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.proto-c2-total { display: flex; flex-direction: column; line-height: 1.25; text-align: right; }
.proto-c2-total span { font-size: .68rem; color: #94a3b8; }
.proto-c2-total b { font-size: 1.05rem; color: #93c5fd; font-weight: 800; }
.proto-c2-total em { font-style: normal; font-size: .66rem; color: #94a3b8; }
.proto-c2-oem { display: inline-flex; align-items: center; gap: 5px; border: 1px solid #16a34a; color: #4ade80; border-radius: 9px; padding: 7px 11px; font-weight: 700; font-size: .8rem; }
.proto-c2-cart { position: relative; display: inline-flex; align-items: center; gap: 5px; background: #2b3a4f; border: 1px solid #3b4a61; color: #fdba74; border-radius: 9px; padding: 7px 11px; font-weight: 700; cursor: pointer; }
.proto-c2-confirm { display: inline-flex; align-items: center; gap: 7px; background: #16a34a; color: #fff; border: none; border-radius: 9px; padding: 9px 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(22,163,74,.3); }

.proto-c2-body { display: flex; gap: 12px; margin-top: 12px; align-items: flex-start; }
.proto-c2-left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }

.proto-card { background: #fff; border: 1px solid #e8edf3; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(16,24,40,.05); }
.proto-card-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px; font-weight: 800; font-size: .8rem; color: #0f172a; letter-spacing: .03em; }
.proto-acc { width: 4px; height: 16px; border-radius: 3px; background: #2563eb; }
.proto-acc.eqv { background: #7c3aed; }
.proto-acc.kit { background: #0d9488; }
.proto-count { background: #eff6ff; color: #1d4ed8; border-radius: 999px; padding: 1px 9px; font-size: .72rem; font-weight: 800; }
.proto-badge { border-radius: 999px; padding: 1px 8px; font-size: .62rem; font-weight: 800; }
.proto-badge.dp { color: #4338ca; background: #eef2ff; border: 1px solid #c7d2fe; }
.proto-badge.cmd { color: #c2410c; background: #fff7ed; border: 1px solid #fed7aa; }
.proto-badge.imp { color: #1d4ed8; background: #eff6ff; border: 1px solid #dbeafe; }

.proto-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.proto-table th { background: #f8fafc; color: #475569; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; text-align: right; padding: 8px 10px; border-bottom: 1.5px solid #e8edf3; white-space: nowrap; }
.proto-table th.l { text-align: left; }
.proto-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #1f2937; font-variant-numeric: tabular-nums; }
.proto-table td.l { text-align: left; }
.proto-table td.n { font-weight: 650; }
.proto-table tr.sel { background: #eff6ff; }
.proto-table td b { display: block; font-weight: 700; color: #0f172a; }
.proto-table td em { display: block; font-style: normal; font-size: 11.5px; color: #64748b; }
.proto-idx { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 16px; margin-right: 6px; padding: 0 5px; font-size: .62rem; font-weight: 800; color: #64748b; background: #eef2f7; border: 1px solid #e2e8f0; border-radius: 6px; vertical-align: middle; float: left; margin-top: 2px; }
.proto-idx.on { color: #fff; background: #2563eb; border-color: #2563eb; }
.proto-dp { font-size: 11px !important; }
.proto-stk { display: inline-block; min-width: 30px; text-align: center; font-weight: 800; padding: 2px 9px; border-radius: 6px; background: #fee2e2; color: #b91c1c; }
.proto-input { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 26px; border: 1px solid #d8dee7; border-radius: 6px; font-weight: 600; margin-right: 6px; }
.proto-ok { color: #16a34a; }
.proto-cartic { color: #94a3b8; }
.proto-table td.acts { white-space: nowrap; text-align: center; }
.proto-table td.acts i { color: #94a3b8; margin: 0 2px; font-size: .88rem; }
.proto-empty { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 26px; color: #94a3b8; font-style: italic; font-size: .85rem; }

.proto-hist { width: min(420px, 32vw); flex-shrink: 0; background: #fff; border: 1px solid #e8edf3; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(16,24,40,.05); }
.proto-hist-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: linear-gradient(180deg, #1e293b, #243246); color: #fff; font-weight: 800; font-size: .8rem; }
.proto-hist-head i { color: #7dd3fc; }
.proto-hist-year { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,.12); border-radius: 8px; padding: 3px 10px; font-size: .78rem; }
.proto-hist-ref { padding: 10px 14px; border-bottom: 1px solid #e8edf3; }
.proto-hist-ref b { font-weight: 800; color: #0f172a; font-size: .92rem; display: block; }
.proto-hist-ref span { font-size: .78rem; color: #64748b; }
.proto-hist-kpis { display: flex; border-bottom: 1px solid #e8edf3; background: #fcfdff; }
.proto-hist-kpis .k { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 9px 0; border-right: 1px solid #f1f5f9; }
.proto-hist-kpis .k:last-child { border-right: none; }
.proto-hist-kpis .k i { font-style: normal; font-size: .66rem; text-transform: uppercase; color: #64748b; }
.proto-hist-kpis .k b { font-size: 1.05rem; color: #0f172a; }
.proto-hist-kpis .k b.g { color: #16a34a; }
.proto-hist-kpis .k b.r { color: #dc2626; }
</style>
