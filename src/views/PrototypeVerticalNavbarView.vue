<script setup>
// ──────────────────────────────────────────────────────────────────────────
// PAGE PROTOTYPE (laboratoire UI) — navigation VERTICALE gauche + mock C2.
// Sidebar : brand navy C2 en haut, menu clair, rappel navy (version) en bas.
// Aucune API, aucun store. TheNavbar.vue et la vraie page C2 NON modifiés.
// Route temporaire : /prototype-vertical-navbar (accessible par URL seulement)
// ──────────────────────────────────────────────────────────────────────────
import { ref } from 'vue';

const sidebarOpen = ref(false); // mobile uniquement
const collapsed = ref(false);   // desktop : sidebar 240px (ouverte) ↔ 72px (réduite)

// 7 entrées (visuel uniquement — aucun lien réel). Confirmation Achat active.
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
  <div class="pv-shell">
    <!-- Bouton menu (mobile) -->
    <button type="button" class="pv-mobile-toggle" aria-label="Menu" @click="sidebarOpen = !sidebarOpen">
      <i class="pi pi-bars"></i>
    </button>
    <div v-if="sidebarOpen" class="pv-overlay" @click="sidebarOpen = false"></div>

    <!-- ═══════════ SIDEBAR VERTICALE ═══════════ -->
    <aside class="pv-sidebar" :class="{ open: sidebarOpen, collapsed }">
      <!-- 1. Brand : CARTE navy alignée (haut/bas) avec le header C2.
           Expanded → texte "Reapro / ERP Achat" + bouton collapse.
           Collapsed → bouton collapse SEUL (ni titre, ni icône app). -->
      <div class="pv-brandcard">
        <div class="pv-brandtxt"><b>Reapro</b><em>ERP Achat</em></div>
        <button type="button" class="pv-collapse" :title="collapsed ? 'Déployer le menu' : 'Réduire le menu'"
          :aria-label="collapsed ? 'Déployer le menu' : 'Réduire le menu'" @click="collapsed = !collapsed">
          <i :class="collapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'"></i>
        </button>
      </div>

      <!-- 2. Menu vertical (clair) — groupe principal, zone scrollable -->
      <div class="pv-section">Navigation</div>
      <nav class="pv-menu">
        <a v-for="it in navItems" :key="it.label" href="#" class="pv-link" :class="{ 'is-active': it.active }"
          :title="it.label" @click.prevent="sidebarOpen = false">
          <i :class="it.icon"></i><span class="pv-label">{{ it.label }}</span>
        </a>
      </nav>

      <!-- Zone compte (séparée, ancrée en bas) -->
      <div class="pv-actions">
        <a href="#" class="pv-link" title="Paramètres" @click.prevent><i class="pi pi-cog"></i><span class="pv-label">Paramètres</span></a>
        <a href="#" class="pv-link" title="Ellouze" @click.prevent>
          <span class="pv-avatar"><i class="pi pi-user"></i></span><span class="pv-label">Ellouze</span>
          <i class="pi pi-angle-down pv-caret"></i>
        </a>
      </div>

      <!-- 3. Pied : rappel navy header (version / chip). Collapsed → seul "v2.5" reste. -->
      <div class="pv-foot">
        <div class="pv-foot-card">
          <span class="pv-foot-version"><span class="pv-foot-app">Reapro </span>v2.5</span>
          <span class="pv-foot-chip">Achat</span>
        </div>
      </div>
    </aside>

    <!-- ═══════════ CONTENU — MOCK STATIQUE C2 (aucune API) ═══════════ -->
    <main class="pv-content">
      <div class="pv-c2">
        <div class="pv-c2-header">
          <button type="button" class="pv-c2-back"><i class="pi pi-arrow-left"></i></button>
          <div class="pv-c2-title">
            <b>Confirmation Commandes Achat</b>
            <span><i class="pv-c2-no">COMP26-00072</i> · Vaico 3</span>
          </div>
          <div class="pv-c2-stocks">
            <span class="pv-c2-stklbl">STOCKS</span>
            <div class="pv-c2-stk"><b>SFAX SILVER STAR</b><span><i class="r">0</i> | Dern. —</span></div>
            <div class="pv-c2-stk"><b>STE COPIM</b><span><i class="r">0</i> | Dern. 01/01/01</span></div>
            <div class="pv-c2-stk"><b>STE MPAA</b><span><i class="r">0</i> | Dern. 01/01/01</span></div>
          </div>
          <div class="pv-c2-right">
            <div class="pv-c2-total"><span>DP26-00390</span><b>40 820.60 <em>TND</em></b></div>
            <span class="pv-c2-oem"><i class="pi pi-sitemap"></i> OEM 1</span>
            <button type="button" class="pv-c2-cart"><i class="pi pi-shopping-cart"></i><span>0</span></button>
            <button type="button" class="pv-c2-confirm"><i class="pi pi-check"></i> Confirmer</button>
          </div>
        </div>

        <div class="pv-c2-body">
          <div class="pv-c2-left">
            <div class="pv-card">
              <div class="pv-card-head"><span class="pv-acc"></span>FOURNISSEURS
                <span class="pv-count">1250</span><span class="pv-badge dp">DP 1</span></div>
              <table class="pv-table">
                <thead><tr><th class="l">Frs</th><th class="l">Réf / Désignation</th><th>Stock</th><th>Coût Dir.</th>
                  <th>Prix Rev.</th><th>Prix Vte</th><th>CF F</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr v-for="r in mockFrs" :key="r.n" :class="{ sel: r.sel }">
                    <td class="l"><span class="pv-idx" :class="{ on: r.sel }">{{ r.n }}</span><b>{{ r.frs }}</b>
                      <em class="pv-dp">{{ r.dp }}</em></td>
                    <td class="l"><b>{{ r.ref }}</b><em>{{ r.desc }}</em></td>
                    <td><span class="pv-stk">{{ r.stock }}</span></td>
                    <td class="n">{{ r.cout }}</td><td class="n">{{ r.prev }}</td><td class="n">{{ r.pvte }}</td>
                    <td><span class="pv-input">{{ r.cf }}</span><i class="pi pi-check-circle pv-ok"></i></td>
                    <td class="acts"><i class="pi pi-info-circle"></i><i class="pi pi-comment"></i><i
                        class="pi pi-flag"></i></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pv-card">
              <div class="pv-card-head"><span class="pv-acc eqv"></span>ÉQUIVALENCE
                <span class="pv-count">6</span><span class="pv-badge cmd">CMD 0</span><span
                  class="pv-badge imp">IMP 0</span></div>
              <table class="pv-table">
                <thead><tr><th class="l">Frs</th><th class="l">Réf / Désignation</th><th>Stock</th><th>Prix Dev.</th>
                  <th>Coût Calc.</th><th>Panier</th><th>Actions</th></tr></thead>
                <tbody>
                  <tr v-for="r in mockEqv" :key="r.ref">
                    <td class="l"><b>{{ r.frs }}</b></td>
                    <td class="l"><b>{{ r.ref }}</b><em>{{ r.desc }}</em></td>
                    <td><span class="pv-stk">{{ r.stock }}</span></td>
                    <td class="n">{{ r.prix }}</td><td class="n">{{ r.cout }}</td>
                    <td><span class="pv-input">1</span><i class="pi pi-shopping-cart pv-cartic"></i></td>
                    <td class="acts"><i class="pi pi-info-circle"></i><i class="pi pi-comment"></i></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="pv-card">
              <div class="pv-card-head"><span class="pv-acc kit"></span>KIT
                <span class="pv-count">0</span><span class="pv-badge cmd">CMD 0</span><span
                  class="pv-badge imp">IMP 0</span></div>
              <div class="pv-empty"><i class="pi pi-inbox"></i> Aucun kit</div>
            </div>
          </div>

          <aside class="pv-hist">
            <div class="pv-hist-head"><i class="pi pi-history"></i> Historique
              <span class="pv-hist-year"><i class="pi pi-chevron-left"></i> 2026 <i
                  class="pi pi-chevron-right"></i></span></div>
            <div class="pv-hist-ref"><b>15-99-2001</b><span>Thermostat d'eau - Cayenne 9PA</span></div>
            <div class="pv-hist-kpis">
              <span class="k"><i>Stock</i><b>0</b></span><span class="k"><i>Achat</i><b class="g">0</b></span>
              <span class="k"><i>Vente</i><b class="g">0</b></span><span class="k"><i>Rupt</i><b
                  class="r">0</b></span>
            </div>
            <div class="pv-empty"><i class="pi pi-inbox"></i> Aucun mouvement</div>
          </aside>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ════════════ Laboratoire navigation verticale (styles 100% locaux, préfixe pv-) ════════════ */
.pv-shell {
  display: flex; min-height: 100vh; background: #f1f5f9;
  font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
}

/* ═══════════ SIDEBAR ═══════════ */
.pv-sidebar {
  width: 240px; flex-shrink: 0; display: flex; flex-direction: column;
  background: #f7f9fc;                          /* clair, mais pas blanc pur */
  border-right: 1px solid #dde4ee;
  box-shadow: 1px 0 4px rgba(16, 24, 40, .05);
  position: sticky; top: 0; height: 100vh;
  transition: width .22s ease;
}
.pv-sidebar.collapsed { width: 70px; }   /* -20% (88px → 70px) : bouton collapse centré seul */

/* 1. Brand — CARTE navy arrondie : même marge haute (12px), même radius (12px) et
   hauteur calée sur la carte header C2 du contenu → haut ET bas alignés, une seule
   ligne visuelle gauche/droite. */
.pv-brandcard {
  display: flex; align-items: center; gap: 10px;
  /* Hauteur calée sur le header C2 : top (margin 12) = top du header (.pv-c2 padding 12),
     min-height = hauteur rendue du header → bas alignés, plus d'écart (ligne rouge). */
  margin: 12px 10px 8px; padding: 10px 14px; min-height: 73px; box-sizing: border-box;
  background: linear-gradient(180deg, #1e293b, #243246);
  border: 1px solid #3b4a61; border-radius: 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06), 0 4px 14px rgba(15, 23, 42, .18);
  flex-shrink: 0;
}

/* Bouton collapse/expand — INTÉGRÉ dans la carte brand (ghost navy net, même
   langage que les boutons du header C2). Carré 30px, icône parfaitement centrée. */
.pv-collapse {
  margin-left: auto; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 9px; padding: 0; line-height: 0;
  background: rgba(255, 255, 255, .06); border: 1px solid rgba(255, 255, 255, .16);
  color: #cbd5e1; cursor: pointer; font-size: .8rem;
  transition: background .15s ease, color .15s ease, border-color .15s ease;
}
.pv-collapse:hover { background: rgba(255, 255, 255, .14); border-color: rgba(255, 255, 255, .28); color: #fff; }
.pv-collapse:active { background: rgba(255, 255, 255, .2); }
.pv-brandtxt { display: flex; flex-direction: column; line-height: 1.2; }
.pv-brandtxt b { font-size: 1.05rem; font-weight: 800; color: #fff; letter-spacing: -.02em; }
.pv-brandtxt em {
  font-style: normal; font-size: .62rem; font-weight: 700; color: #7dd3fc;
  text-transform: uppercase; letter-spacing: .08em;
}

/* 2. Menu vertical (clair) — groupe scrollable, items homogènes */
.pv-section {
  padding: 4px 16px 6px; font-size: .62rem; font-weight: 800; letter-spacing: .08em;
  text-transform: uppercase; color: #64748b; flex-shrink: 0;
}
.pv-menu {
  flex: 1; min-height: 0; overflow-y: auto;
  display: flex; flex-direction: column; gap: 2px; padding: 2px 10px 8px;
}
.pv-menu::-webkit-scrollbar { width: 6px; }
.pv-menu::-webkit-scrollbar-thumb { background: #d3dbe6; border-radius: 999px; }
.pv-link {
  position: relative; display: flex; align-items: center; gap: 11px;
  min-height: 40px; padding: 0 12px;
  color: #475569; border-radius: 10px;
  font-weight: 600; font-size: .86rem; text-decoration: none; cursor: pointer;
  transition: background .15s ease, color .15s ease;
}
.pv-link i { font-size: .98rem; color: #7c8898; width: 22px; text-align: center; flex-shrink: 0; transition: color .15s ease; }
.pv-link .pv-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pv-link:hover { background: #eef3f9; color: #0f172a; }
.pv-link:hover i { color: #475569; }
.pv-link.is-active {
  background: linear-gradient(90deg, #dbeafe, #eaf2ff);
  color: #1d4ed8; font-weight: 700;
}
.pv-link.is-active i { color: #1d4ed8; }
/* Indicateur vertical arrondi à gauche de l'item actif (élégant, sans décaler le layout) */
.pv-link.is-active::before {
  content: ''; position: absolute; left: 4px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 18px; border-radius: 3px; background: #2563eb;
}

/* Actions bas de menu (Paramètres / profil) — séparées, ancrées en bas */
.pv-actions { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border-top: 1px solid #e4eaf2; flex-shrink: 0; }
.pv-avatar {
  display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px;
  border-radius: 50%; background: #eff6ff; color: #1e40af; font-size: .78rem; flex-shrink: 0;
  margin-left: -3px;
}
.pv-caret { margin-left: auto; font-size: .7rem !important; color: #94a3b8; }

/* 3. Pied — rappel navy header (version + chip) */
.pv-foot { padding: 10px; flex-shrink: 0; }
.pv-foot-card {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 9px 12px; border-radius: 10px;
  background: linear-gradient(180deg, #1e293b, #243246);
  border: 1px solid #3b4a61;
}
.pv-foot-version { font-size: .74rem; font-weight: 700; color: #cbd5e1; white-space: nowrap; }
.pv-foot-app { font-size: inherit; color: inherit; }
.pv-foot-chip {
  font-size: .6rem; font-weight: 800; text-transform: uppercase; letter-spacing: .07em;
  color: #dbeafe; background: rgba(59, 130, 246, .22); border: 1px solid rgba(147, 197, 253, .5);
  border-radius: 999px; padding: 2px 9px;
}

/* ─── Mode COLLAPSED (88px) : icônes seules ; brand = icône Achat + chevron sur la MÊME ligne ─── */
.pv-sidebar.collapsed .pv-brandcard { justify-content: center; gap: 0; margin: 12px 8px 8px; padding: 9px 6px; }
.pv-sidebar.collapsed .pv-brandtxt { display: none; }
.pv-sidebar.collapsed .pv-collapse { margin-left: 0; width: 30px; height: 30px; }
.pv-sidebar.collapsed .pv-section { display: none; }
.pv-sidebar.collapsed .pv-menu { padding: 6px 8px; }
.pv-sidebar.collapsed .pv-link { justify-content: center; gap: 0; padding: 0; }
.pv-sidebar.collapsed .pv-link .pv-label { display: none; }
.pv-sidebar.collapsed .pv-link i { width: auto; }
.pv-sidebar.collapsed .pv-link.is-active::before { display: none; }   /* rail : repère = fond, pas la barre */
.pv-sidebar.collapsed .pv-caret { display: none; }
.pv-sidebar.collapsed .pv-avatar { margin-left: 0; }
.pv-sidebar.collapsed .pv-foot-card { justify-content: center; padding: 9px 6px; }
.pv-sidebar.collapsed .pv-foot-app, .pv-sidebar.collapsed .pv-foot-chip { display: none; }

/* ═══════════ CONTENU ═══════════ */
.pv-content { flex: 1; min-width: 0; }
.pv-c2 { padding: 12px 16px 40px; }
.pv-c2-header {
  display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-radius: 12px;
  background: linear-gradient(180deg, #1e293b, #243246); color: #fff; box-shadow: 0 4px 14px rgba(15,23,42,.25);
}
.pv-c2-back { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: 1px solid #3b4a61; background: #2b3a4f; color: #cbd5e1; cursor: pointer; flex-shrink: 0; }
.pv-c2-title { display: flex; flex-direction: column; line-height: 1.3; flex-shrink: 0; }
.pv-c2-title b { font-size: .95rem; font-weight: 800; }
.pv-c2-title span { font-size: .8rem; color: #94a3b8; }
.pv-c2-no { font-style: normal; color: #93c5fd; font-weight: 800; }
.pv-c2-stocks { display: flex; align-items: center; gap: 22px; flex: 1; justify-content: center; border: 1px solid #3b4a61; border-radius: 10px; padding: 8px 18px; min-width: 0; overflow: hidden; }
.pv-c2-stklbl { color: #7dd3fc; font-weight: 800; font-size: .78rem; letter-spacing: .08em; }
.pv-c2-stk { display: flex; flex-direction: column; line-height: 1.3; white-space: nowrap; }
.pv-c2-stk b { font-size: .74rem; color: #cbd5e1; font-weight: 700; }
.pv-c2-stk span { font-size: .74rem; color: #94a3b8; }
.pv-c2-stk .r { font-style: normal; color: #f87171; font-weight: 800; }
.pv-c2-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.pv-c2-total { display: flex; flex-direction: column; line-height: 1.25; text-align: right; }
.pv-c2-total span { font-size: .68rem; color: #94a3b8; }
.pv-c2-total b { font-size: 1.05rem; color: #93c5fd; font-weight: 800; }
.pv-c2-total em { font-style: normal; font-size: .66rem; color: #94a3b8; }
.pv-c2-oem { display: inline-flex; align-items: center; gap: 5px; border: 1px solid #16a34a; color: #4ade80; border-radius: 9px; padding: 7px 11px; font-weight: 700; font-size: .8rem; }
.pv-c2-cart { position: relative; display: inline-flex; align-items: center; gap: 5px; background: #2b3a4f; border: 1px solid #3b4a61; color: #fdba74; border-radius: 9px; padding: 7px 11px; font-weight: 700; cursor: pointer; }
.pv-c2-confirm { display: inline-flex; align-items: center; gap: 7px; background: #16a34a; color: #fff; border: none; border-radius: 9px; padding: 9px 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(22,163,74,.3); }

.pv-c2-body { display: flex; gap: 12px; margin-top: 12px; align-items: flex-start; }
.pv-c2-left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }

.pv-card { background: #fff; border: 1px solid #e8edf3; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(16,24,40,.05); }
.pv-card-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px; font-weight: 800; font-size: .8rem; color: #0f172a; letter-spacing: .03em; }
.pv-acc { width: 4px; height: 16px; border-radius: 3px; background: #2563eb; }
.pv-acc.eqv { background: #7c3aed; }
.pv-acc.kit { background: #0d9488; }
.pv-count { background: #eff6ff; color: #1d4ed8; border-radius: 999px; padding: 1px 9px; font-size: .72rem; font-weight: 800; }
.pv-badge { border-radius: 999px; padding: 1px 8px; font-size: .62rem; font-weight: 800; }
.pv-badge.dp { color: #4338ca; background: #eef2ff; border: 1px solid #c7d2fe; }
.pv-badge.cmd { color: #c2410c; background: #fff7ed; border: 1px solid #fed7aa; }
.pv-badge.imp { color: #1d4ed8; background: #eff6ff; border: 1px solid #dbeafe; }

.pv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.pv-table th { background: #f8fafc; color: #475569; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; text-align: right; padding: 8px 10px; border-bottom: 1.5px solid #e8edf3; white-space: nowrap; }
.pv-table th.l { text-align: left; }
.pv-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #1f2937; font-variant-numeric: tabular-nums; }
.pv-table td.l { text-align: left; }
.pv-table td.n { font-weight: 650; }
.pv-table tr.sel { background: #eff6ff; }
.pv-table td b { display: block; font-weight: 700; color: #0f172a; }
.pv-table td em { display: block; font-style: normal; font-size: 11.5px; color: #64748b; }
.pv-idx { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 16px; margin-right: 6px; padding: 0 5px; font-size: .62rem; font-weight: 800; color: #64748b; background: #eef2f7; border: 1px solid #e2e8f0; border-radius: 6px; vertical-align: middle; float: left; margin-top: 2px; }
.pv-idx.on { color: #fff; background: #2563eb; border-color: #2563eb; }
.pv-dp { font-size: 11px !important; }
.pv-stk { display: inline-block; min-width: 30px; text-align: center; font-weight: 800; padding: 2px 9px; border-radius: 6px; background: #fee2e2; color: #b91c1c; }
.pv-input { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 26px; border: 1px solid #d8dee7; border-radius: 6px; font-weight: 600; margin-right: 6px; }
.pv-ok { color: #16a34a; }
.pv-cartic { color: #94a3b8; }
.pv-table td.acts { white-space: nowrap; text-align: center; }
.pv-table td.acts i { color: #94a3b8; margin: 0 2px; font-size: .88rem; }
.pv-empty { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 26px; color: #94a3b8; font-style: italic; font-size: .85rem; }

.pv-hist { width: min(420px, 30vw); flex-shrink: 0; background: #fff; border: 1px solid #e8edf3; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(16,24,40,.05); }
.pv-hist-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: linear-gradient(180deg, #1e293b, #243246); color: #fff; font-weight: 800; font-size: .8rem; }
.pv-hist-head i { color: #7dd3fc; }
.pv-hist-year { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,.12); border-radius: 8px; padding: 3px 10px; font-size: .78rem; }
.pv-hist-ref { padding: 10px 14px; border-bottom: 1px solid #e8edf3; }
.pv-hist-ref b { font-weight: 800; color: #0f172a; font-size: .92rem; display: block; }
.pv-hist-ref span { font-size: .78rem; color: #64748b; }
.pv-hist-kpis { display: flex; border-bottom: 1px solid #e8edf3; background: #fcfdff; }
.pv-hist-kpis .k { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 9px 0; border-right: 1px solid #f1f5f9; }
.pv-hist-kpis .k:last-child { border-right: none; }
.pv-hist-kpis .k i { font-style: normal; font-size: .66rem; text-transform: uppercase; color: #64748b; }
.pv-hist-kpis .k b { font-size: 1.05rem; color: #0f172a; }
.pv-hist-kpis .k b.g { color: #16a34a; }
.pv-hist-kpis .k b.r { color: #dc2626; }

/* ═══════════ Responsive simple ═══════════ */
.pv-mobile-toggle { display: none; }
.pv-overlay { display: none; }

@media (max-width: 1024px) {
  .pv-sidebar {
    position: fixed; left: 0; top: 0; bottom: 0; z-index: 1099;
    transform: translateX(-100%); transition: transform .22s ease;
  }
  .pv-sidebar.open { transform: translateX(0); }
  /* Le collapse est un mode DESKTOP : neutralisé en drawer mobile (toujours 240px, labels visibles) */
  .pv-collapse { display: none; }
  .pv-sidebar.collapsed { width: 240px; }
  .pv-sidebar.collapsed .pv-brandcard { justify-content: flex-start; gap: 10px; margin: 12px 10px 8px; padding: 11px 12px; }
  .pv-sidebar.collapsed .pv-brandtxt { display: flex; }
  .pv-sidebar.collapsed .pv-section { display: block; }
  .pv-sidebar.collapsed .pv-menu { padding: 2px 10px 8px; }
  .pv-sidebar.collapsed .pv-link { justify-content: flex-start; gap: 11px; padding: 0 12px; }
  .pv-sidebar.collapsed .pv-link.is-active::before { display: block; }
  .pv-sidebar.collapsed .pv-link .pv-label { display: inline; }
  .pv-sidebar.collapsed .pv-caret { display: inline; }
  .pv-sidebar.collapsed .pv-foot-card { justify-content: space-between; padding: 9px 12px; }
  .pv-sidebar.collapsed .pv-foot-app, .pv-sidebar.collapsed .pv-foot-chip { display: inline; }
  .pv-overlay { display: block; position: fixed; inset: 0; background: rgba(15, 23, 42, .45); z-index: 1098; }
  .pv-mobile-toggle {
    display: inline-flex; align-items: center; justify-content: center;
    position: fixed; top: 12px; left: 12px; z-index: 1097;
    width: 40px; height: 40px; border: 1px solid #3b4a61; border-radius: 10px;
    background: linear-gradient(180deg, #1e293b, #243246); color: #cbd5e1; cursor: pointer;
    box-shadow: 0 2px 8px rgba(15, 23, 42, .3);
  }
  .pv-c2 { padding-top: 60px; }
}
</style>
