<template>
  <div class="uilab">
    <!-- Barre de sélection des maquettes -->
    <div class="uilab-bar">
      <div class="uilab-bar-left">
        <span class="uilab-logo">UI LAB</span>
        <span class="uilab-title">Confirmation Achat — prototypes visuels</span>
      </div>
      <div class="uilab-switch">
        <button :class="{ on: design === 'A' }" @click="design = 'A'">Design A · ERP compact</button>
        <button :class="{ on: design === 'B' }" @click="design = 'B'">Design B · Dashboard cards</button>
        <button :class="{ on: design === 'C' }" @click="design = 'C'">Design C · Data grid dense</button>
        <button :class="{ on: design === 'C2' }" @click="design = 'C2'">Design C2 · Data grid premium ★</button>
      </div>
    </div>

    <!-- ══════════════════════════ DESIGN A : ERP compact premium ══════════════════════════ -->
    <section v-if="design === 'A'" class="a-root">
      <header class="a-header">
        <button class="a-back"><i class="pi pi-arrow-left"></i></button>
        <div class="a-titlewrap">
          <h1>Confirmation Commandes Achat</h1>
          <div class="a-sub"><b>{{ mock.compareNo }}</b><span>—</span>{{ mock.compareDesc }}</div>
        </div>
        <div class="a-stockband">
          <span class="a-stocklabel">STOCKS</span>
          <div v-for="s in mock.stocks" :key="s.ste" class="a-stockcell">
            <span class="a-ste">{{ s.ste }}</span>
            <span class="a-stockval" :class="s.stock > 0 ? 'pos' : 'neg'">{{ s.stock }}</span>
            <span class="a-stockdate">{{ s.last }}</span>
          </div>
        </div>
        <div class="a-total"><span>{{ mock.docNo }}</span><b>{{ mock.total }}</b></div>
        <button class="a-cart"><i class="pi pi-shopping-cart"></i><em>{{ mock.cart }}</em></button>
        <button class="a-confirm"><i class="pi pi-check-circle"></i> Confirmer Commande</button>
      </header>

      <div class="a-body">
        <div class="a-left">
          <!-- FRS -->
          <div class="a-card">
            <div class="a-card-head"><span class="a-bar"></span>FOURNISSEURS</div>
            <table class="a-table">
              <thead>
                <tr>
                  <th>Doc</th><th class="left">Frs</th><th>Réf / Désig</th>
                  <th class="a-th-filter">Stock <i class="pi pi-filter on"></i></th>
                  <th>Appro</th><th class="num">Cout Dir.</th><th class="num">Prix Rev.</th>
                  <th class="num">Prix Vente</th><th class="num">Qté conf.</th><th>Info</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in mock.frs" :key="r.no" :class="{ sel: i === 0 }">
                  <td class="muted">{{ r.documentNo }}</td>
                  <td>{{ r.frs }}</td>
                  <td><div class="ref">{{ r.no }}</div><div class="desc">{{ r.description }}</div></td>
                  <td><span class="a-pill" :class="r.stock > 0 ? 'g' : 'r'">{{ r.stock }}</span></td>
                  <td><span class="a-tag">Imp {{ r.imp }}</span><span class="a-tag cmd">Cmd {{ r.cmd }}</span></td>
                  <td class="num">{{ r.coutDirect }}</td>
                  <td class="num">{{ r.prixRevient }}</td>
                  <td class="num">{{ r.prixVente }}</td>
                  <td class="num"><input class="a-input" :value="r.qteAConfirmer" /></td>
                  <td class="actions"><i class="pi pi-info-circle"></i><i class="pi pi-check-circle ok"></i></td>
                </tr>
              </tbody>
            </table>
            <!-- Filtre segmenté ouvert (démo) -->
            <div class="a-filter">
              <div class="a-filter-head">Stock <button class="x"><i class="pi pi-times"></i></button></div>
              <div class="a-filter-label">Condition</div>
              <div class="seg">
                <button v-for="o in ops" :key="o.v" :class="{ on: o.v === 'gt' }" :title="o.t">{{ o.s }}</button>
              </div>
              <div class="a-filter-label">Valeur</div>
              <input class="a-filter-val" value="10" />
              <div class="a-filter-actions"><button class="ghost">Effacer</button><button class="prim">Appliquer</button></div>
            </div>
          </div>

          <!-- EQV -->
          <div class="a-card">
            <div class="a-card-head"><span class="a-bar"></span>ÉQUIVALENCE</div>
            <table class="a-table">
              <thead><tr><th class="left">Frs</th><th>Réf / Désig</th><th>Stock</th><th class="num">Prix Dev.</th><th class="num">Coût Calc.</th><th class="num">Prix Vente</th><th>Panier</th><th>Info</th></tr></thead>
              <tbody>
                <tr v-for="e in mock.eqv" :key="e.no">
                  <td>{{ e.frs }}</td>
                  <td><div class="ref">{{ e.no }}</div><div class="desc">{{ e.description }}</div></td>
                  <td><span class="a-pill" :class="e.stock > 0 ? 'g' : 'r'">{{ e.stock }}</span></td>
                  <td class="num">{{ e.prixDevise }}</td><td class="num">{{ e.coutCalcule }}</td><td class="num">{{ e.prixVente }}</td>
                  <td><input class="a-input" value="1" /></td>
                  <td class="actions"><i class="pi pi-info-circle"></i><i class="pi pi-shopping-cart"></i></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- KIT -->
          <div class="a-card">
            <div class="a-card-head"><span class="a-bar"></span>KIT</div>
            <table class="a-table">
              <thead><tr><th class="left">Frs</th><th>Réf / Désig</th><th>Stock</th><th class="num">Coût Calc.</th><th class="num">Prix Vente</th><th>Info</th></tr></thead>
              <tbody>
                <tr v-for="k in mock.kit" :key="k.no">
                  <td>{{ k.frs }}</td>
                  <td><div class="ref">{{ k.no }}</div><div class="desc">{{ k.description }}</div></td>
                  <td><span class="a-pill" :class="k.stock > 0 ? 'g' : 'r'">{{ k.stock }}</span></td>
                  <td class="num">{{ k.coutCalcule }}</td><td class="num">{{ k.prixVente }}</td>
                  <td class="actions"><i class="pi pi-info-circle"></i></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Historique -->
        <aside class="a-side">
          <div class="a-side-head"><button class="a-histbtn">Historique</button><span class="a-ref">{{ mock.frs[0].no }}</span><div class="a-year"><i class="pi pi-chevron-left"></i>2026<i class="pi pi-chevron-right"></i></div></div>
          <div class="a-kpis"><span>Stock 0</span><span>Achat 4</span><span>Vente 12</span><span>Rupt 0</span></div>
          <table class="a-table a-hist">
            <thead><tr><th>Date</th><th>Type</th><th>Client/Frs</th><th class="num">Qté</th><th class="num">PU</th></tr></thead>
            <tbody>
              <tr v-for="(h, i) in mock.hist" :key="i"><td>{{ h.date }}</td><td><span class="a-typ" :class="h.type">{{ h.type }}</span></td><td>{{ h.tiers }}</td><td class="num">{{ h.qte }}</td><td class="num">{{ h.pu }}</td></tr>
            </tbody>
          </table>
        </aside>
      </div>
    </section>

    <!-- ══════════════════════════ DESIGN B : Dashboard cards ══════════════════════════ -->
    <section v-else-if="design === 'B'" class="b-root">
      <header class="b-header">
        <div class="b-headtop">
          <button class="b-back"><i class="pi pi-arrow-left"></i> Retour</button>
          <div class="b-title"><h1>Confirmation Commandes Achat</h1><span>{{ mock.compareNo }} — {{ mock.compareDesc }}</span></div>
          <button class="b-confirm"><i class="pi pi-check-circle"></i> Confirmer Commande</button>
        </div>
        <div class="b-kpirow">
          <div class="b-kpi" v-for="s in mock.stocks" :key="s.ste"><span class="b-kpi-lbl">{{ s.ste }}</span><span class="b-kpi-val" :class="s.stock > 0 ? 'pos' : 'neg'">{{ s.stock }}</span><span class="b-kpi-sub">Dernier achat {{ s.last }}</span></div>
          <div class="b-kpi accent"><span class="b-kpi-lbl">Total document</span><span class="b-kpi-val">{{ mock.total }}</span><span class="b-kpi-sub">{{ mock.docNo }}</span></div>
          <div class="b-kpi cart"><i class="pi pi-shopping-cart"></i><span class="b-kpi-val">{{ mock.cart }}</span><span class="b-kpi-sub">articles au panier</span></div>
        </div>
      </header>

      <div class="b-body">
        <div class="b-left">
          <div class="b-card">
            <div class="b-card-head"><i class="pi pi-truck"></i><h2>Fournisseurs</h2><span class="b-count">{{ mock.frs.length }}</span>
              <div class="b-filterchip on"><i class="pi pi-filter"></i> Stock &gt; 10</div>
            </div>
            <div class="b-rows">
              <div v-for="(r, i) in mock.frs" :key="r.no" class="b-row" :class="{ sel: i === 0 }">
                <div class="b-row-main">
                  <div class="b-row-ref">{{ r.no }}<span class="b-doc">{{ r.documentNo }}</span></div>
                  <div class="b-row-desc">{{ r.description }} · Frs {{ r.frs }}</div>
                </div>
                <div class="b-chip" :class="r.stock > 0 ? 'g' : 'r'">Stock {{ r.stock }}</div>
                <div class="b-chip n">Imp {{ r.imp }}</div>
                <div class="b-chip n">Cmd {{ r.cmd }}</div>
                <div class="b-prices"><span>Revient<b>{{ r.prixRevient }}</b></span><span>Vente<b>{{ r.prixVente }}</b></span></div>
                <input class="b-qty" :value="r.qteAConfirmer" />
                <div class="b-acts"><i class="pi pi-info-circle"></i><i class="pi pi-check-circle ok"></i></div>
              </div>
            </div>
            <!-- Filtre segmenté ouvert (démo) -->
            <div class="b-filter">
              <div class="b-filter-head"><span>Filtrer : Stock</span><button class="x"><i class="pi pi-times"></i></button></div>
              <span class="b-filter-lbl">Condition</span>
              <div class="seg b">
                <button v-for="o in ops" :key="o.v" :class="{ on: o.v === 'gt' }" :title="o.t">{{ o.s }}</button>
              </div>
              <span class="b-filter-lbl">Valeur</span>
              <input class="b-filter-val" value="10" />
              <div class="b-filter-actions"><button class="ghost">Effacer</button><button class="prim">Appliquer</button></div>
            </div>
          </div>

          <div class="b-card">
            <div class="b-card-head"><i class="pi pi-sync"></i><h2>Équivalence</h2><span class="b-count">{{ mock.eqv.length }}</span></div>
            <div class="b-rows">
              <div v-for="e in mock.eqv" :key="e.no" class="b-row">
                <div class="b-row-main"><div class="b-row-ref">{{ e.no }}</div><div class="b-row-desc">{{ e.description }} · Frs {{ e.frs }}</div></div>
                <div class="b-chip" :class="e.stock > 0 ? 'g' : 'r'">Stock {{ e.stock }}</div>
                <div class="b-prices"><span>Calc.<b>{{ e.coutCalcule }}</b></span><span>Vente<b>{{ e.prixVente }}</b></span></div>
                <input class="b-qty" value="1" />
                <div class="b-acts"><i class="pi pi-info-circle"></i><i class="pi pi-shopping-cart"></i></div>
              </div>
            </div>
          </div>

          <div class="b-card">
            <div class="b-card-head"><i class="pi pi-box"></i><h2>Kit</h2><span class="b-count">{{ mock.kit.length }}</span></div>
            <div class="b-rows">
              <div v-for="k in mock.kit" :key="k.no" class="b-row">
                <div class="b-row-main"><div class="b-row-ref">{{ k.no }}</div><div class="b-row-desc">{{ k.description }} · Frs {{ k.frs }}</div></div>
                <div class="b-chip" :class="k.stock > 0 ? 'g' : 'r'">Stock {{ k.stock }}</div>
                <div class="b-prices"><span>Calc.<b>{{ k.coutCalcule }}</b></span><span>Vente<b>{{ k.prixVente }}</b></span></div>
                <div class="b-acts"><i class="pi pi-info-circle"></i></div>
              </div>
            </div>
          </div>
        </div>

        <aside class="b-side">
          <div class="b-card b-histcard">
            <div class="b-card-head"><i class="pi pi-history"></i><h2>Historique</h2><div class="b-year"><i class="pi pi-chevron-left"></i>2026<i class="pi pi-chevron-right"></i></div></div>
            <div class="b-histref">{{ mock.frs[0].no }} · {{ mock.frs[0].description }}</div>
            <div class="b-statgrid"><div><b>0</b><span>Stock</span></div><div><b>4</b><span>Achat</span></div><div><b>12</b><span>Vente</span></div><div><b>0</b><span>Rupt</span></div></div>
            <div class="b-histlist">
              <div v-for="(h, i) in mock.hist" :key="i" class="b-histitem"><span class="b-typ" :class="h.type">{{ h.type }}</span><div class="b-histmain"><b>{{ h.tiers }}</b><span>{{ h.date }}</span></div><div class="b-histqp"><span>{{ h.qte }}</span><b>{{ h.pu }}</b></div></div>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <!-- ══════════════════════════ DESIGN C : Data grid dense ══════════════════════════ -->
    <section v-else-if="design === 'C'" class="c-root">
      <header class="c-header">
        <button class="c-back"><i class="pi pi-arrow-left"></i></button>
        <div class="c-title">CONFIRMATION COMMANDES ACHAT <span>{{ mock.compareNo }} · {{ mock.compareDesc }}</span></div>
        <div class="c-stockstrip">
          <span v-for="s in mock.stocks" :key="s.ste"><i>{{ s.ste }}</i><b :class="s.stock > 0 ? 'pos' : 'neg'">{{ s.stock }}</b></span>
          <span class="c-total"><i>{{ mock.docNo }}</i><b>{{ mock.total }}</b></span>
          <button class="c-cart"><i class="pi pi-shopping-cart"></i>{{ mock.cart }}</button>
        </div>
        <button class="c-confirm"><i class="pi pi-check"></i> Confirmer</button>
      </header>

      <div class="c-body">
        <div class="c-left">
          <div class="c-grid">
            <div class="c-grid-title">FOURNISSEURS
              <div class="c-toolbar">
                <span class="c-filtertag on">Stock &gt; 10 <i class="pi pi-times"></i></span>
              </div>
            </div>
            <table class="c-table">
              <thead>
                <tr>
                  <th>DOC</th><th>FRS</th><th>RÉF / DÉSIG</th>
                  <th class="c-th-f">STOCK <i class="pi pi-filter on"></i></th>
                  <th>APPRO</th><th class="num">COUT DIR</th><th class="num">PRIX REV</th><th class="num">PRIX VTE</th>
                  <th class="num">NÉG PX</th><th class="num">NÉG QT</th><th class="num">QTÉ CF</th><th>RAISON</th><th>INF</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in mock.frs" :key="r.no" :class="{ sel: i === 0 }">
                  <td class="mono muted">{{ r.documentNo }}</td>
                  <td class="mono">{{ r.frs }}</td>
                  <td class="c-ref"><b>{{ r.no }}</b><i>{{ r.description }}</i></td>
                  <td class="num"><span class="c-stk" :class="r.stock > 0 ? 'g' : 'r'">{{ r.stock }}</span></td>
                  <td class="c-appro"><span>I:{{ r.imp }}</span><span class="cmd">C:{{ r.cmd }}</span></td>
                  <td class="num mono">{{ r.coutDirect }}</td>
                  <td class="num mono">{{ r.prixRevient }}</td>
                  <td class="num mono">{{ r.prixVente }}</td>
                  <td class="num mono">{{ r.negPrix }}</td>
                  <td class="num mono">{{ r.negQte }}</td>
                  <td class="num"><input class="c-input" :value="r.qteAConfirmer" /></td>
                  <td><span class="c-raison">{{ r.raison || '—' }}</span></td>
                  <td class="c-acts"><i class="pi pi-info-circle"></i><i class="pi pi-check ok"></i></td>
                </tr>
              </tbody>
            </table>
            <!-- Filtre segmenté ouvert (démo) -->
            <div class="c-filter">
              <div class="c-filter-row">
                <span class="c-filter-lbl">STOCK</span>
                <div class="seg c">
                  <button v-for="o in ops" :key="o.v" :class="{ on: o.v === 'gt' }" :title="o.t">{{ o.s }}</button>
                </div>
                <input class="c-filter-val" value="10" />
                <button class="c-mini ghost">Effacer</button>
                <button class="c-mini prim">Appliquer</button>
              </div>
            </div>
          </div>

          <div class="c-grid">
            <div class="c-grid-title">ÉQUIVALENCE</div>
            <table class="c-table">
              <thead><tr><th>FRS</th><th>RÉF / DÉSIG</th><th class="num">STOCK</th><th class="num">PRIX DEV</th><th class="num">COÛT CALC</th><th class="num">PRIX VTE</th><th class="num">PANIER</th><th>INF</th></tr></thead>
              <tbody>
                <tr v-for="e in mock.eqv" :key="e.no">
                  <td class="mono">{{ e.frs }}</td>
                  <td class="c-ref"><b>{{ e.no }}</b><i>{{ e.description }}</i></td>
                  <td class="num"><span class="c-stk" :class="e.stock > 0 ? 'g' : 'r'">{{ e.stock }}</span></td>
                  <td class="num mono">{{ e.prixDevise }}</td><td class="num mono">{{ e.coutCalcule }}</td><td class="num mono">{{ e.prixVente }}</td>
                  <td class="num"><input class="c-input" value="1" /></td>
                  <td class="c-acts"><i class="pi pi-info-circle"></i><i class="pi pi-shopping-cart"></i></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="c-grid">
            <div class="c-grid-title">KIT</div>
            <table class="c-table">
              <thead><tr><th>FRS</th><th>RÉF / DÉSIG</th><th class="num">STOCK</th><th class="num">COÛT CALC</th><th class="num">PRIX VTE</th><th>INF</th></tr></thead>
              <tbody>
                <tr v-for="k in mock.kit" :key="k.no">
                  <td class="mono">{{ k.frs }}</td>
                  <td class="c-ref"><b>{{ k.no }}</b><i>{{ k.description }}</i></td>
                  <td class="num"><span class="c-stk" :class="k.stock > 0 ? 'g' : 'r'">{{ k.stock }}</span></td>
                  <td class="num mono">{{ k.coutCalcule }}</td><td class="num mono">{{ k.prixVente }}</td>
                  <td class="c-acts"><i class="pi pi-info-circle"></i></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <aside class="c-side">
          <div class="c-side-head">HISTORIQUE <span class="c-year"><i class="pi pi-chevron-left"></i>2026<i class="pi pi-chevron-right"></i></span></div>
          <div class="c-side-ref">{{ mock.frs[0].no }} · {{ mock.frs[0].description }}</div>
          <div class="c-side-kpis"><span>STK<b>0</b></span><span>ACH<b>4</b></span><span>VTE<b>12</b></span><span>RUP<b>0</b></span></div>
          <table class="c-table c-hist">
            <thead><tr><th>DATE</th><th>T</th><th>TIERS</th><th class="num">QT</th><th class="num">PU</th></tr></thead>
            <tbody>
              <tr v-for="(h, i) in mock.hist" :key="i"><td class="mono">{{ h.date }}</td><td><span class="c-typ" :class="h.type">{{ h.type[0] }}</span></td><td>{{ h.tiers }}</td><td class="num mono">{{ h.qte }}</td><td class="num mono">{{ h.pu }}</td></tr>
            </tbody>
          </table>
        </aside>
      </div>
    </section>

    <!-- ══════════════════════════ DESIGN C2 : Data grid dense premium ══════════════════════════ -->
    <section v-else class="c2-root" :class="{ 'hist-collapsed': histState === 'collapsed', 'hist-expanded': histState === 'expanded' }">
      <header class="c2-header">
        <button class="c2-back" title="Retour à la liste"><i class="pi pi-arrow-left"></i></button>
        <div class="c2-titlewrap">
          <h1>Confirmation Commandes Achat</h1>
          <div class="c2-sub"><span class="c2-no">{{ mock.compareNo }}</span><span class="c2-dot">·</span>{{ mock.compareDesc }}</div>
        </div>
        <div class="c2-stockband">
          <span class="c2-stocklabel">STOCKS</span>
          <div v-for="s in mock.stocks" :key="s.ste" class="c2-stockcell">
            <span class="c2-ste">{{ s.ste }}</span>
            <div class="c2-stkrow">
              <span class="c2-stkv" :class="s.stock > 0 ? 'pos' : 'neg'">{{ s.stock }}</span>
              <span class="c2-stksep"></span>
              <span class="c2-stkd">Dern. {{ s.last }}</span>
            </div>
          </div>
        </div>
        <!-- Zone droite alignée avec la sidebar Historique (même largeur) -->
        <div class="c2-header-right">
          <div class="c2-total"><span>{{ mock.docNo }}</span><b>{{ mock.total }} <em>TND</em></b></div>
          <button class="c2-cart" title="Panier"><i class="pi pi-shopping-cart"></i><span>{{ mock.cart }}</span></button>
          <button class="c2-confirm"><i class="pi pi-check"></i> Confirmer</button>
        </div>
      </header>

      <div class="c2-body">
        <div class="c2-left">
          <!-- ─── FRS ─── -->
          <div class="c2-grid">
            <div class="c2-grid-head">
              <div class="c2-grid-title"><span class="c2-acc"></span>FOURNISSEURS<span class="c2-count">{{ mock.frs.length }}</span></div>
              <div class="c2-filterbar" v-if="c2Filters.frs.length">
                <span class="c2-filterbar-lbl"><i class="pi pi-filter"></i> Filtres actifs</span>
                <span v-for="f in c2Filters.frs" :key="f.key" class="c2-fchip">{{ f.label }}<i class="pi pi-times" @click="removeFilter('frs', f.key)"></i></span>
                <button class="c2-clearall" @click="clearAll('frs')">Effacer tout</button>
              </div>
            </div>

            <div class="c2-tablewrap">
              <table class="c2-table c2-maintable">
                <colgroup><col v-for="(w, ci) in cols" :key="ci" :style="{ width: w }" /></colgroup>
                <thead>
                  <tr>
                    <th class="left">Frs</th><th class="left">Réf / Désignation</th>
                    <th class="num c2-th-f">Stock <button class="c2-fbtn" :class="{ on: isColFiltered('frs','stock') }" @click.stop="openMenu($event,'frs','stock','Stock')"><i class="pi pi-sliders-h"></i></button></th>
                    <th>Appro</th>
                    <th class="num c2-th-f">Dernier <button class="c2-fbtn" :class="{ on: isColFiltered('frs','date') }" @click.stop="openMenu($event,'frs','date','Dernier Achat')"><i class="pi pi-sliders-h"></i></button></th>
                    <th class="num">Coût Dir.</th><th class="num">Prix Rev.</th><th class="num">Prix Vte</th>
                    <th class="num">Nég Px</th><th class="num">Nég Qt</th>
                    <th class="num c2-th-f">Qté Cf <button class="c2-fbtn" :class="{ on: isColFiltered('frs','qty') }" @click.stop="openMenu($event,'frs','qty','Qté')"><i class="pi pi-sliders-h"></i></button></th>
                    <th class="left">Raison</th><th class="c2-actcol">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in mock.frs" :key="r.no" :class="{ sel: i === selectedFrs }" @click="selectedFrs = i">
                    <td><div class="c2-frs"><span class="c2-frs-code">{{ r.frs }}</span><span class="c2-doc">{{ r.documentNo }}</span></div></td>
                    <td class="left c2-ref"><b>{{ r.no }}</b><span>{{ r.description }}</span></td>
                    <td class="num"><span class="c2-stk" :class="stockClass(r)">{{ r.stock }}</span></td>
                    <td class="c2-appro"><span class="imp" :class="{ z: r.imp === 0 }">I {{ r.imp }}</span><span class="cmd" :class="{ z: r.cmd === 0 }">C {{ r.cmd }}</span></td>
                    <td class="num mono muted">{{ r.dernierAchat }}</td>
                    <td class="num mono">{{ r.coutDirect }}</td>
                    <td class="num c2-pricecell"><b class="mono">{{ r.prixRevient }}</b><em :class="varClass(r.revientVar)">{{ r.revientVar }}</em></td>
                    <td class="num c2-pricecell"><b class="mono">{{ r.prixVente }}</b><em :class="varClass(r.venteVar)">{{ r.venteVar }}</em></td>
                    <td class="num mono">{{ r.negPrix }}</td>
                    <td class="num mono">{{ r.negQte }}</td>
                    <td class="num"><input class="c2-input" :value="r.qteAConfirmer" @click.stop /></td>
                    <td class="left"><span class="c2-raison" :class="{ empty: !r.raison }">{{ r.raison || '—' }}</span></td>
                    <td class="c2-acts">
                      <i class="pi pi-info-circle" title="Informations"></i>
                      <i class="pi pi-comment" title="Commentaire"></i>
                      <i class="pi pi-check ok" title="Valider la ligne"></i>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ─── EQV ─── -->
          <div class="c2-grid">
            <div class="c2-grid-head">
              <div class="c2-grid-title"><span class="c2-acc eqv"></span>ÉQUIVALENCE<span class="c2-count">{{ mock.eqv.length }}</span></div>
              <div class="c2-filterbar" v-if="c2Filters.eqv.length">
                <span class="c2-filterbar-lbl"><i class="pi pi-filter"></i> Filtres actifs</span>
                <span v-for="f in c2Filters.eqv" :key="f.key" class="c2-fchip">{{ f.label }}<i class="pi pi-times" @click="removeFilter('eqv', f.key)"></i></span>
                <button class="c2-clearall" @click="clearAll('eqv')">Effacer tout</button>
              </div>
            </div>
            <div class="c2-tablewrap">
              <table class="c2-table c2-maintable">
                <colgroup><col v-for="(w, ci) in cols" :key="ci" :style="{ width: w }" /></colgroup>
                <thead><tr>
                  <th class="left">Frs</th><th class="left">Réf / Désignation</th>
                  <th class="num c2-th-f">Stock <button class="c2-fbtn" :class="{ on: isColFiltered('eqv','stock') }" @click.stop="openMenu($event,'eqv','stock','Stock')"><i class="pi pi-sliders-h"></i></button></th>
                  <th>Appro</th>
                  <th class="num c2-th-f">Dernier <button class="c2-fbtn" :class="{ on: isColFiltered('eqv','date') }" @click.stop="openMenu($event,'eqv','date','Dernier Achat')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="num c2-th-f">Prix Dev. <button class="c2-fbtn" :class="{ on: isColFiltered('eqv','prixDev') }" @click.stop="openMenu($event,'eqv','prixDev','Prix Devise')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="num">Coût Calc.</th>
                  <th class="num c2-th-f">Prix Vte <button class="c2-fbtn" :class="{ on: isColFiltered('eqv','prixVte') }" @click.stop="openMenu($event,'eqv','prixVte','Prix Vente')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="num c2-th-f">Achat <button class="c2-fbtn" :class="{ on: isColFiltered('eqv','achat') }" @click.stop="openMenu($event,'eqv','achat','Achat')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="num c2-th-f">Vente <button class="c2-fbtn" :class="{ on: isColFiltered('eqv','vente') }" @click.stop="openMenu($event,'eqv','vente','Vente')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="num c2-th-f">Panier <button class="c2-fbtn" :class="{ on: isColFiltered('eqv','panier') }" @click.stop="openMenu($event,'eqv','panier','Panier à Cmd')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="left">Raison</th>
                  <th class="c2-actcol">Actions</th>
                </tr></thead>
                <tbody>
                  <tr v-for="e in mock.eqv" :key="e.no">
                    <td class="left"><span class="c2-frs-code">{{ e.frs }}</span></td>
                    <td class="left c2-ref"><b>{{ e.no }}</b><span>{{ e.description }}</span></td>
                    <td class="num"><span class="c2-stk" :class="stockClass(e)">{{ e.stock }}</span></td>
                    <td class="c2-appro"><span class="imp" :class="{ z: e.imp === 0 }">I {{ e.imp }}</span><span class="cmd" :class="{ z: e.cmd === 0 }">C {{ e.cmd }}</span></td>
                    <td class="num mono muted">{{ e.dernierAchat }}</td>
                    <td class="num mono">{{ e.prixDevise }}</td>
                    <td class="num c2-pricecell"><b class="mono">{{ e.coutCalcule }}</b><em class="muted">{{ e.coutDate }}</em></td>
                    <td class="num mono">{{ e.prixVente }}</td>
                    <td class="num mono" :class="{ 'pos-txt': e.achat > 0 }">{{ e.achat }}</td>
                    <td class="num mono" :class="{ 'pos-txt': e.vente > 0 }">{{ e.vente }}</td>
                    <td class="num"><input class="c2-input" value="1" @click.stop /></td>
                    <td class="left"><span class="c2-raison" :class="{ empty: !e.raison }">{{ e.raison || '—' }}</span></td>
                    <td class="c2-acts"><i class="pi pi-info-circle" title="Informations"></i><i class="pi pi-shopping-cart" title="Ajouter au panier"></i><i class="pi pi-check ok" title="Valider"></i></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ─── KIT ─── -->
          <div class="c2-grid">
            <div class="c2-grid-head">
              <div class="c2-grid-title"><span class="c2-acc kit"></span>KIT<span class="c2-count">{{ mock.kit.length }}</span></div>
              <div class="c2-filterbar" v-if="c2Filters.kit.length">
                <span class="c2-filterbar-lbl"><i class="pi pi-filter"></i> Filtres actifs</span>
                <span v-for="f in c2Filters.kit" :key="f.key" class="c2-fchip">{{ f.label }}<i class="pi pi-times" @click="removeFilter('kit', f.key)"></i></span>
                <button class="c2-clearall" @click="clearAll('kit')">Effacer tout</button>
              </div>
            </div>
            <div class="c2-tablewrap">
              <table class="c2-table c2-maintable">
                <colgroup><col v-for="(w, ci) in cols" :key="ci" :style="{ width: w }" /></colgroup>
                <thead><tr>
                  <th class="left">Frs</th><th class="left">Réf / Désignation</th>
                  <th class="num c2-th-f">Stock <button class="c2-fbtn" :class="{ on: isColFiltered('kit','stock') }" @click.stop="openMenu($event,'kit','stock','Stock')"><i class="pi pi-sliders-h"></i></button></th>
                  <th>Appro</th>
                  <th class="num c2-th-f">Dernier <button class="c2-fbtn" :class="{ on: isColFiltered('kit','date') }" @click.stop="openMenu($event,'kit','date','Dernier Achat')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="num c2-th-f">Prix Dev. <button class="c2-fbtn" :class="{ on: isColFiltered('kit','prixDev') }" @click.stop="openMenu($event,'kit','prixDev','Prix Devise')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="num c2-th-f">Coût Calc. <button class="c2-fbtn" :class="{ on: isColFiltered('kit','cout') }" @click.stop="openMenu($event,'kit','cout','Coût Calculé')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="num c2-th-f">Prix Vte <button class="c2-fbtn" :class="{ on: isColFiltered('kit','prixVte') }" @click.stop="openMenu($event,'kit','prixVte','Prix Vente')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="num">Achat</th><th class="num">Vente</th>
                  <th class="num">Panier</th><th class="left">Raison</th>
                  <th class="c2-actcol">Actions</th>
                </tr></thead>
                <tbody>
                  <tr v-for="k in mock.kit" :key="k.no">
                    <td class="left"><span class="c2-frs-code">{{ k.frs }}</span></td>
                    <td class="left c2-ref"><b>{{ k.no }}</b><span>{{ k.description }}</span></td>
                    <td class="num"><span class="c2-stk" :class="stockClass(k)">{{ k.stock }}</span></td>
                    <td class="c2-appro"><span class="imp" :class="{ z: k.imp === 0 }">I {{ k.imp }}</span><span class="cmd" :class="{ z: k.cmd === 0 }">C {{ k.cmd }}</span></td>
                    <td class="num mono muted">{{ k.dernierAchat }}</td>
                    <td class="num mono">{{ k.prixDevise }}</td>
                    <td class="num c2-pricecell"><b class="mono">{{ k.coutCalcule }}</b><em class="muted">{{ k.coutDate }}</em></td>
                    <td class="num mono">{{ k.prixVente }}</td>
                    <td class="num mono" :class="{ 'pos-txt': k.achat > 0 }">{{ k.achat }}</td>
                    <td class="num mono" :class="{ 'pos-txt': k.vente > 0 }">{{ k.vente }}</td>
                    <td class="num"><input class="c2-input" value="1" @click.stop /></td>
                    <td class="left"><span class="c2-raison" :class="{ empty: !k.raison }">{{ k.raison || '—' }}</span></td>
                    <td class="c2-acts"><i class="pi pi-info-circle" title="Informations"></i><i class="pi pi-shopping-cart" title="Ajouter au panier"></i><i class="pi pi-check ok" title="Valider"></i></td>
                  </tr>
                  <tr v-if="!mock.kit.length"><td colspan="12" class="c2-empty"><i class="pi pi-inbox"></i> Aucune donnée disponible</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ─── Historique (3 états : collapsed / normal / expanded) ─── -->
        <aside class="c2-side" :class="{ collapsed: histState === 'collapsed', expanded: histState === 'expanded' }">
          <template v-if="histState !== 'collapsed'">
            <div class="c2-side-head">
              <button class="c2-collapse grow" @click="widenHist" :disabled="histState === 'expanded'" title="Agrandir l'historique"><i class="pi pi-angle-double-left"></i></button>
              <span class="c2-side-title"><i class="pi pi-history"></i> Historique</span>
              <div class="c2-side-headright">
                <span class="c2-year"><i class="pi pi-chevron-left"></i>2026<i class="pi pi-chevron-right"></i></span>
                <button class="c2-collapse" @click="narrowHist" :title="histState === 'expanded' ? 'Revenir normal' : 'Réduire l\'historique'"><i class="pi pi-angle-double-right"></i></button>
              </div>
            </div>
            <div class="c2-side-ref"><b>{{ mock.frs[selectedFrs].no }}</b><span>{{ mock.frs[selectedFrs].description }}</span></div>
            <div class="c2-side-kpis">
              <span class="kpi"><i>Stock</i><b>0</b></span>
              <span class="kpi"><i>Achat</i><b class="pos">4</b></span>
              <span class="kpi"><i>Vente</i><b class="pos">12</b></span>
              <span class="kpi"><i>Rupt</i><b class="neg">0</b></span>
            </div>
            <div class="c2-hist">
              <table class="c2-table c2-histtable">
                <thead><tr>
                  <th>Date</th><th>T</th>
                  <template v-if="histState === 'expanded'">
                    <th>Client / Frs</th><th class="left">Nom</th><th>N° Doc</th><th>Magasin</th>
                  </template>
                  <th v-else class="left">Tiers</th>
                  <th class="num">Qté</th><th class="num">PU</th>
                  <th v-if="histState === 'expanded'" class="num">Montant</th>
                </tr></thead>
                <tbody>
                  <tr v-for="(h, i) in mock.hist" :key="i">
                    <td class="mono">{{ h.date }}</td>
                    <td><span class="c2-typ" :class="h.type" :title="h.type">{{ typeLetter(h.type) }}</span></td>
                    <template v-if="histState === 'expanded'">
                      <td class="mono">{{ h.client }}</td>
                      <td class="left">{{ h.tiers }}</td>
                      <td class="mono muted">{{ h.docNo }}</td>
                      <td class="muted">{{ h.magasin }}</td>
                    </template>
                    <td v-else class="left">{{ h.tiers }}</td>
                    <td class="num mono" :class="{ neg: h.qte < 0 }">{{ h.qte }}</td>
                    <td class="num mono">{{ h.pu }}</td>
                    <td v-if="histState === 'expanded'" class="num mono" :class="{ neg: String(h.montant).startsWith('-') }">{{ h.montant }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
          <div v-else class="c2-rail" @click="widenHist" title="Afficher l'historique">
            <button class="c2-collapse" @click.stop="widenHist"><i class="pi pi-angle-double-left"></i></button>
            <i class="pi pi-history c2-rail-icon"></i>
            <span class="c2-rail-label">HISTORIQUE</span>
          </div>
        </aside>
      </div>

      <!-- Mini-menu de filtre flottant (toutes colonnes / tous tableaux) -->
      <div v-if="c2Menu.open" class="c2-menu-backdrop" @click="closeMenu"></div>
      <div v-if="c2Menu.open" class="c2-fmenu floating" :style="{ left: c2Menu.x + 'px', top: c2Menu.y + 'px' }">
        <div class="c2-fmenu-head"><span>Filtrer : {{ c2Menu.label }}</span><button @click="closeMenu"><i class="pi pi-times"></i></button></div>
        <div class="c2-fmenu-lbl">Condition</div>
        <div class="seg c2"><button v-for="o in ops" :key="o.v" :class="{ on: o.v === c2Menu.op }" @click="c2Menu.op = o.v" :title="o.t">{{ o.s }}</button></div>
        <div class="c2-fmenu-lbl">Valeur</div>
        <input class="c2-fmenu-val" :type="c2Menu.col === 'date' ? 'date' : 'number'" v-model="c2Menu.value" placeholder="Saisir une valeur" />
        <div class="c2-fmenu-actions">
          <button class="ghost" @click="clearMenuCol">Effacer</button>
          <button class="prim" @click="applyMenu"><i class="pi pi-check"></i> Appliquer</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const design = ref('C2')
const selectedFrs = ref(0)

// Historique : 3 états (collapsed | normal | expanded) — démo locale uniquement
const histState = ref('normal')
const widenHist = () => { histState.value = histState.value === 'collapsed' ? 'normal' : 'expanded' }
const narrowHist = () => { histState.value = histState.value === 'expanded' ? 'normal' : 'collapsed' }

// Système de filtres unifié C2 (démo uniquement — aucune logique métier réelle)
const c2Filters = ref({
  frs: [
    { key: 'stock', op: 'gt', value: 10, label: 'Stock > 10' },
    { key: 'date', op: 'ge', value: '01/12/2025', label: 'Dernier Achat ≥ 01/12/2025' },
    { key: 'qty', op: 'le', value: 2, label: 'Qté ≤ 2' }
  ],
  eqv: [],
  kit: []
})
const c2Menu = ref({ open: false, table: null, col: null, label: '', op: 'gt', value: null, x: 0, y: 0 })
const opSym = (v) => ops.find(o => o.v === v)?.s || '>'
const isColFiltered = (table, col) => c2Filters.value[table].some(f => f.key === col)
const openMenu = (e, table, col, label) => {
  const existing = c2Filters.value[table].find(f => f.key === col)
  // Repositionnement anti-coupure : si le menu déborderait en bas, on l'ouvre au-dessus de l'icône.
  const MENU_H = 250
  const below = e.clientY + 14
  const y = (below + MENU_H > window.innerHeight) ? Math.max(8, e.clientY - MENU_H - 8) : below
  c2Menu.value = {
    open: true, table, col, label,
    op: existing ? existing.op : 'gt',
    value: existing ? existing.value : null,
    x: Math.min(e.clientX, window.innerWidth - 280),
    y
  }
}
const closeMenu = () => { c2Menu.value.open = false }
const applyMenu = () => {
  const m = c2Menu.value
  if (m.value === null || m.value === '') { closeMenu(); return }
  const arr = c2Filters.value[m.table].filter(f => f.key !== m.col)
  arr.push({ key: m.col, op: m.op, value: m.value, label: `${m.label} ${opSym(m.op)} ${m.value}` })
  c2Filters.value[m.table] = arr
  closeMenu()
}
const clearMenuCol = () => {
  const m = c2Menu.value
  c2Filters.value[m.table] = c2Filters.value[m.table].filter(f => f.key !== m.col)
  closeMenu()
}
const removeFilter = (table, key) => { c2Filters.value[table] = c2Filters.value[table].filter(f => f.key !== key) }
const clearAll = (table) => { c2Filters.value[table] = [] }
const stockClass = (r) => (Number(r.stock) === 0 ? 'r' : (r.attention ? 'o' : 'g'))
const varClass = (v) => (!v ? '' : (v.startsWith('+') ? 'up' : (v.startsWith('-') ? 'down' : '')))
const typeLetter = (t) => ({ Achat: 'A', Vente: 'V', Rupture: 'R', Transfert: 'T' }[t] || (t ? t[0] : ''))

const ops = [
  { s: '>', v: 'gt', t: 'Supérieur à' },
  { s: '≥', v: 'ge', t: 'Supérieur ou égal' },
  { s: '=', v: 'eq', t: 'Égal à' },
  { s: '≤', v: 'le', t: 'Inférieur ou égal' },
  { s: '<', v: 'lt', t: 'Inférieur à' }
]

// Grille de colonnes COMMUNE aux 3 tableaux FRS / EQV / KIT (mêmes largeurs => alignement)
const cols = ['7%', '17%', '6%', '7%', '7%', '7%', '9%', '8%', '7%', '7%', '6%', '8%', '7%']

// Données 100 % mockées (aucun appel API, aucune logique métier)
const mock = {
  compareNo: 'COMP26-00071',
  compareDesc: 'Vaïco 1',
  docNo: 'DP26-00388',
  total: '18 920.27',
  cart: 9,
  stocks: [
    { ste: 'STE Sfax Silver Star', stock: 12, last: '14/10/24' },
    { ste: 'STE COPIM', stock: 0, last: '—' },
    { ste: 'STE MPAA', stock: 4, last: '02/11/23' }
  ],
  frs: [
    { documentNo: 'DP26-00388', frs: '401301', no: '20-77-1051', description: "Vanne d'inversion - N47", stock: 14, attention: false, imp: 0, cmd: 0, dernierAchat: '14/10/24', coutDirect: '23.310', prixRevient: '115.064', revientVar: '+8.2%', prixVente: '143.830', venteVar: '+3.1%', negPrix: '23.31', negQte: '1', qteAConfirmer: 1, raison: '' },
    { documentNo: 'DP26-00388', frs: '401301', no: '30-63-0040', description: 'Convertisseur de pression', stock: 8, attention: false, imp: 0, cmd: 3, dernierAchat: '07/11/22', coutDirect: '13.260', prixRevient: '65.455', revientVar: '-2.4%', prixVente: '82.854', venteVar: '0.0%', negPrix: '13.26', negQte: '1', qteAConfirmer: 2, raison: 'Mouvement lent' },
    { documentNo: 'DP26-00388', frs: '401301', no: '30-1876', description: 'Tube de purge - 211', stock: 0, attention: false, imp: 0, cmd: 10, dernierAchat: '02/11/23', coutDirect: '6.770', prixRevient: '33.418', revientVar: '+14.6%', prixVente: '53.045', venteVar: '+5.0%', negPrix: '6.77', negQte: '1', qteAConfirmer: 1, raison: 'Prix augmenté' },
    { documentNo: 'DP26-00389', frs: '401118', no: '11-42-7-509', description: "Filtre à huile - moteur N47", stock: 3, attention: true, imp: 6, cmd: 0, dernierAchat: '21/02/26', coutDirect: '4.120', prixRevient: '9.880', revientVar: '-1.1%', prixVente: '16.500', venteVar: '+2.2%', negPrix: '4.05', negQte: '1', qteAConfirmer: 1, raison: '' },
    { documentNo: 'DP26-00389', frs: '401118', no: '06-28-0044', description: "Sonde température liquide", stock: 0, attention: false, imp: 0, cmd: 0, dernierAchat: '—', coutDirect: '0.000', prixRevient: '0.000', revientVar: '', prixVente: '0.000', venteVar: '', negPrix: '0.00', negQte: '1', qteAConfirmer: 0, raison: 'Nouveau article' }
  ],
  eqv: [
    { frs: '401309', no: '77109', description: "Vanne d'inversion - N47", stock: 5, imp: 2, cmd: 0, dernierAchat: '24/01/26', prixDevise: '16.000', coutCalcule: '81.004', coutDate: '24/01/26', prixVente: '102.300', achat: 4, vente: 6, raison: '' },
    { frs: '401325', no: '19815901', description: "Vanne d'inversion - N47", stock: 0, imp: 0, cmd: 0, dernierAchat: '—', prixDevise: '0.000', coutCalcule: '0.000', coutDate: '—', prixVente: '0.000', achat: 0, vente: 0, raison: 'Nouveau article' },
    { frs: '401344', no: 'A2C59515', description: "Vanne EGR équivalente", stock: 9, imp: 0, cmd: 4, dernierAchat: '11/12/25', prixDevise: '18.400', coutCalcule: '92.110', coutDate: '11/12/25', prixVente: '118.900', achat: 11, vente: 9, raison: '' },
    { frs: '401307', no: 'V20-77-0030', description: "Vanne d'inversion adaptable", stock: 0, imp: 12, cmd: 0, dernierAchat: '03/08/25', prixDevise: '14.750', coutCalcule: '74.820', coutDate: '03/08/25', prixVente: '96.400', achat: 2, vente: 1, raison: 'Mouvement lent' }
  ],
  kit: [
    { frs: '401312', no: 'KIT-4471', description: 'Kit joints + vanne inversion', stock: 2, imp: 0, cmd: 0, dernierAchat: '18/11/25', prixDevise: '28.500', coutCalcule: '142.900', coutDate: '18/11/25', prixVente: '189.500', achat: 3, vente: 5, raison: '' },
    { frs: '401312', no: 'KIT-4480', description: 'Kit réparation EGR complet', stock: 0, imp: 4, cmd: 2, dernierAchat: '06/09/25', prixDevise: '41.200', coutCalcule: '210.300', coutDate: '06/09/25', prixVente: '278.900', achat: 1, vente: 0, raison: 'Sur Stockage' }
  ],
  hist: [
    { date: '12/03/26', type: 'Achat', client: 'F00045', tiers: 'BOSCH FRANCE', docNo: 'BC26-1042', magasin: 'MAG-SFAX', qte: 4, pu: '22.80', montant: '91.20' },
    { date: '28/01/26', type: 'Vente', client: 'C01233', tiers: 'GARAGE CENTRAL', docNo: 'FA26-0811', magasin: 'MAG-SFAX', qte: -2, pu: '141.40', montant: '-282.80' },
    { date: '05/01/26', type: 'Transfert', client: 'INT', tiers: 'STE COPIM → MPAA', docNo: 'TR26-0033', magasin: 'MAG-COPIM', qte: 3, pu: '21.50', montant: '64.50' },
    { date: '14/10/25', type: 'Achat', client: 'F00118', tiers: 'VAICO DIST.', docNo: 'BC25-2207', magasin: 'MAG-MPAA', qte: 6, pu: '21.10', montant: '126.60' },
    { date: '21/09/25', type: 'Rupture', client: '—', tiers: 'Stock épuisé', docNo: '—', magasin: 'MAG-SFAX', qte: 0, pu: '—', montant: '—' },
    { date: '03/09/25', type: 'Vente', client: 'C00876', tiers: 'AUTO PIÈCES SUD', docNo: 'FA25-1990', magasin: 'MAG-SFAX', qte: -1, pu: '139.90', montant: '-139.90' }
  ]
}
</script>

<style scoped>
/* ════════════════════ Base lab ════════════════════ */
.uilab {
  min-height: 100vh;
  background: #eef2f6;
  padding: 16px;
  font-family: 'Inter', system-ui, sans-serif;
}

.uilab-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0f172a;
  color: #fff;
  border-radius: 12px;
  padding: 10px 16px;
  margin-bottom: 16px;
}

.uilab-bar-left { display: flex; align-items: center; gap: 12px; }
.uilab-logo { font-weight: 800; letter-spacing: 0.1em; background: #2563eb; padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; }
.uilab-title { font-size: 0.9rem; color: #cbd5e1; }
.uilab-switch { display: flex; gap: 6px; }
.uilab-switch button { background: #1e293b; color: #cbd5e1; border: 1px solid #334155; border-radius: 8px; padding: 7px 14px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all .15s; }
.uilab-switch button:hover { background: #334155; color: #fff; }
.uilab-switch button.on { background: #2563eb; border-color: #2563eb; color: #fff; }

.num { text-align: right; }

/* Boutons segmentés (communs) */
.seg { display: flex; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; padding: 3px; gap: 0; }
.seg button { flex: 1; height: 30px; border: none; background: transparent; color: #64748b; font-weight: 800; font-size: 0.95rem; border-radius: 7px; cursor: pointer; transition: all .15s; }
.seg button:hover { background: #e2e8f0; color: #0f172a; }
.seg button.on { background: #fff; color: #2563eb; box-shadow: 0 1px 2px rgba(16,24,40,.18); }

/* ════════════════════ DESIGN A : ERP compact premium ════════════════════ */
.a-root { font-size: 0.86rem; color: #1e293b; }
.a-header { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 10px 14px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
.a-back { width: 36px; height: 36px; border-radius: 9px; border: 1.5px solid #e5e7eb; background: #f8fafc; color: #334155; cursor: pointer; }
.a-titlewrap h1 { font-size: 1.05rem; font-weight: 800; margin: 0; color: #0f172a; }
.a-sub { font-size: 0.78rem; color: #64748b; display: flex; gap: 6px; }
.a-sub b { color: #1d4ed8; }
.a-stockband { flex: 1; display: flex; align-items: center; gap: 16px; border: 1px solid #c7d2fe; border-radius: 10px; padding: 6px 12px; margin: 0 6px; background: linear-gradient(180deg,#f8faff,#fff); }
.a-stocklabel { font-weight: 800; color: #2563eb; font-size: 0.78rem; letter-spacing: .05em; }
.a-stockcell { display: flex; flex-direction: column; line-height: 1.1; }
.a-ste { font-size: 0.62rem; color: #64748b; text-transform: uppercase; }
.a-stockval { font-weight: 800; }
.a-stockval.pos { color: #16a34a; } .a-stockval.neg { color: #dc2626; }
.a-stockdate { font-size: 0.62rem; color: #94a3b8; }
.a-total { display: flex; flex-direction: column; align-items: flex-end; border: 1px solid #c7d2fe; border-radius: 10px; padding: 4px 12px; }
.a-total span { font-size: 0.66rem; color: #64748b; } .a-total b { font-size: 1rem; color: #0f172a; }
.a-cart { position: relative; width: 38px; height: 38px; border-radius: 10px; border: 1px solid #c7d2fe; background: #fff; color: #1d4ed8; cursor: pointer; }
.a-cart em { position: absolute; top: -6px; right: -6px; background: #ea580c; color: #fff; font-style: normal; font-size: 0.6rem; font-weight: 800; border-radius: 9px; padding: 1px 5px; }
.a-confirm { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; border: none; border-radius: 10px; background: #16a34a; color: #fff; font-weight: 700; cursor: pointer; }
.a-body { display: flex; gap: 14px; margin-top: 14px; }
.a-left { flex: 1; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.a-side { width: 320px; flex-shrink: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 10px; box-shadow: 0 1px 3px rgba(16,24,40,.06); height: fit-content; }
.a-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(16,24,40,.05); position: relative; }
.a-card-head { display: flex; align-items: center; gap: 10px; padding: 12px 14px; font-weight: 800; font-size: 0.78rem; letter-spacing: .07em; color: #0f172a; border-bottom: 1px solid #eef2f7; }
.a-bar { width: 7px; height: 16px; border-radius: 4px; background: #2563eb; }
.a-table { width: 100%; border-collapse: collapse; }
.a-table th { background: #f8fafc; color: #475569; font-size: 0.68rem; text-transform: uppercase; letter-spacing: .03em; text-align: left; padding: 9px 12px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
.a-table th.num { text-align: right; }
.a-th-filter .on { color: #2563eb; margin-left: 4px; }
.a-table td { padding: 7px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.a-table tbody tr:hover { background: #f6f9ff; }
.a-table tbody tr.sel { background: #eff6ff; box-shadow: inset 4px 0 0 #2563eb; }
.ref { font-weight: 700; color: #0f172a; }
.desc { font-size: 0.74rem; color: #64748b; }
.muted { color: #94a3b8; font-size: 0.78rem; }
.a-pill { display: inline-block; min-width: 26px; text-align: center; font-weight: 800; padding: 2px 8px; border-radius: 7px; }
.a-pill.g { background: #dcfce7; color: #166534; } .a-pill.r { background: #fee2e2; color: #991b1b; }
.a-tag { display: inline-block; font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 6px; border: 1px solid #bfdbfe; color: #1d4ed8; margin-right: 4px; }
.a-tag.cmd { border-color: #fdba74; color: #c2410c; }
.a-input { width: 48px; text-align: right; border: 1px solid #e5e7eb; border-radius: 7px; padding: 4px 6px; }
.actions { white-space: nowrap; } .actions i { color: #2563eb; margin: 0 4px; cursor: pointer; } .actions i.ok { color: #16a34a; }
.a-filter { position: absolute; top: 44px; left: 220px; width: 250px; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 12px 30px rgba(16,24,40,.18); padding: 12px; z-index: 5; }
.a-filter-head { display: flex; justify-content: space-between; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.a-filter-head .x { border: none; background: transparent; color: #94a3b8; cursor: pointer; }
.a-filter-label { font-size: 0.7rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin: 8px 0 5px; }
.a-filter-val { width: 100%; box-sizing: border-box; border: 1px solid #e5e7eb; border-radius: 8px; padding: 7px 9px; }
.a-filter-actions { display: flex; justify-content: space-between; margin-top: 12px; }
.a-filter-actions .ghost { border: 1px solid #e5e7eb; background: #fff; color: #475569; border-radius: 8px; padding: 6px 12px; cursor: pointer; }
.a-filter-actions .prim { border: none; background: #2563eb; color: #fff; border-radius: 8px; padding: 6px 14px; font-weight: 700; cursor: pointer; }
.a-side-head { display: flex; align-items: center; gap: 8px; }
.a-histbtn { background: #2563eb; color: #fff; border: none; border-radius: 9px; padding: 8px 12px; font-weight: 700; }
.a-ref { flex: 1; font-weight: 800; font-size: 0.78rem; background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; padding: 6px 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.a-year { display: flex; align-items: center; gap: 6px; border: 1px solid #c7d2fe; border-radius: 9px; padding: 4px 8px; color: #1d4ed8; font-weight: 800; }
.a-kpis { display: flex; gap: 6px; margin: 10px 0; }
.a-kpis span { flex: 1; text-align: center; background: #fff7ed; border: 1px solid #fed7aa; color: #2563eb; border-radius: 9px; padding: 6px 0; font-weight: 700; font-size: 0.74rem; }
.a-hist th { font-size: 0.64rem; } .a-hist td { font-size: 0.76rem; }
.a-typ { font-size: 0.62rem; font-weight: 800; padding: 1px 6px; border-radius: 6px; }
.a-typ.Achat { background: #dbeafe; color: #1e40af; } .a-typ.Vente { background: #dcfce7; color: #166534; }

/* ════════════════════ DESIGN B : Dashboard cards ════════════════════ */
.b-root { color: #1e293b; }
.b-header { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 16px 18px; box-shadow: 0 1px 3px rgba(16,24,40,.06); }
.b-headtop { display: flex; align-items: center; gap: 16px; }
.b-back { display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid #e5e7eb; background: #f8fafc; border-radius: 10px; padding: 8px 12px; color: #334155; font-weight: 600; cursor: pointer; }
.b-title { flex: 1; } .b-title h1 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; } .b-title span { color: #64748b; font-size: 0.85rem; }
.b-confirm { display: inline-flex; align-items: center; gap: 8px; background: #16a34a; color: #fff; border: none; border-radius: 11px; padding: 11px 18px; font-weight: 700; cursor: pointer; box-shadow: 0 6px 16px rgba(22,163,74,.25); }
.b-kpirow { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 16px; }
.b-kpi { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 14px; padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; }
.b-kpi-lbl { font-size: 0.7rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; }
.b-kpi-val { font-size: 1.35rem; font-weight: 800; color: #0f172a; }
.b-kpi-val.pos { color: #16a34a; } .b-kpi-val.neg { color: #dc2626; }
.b-kpi-sub { font-size: 0.7rem; color: #94a3b8; }
.b-kpi.accent { background: #eff6ff; border-color: #bfdbfe; } .b-kpi.accent .b-kpi-val { color: #1d4ed8; }
.b-kpi.cart { background: #fff7ed; border-color: #fed7aa; align-items: center; justify-content: center; text-align: center; }
.b-kpi.cart i { font-size: 1.3rem; color: #ea580c; }
.b-body { display: flex; gap: 16px; margin-top: 16px; }
.b-left { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.b-side { width: 340px; flex-shrink: 0; }
.b-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; box-shadow: 0 1px 3px rgba(16,24,40,.05); overflow: hidden; position: relative; }
.b-card-head { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid #eef2f7; }
.b-card-head i { color: #2563eb; } .b-card-head h2 { margin: 0; font-size: 0.98rem; font-weight: 800; color: #0f172a; }
.b-count { background: #eff6ff; color: #1d4ed8; font-weight: 800; font-size: 0.72rem; padding: 2px 9px; border-radius: 9999px; }
.b-filterchip { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 0.76rem; font-weight: 700; padding: 5px 11px; border-radius: 9999px; border: 1px solid #e5e7eb; color: #64748b; cursor: pointer; }
.b-filterchip.on { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
.b-rows { display: flex; flex-direction: column; }
.b-row { display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid #f3f4f6; }
.b-row:hover { background: #f8fafc; }
.b-row.sel { background: #eff6ff; box-shadow: inset 4px 0 0 #2563eb; }
.b-row-main { flex: 1; min-width: 0; }
.b-row-ref { font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px; }
.b-doc { font-size: 0.68rem; font-weight: 600; color: #94a3b8; background: #f1f5f9; border-radius: 6px; padding: 1px 6px; }
.b-row-desc { font-size: 0.8rem; color: #64748b; }
.b-chip { font-size: 0.74rem; font-weight: 700; padding: 4px 10px; border-radius: 9999px; }
.b-chip.g { background: #dcfce7; color: #166534; } .b-chip.r { background: #fee2e2; color: #991b1b; } .b-chip.n { background: #f1f5f9; color: #475569; }
.b-prices { display: flex; gap: 14px; }
.b-prices span { display: flex; flex-direction: column; font-size: 0.66rem; color: #94a3b8; text-transform: uppercase; } .b-prices b { font-size: 0.9rem; color: #0f172a; }
.b-qty { width: 52px; text-align: center; border: 1px solid #e5e7eb; border-radius: 9px; padding: 6px; }
.b-acts i { color: #2563eb; margin: 0 4px; cursor: pointer; font-size: 1.05rem; } .b-acts i.ok { color: #16a34a; }
.b-filter { position: absolute; top: 50px; right: 18px; width: 270px; background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 16px 40px rgba(16,24,40,.2); padding: 14px; z-index: 5; }
.b-filter-head { display: flex; justify-content: space-between; font-weight: 800; color: #0f172a; }
.b-filter-head .x { border: none; background: transparent; color: #94a3b8; cursor: pointer; }
.b-filter-lbl { display: block; font-size: 0.7rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin: 12px 0 6px; }
.seg.b button { height: 34px; }
.b-filter-val { width: 100%; box-sizing: border-box; border: 1px solid #e5e7eb; border-radius: 9px; padding: 9px 10px; }
.b-filter-actions { display: flex; justify-content: space-between; margin-top: 14px; }
.b-filter-actions .ghost { border: 1px solid #e5e7eb; background: #fff; color: #475569; border-radius: 9px; padding: 8px 14px; cursor: pointer; }
.b-filter-actions .prim { border: none; background: #2563eb; color: #fff; border-radius: 9px; padding: 8px 16px; font-weight: 700; cursor: pointer; }
.b-histcard { padding-bottom: 8px; }
.b-year { margin-left: auto; display: flex; align-items: center; gap: 8px; border: 1px solid #c7d2fe; border-radius: 9px; padding: 4px 10px; color: #1d4ed8; font-weight: 800; }
.b-histref { padding: 10px 18px; font-weight: 700; font-size: 0.82rem; color: #334155; }
.b-statgrid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; padding: 0 18px 12px; }
.b-statgrid div { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 11px; text-align: center; padding: 8px 0; }
.b-statgrid b { display: block; font-size: 1.15rem; color: #0f172a; } .b-statgrid span { font-size: 0.66rem; color: #94a3b8; text-transform: uppercase; }
.b-histlist { display: flex; flex-direction: column; }
.b-histitem { display: flex; align-items: center; gap: 10px; padding: 10px 18px; border-top: 1px solid #f3f4f6; }
.b-typ { font-size: 0.62rem; font-weight: 800; padding: 2px 7px; border-radius: 7px; }
.b-typ.Achat { background: #dbeafe; color: #1e40af; } .b-typ.Vente { background: #dcfce7; color: #166534; }
.b-histmain { flex: 1; } .b-histmain b { font-size: 0.82rem; display: block; } .b-histmain span { font-size: 0.7rem; color: #94a3b8; }
.b-histqp { text-align: right; } .b-histqp span { font-size: 0.72rem; color: #64748b; display: block; } .b-histqp b { font-size: 0.85rem; }

/* ════════════════════ DESIGN C : Data grid dense ════════════════════ */
.c-root { font-size: 0.8rem; color: #1f2937; }
.c-header { display: flex; align-items: center; gap: 10px; background: #1e293b; color: #e2e8f0; border-radius: 10px; padding: 8px 12px; }
.c-back { width: 32px; height: 32px; border-radius: 7px; border: 1px solid #475569; background: #334155; color: #e2e8f0; cursor: pointer; }
.c-title { font-weight: 800; letter-spacing: .04em; font-size: 0.82rem; } .c-title span { font-weight: 500; color: #94a3b8; margin-left: 8px; }
.c-stockstrip { flex: 1; display: flex; align-items: center; justify-content: center; gap: 18px; }
.c-stockstrip span { display: flex; flex-direction: column; align-items: center; line-height: 1.1; } .c-stockstrip i { font-style: normal; font-size: 0.6rem; color: #94a3b8; text-transform: uppercase; } .c-stockstrip b { font-weight: 800; }
.c-stockstrip b.pos { color: #4ade80; } .c-stockstrip b.neg { color: #f87171; }
.c-total b { color: #fff; }
.c-cart { background: #334155; color: #fdba74; border: 1px solid #475569; border-radius: 7px; padding: 5px 10px; font-weight: 700; cursor: pointer; }
.c-confirm { background: #16a34a; color: #fff; border: none; border-radius: 7px; padding: 7px 14px; font-weight: 700; cursor: pointer; }
.c-body { display: flex; gap: 10px; margin-top: 10px; }
.c-left { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.c-side { width: 300px; flex-shrink: 0; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; height: fit-content; }
.c-grid { background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; position: relative; }
.c-grid-title { display: flex; align-items: center; gap: 12px; background: #f1f5f9; padding: 8px 12px; font-weight: 800; font-size: 0.72rem; letter-spacing: .08em; color: #334155; border-bottom: 1px solid #cbd5e1; }
.c-toolbar { margin-left: auto; }
.c-filtertag { font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 6px; background: #dbeafe; color: #1d4ed8; cursor: pointer; }
.c-filtertag i { margin-left: 5px; }
.c-table { width: 100%; border-collapse: collapse; }
.c-table th { background: #f8fafc; color: #64748b; font-size: 0.62rem; letter-spacing: .04em; text-align: left; padding: 6px 8px; border-bottom: 1.5px solid #cbd5e1; border-right: 1px solid #eef2f7; white-space: nowrap; }
.c-table th.num { text-align: right; }
.c-table th.c-th-f .on { color: #2563eb; }
.c-table td { padding: 4px 8px; border-bottom: 1px solid #eef2f7; border-right: 1px solid #f3f4f6; white-space: nowrap; }
.c-table tbody tr:nth-child(odd) { background: #fcfdfe; }
.c-table tbody tr:hover { background: #eff6ff; }
.c-table tbody tr.sel { background: #dbeafe; box-shadow: inset 3px 0 0 #1d4ed8; }
.mono { font-family: 'Roboto Mono', ui-monospace, monospace; font-size: 0.74rem; }
.c-ref b { font-weight: 800; color: #0f172a; } .c-ref i { font-style: normal; display: block; font-size: 0.68rem; color: #64748b; }
.c-stk { font-weight: 800; padding: 1px 6px; border-radius: 4px; } .c-stk.g { background: #dcfce7; color: #166534; } .c-stk.r { background: #fee2e2; color: #991b1b; }
.c-appro span { font-size: 0.66rem; font-weight: 700; color: #1d4ed8; margin-right: 5px; } .c-appro .cmd { color: #c2410c; }
.c-input { width: 42px; text-align: right; border: 1px solid #cbd5e1; border-radius: 5px; padding: 2px 4px; font-family: ui-monospace, monospace; }
.c-raison { font-size: 0.68rem; color: #94a3b8; }
.c-acts i { color: #2563eb; margin: 0 3px; cursor: pointer; } .c-acts i.ok { color: #16a34a; }
.c-filter { border-top: 1.5px solid #cbd5e1; background: #f8fafc; padding: 8px 12px; }
.c-filter-row { display: flex; align-items: center; gap: 10px; }
.c-filter-lbl { font-weight: 800; font-size: 0.7rem; color: #475569; letter-spacing: .05em; }
.seg.c { padding: 2px; } .seg.c button { height: 26px; font-size: 0.85rem; }
.c-filter-val { width: 70px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 6px; font-family: ui-monospace, monospace; }
.c-mini { border-radius: 6px; padding: 5px 12px; font-size: 0.74rem; font-weight: 700; cursor: pointer; }
.c-mini.ghost { border: 1px solid #cbd5e1; background: #fff; color: #475569; }
.c-mini.prim { border: none; background: #2563eb; color: #fff; }
.c-side-head { display: flex; align-items: center; justify-content: space-between; background: #1e293b; color: #fff; padding: 8px 12px; font-weight: 800; font-size: 0.72rem; letter-spacing: .06em; }
.c-year { display: flex; align-items: center; gap: 6px; font-weight: 700; }
.c-side-ref { padding: 8px 12px; font-weight: 700; font-size: 0.76rem; border-bottom: 1px solid #eef2f7; }
.c-side-kpis { display: flex; border-bottom: 1.5px solid #cbd5e1; }
.c-side-kpis span { flex: 1; text-align: center; padding: 7px 0; font-size: 0.66rem; color: #64748b; border-right: 1px solid #eef2f7; } .c-side-kpis b { display: block; font-size: 0.95rem; color: #0f172a; }
.c-hist th { font-size: 0.58rem; }
.c-typ { display: inline-block; width: 18px; height: 18px; line-height: 18px; text-align: center; border-radius: 5px; font-weight: 800; font-size: 0.66rem; }
.c-typ.Achat { background: #dbeafe; color: #1e40af; } .c-typ.Vente { background: #dcfce7; color: #166534; }

/* ════════════════════ DESIGN C2 : Data grid dense premium ════════════════════ */
.c2-root {
  --p: #2563eb;          /* bleu Reapro */
  --p-soft: #eff6ff;
  --ink: #0f172a;
  --muted: #64748b;
  --line: #e8edf3;
  --line-soft: #f1f5f9;
  --ok: #16a34a;
  --bad: #dc2626;
  --warn: #ea580c;
  --c2-right-width: 440px;     /* zone droite (header + sidebar historique) en état normal — élargie vers la gauche */
  font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif;
  font-size: 13px;
  line-height: 1.45;
  color: #1f2937;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.c2-root.hist-collapsed { --c2-right-width: 54px; }   /* rail */
.c2-root.hist-expanded  { --c2-right-width: 38%; }    /* historique élargi vers la gauche */

/* Une seule police partout ; tabular-nums pour aligner les chiffres (pas de police mono distincte) */
/* Une seule police partout ; chiffres alignés (pas de vraie monospace visible) */
.c2-root, .c2-root input, .c2-root button { font-family: 'Inter', 'Segoe UI', Roboto, Arial, sans-serif; }
.c2-root .mono { font-family: inherit; font-variant-numeric: tabular-nums; }
.c2-root { font-variant-numeric: tabular-nums; }
/* Style commun des valeurs numériques importantes */
.c2-num-value { font-family: inherit; font-variant-numeric: tabular-nums; font-weight: 700; color: var(--ink); }
.c2-table { font-variant-numeric: tabular-nums; }

/* ── Header semi-sombre élégant ── */
.c2-header {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(180deg, #1e293b 0%, #243246 100%);
  color: #e2e8f0;
  border-radius: 12px;
  /* Pas de padding à droite : la zone droite va jusqu'au bord (aligné avec la sidebar) */
  padding: 10px 0 10px 16px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
}
.c2-back {
  width: 36px; height: 36px; flex-shrink: 0;
  border-radius: 9px; border: 1px solid #3b4a61; background: #2b3a4f; color: #cbd5e1; cursor: pointer;
  transition: all .15s;
}
.c2-back:hover { background: #34465e; color: #fff; }
.c2-titlewrap { flex-shrink: 0; }
.c2-titlewrap h1 { margin: 0; font-size: 1.02rem; font-weight: 800; letter-spacing: -0.01em; color: #fff; }
.c2-sub { font-size: 0.95rem; color: #aab6c6; display: flex; align-items: center; gap: 7px; margin-top: 2px; }
.c2-no { color: #93c5fd; font-weight: 800; font-size: 1rem; }
.c2-dot { color: #475569; }
.c2-dot { color: #475569; }
.c2-stockband {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 64px;
  background: rgba(255,255,255,0.04); border: 1px solid #3b4a61; border-radius: 10px;
  padding: 9px 30px; min-width: 0; overflow: hidden;
}
.c2-stocklabel { font-size: 14px; font-weight: 800; letter-spacing: .12em; color: #7dd3fc; flex-shrink: 0; }
.c2-stockcell { display: flex; flex-direction: column; line-height: 1.35; min-width: 0; gap: 3px; }
.c2-ste { font-size: 13px; color: #b6c2d2; text-transform: uppercase; letter-spacing: .02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* Stock + date sur la même ligne, séparés par une barre verticale */
.c2-stkrow { display: flex; align-items: center; gap: 11px; }
.c2-stksep { width: 1px; height: 16px; background: #44566f; flex-shrink: 0; }
.c2-stkv { font-weight: 800; font-size: 19px; line-height: 1; }
.c2-stkv.pos { color: #4ade80; } .c2-stkv.neg { color: #f87171; }
.c2-stkd { font-size: 12.5px; color: #aab6c6; white-space: nowrap; }
.c2-total { display: flex; flex-direction: column; align-items: flex-start; flex-shrink: 0; }
.c2-total span { font-size: 0.66rem; color: #94a3b8; }
.c2-total b { font-size: 1.12rem; color: #93c5fd; font-weight: 800; }
.c2-total em { font-size: 0.66rem; font-style: normal; color: #94a3b8; font-weight: 600; }
.c2-cart { position: relative; display: inline-flex; align-items: center; gap: 5px; background: #2b3a4f; border: 1px solid #3b4a61; color: #fdba74; border-radius: 9px; padding: 7px 11px; font-weight: 700; cursor: pointer; flex-shrink: 0; }
.c2-confirm { display: inline-flex; align-items: center; gap: 7px; background: var(--ok); color: #fff; border: none; border-radius: 9px; padding: 9px 16px; font-weight: 700; cursor: pointer; flex-shrink: 0; box-shadow: 0 4px 12px rgba(22,163,74,.3); }
.c2-confirm:hover { background: #15803d; }

/* ── Corps ── */
.c2-body { display: flex; gap: 12px; margin-top: 12px; align-items: stretch; }
.c2-left { flex: 1; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.c2-side { width: var(--c2-right-width); flex-shrink: 0; align-self: stretch; display: flex; flex-direction: column; background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(16,24,40,.05); transition: width .25s cubic-bezier(.4,0,.2,1); }
/* L'historique remplit la hauteur restante (jusqu'en bas du KIT) et défile si besoin */
.c2-hist { flex: 1; min-height: 0; overflow-y: auto; }
.c2-rail { flex: 1; }

/* Zone droite du header : même largeur que la sidebar Historique (alignement) */
/* Largeur = sidebar historique ; bord droit au ras du conteneur => bords gauches alignés */
/* Barre verticale au BORD GAUCHE de la zone droite => alignée avec la limite gauche de l'Historique */
.c2-header-right { width: var(--c2-right-width); min-width: 360px; max-width: 520px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 0 16px; box-sizing: border-box; border-left: 1px solid #3b4a61; transition: width .25s cubic-bezier(.4,0,.2,1); }

/* ── Cartes grilles ── */
.c2-grid { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(16,24,40,.05); position: relative; }
.c2-grid-head { display: flex; align-items: center; gap: 14px; padding: 10px 14px; border-bottom: 1px solid var(--line); background: #fcfdff; }
.c2-grid-title { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 0.74rem; letter-spacing: .08em; color: var(--ink); }
.c2-acc { width: 4px; height: 16px; border-radius: 3px; background: var(--p); }
.c2-acc.eqv { background: #0ea5e9; } .c2-acc.kit { background: #8b5cf6; }
.c2-count { background: var(--p-soft); color: var(--p); font-weight: 800; font-size: 0.66rem; padding: 1px 8px; border-radius: 9999px; }

/* ── Barre de filtres actifs ── */
/* Filtres actifs : composant en ligne, à droite du titre de section, prend le reste de la largeur */
.c2-filterbar { flex: 1; min-width: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 7px; padding: 5px 10px; background: #f9fafb; border: 1px solid var(--line); border-radius: 8px; }
.c2-filterbar-lbl { font-size: 0.72rem; font-weight: 700; color: var(--muted); display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; }
.c2-filterbar .c2-clearall { margin-left: auto; }
.c2-fchip { display: inline-flex; align-items: center; gap: 6px; font-size: 0.72rem; font-weight: 700; color: var(--p); background: var(--p-soft); border: 1px solid #bfdbfe; border-radius: 7px; padding: 3px 8px; }
.c2-fchip i { color: #60a5fa; cursor: pointer; font-size: 0.66rem; }
.c2-fchip i:hover { color: var(--bad); }
.c2-clearall { margin-left: auto; background: none; border: none; color: var(--muted); font-size: 0.72rem; font-weight: 700; cursor: pointer; text-decoration: underline; }
.c2-clearall:hover { color: var(--bad); }

/* ── Table dense premium ── */
.c2-tablewrap { position: relative; overflow-x: auto; }
.c2-table { width: 100%; border-collapse: collapse; }
.c2-table th {
  background: #f8fafc; color: #475569;
  font-size: 12px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase;
  text-align: right; padding: 10px 10px; white-space: nowrap;
  border-bottom: 1.5px solid var(--line); border-right: 1px solid var(--line-soft);
  position: sticky; top: 0; z-index: 2;
}

/* Grille commune FRS / EQV / KIT : colonnes identiques (alignées) */
.c2-maintable { table-layout: fixed; }
.c2-maintable td, .c2-maintable th { overflow: hidden; text-overflow: ellipsis; }
.c2-table th.left { text-align: left; }
.c2-table th:first-child, .c2-table td:first-child { padding-left: 14px; }
.c2-table th:last-child, .c2-table td:last-child { border-right: none; }
.c2-th-f { color: var(--p) !important; }
/* Bouton filtre raffiné dans les en-têtes de colonnes */
.c2-fbtn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 23px; height: 23px; margin-left: 5px; vertical-align: middle;
  border: 1px solid transparent; background: transparent;
  color: #94a3b8; border-radius: 7px; cursor: pointer;
  transition: all .15s ease;
}
.c2-fbtn i { font-size: 0.78rem; }
.c2-fbtn:hover { background: var(--p-soft); color: var(--p); }
.c2-fbtn.on { color: var(--p); background: var(--p-soft); border-color: #bfdbfe; }
.c2-table td {
  padding: 8px 10px; text-align: right; vertical-align: middle;
  border-bottom: 1px solid var(--line-soft); border-right: 1px solid var(--line-soft);
  color: #334155; font-size: 13.5px;
}
/* Style UNIQUE des valeurs numériques (prix, qté, stock, négo, qté cf…) — réf. "143.830" */
.c2-maintable td.num, .c2-maintable td.mono { font-size: 14px; font-weight: 650; color: var(--ink); font-variant-numeric: tabular-nums; }
/* Les colonnes secondaires (dates, n° doc) restent atténuées */
.c2-maintable td.muted { color: var(--muted) !important; font-weight: 500 !important; }
/* N° Frs en gras dans les 3 tableaux (cohérence FRS / EQV / KIT) */
.c2-maintable td.c2-frsno { font-weight: 700; color: var(--ink); }
.c2-table td.left { text-align: left; }
.c2-table tbody tr:nth-child(even) { background: #fcfdfe; }
.c2-table tbody tr:hover { background: #f5f9ff; cursor: pointer; }
.c2-table tbody tr.sel { background: var(--p-soft); box-shadow: inset 3px 0 0 var(--p); outline: 1px solid #bfdbfe; outline-offset: -1px; }
.c2-table tbody tr.sel td { border-bottom-color: #dbeafe; }

.mono { font-family: 'Roboto Mono', ui-monospace, 'SF Mono', monospace; font-variant-numeric: tabular-nums; }
.muted { color: #94a3b8; }
.c2-ref b { display: block; font-weight: 800; color: var(--ink); font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.c2-ref span { display: block; font-size: 12.5px; color: var(--muted); margin-top: 1px; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.c2-stk { display: inline-block; min-width: 32px; text-align: center; font-weight: 800; font-size: 14px; padding: 3px 10px; border-radius: 6px; }
.c2-stk.g { background: #dcfce7; color: #15803d; }
.c2-stk.r { background: #fee2e2; color: #b91c1c; }
.c2-stk.o { background: #ffedd5; color: #c2410c; }

.c2-appro { text-align: left; white-space: nowrap; }
.c2-appro span { display: inline-block; font-size: 11.5px; font-weight: 800; padding: 2px 7px; border-radius: 5px; margin-right: 4px; }
.c2-appro .imp { color: #1d4ed8; background: #eff6ff; border: 1px solid #dbeafe; }
.c2-appro .cmd { color: #c2410c; background: #fff7ed; border: 1px solid #fed7aa; }
.c2-appro .z { color: #94a3b8; background: #f8fafc; border-color: #eef2f7; }

.c2-pricecell b { display: block; font-size: 14px; color: var(--ink); font-weight: 650; }
.c2-pricecell em { font-style: normal; font-size: 11px; font-weight: 700; }
.c2-pricecell em.up { color: var(--bad); } .c2-pricecell em.down { color: var(--ok); }

.c2-input { width: 48px; text-align: right; border: 1px solid #d8dee7; border-radius: 6px; padding: 4px 6px; font-size: 14px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
.c2-input:focus { outline: none; border-color: var(--p); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.c2-raison { font-size: 12px; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.c2-raison.empty { color: #cbd5e1; }
.c2-actcol { text-align: center !important; }
.c2-acts { text-align: center; white-space: nowrap; }
.c2-acts i { color: #94a3b8; margin: 0 3px; cursor: pointer; font-size: 0.92rem; transition: color .15s, transform .15s; }
.c2-acts i:hover { transform: scale(1.18); }
.c2-acts i.pi-info-circle:hover { color: var(--p); }
.c2-acts i.pi-comment:hover { color: var(--warn); }
.c2-acts i.ok { color: #86efac; } .c2-acts i.ok:hover { color: var(--ok); }
.pos-txt { color: var(--ok); font-weight: 700; }

.c2-empty { text-align: center !important; padding: 22px !important; color: #94a3b8; font-style: italic; }
.c2-empty i { font-size: 1.1rem; margin-right: 6px; }

/* ── Mini-menu de filtre ── */
.c2-fmenu {
  position: absolute; top: 40px; left: 38%; width: 244px; z-index: 20;
  background: #fff; border: 1px solid var(--line); border-radius: 12px;
  box-shadow: 0 16px 40px rgba(15,23,42,.22); padding: 12px;
}
.c2-fmenu-head { display: flex; align-items: center; justify-content: space-between; font-weight: 800; color: var(--ink); font-size: 0.82rem; padding-bottom: 9px; border-bottom: 1px solid var(--line-soft); }
.c2-fmenu-head button { border: none; background: transparent; color: #94a3b8; cursor: pointer; }
.c2-fmenu-head button:hover { color: var(--bad); }
.c2-fmenu-lbl { font-size: 0.66rem; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); font-weight: 800; margin: 10px 0 5px; }
.seg.c2 { padding: 3px; }
.seg.c2 button { height: 28px; font-size: 0.9rem; }
.c2-fmenu-val { width: 100%; box-sizing: border-box; border: 1px solid #d8dee7; border-radius: 8px; padding: 7px 9px; font-family: ui-monospace, monospace; }
.c2-fmenu-val:focus { outline: none; border-color: var(--p); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.c2-fmenu-actions { display: flex; justify-content: space-between; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line-soft); }
.c2-fmenu-actions .ghost { border: 1px solid #d8dee7; background: #fff; color: #475569; border-radius: 8px; padding: 6px 12px; font-weight: 600; cursor: pointer; }
.c2-fmenu-actions .ghost:hover { background: #f8fafc; }
.c2-fmenu-actions .prim { display: inline-flex; align-items: center; gap: 5px; border: none; background: var(--p); color: #fff; border-radius: 8px; padding: 6px 14px; font-weight: 700; cursor: pointer; }
.c2-fmenu-actions .prim:hover { background: #1d4ed8; }

/* ── Sidebar Historique premium ── */
.c2-side-head { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(180deg, #1e293b, #243246); color: #fff; padding: 10px 14px; }
.c2-side-title { font-weight: 800; font-size: 0.78rem; letter-spacing: .04em; display: inline-flex; align-items: center; gap: 7px; }
.c2-side-title i { color: #7dd3fc; }
.c2-year { display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.8rem; background: rgba(255,255,255,.08); border-radius: 7px; padding: 3px 9px; }
.c2-year i { cursor: pointer; color: #cbd5e1; }
.c2-side-ref { padding: 10px 14px; border-bottom: 1px solid var(--line); }
.c2-side-ref b { font-weight: 800; color: var(--ink); font-size: 0.92rem; }
.c2-side-ref span { display: block; font-size: 0.78rem; color: var(--muted); }
.c2-side-kpis { display: flex; border-bottom: 1px solid var(--line); background: #fcfdff; }
.c2-side-kpis .kpi { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 9px 0; border-right: 1px solid var(--line-soft); }
.c2-side-kpis .kpi:last-child { border-right: none; }
.c2-side-kpis .kpi i { font-style: normal; font-size: 0.68rem; text-transform: uppercase; color: var(--muted); letter-spacing: .03em; }
.c2-side-kpis .kpi b { font-size: 1.1rem; color: var(--ink); }
.c2-side-kpis .kpi b.pos { color: var(--ok); } .c2-side-kpis .kpi b.neg { color: var(--bad); }
.c2-histtable th { font-size: 12.5px; padding: 10px 8px; }
.c2-histtable td { padding: 8px 8px; font-size: 14px; }
/* Valeurs de l'historique au même style numérique (homogène avec les tableaux) */
.c2-histtable td.mono { font-weight: 650; color: var(--ink); }
.c2-histtable td.mono.muted { color: var(--muted); font-weight: 500; }
.c2-histtable td.neg { color: var(--bad); }
.c2-typ { display: inline-block; width: 19px; height: 19px; line-height: 19px; text-align: center; border-radius: 5px; font-weight: 800; font-size: 0.64rem; }
.c2-typ.Achat { background: #dbeafe; color: #1e40af; }
.c2-typ.Vente { background: #dcfce7; color: #166534; }
.c2-typ.Rupture { background: #fee2e2; color: #b91c1c; }
.c2-typ.Transfert { background: #ffedd5; color: #c2410c; }
.c2-table td.neg { color: var(--bad); }

/* ── Chips de filtre dans l'en-tête des sections EQV/KIT ── */
.c2-grid-head { gap: 12px; }
.c2-grid-chips { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-left: auto; }
.c2-fchip.sm { font-size: 0.68rem; padding: 2px 7px; }
.c2-clearall.sm { font-size: 0.68rem; }

/* ── Collapse / expand historique ── */
.c2-side-headright { display: flex; align-items: center; gap: 8px; }
.c2-collapse { border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.14); color: #e2e8f0; width: 28px; height: 26px; border-radius: 7px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all .15s; }
.c2-collapse:hover { background: #2563eb; border-color: #2563eb; color: #fff; }
.c2-collapse i { font-size: 0.85rem; }
.c2-collapse:disabled { opacity: .35; cursor: default; }
.c2-collapse:disabled:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.25); color: #e2e8f0; }

/* Cellule Frs : code fournisseur + n° document en 2ème ligne */
.c2-frs { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.25; text-align: left; }
.c2-doc { font-size: 12px; color: var(--muted); text-align: left; }

/* Code FRS strictement identique dans FOURNISSEURS / EQUIVALENCE / KIT */
.c2-frs-code {
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.25;
  text-align: left;
  font-variant-numeric: tabular-nums;
}
.c2-rail { height: 100%; min-height: 360px; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px 0; cursor: pointer; background: linear-gradient(180deg, #1e293b, #243246); color: #cbd5e1; }
.c2-rail .c2-collapse { background: rgba(255,255,255,0.12); }
.c2-rail-icon { font-size: 1.1rem; color: #7dd3fc; margin-top: 4px; }
.c2-rail-label { writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: 0.18em; font-size: 0.66rem; font-weight: 800; color: #94a3b8; }
.c2-rail:hover .c2-rail-label { color: #e2e8f0; }

/* ── Mini-menu de filtre flottant (positionné au clic) ── */
.c2-menu-backdrop { position: fixed; inset: 0; z-index: 40; }
.c2-fmenu.floating {
  position: fixed; left: auto; top: auto; width: 248px; z-index: 41;
  background: #fff; border: 1px solid var(--line); border-radius: 12px;
  box-shadow: 0 18px 44px rgba(15,23,42,.26); padding: 12px;
}
</style>
