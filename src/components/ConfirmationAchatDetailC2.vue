<!--
  ╔══════════════════════════════════════════════════════════════════════════╗
  ║  ConfirmationAchatDetailC2.vue                                            ║
  ║  ─────────────────────────────────────────────────────────────────────── ║
  ║  PHASE 1 — SQUELETTE VISUEL C2 EXACT (sans données réelles, sans logique). ║
  ║                                                                            ║
  ║  Ce composant est un PORTAGE FIDÈLE du prototype validé                    ║
  ║      src/views/ConfirmationAchatUiLabView.vue  →  Design C2 · Data grid    ║
  ║      premium ★                                                            ║
  ║                                                                            ║
  ║  But : valider d'abord le DESIGN identique au prototype, puis brancher     ║
  ║  les vraies données pas à pas (voir TODO Phase 2 → 7 plus bas).            ║
  ║                                                                            ║
  ║  ⚠️  Données 100 % statiques (mock du prototype). AUCUN appel API, AUCUN   ║
  ║      store, AUCUN handler métier. Les boutons sont visuels (stubs).        ║
  ║                                                                            ║
  ║  Rollback : changer l'import dans src/views/ConfirmationAchatView.vue.     ║
  ╚══════════════════════════════════════════════════════════════════════════╝
-->
<template>
  <section class="c2-root"
    :class="{ 'hist-collapsed': histState === 'collapsed', 'hist-expanded': histState === 'expanded' }">
    <!-- ════════════════════════ HEADER C2 ════════════════════════ -->
    <header class="c2-header">
      <!-- Seule action réellement câblée en Phase 1 : retour à la liste -->
      <button class="c2-back" title="Retour à la liste" @click="emit('back')"><i class="pi pi-arrow-left"></i></button>
      <div class="c2-titlewrap">
        <h1>Confirmation Commandes Achat</h1>
        <!-- PHASE 2 : numéro + description comparateur réels (props depuis la vue parent) -->
        <div class="c2-sub"><span class="c2-no">{{ compareQuoteNo || mock.compareNo }}</span><span class="c2-dot">·</span>{{ compareQuoteDescription || mock.compareDesc }}</div>
      </div>
      <!-- PHASE 7 : bande STOCKS = stocks intersociétés réels (design STE / Stock / Dern. Achat, réf. détail comparateur) -->
      <div class="c2-stockband">
        <span class="c2-stocklabel">STOCKS</span>
        <div v-for="s in intercompanyStocks" :key="s.companyId" class="c2-stkcol">
          <div class="c2-stkpart">
            <span class="c2-stkmini">STE</span>
            <span class="c2-stkval company">{{ s.company }}</span>
          </div>
          <div class="c2-stkpart click" :title="'Voir l\'historique — ' + s.company" @click.stop="openHistory(s.company, s.companyId, s.stock)">
            <span class="c2-stkmini">Stock</span>
            <span class="c2-stkval" :class="Number(s.stock) > 0 ? 'pos' : 'neg'">{{ s.stock }}</span>
          </div>
          <div class="c2-stkpart">
            <span class="c2-stkmini">Dern. Achat</span>
            <span class="c2-stkval date">{{ formatDate(s.lastPurchaseDate) }}</span>
          </div>
        </div>
      </div>
      <!-- Zone droite alignée avec la sidebar Historique (même largeur) -->
      <div class="c2-header-right">
        <!-- PHASE 7 : total document réel (lié à la ligne FRS) + n° DP réel -->
        <div class="c2-total"><span>{{ selectedDetailRow?.documentNo || '—' }}</span><b>{{ formatMoney(totalAmount) }} <em>TND</em></b></div>
        <!-- COUNT OEM : équivalences OEM du master de la ligne FRS sélectionnée (clic = détails) -->
        <button class="c2-oem" :class="{ z: !oemCount, clickable: !isLoadingOemCount && oemCountDetails.length }"
          :title="oemCountDetails.length ? 'Voir les équivalences OEM' : 'Équivalences OEM du master'"
          :disabled="isLoadingOemCount || !oemCountDetails.length" @click="openOemDialog">
          <i class="pi" :class="isLoadingOemCount ? 'pi-spin pi-spinner' : 'pi-sitemap'"></i>
          <span>OEM {{ isLoadingOemCount ? '…' : (oemCount ?? 0) }}</span>
        </button>
        <!-- PHASE 8B : ouvre le panier dans la sidebar C2 -->
        <button class="c2-cart" :class="{ active: sidebarMode === 'cart' }" title="Voir le panier" @click="openCart"><i class="pi pi-shopping-cart"></i><span>{{ store.cartCount }}</span></button>
        <!-- TODO Phase ultérieure : logique Confirmer -->
        <button class="c2-confirm" @click="noop"><i class="pi pi-check"></i> Confirmer</button>
      </div>
    </header>

    <!-- ════════════════════════ CORPS C2 ════════════════════════ -->
    <div class="c2-body">
      <div class="c2-left">
        <!-- ─── FOURNISSEURS ─── (TODO Phase 3 : FRS réel en lecture · TODO Phase 6 : filtres backend) -->
        <div class="c2-grid">
          <div class="c2-grid-head">
            <div class="c2-grid-title"><span class="c2-acc"></span>FOURNISSEURS<span class="c2-count">{{ frsTotalElements || quoteLineDetails.length }}</span><span class="c2-sum dp" title="Nombre distinct de N° DP (toutes lignes filtrées)">DP {{ frsDistinctDp }}</span></div>
            <div class="c2-filterbar" v-if="c2Filters.frs.length">
              <span class="c2-filterbar-lbl"><i class="pi pi-filter"></i> Filtres actifs</span>
              <span v-for="f in c2Filters.frs" :key="f.key" class="c2-fchip">{{ f.label }}<i class="pi pi-times" @click="removeFilter('frs', f.key)"></i></span>
              <button class="c2-clearall" @click="clearAll('frs')">Effacer tout</button>
            </div>
          </div>

          <!-- PHASE 3 : tablewrap scrollable (infinite scroll serveur). max-height n'engage
               un scroll interne que s'il y a beaucoup de lignes → visuel C2 préservé sinon. -->
          <div class="c2-tablewrap c2-frs-scroll" ref="frsWrap" @scroll="onFrsScroll">
            <table class="c2-table c2-maintable">
              <colgroup><col v-for="(w, ci) in activeCols" :key="ci" :style="{ width: w }" /></colgroup>
              <thead>
                <tr>
                  <th class="left">Frs</th><th class="left c2-th-f">Réf / Désignation <button class="c2-fbtn" :class="{ on: isColFiltered('frs','ref') }" @click.stop="openMenu($event,'frs','ref','Réf')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="num c2-th-f">Stock <button class="c2-fbtn" :class="{ on: isColFiltered('frs','stock') }" @click.stop="openMenu($event,'frs','stock','Stock')"><i class="pi pi-sliders-h"></i></button></th>
                  <th>Appro</th>
                  <th class="num c2-th-f">Der. Ach. <button class="c2-fbtn" :class="{ on: isColFiltered('frs','date') }" @click.stop="openMenu($event,'frs','date','Dernier Achat')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="num">Coût Dir.</th><th class="num">Prix Rev.</th><th class="num">Prix Vte</th>
                  <th v-if="!isHistExpanded" class="num">Négoc.</th>
                  <th v-if="!isHistExpanded" class="num c2-th-f" title="Confirmation Initial : Qté 1er Confirmation">CF I <button class="c2-fbtn" :class="{ on: isColFiltered('frs','firstconf') }" @click.stop="openMenu($event,'frs','firstconf','1ère Conf')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="num c2-th-f c2-th-c" title="Confirmation Finale : Qté Confirmé finale">CF F <button class="c2-fbtn" :class="{ on: isColFiltered('frs','qty') }" @click.stop="openMenu($event,'frs','qty','Qté')"><i class="pi pi-sliders-h"></i></button></th>
                  <th class="c2-actcol">Actions</th>
                </tr>
              </thead>
              <tbody>
                <!-- PHASE 3 : vraies lignes FRS (lecture simple). Champs secondaires (Dernier achat, %) = "—" + TODO -->
                <tr v-for="(detail, i) in quoteLineDetails" :key="detail.id ?? i" :class="{ sel: activeTableSelection === 'frs' && i === selectedFrs }" @click="selectFrs(i)">
                  <td><div class="c2-frs"><span class="c2-frs-code"><span class="c2-row-index" :class="{ 'ctx-active': hasSelectedFrs && i === selectedFrs }">{{ i + 1 }}</span>{{ detail.buyFromVendorNo || '—' }}</span><span class="c2-doc">{{ detail.documentNo }}</span></div></td>
                  <td class="left c2-ref"><b>{{ detail.no }}</b><span>{{ detail.descriptionStructured }}</span></td>
                  <td class="num"><span class="c2-stk" :class="Number(detail.inventoryWithoutImport) > 0 ? 'g' : 'r'">{{ detail.inventoryWithoutImport ?? 0 }}</span></td>
                  <td class="c2-appro"><span class="imp" :class="{ z: !detail.importInventory, clickable: detail.importInventory > 0 }" :title="detail.importInventory > 0 ? 'Voir les lignes d\'import' : ''" @click.stop="openImportLines(detail.no, detail.buyFromVendorNo, detail.importInventory)">I {{ detail.importInventory ?? 0 }}</span><span class="cmd" :class="{ z: !detail.qtyOnPurchOrder, clickable: detail.qtyOnPurchOrder > 0 }" :title="detail.qtyOnPurchOrder > 0 ? 'Voir les lignes de commande achat' : ''" @click.stop="openPoLines(detail)">C {{ detail.qtyOnPurchOrder ?? 0 }}</span></td>
                  <!-- Dernier Achat : prix + badge quantité (ligne 1), date (ligne 2). Source secondaire last-invoiced. -->
                  <td class="num c2-lastbuy">
                    <template v-if="getLastInvoicedData(detail.buyFromVendorNo, detail.no)">
                      <div class="c2-lb-top"><b class="mono c2-derp-link" title="Voir l'historique Der P" @click.stop="openDerp(detail.no, detail.descriptionStructured)">{{ formatNumber(getLastInvoicedData(detail.buyFromVendorNo, detail.no).lastInvoicedDirectCost, 2) }}</b><span v-if="getLastInvoicedData(detail.buyFromVendorNo, detail.no).quantity" class="c2-qbadge">{{ Math.round(getLastInvoicedData(detail.buyFromVendorNo, detail.no).quantity) }}</span></div>
                      <em class="c2-lb-date">{{ formatDate(getLastInvoicedData(detail.buyFromVendorNo, detail.no).lastInvoicedCostDate) }}</em>
                    </template>
                    <span v-else class="muted mono">—</span>
                  </td>
                  <!-- Coût Direct : prix + icône préférentiel (ligne 1) ; % évolution vs avant-dernier prix d'achat (ligne 2). Clic = historique prix. -->
                  <td class="num c2-costdir">
                    <div class="c2-cd-top">
                      <b class="mono c2-clickprice" title="Voir l'historique des prix" @click.stop="openPriceHist(detail.buyFromVendorNo, detail.no, detail.descriptionStructured, true)">{{ formatNumber(detail.directUnitCost, 2) }}</b>
                      <i class="c2-pref" :class="detail.preferential ? 'pi pi-check-circle on' : 'pi pi-times-circle off'" :title="detail.preferential ? 'Prix préférentiel' : 'Prix non préférentiel'"></i>
                    </div>
                    <span v-if="frsPctChange(detail)" class="c2-pct" :class="getPercentageClass(frsPctChange(detail))">{{ frsPctChange(detail) }}</span>
                  </td>
                  <!-- TODO Phase ultérieure : variation % (nécessite appels secondaires) -->
                  <td class="num c2-pricecell"><b class="mono">{{ formatNumber(detail.prixDeRevientCalcule, 3) }}</b></td>
                  <td class="num c2-pricecell"><b class="mono">{{ formatNumber(detail.calcAncienPrixDeVente, 3) }}</b></td>
                  <!-- Négoc. : Nég Px + Nég Qt fusionnés, affichage seul (lecture seule). Masquée en Historique expanded. -->
                  <td v-if="!isHistExpanded" class="num c2-negoc">
                    <template v-if="(detail.askingPrice ?? '') !== '' || (detail.askingQty ?? '') !== ''">
                      <div class="c2-negoc-cell">
                        <span class="c2-negoc-badge c2-negoc-price"><span class="c2-negoc-label">PX</span><span class="c2-negoc-value">{{ (detail.askingPrice ?? '') !== '' ? formatNumber(detail.askingPrice, 2) : '—' }}</span></span>
                        <span class="c2-negoc-badge c2-negoc-qty"><span class="c2-negoc-label">QTÉ</span><span class="c2-negoc-value">{{ (detail.askingQty ?? '') !== '' ? formatNumber(detail.askingQty, 0) : '—' }}</span></span>
                      </div>
                    </template>
                    <span v-else class="muted mono">—</span>
                  </td>
                  <!-- Qté 1ère Conf. : lecture seule, source API BC quoteLines (detail.qtyFirstConfirmation). Pas de vue SQL. -->
                  <td v-if="!isHistExpanded" class="num mono">{{ (detail.qtyFirstConfirmation ?? '') !== '' ? formatNumber(detail.qtyFirstConfirmation, 0) : '—' }}</td>
                  <td class="c2-qtycell">
                    <div class="c2-qtywrap">
                      <input class="c2-input" type="number" step="1" min="0" v-model.number="detail.quantity" :disabled="detail.isUpdating" @click.stop @change="updateFrsLine(detail)" @keydown.enter="$event.target.blur()" />
                      <!-- Icône Valider : MÊME traitement que la modif Qté Cf (updateFrsLine). Spinner pendant l'enregistrement. -->
                      <i v-if="detail.isUpdating" class="pi pi-spin pi-spinner" title="Enregistrement…"></i>
                      <i v-else class="pi pi-check-circle c2-validate" title="Valider la quantité" @click.stop="updateFrsLine(detail)"></i>
                    </div>
                  </td>
                  <td class="c2-acts">
                    <!-- En Historique expanded : seule l'icône Info article reste. Logique inchangée (juste masquage UI). -->
                    <i v-if="!isHistExpanded && hasReason(detail,'frs')" class="pi pi-exclamation-triangle c2-reason-ic" title="Voir la raison" @click.stop="openReason($event, detail, 'frs')"></i>
                    <i class="pi pi-info-circle" title="Informations" @click.stop="openInfo(detail)"></i>
                    <i v-if="!isHistExpanded" class="pi pi-comment" :class="{ 'has-comment': hasComment(detail, 'frs') }" :title="hasComment(detail, 'frs') ? 'Modifier le commentaire' : 'Ajouter un commentaire'" @click.stop="openComment($event, detail, 'frs')"></i>
                    <i v-if="!isHistExpanded && detail.isVerifying" class="pi pi-spin pi-spinner" title="Marquage en cours…"></i>
                    <i v-else-if="!isHistExpanded" class="pi" :class="detail.toVerify ? 'pi-flag-fill to-verify' : 'pi-flag'" :title="detail.toVerify ? 'Marqué à vérifier' : 'À vérifier'" @click.stop="markToVerify(detail)"></i>
                    <i v-if="!isHistExpanded && detail.isUpdating" class="pi pi-spin pi-spinner" title="Enregistrement…"></i>
                  </td>
                </tr>
                <tr v-if="isLoadingFrsMore && !quoteLineDetails.length"><td colspan="12" class="c2-empty"><i class="pi pi-spin pi-spinner"></i> Chargement des fournisseurs…</td></tr>
                <tr v-else-if="!quoteLineDetails.length"><td colspan="12" class="c2-empty"><i class="pi pi-inbox"></i> Aucune ligne fournisseur pour ce comparateur</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ─── ÉQUIVALENCE ─── (TODO Phase 4 : EQV réel sur sélection FRS) -->
        <div class="c2-grid">
          <div class="c2-grid-head">
            <div class="c2-grid-title"><span class="c2-acc eqv"></span>ÉQUIVALENCE<span class="c2-count">{{ eqvTotalElements || equivalenceItems.length }}</span><span class="c2-sum cmd" title="Total Commande (toutes lignes filtrées)">CMD {{ fmtSum(eqvTotalCmd) }}</span><span class="c2-sum imp" title="Total Import (toutes lignes filtrées)">IMP {{ fmtSum(eqvTotalImp) }}</span></div>
            <div class="c2-filterbar" v-if="c2Filters.eqv.length">
              <span class="c2-filterbar-lbl"><i class="pi pi-filter"></i> Filtres actifs</span>
              <span v-for="f in c2Filters.eqv" :key="f.key" class="c2-fchip">{{ f.label }}<i class="pi pi-times" @click="removeFilter('eqv', f.key)"></i></span>
              <button class="c2-clearall" @click="clearAll('eqv')">Effacer tout</button>
            </div>
          </div>
          <div class="c2-tablewrap c2-eqv-scroll" ref="eqvWrap" @scroll="onEquivalenceScroll">
            <table class="c2-table c2-maintable">
              <colgroup><col v-for="(w, ci) in activeCols" :key="ci" :style="{ width: w }" /></colgroup>
              <thead><tr>
                <th class="left">Frs</th><th class="left c2-th-f">Réf / Désignation <button class="c2-fbtn" :class="{ on: isColFiltered('eqv','ref') }" @click.stop="openMenu($event,'eqv','ref','Réf')"><i class="pi pi-sliders-h"></i></button></th>
                <th class="num c2-th-f">Stock <button class="c2-fbtn" :class="{ on: isColFiltered('eqv','stock') }" @click.stop="openMenu($event,'eqv','stock','Stock')"><i class="pi pi-sliders-h"></i></button></th>
                <th>Appro</th>
                <th class="num c2-th-f">Der. Ach. <button class="c2-fbtn" :class="{ on: isColFiltered('eqv','date') }" @click.stop="openMenu($event,'eqv','date','Dernier Achat')"><i class="pi pi-sliders-h"></i></button></th>
                <!-- PHASE 6B : seuls Stock + Dernier sont filtrables (backend). Autres colonnes EQV = sans filtre. -->
                <th class="num">Prix Dev.</th>
                <th class="num">Coût Calc.</th>
                <th class="num">Prix Vte</th>
                <th v-if="!isHistExpanded" class="num">Achat</th>
                <th v-if="!isHistExpanded" class="num">Vente</th>
                <th class="num c2-th-c">Panier</th>
                <th class="c2-actcol">Actions</th>
              </tr></thead>
              <tbody>
                <!-- PHASE 4B : vraies lignes ÉQUIVALENCE (lecture simple) · PHASE 4D : sélection visuelle C2 -->
                <tr v-for="(e, ei) in equivalenceItems" :key="e.id ?? e.no ?? ei" :class="{ sel: activeTableSelection === 'eqv' && ei === selectedEqvIndex }" @click="selectEqv(ei)">
                  <td class="left"><span class="c2-frs-code">{{ e.vendorNo || '—' }}</span></td>
                  <td class="left c2-ref"><b>{{ formatReference(e.no) }}</b><span>{{ e.descriptionStructured }}</span></td>
                  <td class="num"><span class="c2-stk" :class="Number(e.qtyStock) > 0 ? 'g' : 'r'">{{ e.qtyStock ?? 0 }}</span></td>
                  <td class="c2-appro"><span class="imp" :class="{ z: !e.qtyImport, clickable: e.qtyImport > 0 }" :title="e.qtyImport > 0 ? 'Voir les lignes d\'import' : ''" @click.stop="openImportLines(e.no, e.vendorNo, e.qtyImport)">I {{ e.qtyImport ?? 0 }}</span><span class="cmd" :class="{ z: !e.qtyOnPurchOrder, clickable: e.qtyOnPurchOrder > 0 }" :title="e.qtyOnPurchOrder > 0 ? 'Voir les lignes de commande achat' : ''" @click.stop="openPoLines(e)">C {{ e.qtyOnPurchOrder ?? 0 }}</span></td>
                  <!-- Dernier Achat EQV : prix + badge qté + date (champs déjà sur la ligne) -->
                  <td class="num c2-lastbuy">
                    <template v-if="e.lastInvoicedCostDate || e.lastInvoicedDirectCost != null">
                      <div class="c2-lb-top"><b class="mono c2-derp-link" title="Voir l'historique Der P" @click.stop="openDerp(e.no, e.descriptionStructured)">{{ formatNumber(e.lastInvoicedDirectCost, 2) }}</b><span v-if="e.quantity" class="c2-qbadge">{{ Math.round(e.quantity) }}</span></div>
                      <em class="c2-lb-date">{{ formatDate(e.lastInvoicedCostDate) }}</em>
                    </template>
                    <span v-else class="muted mono">—</span>
                  </td>
                  <!-- PHASE 10C : clic = historique prix d'achat (filtre libre) · + icône préférentiel (LastPreferential) -->
                  <td class="num mono"><span class="c2-clickprice" title="Voir l'historique des prix" @click.stop="openPriceHist(e.vendorNo, e.no, e.descriptionStructured, false)">{{ formatNumber(e.lastCurrPrice, 2) }}</span><i class="c2-pref" :class="e.LastPreferential ? 'pi pi-check-circle on' : 'pi pi-times-circle off'" :title="e.LastPreferential ? 'Prix préférentiel' : 'Prix non préférentiel'"></i></td>
                  <td class="num c2-pricecell"><b class="mono">{{ formatNumber(e.lastPurshCostDS, 3) }}</b><em class="muted">{{ formatDate(e.lastPurshDate) }}</em></td>
                  <td class="num mono">{{ formatNumber(e.unitPrice, 3) }}</td>
                  <td v-if="!isHistExpanded" class="num mono" :class="{ 'pos-txt': (e.acheteCurrYear || 0) > 0 }">{{ e.acheteCurrYear ?? 0 }}</td>
                  <td v-if="!isHistExpanded" class="num mono" :class="{ 'pos-txt': (e.venduCurrYear || 0) > 0 }">{{ e.venduCurrYear ?? 0 }}</td>
                  <!-- PHASE 8A : quantité panier éditable + bouton Ajouter au panier (déplacé depuis Actions) -->
                  <td class="c2-qtycell">
                    <div class="c2-qtywrap">
                      <input class="c2-input" type="number" min="0" v-model.number="e.quantityToOrder" @click.stop />
                      <i v-if="cartBusyKey === (e.id ?? e.no)" class="pi pi-spin pi-spinner" title="Ajout en cours…"></i>
                      <i v-else class="pi pi-shopping-cart c2-cart-add" :class="{ 'in-cart': e.existPurchaseCart }" :title="e.existPurchaseCart ? 'Déjà au panier' : 'Ajouter au panier'" @click.stop="addToCart(e)"></i>
                    </div>
                  </td>
                  <td class="c2-acts">
                    <!-- En Historique expanded : seule l'icône Info article reste. -->
                    <i v-if="!isHistExpanded && hasReason(e,'eqv')" class="pi pi-exclamation-triangle c2-reason-ic" title="Voir la raison" @click.stop="openReason($event, e, 'eqv')"></i>
                    <i class="pi pi-info-circle" title="Informations" @click.stop="openInfo(e)"></i>
                    <i v-if="!isHistExpanded" class="pi pi-comment" :class="{ 'has-comment': hasComment(e, 'eqv') }" :title="hasComment(e, 'eqv') ? 'Modifier le commentaire' : 'Ajouter un commentaire'" @click.stop="openComment($event, e, 'eqv')"></i>
                    <i v-if="!isHistExpanded && e.isVerifying" class="pi pi-spin pi-spinner" title="Marquage en cours…"></i>
                    <i v-else-if="!isHistExpanded" class="pi" :class="e.toVerify ? 'pi-flag-fill to-verify' : 'pi-flag'" :title="e.toVerify ? 'Marqué à vérifier' : 'À vérifier'" @click.stop="markToVerify(e)"></i>
                  </td>
                </tr>
                <tr v-if="isLoadingEquivalence && !equivalenceItems.length"><td colspan="12" class="c2-empty"><i class="pi pi-spin pi-spinner"></i> Chargement des équivalences…</td></tr>
                <tr v-else-if="!hasSelectedFrs"><td colspan="12" class="c2-empty"><i class="pi pi-hand-point-up"></i> Sélectionnez un fournisseur pour voir les équivalences</td></tr>
                <tr v-else-if="!equivalenceItems.length"><td colspan="12" class="c2-empty"><i class="pi pi-inbox"></i> Aucune équivalence</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ─── KIT ─── (TODO Phase 4 : KIT réel sur sélection FRS) -->
        <div class="c2-grid">
          <div class="c2-grid-head">
            <div class="c2-grid-title"><span class="c2-acc kit"></span>KIT<span class="c2-count">{{ kitTotalElements || kitItems.length }}</span><span class="c2-sum cmd" title="Total Commande (toutes lignes filtrées)">CMD {{ fmtSum(kitTotalCmd) }}</span><span class="c2-sum imp" title="Total Import (toutes lignes filtrées)">IMP {{ fmtSum(kitTotalImp) }}</span></div>
            <div class="c2-filterbar" v-if="c2Filters.kit.length">
              <span class="c2-filterbar-lbl"><i class="pi pi-filter"></i> Filtres actifs</span>
              <span v-for="f in c2Filters.kit" :key="f.key" class="c2-fchip">{{ f.label }}<i class="pi pi-times" @click="removeFilter('kit', f.key)"></i></span>
              <button class="c2-clearall" @click="clearAll('kit')">Effacer tout</button>
            </div>
          </div>
          <div class="c2-tablewrap c2-kit-scroll" ref="kitWrap" @scroll="onKitScroll">
            <table class="c2-table c2-maintable">
              <colgroup><col v-for="(w, ci) in activeCols" :key="ci" :style="{ width: w }" /></colgroup>
              <thead><tr>
                <th class="left">Frs</th><th class="left c2-th-f">Réf / Désignation <button class="c2-fbtn" :class="{ on: isColFiltered('kit','ref') }" @click.stop="openMenu($event,'kit','ref','Réf')"><i class="pi pi-sliders-h"></i></button></th>
                <th class="num c2-th-f">Stock <button class="c2-fbtn" :class="{ on: isColFiltered('kit','stock') }" @click.stop="openMenu($event,'kit','stock','Stock')"><i class="pi pi-sliders-h"></i></button></th>
                <th>Appro</th>
                <th class="num c2-th-f">Der. Ach. <button class="c2-fbtn" :class="{ on: isColFiltered('kit','date') }" @click.stop="openMenu($event,'kit','date','Dernier Achat')"><i class="pi pi-sliders-h"></i></button></th>
                <!-- PHASE 6B : seuls Stock + Dernier sont filtrables (backend). Autres colonnes KIT = sans filtre. -->
                <th class="num">Prix Dev.</th>
                <th class="num">Coût Calc.</th>
                <th class="num">Prix Vte</th>
                <th v-if="!isHistExpanded" class="num">Achat</th><th v-if="!isHistExpanded" class="num">Vente</th>
                <th class="num c2-th-c">Panier</th>
                <th class="c2-actcol">Actions</th>
              </tr></thead>
              <tbody>
                <!-- PHASE 4B : vraies lignes KIT (lecture simple) · PHASE 4D : sélection visuelle C2 -->
                <tr v-for="(k, ki) in kitItems" :key="k.id ?? k.no ?? ki" :class="{ sel: activeTableSelection === 'kit' && ki === selectedKitIndex }" @click="selectKit(ki)">
                  <td class="left"><span class="c2-frs-code">{{ k.vendorNo || '—' }}</span></td>
                  <td class="left c2-ref"><b>{{ formatReference(k.no) }}</b><span>{{ k.descriptionStructured }}</span></td>
                  <td class="num"><span class="c2-stk" :class="Number(k.qtyStock) > 0 ? 'g' : 'r'">{{ k.qtyStock ?? 0 }}</span></td>
                  <td class="c2-appro"><span class="imp" :class="{ z: !k.qtyImport, clickable: k.qtyImport > 0 }" :title="k.qtyImport > 0 ? 'Voir les lignes d\'import' : ''" @click.stop="openImportLines(k.no, k.vendorNo, k.qtyImport)">I {{ k.qtyImport ?? 0 }}</span><span class="cmd" :class="{ z: !k.qtyOnPurchOrder, clickable: k.qtyOnPurchOrder > 0 }" :title="k.qtyOnPurchOrder > 0 ? 'Voir les lignes de commande achat' : ''" @click.stop="openPoLines(k)">C {{ k.qtyOnPurchOrder ?? 0 }}</span></td>
                  <!-- Dernier Achat KIT : prix + badge qté + date (champs déjà sur la ligne) -->
                  <td class="num c2-lastbuy">
                    <template v-if="k.lastInvoicedCostDate || k.lastInvoicedDirectCost != null">
                      <div class="c2-lb-top"><b class="mono c2-derp-link" title="Voir l'historique Der P" @click.stop="openDerp(k.no, k.descriptionStructured)">{{ formatNumber(k.lastInvoicedDirectCost, 2) }}</b><span v-if="k.quantity" class="c2-qbadge">{{ Math.round(k.quantity) }}</span></div>
                      <em class="c2-lb-date">{{ formatDate(k.lastInvoicedCostDate) }}</em>
                    </template>
                    <span v-else class="muted mono">—</span>
                  </td>
                  <!-- PHASE 10C : clic = historique prix d'achat (filtre libre) -->
                  <td class="num mono"><span class="c2-clickprice" title="Voir l'historique des prix" @click.stop="openPriceHist(k.vendorNo, k.no, k.descriptionStructured, false)">{{ formatNumber(k.lastCurrPrice, 2) }}</span></td>
                  <td class="num c2-pricecell"><b class="mono">{{ formatNumber(k.lastPurshCostDS, 3) }}</b><em class="muted">{{ formatDate(k.lastPurshDate) }}</em></td>
                  <td class="num mono">{{ formatNumber(k.unitPrice, 3) }}</td>
                  <td v-if="!isHistExpanded" class="num mono" :class="{ 'pos-txt': (k.acheteCurrYear || 0) > 0 }">{{ k.acheteCurrYear ?? 0 }}</td>
                  <td v-if="!isHistExpanded" class="num mono" :class="{ 'pos-txt': (k.venduCurrYear || 0) > 0 }">{{ k.venduCurrYear ?? 0 }}</td>
                  <!-- PHASE 8A : quantité panier éditable + bouton Ajouter au panier (déplacé depuis Actions) -->
                  <td class="c2-qtycell">
                    <div class="c2-qtywrap">
                      <input class="c2-input" type="number" min="0" v-model.number="k.quantityToOrder" @click.stop />
                      <i v-if="cartBusyKey === (k.id ?? k.no)" class="pi pi-spin pi-spinner" title="Ajout en cours…"></i>
                      <i v-else class="pi pi-shopping-cart c2-cart-add" :class="{ 'in-cart': k.existPurchaseCart }" :title="k.existPurchaseCart ? 'Déjà au panier' : 'Ajouter au panier'" @click.stop="addToCart(k)"></i>
                    </div>
                  </td>
                  <td class="c2-acts">
                    <!-- En Historique expanded : seule l'icône Info article reste. -->
                    <i v-if="!isHistExpanded && hasReason(k,'kit')" class="pi pi-exclamation-triangle c2-reason-ic" title="Voir la raison" @click.stop="openReason($event, k, 'kit')"></i>
                    <i class="pi pi-info-circle" title="Informations" @click.stop="openInfo(k)"></i>
                    <i v-if="!isHistExpanded" class="pi pi-comment" :class="{ 'has-comment': hasComment(k, 'kit') }" :title="hasComment(k, 'kit') ? 'Modifier le commentaire' : 'Ajouter un commentaire'" @click.stop="openComment($event, k, 'kit')"></i>
                    <i v-if="!isHistExpanded && k.isVerifying" class="pi pi-spin pi-spinner" title="Marquage en cours…"></i>
                    <i v-else-if="!isHistExpanded" class="pi" :class="k.toVerify ? 'pi-flag-fill to-verify' : 'pi-flag'" :title="k.toVerify ? 'Marqué à vérifier' : 'À vérifier'" @click.stop="markToVerify(k)"></i>
                  </td>
                </tr>
                <tr v-if="isLoadingKit && !kitItems.length"><td colspan="12" class="c2-empty"><i class="pi pi-spin pi-spinner"></i> Chargement des kits…</td></tr>
                <tr v-else-if="!hasSelectedFrs"><td colspan="12" class="c2-empty"><i class="pi pi-hand-point-up"></i> Sélectionnez un fournisseur pour voir les kits</td></tr>
                <tr v-else-if="!kitItems.length"><td colspan="12" class="c2-empty"><i class="pi pi-inbox"></i> Aucun kit</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ─── HISTORIQUE RÉEL (3 états : collapsed / normal / expanded) ─── PHASE 5 -->
      <aside class="c2-side" :class="{ collapsed: histState === 'collapsed', expanded: histState === 'expanded' }">
        <template v-if="histState !== 'collapsed'">
          <!-- ═══ PANIER (PHASE 8B) — variante de la sidebar C2 ═══ -->
          <template v-if="sidebarMode === 'cart'">
            <div class="c2-side-head">
              <!-- PHASE 8E : mêmes contrôles de taille que l'Historique (agrandir / réduire) + fermer panier -->
              <button class="c2-collapse grow" @click="widenHist" :disabled="histState === 'expanded'" title="Agrandir le panier"><i class="pi pi-angle-double-left"></i></button>
              <span class="c2-side-title"><i class="pi pi-shopping-cart"></i> Panier</span>
              <div class="c2-side-headright">
                <span class="c2-carttabs">
                  <button :class="{ on: cartTab === 'current' }" @click="switchCartTab('current')">Ce comparateur</button>
                  <button :class="{ on: cartTab === 'all' }" @click="switchCartTab('all')">Tous</button>
                </span>
                <button class="c2-collapse" @click="narrowHist" :title="histState === 'expanded' ? 'Revenir normal' : 'Réduire le panier'"><i class="pi pi-angle-double-right"></i></button>
                <button class="c2-collapse" @click="closeCart" title="Retour à l'historique"><i class="pi pi-times"></i></button>
              </div>
            </div>
            <!-- PHASE 8F : ligne de filtres panier (Frs / Référence / Comparateur(onglet Tous) / Statut) -->
            <div class="c2-cart-filters">
              <input class="c2-cf-input" v-model="cartFilters.vendorNo" placeholder="Frs" @input="debouncedCartFilter" />
              <input class="c2-cf-input c2-cf-grow" v-model="cartFilters.itemNo" placeholder="Référence" @input="debouncedCartFilter" />
              <input v-if="cartTab === 'all'" class="c2-cf-input" v-model="cartFilters.compareQuoteNo" placeholder="Comparateur" @input="debouncedCartFilter" />
              <select class="c2-cf-input c2-cf-status" v-model="cartFilters.status" @change="applyCartFilters">
                <option :value="null">Statut</option>
                <option value="New">New</option>
                <option value="Verified">Verified</option>
                <option value="All">Tous</option>
              </select>
              <button class="c2-cf-clear" @click="clearCartFilters" title="Effacer les filtres"><i class="pi pi-times"></i></button>
            </div>
            <div class="c2-hist">
              <table class="c2-table c2-histtable">
                <!-- PHASE 8C/8D : colonnes panier selon le mode + largeurs fixes (pas de scroll horizontal) -->
                <thead><tr>
                  <th class="left" :style="{ width: histState === 'expanded' ? '9%' : '15%' }">Frs</th>
                  <template v-if="histState === 'expanded'">
                    <th class="left" style="width:12%">Réf</th><th class="left" style="width:21%">Désignation</th>
                  </template>
                  <th v-else class="left" style="width:35%">Réf / Désignation</th>
                  <th class="num" :style="{ width: histState === 'expanded' ? '6%' : '11%' }">Qté</th>
                  <th class="num" :style="{ width: histState === 'expanded' ? '10%' : '14%' }">Coût</th>
                  <th :style="{ width: histState === 'expanded' ? '11%' : '13%' }">Statut</th>
                  <template v-if="histState === 'expanded'">
                    <th class="left" style="width:11%">Comparateur</th><th class="left" style="width:11%">Commentaire</th>
                  </template>
                  <th class="c2-actcol" :style="{ width: histState === 'expanded' ? '9%' : '12%' }">Actions</th>
                </tr></thead>
                <tbody>
                  <tr v-for="c in store.cartItems" :key="c.lineNo">
                    <td class="left"><span class="c2-frs-code">{{ c.buyFromVendorNo || '—' }}</span></td>
                    <template v-if="histState === 'expanded'">
                      <td class="left"><b class="c2-frs-code">{{ c.itemNo }}</b></td>
                      <td class="left c2-ref" :title="c.description"><span>{{ c.description }}</span></td>
                    </template>
                    <td v-else class="left c2-ref" :title="c.description"><b>{{ c.itemNo }}</b><span>{{ c.description }}</span></td>
                    <td class="num mono">{{ c.quantity }}</td>
                    <td class="num mono">{{ formatNumber(c.directUnitCost, 2) }}</td>
                    <td><span class="c2-cart-status" :class="'st-' + (c.status || '').toLowerCase()">{{ c.status }}</span></td>
                    <template v-if="histState === 'expanded'">
                      <td class="left mono muted" :title="c.compareQuoteNo">{{ c.compareQuoteNo || '—' }}</td>
                      <td class="left muted" :title="c.comment">{{ c.comment || '—' }}</td>
                    </template>
                    <td class="c2-acts">
                      <template v-if="cartBusyLineNo === c.lineNo"><i class="pi pi-spin pi-spinner"></i></template>
                      <template v-else>
                        <i v-if="c.status !== 'Verified'" class="pi pi-check ok" title="Vérifier" @click.stop="cartAction(c.lineNo, 'Verified')"></i>
                        <i class="pi pi-trash" title="Retirer du panier" @click.stop="cartAction(c.lineNo, 'Cancelled')"></i>
                      </template>
                    </td>
                  </tr>
                  <tr v-if="store.isLoading && !store.cartItems.length"><td :colspan="histState === 'expanded' ? 9 : 6" class="c2-empty"><i class="pi pi-spin pi-spinner"></i> Chargement du panier…</td></tr>
                  <tr v-else-if="!store.cartItems.length"><td :colspan="histState === 'expanded' ? 9 : 6" class="c2-empty"><i class="pi pi-inbox"></i> Votre panier est vide</td></tr>
                </tbody>
              </table>
            </div>
            <div class="c2-cart-footer" v-if="store.cartPagination.totalPages > 1">
              <button class="c2-pager-btn" :disabled="store.cartPagination.page === 0" @click="goCartPage(store.cartPagination.page - 1)"><i class="pi pi-chevron-left"></i></button>
              <span>{{ store.cartPagination.page + 1 }} / {{ store.cartPagination.totalPages }}</span>
              <button class="c2-pager-btn" :disabled="store.cartPagination.page >= store.cartPagination.totalPages - 1" @click="goCartPage(store.cartPagination.page + 1)"><i class="pi pi-chevron-right"></i></button>
            </div>
          </template>
          <!-- ═══ HISTORIQUE ═══ -->
          <template v-else>
          <div class="c2-side-head">
            <button class="c2-collapse grow" @click="widenHist" :disabled="histState === 'expanded'" title="Agrandir l'historique"><i class="pi pi-angle-double-left"></i></button>
            <span class="c2-side-title"><i class="pi pi-history"></i> Historique</span>
            <div class="c2-side-headright">
              <!-- PHASE 5 : navigation année réelle (recharge l'historique) -->
              <span class="c2-year"><i class="pi pi-chevron-left" @click="changeYear(-1)"></i>{{ selectedYear }}<i class="pi pi-chevron-right" @click="changeYear(1)"></i></span>
              <button class="c2-collapse" @click="narrowHist" :title="histState === 'expanded' ? 'Revenir normal' : 'Réduire l\'historique'"><i class="pi pi-angle-double-right"></i></button>
            </div>
          </div>
          <!-- PHASE 5 : libellé = ligne sélectionnée (FRS / EQV / KIT) dont on affiche l'historique -->
          <div class="c2-side-ref"><b>{{ formatReference(selectedHistoryItem?.no) || '—' }}</b><span>{{ selectedHistoryItem?.descriptionStructured || '' }}</span></div>
          <div class="c2-side-kpis">
            <span class="kpi"><i>Stock</i><b>{{ historyKpis.stock }}</b></span>
            <span class="kpi"><i>Achat</i><b class="pos">{{ historyKpis.achat }}</b></span>
            <span class="kpi"><i>Vente</i><b class="pos">{{ historyKpis.vente }}</b></span>
            <span class="kpi"><i>Rupt</i><b class="neg">{{ historyKpis.rupt }}</b></span>
          </div>
          <div class="c2-hist" ref="historyWrap" @scroll="onHistoryScroll">
            <!-- PHASE 8D : colonnes EXACTES de l'ancienne page. Normal : Date·Type·Client/Frs(sourceNo)·Nom(sourceName)·Qté·PU.
                 Expanded : + Type Doc, N° Document (après Type) et Magasin (avant PU). Pas de colonne Montant. -->
            <table class="c2-table c2-histtable">
              <thead><tr>
                <th :style="{ width: histState === 'expanded' ? '12%' : '20%' }">Date</th>
                <th :style="{ width: histState === 'expanded' ? '5%' : '8%' }">T</th>
                <template v-if="histState === 'expanded'">
                  <th class="left" style="width:11%">Type Doc</th><th class="left" style="width:13%">N° Doc</th>
                </template>
                <th class="left" :style="{ width: histState === 'expanded' ? '11%' : '18%' }">Client / Frs</th>
                <th class="left" :style="{ width: histState === 'expanded' ? '19%' : '29%' }">Nom</th>
                <th class="num" :style="{ width: histState === 'expanded' ? '7%' : '11%' }">Qté</th>
                <th v-if="histState === 'expanded'" class="left" style="width:9%">Magasin</th>
                <th class="num" :style="{ width: histState === 'expanded' ? '13%' : '14%' }">PU</th>
              </tr></thead>
              <tbody>
                <!-- PHASE 5 : vraies écritures (item ledger) -->
                <tr v-for="(h, i) in historyEntries" :key="i">
                  <td class="mono">{{ formatDate(h.postingDate) }}</td>
                  <td><span class="c2-typ" :class="histTypeClass(h.entryType)" :title="h.entryType">{{ histTypeLetter(h.entryType) }}</span></td>
                  <template v-if="histState === 'expanded'">
                    <td class="left muted" :title="h.documentType">{{ h.documentType || '—' }}</td>
                    <td class="left mono muted" :title="h.documentNo">{{ h.documentNo || '—' }}</td>
                  </template>
                  <td class="left mono" :title="h.sourceNo">{{ h.sourceNo || '—' }}</td>
                  <td class="left" :title="h.sourceName">{{ h.sourceName || '—' }}</td>
                  <td class="num mono" :class="{ neg: Number(h.quantity) < 0 }">{{ h.quantity }}</td>
                  <td v-if="histState === 'expanded'" class="left muted" :title="h.locationCode">{{ h.locationCode || '—' }}</td>
                  <td class="num mono">{{ formatNumber(calculatePU(h), 2) }}</td>
                </tr>
                <tr v-if="isLoadingHistory && !historyEntries.length"><td :colspan="histState === 'expanded' ? 9 : 6" class="c2-empty"><i class="pi pi-spin pi-spinner"></i> Chargement de l'historique…</td></tr>
                <tr v-else-if="!historyEntries.length"><td :colspan="histState === 'expanded' ? 9 : 6" class="c2-empty"><i class="pi pi-inbox"></i> Aucun mouvement</td></tr>
              </tbody>
            </table>
          </div>
          </template>
        </template>
        <!-- PHASE 8C : rail collapsed reflète le mode courant (Panier compteur / Historique) -->
        <div v-else class="c2-rail" @click="widenHist" :title="sidebarMode === 'cart' ? 'Afficher le panier' : 'Afficher l\'historique'">
          <button class="c2-collapse" @click.stop="widenHist"><i class="pi pi-angle-double-left"></i></button>
          <i class="c2-rail-icon" :class="sidebarMode === 'cart' ? 'pi pi-shopping-cart' : 'pi pi-history'"></i>
          <span class="c2-rail-label">{{ sidebarMode === 'cart' ? 'PANIER' : 'HISTORIQUE' }}</span>
          <span v-if="sidebarMode === 'cart'" class="c2-rail-count">{{ store.cartCount }}</span>
        </div>
      </aside>
    </div>

    <!-- ════════════════════════ FOOTER PAGE C2 (shell standard 48px) ════════════════════════ -->
    <footer class="c2-footer">
      <span class="c2-footer-label">Détail Confirmation Achat</span>
      <span class="c2-footer-meta"><b>{{ compareQuoteNo || mock.compareNo }}</b><em v-if="compareQuoteDescription || mock.compareDesc">{{ compareQuoteDescription || mock.compareDesc }}</em></span>
    </footer>

    <!-- Mini-menu de filtre flottant (visuel — TODO Phase 6 : brancher filtres backend) -->
    <div v-if="c2Menu.open" class="c2-menu-backdrop" @click="closeMenu"></div>
    <div v-if="c2Menu.open" class="c2-fmenu floating" :style="{ left: c2Menu.x + 'px', top: c2Menu.y + 'px' }">
      <div class="c2-fmenu-head"><span>Filtrer : {{ c2Menu.label }}</span><button @click="closeMenu"><i class="pi pi-times"></i></button></div>
      <div class="c2-fmenu-lbl">Condition</div>
      <div class="seg c2" :class="{ txt: c2Menu.col === 'ref' }"><button v-for="o in (c2Menu.col === 'ref' ? opsText : ops)" :key="o.v" :class="{ on: o.v === c2Menu.op }" @click="c2Menu.op = o.v" :title="o.t">{{ o.s }}</button></div>
      <div class="c2-fmenu-lbl">Valeur</div>
      <input class="c2-fmenu-val" :type="c2Menu.col === 'date' ? 'date' : (c2Menu.col === 'ref' ? 'text' : 'number')" v-model="c2Menu.value" placeholder="Saisir une valeur" />
      <div class="c2-fmenu-actions">
        <button class="ghost" @click="clearMenuCol">Effacer</button>
        <button class="prim" @click="applyMenu"><i class="pi pi-check"></i> Appliquer</button>
      </div>
    </div>

    <!-- PHASE 9D : overlay commentaire (FRS / EQV / KIT) -->
    <div v-if="commentState.open" class="c2-menu-backdrop" @click="closeComment"></div>
    <div v-if="commentState.open" class="c2-comment-pop" :style="{ left: commentState.x + 'px', top: commentState.y + 'px' }">
      <div class="c2-comment-head">
        <span><i class="pi pi-comment"></i> Commentaire — {{ formatReference(commentState.item?.no) }}</span>
        <button @click="closeComment"><i class="pi pi-times"></i></button>
      </div>
      <textarea class="c2-comment-text" v-model="commentState.text" rows="3" maxlength="250" placeholder="Saisir un commentaire…"></textarea>
      <div class="c2-comment-actions">
        <span class="c2-comment-count">{{ (commentState.text || '').length }}/250</span>
        <button class="ghost" @click="closeComment">Annuler</button>
        <button class="prim" :disabled="commentState.busy" @click="saveComment"><i class="pi pi-check"></i> Enregistrer</button>
      </div>
    </div>

    <!-- Popover Raison (lecture seule) — ouvert par l'icône Raison de la colonne Actions -->
    <div v-if="reasonPopover.open" class="c2-menu-backdrop" @click="closeReason"></div>
    <div v-if="reasonPopover.open" class="c2-comment-pop" :style="{ left: reasonPopover.x + 'px', top: reasonPopover.y + 'px' }">
      <div class="c2-comment-head">
        <span><i class="pi pi-exclamation-triangle c2-reason-ic"></i> Raison — {{ formatReference(reasonPopover.item?.no) }}</span>
        <button @click="closeReason"><i class="pi pi-times"></i></button>
      </div>
      <div class="c2-reason-text">{{ reasonPopover.text || '—' }}</div>
    </div>

    <!-- PHASE 9F : dialog de confirmation C2 (remplace window.confirm) -->
    <div v-if="confirmState.open" class="c2-confirm-backdrop" @click="cancelConfirm"></div>
    <div v-if="confirmState.open" class="c2-confirm-modal" role="dialog" aria-modal="true">
      <div class="c2-confirm-title"><i class="pi pi-exclamation-triangle"></i> {{ confirmState.title }}</div>
      <div class="c2-confirm-msg">{{ confirmState.message }}</div>
      <div class="c2-confirm-actions">
        <button class="ghost" :disabled="confirmState.loading" @click="cancelConfirm">Annuler</button>
        <button :class="confirmState.danger ? 'danger' : 'prim'" :disabled="confirmState.loading" @click="runConfirm">
          <i v-if="confirmState.loading" class="pi pi-spin pi-spinner"></i><i v-else class="pi pi-check"></i> {{ confirmState.confirmLabel }}
        </button>
      </div>
    </div>


    <!-- Dialog Info Article TecDoc — composant PARTAGÉ (réf. visuelle = B2B) -->
    <TecDocArticleInfoDialog
      :visible="infoState.open"
      :item="infoState.data"
      :loading="infoState.loading"
      :bc-picture-url="bcPicture.url"
      :bc-picture-loading="bcPicture.loading"
      :can-manage-picture="authStore.isAdmin"
      @update:visible="closeInfo"
      @load-vehicle-models="loadVehicleModels"
      @update-photo="onUpdatePhoto"
      @delete-photo="onDeletePhoto"
    />

    <!-- PHASE 10B : dialog historique / détail stock par société — composant PARTAGÉ -->
    <ArticleStockHistoryDialog
      :visible="companyHist.open"
      :company="companyHist.company"
      :reference="selectedHistoryItem?.no || ''"
      :description="selectedHistoryItem?.descriptionStructured || ''"
      :year="companyHist.year"
      :kpis="companyHist.kpis"
      :entries="companyHist.entries"
      :loading="companyHist.loading"
      @update:visible="closeCompanyHist"
      @change-year="changeCompanyYear"
      @scroll="onCompanyHistScroll"
    />

    <!-- PHASE 10C : dialog Historique prix d'achat — composant PARTAGÉ -->
    <ArticlePurchasePriceHistoryDialog
      :visible="priceHist.open"
      :item-no="priceHist.itemNo"
      :description="priceHist.description"
      :prices="priceHist.prices"
      :loading="priceHist.loading"
      :vendor-filter="priceHist.vendorFilter"
      :filter-locked="priceHist.filterLocked"
      @update:visible="closePriceHist"
      @update:vendor-filter="priceHist.vendorFilter = $event"
    />

    <!-- PHASE 10D : dialog Lignes commande achat — composant PARTAGÉ -->
    <ArticlePurchaseLinesDialog
      :visible="poLines.open"
      :no="poLines.no"
      :total-elements="poLines.totalElements"
      :entries="poLines.entries"
      :loading="poLines.loading"
      :page="poLines.page"
      :total-pages="poLines.totalPages"
      :sort-field="poLines.sortField"
      :sort-direction="poLines.sortDirection"
      @update:visible="closePoLines"
      @go-page="goPoPage"
      @sort-change="onPoSort"
    />

    <!-- Dialog Lignes Import (clic quantité « I » colonne Appro) — composant PARTAGÉ -->
    <ArticleImportLedgerLinesDialog
      :visible="importLines.open"
      :item-no="importLines.itemNo"
      :source-no="importLines.sourceNo"
      :total-elements="importLines.totalElements"
      :entries="importLines.entries"
      :loading="importLines.loading"
      :page="importLines.page"
      :total-pages="importLines.totalPages"
      :sort-field="importLines.sortField"
      :sort-direction="importLines.sortDirection"
      @update:visible="closeImportLines"
      @go-page="goImportPage"
      @sort-change="onImportSort"
    />

    <!-- Dialog détails count OEM (clic sur le chip "OEM" de l'en-tête) — composant PARTAGÉ -->
    <ArticleOemCountDialog
      :visible="oemDialog.open"
      :master="oemDialog.master"
      :total="oemCount ?? 0"
      :details="oemCountDetails"
      @update:visible="closeOemDialog"
    />

    <!-- Dialog "Historique Der P" (vue SQL LastInvoicedItemCost) — composant PARTAGÉ. Distinct de l'historique prix d'achat. -->
    <ArticleDerPHistoryDialog
      :visible="derp.open"
      :item-no="derp.itemNo"
      :desc="derp.desc"
      :total-elements="derp.totalElements"
      :entries="derp.entries"
      :loading="derp.loading"
      :page="derp.page"
      :total-pages="derp.totalPages"
      @update:visible="closeDerp"
      @go-page="goDerpPage"
    />
  </section>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useCompareQuoteStore } from '../stores/compareQuote'
import { useAuthStore } from '../stores/auth'
import TecDocArticleInfoDialog from './tecdoc/TecDocArticleInfoDialog.vue'
import ArticleStockHistoryDialog from './article/ArticleStockHistoryDialog.vue'
import ArticlePurchasePriceHistoryDialog from './article/ArticlePurchasePriceHistoryDialog.vue'
import ArticlePurchaseLinesDialog from './article/ArticlePurchaseLinesDialog.vue'
import ArticleImportLedgerLinesDialog from './article/ArticleImportLedgerLinesDialog.vue'
import ArticleDerPHistoryDialog from './article/ArticleDerPHistoryDialog.vue'
import ArticleOemCountDialog from './article/ArticleOemCountDialog.vue'

/* ──────────────────────────────────────────────────────────────────────────
   PROPS / EMITS
   ──────────────────────────────────────────────────────────────────────────
   Props transmises par la vue parent
   (ConfirmationAchatView.vue passe :compareQuoteNo / :compareQuoteDescription).
   PHASE 2 : utilisées dans le header (numéro + description comparateur réels).
   Les autres données du header (total, n° DP, KPI STOCKS) restent en mock
   car elles dépendent de l'API/store — hors périmètre.

   emit('back') : seule action réellement câblée (retour à la liste).
─────────────────────────────────────────────────────────────────────────── */
const props = defineProps({
  compareQuoteNo: { type: String, default: '' },
  compareQuoteDescription: { type: String, default: '' }
})
const emit = defineEmits(['back'])

/* Stub temporaire pour les boutons visuels (aucune logique métier en Phase 1) */
const noop = () => { /* TODO Phase 7 : brancher l'action réelle */ }

/* ─── État UI local (identique au prototype C2) ─── */
const selectedFrs = ref(0)

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 3 — TABLE FOURNISSEURS RÉELLE (lecture simple)
   ──────────────────────────────────────────────────────────────────────────
   Branche UNIQUEMENT le chargement des lignes FRS du comparateur sélectionné,
   via le store existant (action fetchConfirmationQuoteLines → endpoint
   /api/bc/quote-lines/by-compare-quote). Pagination serveur (infinite scroll)
   reprise à l'identique. AUCUN appel secondaire (last-invoiced, %), AUCUN
   filtre backend (Phase 6), AUCUN déclenchement EQV/KIT/Historique (Phase 4).
══════════════════════════════════════════════════════════════════════════ */
const store = useCompareQuoteStore()
const authStore = useAuthStore()
const toast = useToast()
const quoteLineDetails = ref([])
const isLoadingDetails = ref(false)
const frsTotalElements = ref(0)        // PHASE 4C : total réel (badge FOURNISSEURS) via totalElements backend
const frsDistinctDp = ref(0)           // Nombre distinct de N° DP (documentNo) sur les lignes FRS filtrées (backend)

// Helpers communs FRS/EQV/KIT (réponses paginées { content, totalElements } ou tableau simple)
const normalizeRows = (data) => {
  if (!data) return []
  if (Array.isArray(data.content)) return data.content
  if (Array.isArray(data)) return data
  return [data]
}
const pickTotal = (data, fallbackArr) => (data && data.totalElements != null ? Number(data.totalElements) : fallbackArr.length)
// PHASE 10B : normalise quantityToOrder des lignes EQV/KIT → 1 par défaut si null/undefined/'' (0 reste 0, valeur existante conservée)
const withDefaultQty = (rows) => rows.map(r => {
  const q = r.quantityToOrder
  return (q === null || q === undefined || q === '') ? { ...r, quantityToOrder: 1 } : r
})

// Pagination serveur (infinite scroll) — reprise minimale de l'ancien composant
// PHASE 4A : 5 lignes visibles → taille de page = 5, le reste accessible au scroll interne.
const frsPage = ref(0)
const frsPageSize = 5
const frsHasMore = ref(true)
const isLoadingFrsMore = ref(false)
const frsWrap = ref(null)
const eqvWrap = ref(null)
const kitWrap = ref(null)

/* ══════════════════════════════════════════════════════════════════════════
   DONNÉES SECONDAIRES FRS — "Dernier Achat" (prix + qté + date) et "% Coût Direct".
   Reprend l'ancien composant : par article FRS de la page, on charge le dernier
   coût facturé (store.fetchLastInvoicedCost → /api/last-invoiced-cost) et
   l'historique des prix d'achat (store.fetchPurchasePrices → /api/purchase-prices),
   en cache par article (dédup) dans 2 Maps. Chargement NON bloquant, par page,
   dédupliqué → pas d'appel massif. Aucun nouvel endpoint.
══════════════════════════════════════════════════════════════════════════ */
const lastInvoicedCosts = ref(new Map())     // itemNo -> Map(codeFrs -> { lastInvoicedDirectCost, quantity, lastInvoicedCostDate, ... })
const purchasePricesByItem = ref(new Map())  // itemNo -> [ { vendorNo, startingDate, directUnitCost } ]

const getLastInvoicedData = (vendorNo, itemNo) => {
  if (!vendorNo || !itemNo) return null
  const itemMap = lastInvoicedCosts.value.get(itemNo)
  return itemMap ? (itemMap.get(vendorNo) || null) : null
}
// Avant-dernier prix d'achat du même fournisseur (pour le % d'évolution) — repris de l'ancien.
const getSecondLastPurchasePrice = (vendorNo, itemNo) => {
  if (!vendorNo || !itemNo) return null
  const prices = purchasePricesByItem.value.get(itemNo)
  if (!prices || !prices.length) return null
  const vendorPrices = prices.filter(p => p.vendorNo == vendorNo)
  vendorPrices.sort((a, b) => new Date(b.startingDate) - new Date(a.startingDate))
  return vendorPrices.length >= 2 ? vendorPrices[1].directUnitCost : null
}
// % d'évolution (flèche + signe), null si non calculable ou ~0 — repris de l'ancien.
const calculatePercentageChange = (value1, value2) => {
  if (value2 === null || value2 === undefined || value2 === 0) return null
  if (value1 === null || value1 === undefined) return null
  const pct = ((value1 - value2) / value2) * 100
  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : ''
  const sign = pct > 0 ? '+' : ''
  return `${arrow} ${sign}${pct.toFixed(1)}%`
}
const getPercentageClass = (txt) => {
  if (!txt) return ''
  if (txt.includes('↑')) return 'up'
  if (txt.includes('↓')) return 'down'
  return 'neutral'
}
// % Coût Direct d'une ligne FRS vs avant-dernier prix d'achat du même fournisseur.
const frsPctChange = (detail) =>
  calculatePercentageChange(detail.directUnitCost, getSecondLastPurchasePrice(detail.buyFromVendorNo, detail.no))

// Charge (non bloquant, dédupliqué par article) les données secondaires d'une page FRS.
const fetchFrsSecondaryData = (rows) => {
  const uniqueNos = [...new Set((rows || []).map(d => d.no))]
    .filter(Boolean)
    .filter(no => !lastInvoicedCosts.value.has(no))
  uniqueNos.forEach(async (itemNo) => {
    try {
      const data = await store.fetchLastInvoicedCost(itemNo)
      if (Array.isArray(data)) {
        const costMap = new Map()
        data.forEach(d => { if (d.frs) costMap.set(d.frs, d) })
        lastInvoicedCosts.value.set(itemNo, costMap)
      }
    } catch (e) { console.error('[C2] last-invoiced-cost', itemNo, e) }
    try {
      const prices = await store.fetchPurchasePrices(itemNo)
      purchasePricesByItem.value.set(itemNo, prices || [])
    } catch (e) { console.error('[C2] purchase-prices', itemNo, e) }
  })
}

const loadFrsPage = async () => {
  if (isLoadingFrsMore.value || !frsHasMore.value) return
  isLoadingFrsMore.value = true
  try {
    // PHASE 6 : filtres FRS backend (appliqués AVANT pagination). Réponse paginée { content, totalElements }.
    const data = await store.fetchConfirmationQuoteLinesPaged(props.compareQuoteNo, frsPage.value, frsPageSize, buildFrsFilterParams())
    const rows = normalizeRows(data)
    quoteLineDetails.value = [...quoteLineDetails.value, ...rows]
    fetchFrsSecondaryData(rows)              // Dernier Achat + % Coût Direct (asynchrone, ne bloque pas l'affichage)
    frsTotalElements.value = pickTotal(data, quoteLineDetails.value)
    frsDistinctDp.value = Number(data?.distinctDocumentCount ?? 0)   // count distinct DP (stable au scroll, recalculé backend par filtre)
    // hasMore : via totalElements si présent, sinon repli sur "page pleine"
    frsHasMore.value = (data && data.totalElements != null)
      ? quoteLineDetails.value.length < frsTotalElements.value
      : rows.length === frsPageSize
    frsPage.value += 1
    // TODO Phase ultérieure : fetchSecondaryDataForItems (dernier achat, %, dernier coût facturé)
  } catch (error) {
    console.error('[C2 Phase 3] Erreur chargement lignes FRS:', error)
    frsHasMore.value = false
  } finally {
    isLoadingFrsMore.value = false
  }
}

const onFrsScroll = (event) => {
  const { scrollTop, clientHeight, scrollHeight } = event.target
  if (scrollTop + clientHeight >= scrollHeight - 20 && !isLoadingFrsMore.value && frsHasMore.value) {
    loadFrsPage()
  }
}

// Ligne FRS sélectionnée (sert au libellé de la sidebar Historique — l'historique reste mock)
const selectedFrsRow = computed(() => quoteLineDetails.value[selectedFrs.value] || null)

// Formatage numérique simple façon C2 (séparateur décimal point, pas de logique métier)
const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return isNaN(n) ? '—' : n.toFixed(decimals)
}
// Référence sans le suffixe MASTER (comme l'ancien composant) + date courte façon prototype
const formatReference = (refVal) => (refVal ? String(refVal).replace(/MASTER/gi, '').trim() : '')
const formatDate = (d) => {
  if (!d) return '—'
  const date = (d instanceof Date) ? d : new Date(d)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 9A — Édition FRS (Qté Cf / Nég Px / Nég Qt)
   ──────────────────────────────────────────────────────────────────────────
   Reprend updateLine de l'ancien composant (PATCH /api/bc/quote-lines/{id} avec
   If-Match etag) mais SANS marquer "treated" (la validation de ligne = phase
   ultérieure). Sauvegarde sur @change (blur / Enter). Loading par ligne via
   detail.isUpdating. Sur 412 (etag périmé), rechargement sûr de la liste filtrée.
══════════════════════════════════════════════════════════════════════════ */
// markTreated=false (PHASE 9A : édition pure) ; markTreated=true (PHASE 9B : validation ligne via bouton ✓)
const updateFrsLine = async (detail, markTreated = false) => {
  if (!detail || !detail.id || detail.isUpdating) return
  detail.isUpdating = true
  try {
    const payload = {
      askingPrice: detail.askingPrice,
      askingQty: detail.askingQty,
      quantity: detail.quantity,
      quoteLineReason: detail.quoteLineReason     // valeur courante (raison non éditable en 9A/9B)
    }
    if (markTreated) payload.treated = true       // PHASE 9B
    const response = await store.updateQuoteLine(detail.id, detail['@odata.etag'], payload, authStore.user?.bcCompanyId)
    if (markTreated) detail.treated = true        // état local immédiat (avant merge serveur)
    // Fusionne la réponse serveur (nouvel @odata.etag + valeurs) dans la ligne, sans recharger toute la grille
    if (response && response.data) Object.assign(detail, response.data)
  } catch (error) {
    console.error('[C2 Phase 9A/9B] Erreur mise à jour ligne FRS:', error)
    if (error.response && error.response.status === 412) {
      applyFrsFilters()      // etag périmé (édition concurrente) → rechargement sûr (filtres conservés)
    }
  } finally {
    detail.isUpdating = false
  }
}
// PHASE 9B : validation de ligne (bouton ✓) = mise à jour + treated:true
const validateFrsLine = (detail) => updateFrsLine(detail, true)

// PHASE 9C : options de raison FRS (identiques à l'ancien composant). Édition = updateFrsLine (sans treated).
const orderReasons = [
  { value: 'Prix augmenté', label: 'Prix augmenté' },
  { value: 'Remplacé autre fabricant', label: 'Remplacé autre fabricant' },
  { value: 'Mouvement lent', label: 'Mouvement lent' },
  { value: 'Nouveau article', label: 'Nouveau article' },
  { value: 'En attente devis autre fabricant', label: 'En attente devis autre fabricant' },
  { value: 'Sur Stockage', label: 'Sur Stockage' }
]

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 9D — Commentaires FRS / EQV / KIT
   ──────────────────────────────────────────────────────────────────────────
   Reprend la logique de l'ancien composant via un overlay compact C2 :
   - FRS (ligne de devis, possède .id) → store.updateQuoteLineComment(id, text) → quoteLineComment
   - EQV/KIT déjà au panier → store.updateCartItemComment(lineNo, text) → commentPurchaseCart
   - EQV/KIT hors panier → stockage LOCAL (item.comment) — comportement ancien
══════════════════════════════════════════════════════════════════════════ */
const commentState = ref({ open: false, item: null, type: 'frs', text: '', x: 0, y: 0, busy: false })
const hasComment = (item, type) => {
  if (!item) return false
  if (type === 'frs') return !!(item.quoteLineComment || item.QuoteLineComment)
  return !!(item.commentPurchaseCart || item.comment)
}
const openComment = (event, item, type) => {
  const existing = (type === 'frs')
    ? (item.quoteLineComment || item.QuoteLineComment || '')
    : (item.commentPurchaseCart || item.comment || '')
  const POP_W = 300, POP_H = 200
  const x = Math.min(event.clientX, window.innerWidth - POP_W - 8)
  const below = event.clientY + 12
  const y = (below + POP_H > window.innerHeight) ? Math.max(8, event.clientY - POP_H - 8) : below
  commentState.value = { open: true, item, type, text: existing, x, y, busy: false }
}
const closeComment = () => { commentState.value.open = false }

/* Raison (lecture seule) — affichée via une icône dans Actions (colonne Raison supprimée).
   FRS : quoteLineReason (code → label via orderReasons). EQV/KIT : orderReason (texte). */
const reasonText = (item, type) => {
  if (!item) return ''
  if (type === 'frs') {
    const v = (item.quoteLineReason || '').trim()        // vide / null / chaîne blanche → ''
    if (!v) return ''
    const found = orderReasons.find(r => r.value === v)
    return found ? found.label : v
  }
  return (item.orderReason || '').trim()                  // EQV/KIT : orderReason (trim → exclut whitespace)
}
const hasReason = (item, type) => !!reasonText(item, type)  // icône affichée seulement si raison non vide
const reasonPopover = ref({ open: false, item: null, type: 'frs', text: '', x: 0, y: 0 })
const openReason = (event, item, type) => {
  const POP_W = 300, POP_H = 180
  const x = Math.min(event.clientX, window.innerWidth - POP_W - 8)
  const below = event.clientY + 12
  const y = (below + POP_H > window.innerHeight) ? Math.max(8, event.clientY - POP_H - 8) : below
  reasonPopover.value = { open: true, item, type, text: reasonText(item, type), x, y }
}
const closeReason = () => { reasonPopover.value.open = false }

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 9E — « À vérifier » (toVerify) FRS / EQV / KIT
   ──────────────────────────────────────────────────────────────────────────
   Reprend markAsToVerify de l'ancien : confirmation, store.markAsToVerify(itemNo)
   (PATCH /api/bc/itemsEqv/{itemNo}/toVerify), loading item.isVerifying.
   itemNo = item.bcItemNo || item.no. Indicateur local item.toVerify après succès.
══════════════════════════════════════════════════════════════════════════ */
// PHASE 9F : ouvre la confirmation C2 (plus de window.confirm natif)
const markToVerify = (item) => {
  const itemNo = item ? (item.bcItemNo || item.no) : null
  if (!itemNo || item.isVerifying) return
  openConfirm({
    title: 'À vérifier',
    message: `Marquer la référence ${itemNo} comme « À vérifier » ?`,
    confirmLabel: 'Confirmer',
    action: () => doMarkToVerify(item, itemNo)
  })
}
const doMarkToVerify = async (item, itemNo) => {
  item.isVerifying = true
  try {
    const response = await store.markAsToVerify(itemNo)
    item.toVerify = (response && response.toVerify !== undefined) ? response.toVerify : true
  } catch (error) {
    console.error('[C2 Phase 9E] Erreur « à vérifier »:', error)
  } finally {
    item.isVerifying = false
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 9F — Dialog de confirmation C2 (remplace window.confirm)
   Générique : { title, message, confirmLabel, danger, action } ; loading sur
   le bouton Confirmer ; backdrop sombre ; Annuler = aucune action.
══════════════════════════════════════════════════════════════════════════ */
const confirmState = ref({ open: false, title: '', message: '', confirmLabel: 'Confirmer', danger: false, loading: false, action: null })
const openConfirm = ({ title, message, confirmLabel = 'Confirmer', danger = false, action }) => {
  confirmState.value = { open: true, title, message, confirmLabel, danger, loading: false, action }
}
const cancelConfirm = () => { if (!confirmState.value.loading) confirmState.value.open = false }
const runConfirm = async () => {
  const fn = confirmState.value.action
  if (!fn) { confirmState.value.open = false; return }
  confirmState.value.loading = true
  try { await fn() } finally { confirmState.value.loading = false; confirmState.value.open = false }
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 10A — Dialog Info article / TecDoc (FRS / EQV / KIT)
   ──────────────────────────────────────────────────────────────────────────
   Reprend openInfoDialog de l'ancien : store.fetchTecdocArticleDetails(ref, supplier)
   (GET /api/tecdoc/articles). Affiche réf, désignation, fabricant, stock, prix,
   image + vignettes, spécifications (articleCriteria), OEM, GTIN.
   Différés (secondaires/lourds) : visionneuse 360°, véhicules par marque, PDFs.
══════════════════════════════════════════════════════════════════════════ */
const infoState = ref({ open: false, loading: false, data: null })
// PHASE 10A-bis : état d'affichage du dialog (galerie + sections collapsibles, façon source)
const currentImageIndex = ref(0)
const isOemSectionExpanded = ref(true)
const isPdfSectionExpanded = ref(false)
const expandedOemBrands = ref(new Set())
const setInfoImage = (index) => { currentImageIndex.value = index }
const toggleOemBrand = (brand) => {
  const s = new Set(expandedOemBrands.value)
  if (s.has(brand)) s.delete(brand); else s.add(brand)
  expandedOemBrands.value = s
}
const isOemBrandExpanded = (brand) => expandedOemBrands.value.has(brand)
// OEM groupés par marque (mfrName), marques triées — identique au computed source
const groupedOemNumbers = computed(() => {
  const oems = infoState.value.data?.oemNumbers || []
  if (!oems.length) return []
  const groups = {}
  oems.forEach(o => { const b = o.mfrName || 'Autre'; (groups[b] = groups[b] || []).push(o) })
  return Object.keys(groups).sort().map(brand => ({ brand, numbers: groups[brand] }))
})
// PHASE 10A-ter : sections supplémentaires (Kit, Véhicules lazy, 360°)
const isKitPartsExpanded = ref(false)
const isVehiclesExpanded = ref(false)
const expandedVehBrands = ref(new Set())
const isVehBrandExpanded = (brand) => expandedVehBrands.value.has(brand)
const is360 = ref(false)
const frame360 = ref(0)
const formatConstructionDate = (dateNum) => {
  if (!dateNum) return '...'
  const s = String(dateNum)
  return s.length !== 6 ? s : `${s.substring(4, 6)}.${s.substring(0, 4)}`
}
// Vue 360° : la frame suit la position horizontale de la souris (comme la source)
const on360Move = (event) => {
  const imgs = infoState.value.data?.images360 || []
  if (!imgs.length) return
  const rect = event.currentTarget.getBoundingClientRect()
  const idx = Math.floor(((event.clientX - rect.left) / rect.width) * imgs.length)
  frame360.value = Math.max(0, Math.min(idx, imgs.length - 1))
}
// Véhicules : accordéon par marque + lazy-load des modèles (fetchArticleVehicles)
// Lazy-load des modèles d'une marque véhicule (toggle accordéon géré par le composant partagé TecDocArticleInfoDialog).
const loadVehicleModels = async (group) => {
  if (group.loaded || !group.id || !infoState.value.data?.articleId) return
  group.isLoading = true
  try {
    const vehicles = await store.fetchArticleVehicles(infoState.value.data.articleId, group.id)
    const grouped = {}
    ;(vehicles || []).forEach(v => {
      if (!grouped[v.modelDesc]) grouped[v.modelDesc] = { manuDesc: v.manuDesc, modelDesc: v.modelDesc, minYear: v.yearOfConstructionFrom, maxYear: v.yearOfConstructionTo, minHp: v.powerHpFrom, maxHp: v.powerHpFrom }
      const g = grouped[v.modelDesc]
      if (v.yearOfConstructionFrom < g.minYear) g.minYear = v.yearOfConstructionFrom
      if (v.yearOfConstructionTo > g.maxYear) g.maxYear = v.yearOfConstructionTo
      if (v.powerHpFrom < g.minHp) g.minHp = v.powerHpFrom
      if (v.powerHpFrom > g.maxHp) g.maxHp = v.powerHpFrom
    })
    group.models = Object.values(grouped).map(g => {
      const minDate = formatConstructionDate(g.minYear)
      const maxDate = g.maxYear ? formatConstructionDate(g.maxYear) : '...'
      return `${g.manuDesc} ${g.modelDesc} ( ${minDate} - ${maxDate} , ${g.minHp} - ${g.maxHp} CH)`
    })
    group.loaded = true
  } catch (error) {
    console.error('[C2 Phase 10A-ter] Erreur véhicules:', error)
    group.models = ['Erreur lors du chargement des véhicules']
  } finally {
    group.isLoading = false
  }
}

/* Photo Business Central (fallback si pas d'image TecDoc) — blob URL géré ici (parent). */
const bcPicture = ref({ url: null, loading: false })
const revokeBcPicture = () => {
  if (bcPicture.value.url) URL.revokeObjectURL(bcPicture.value.url)
  bcPicture.value = { url: null, loading: false }
}
const loadBcPicture = async (itemNo) => {
  revokeBcPicture()
  if (!itemNo) return
  bcPicture.value.loading = true
  try {
    const blob = await store.fetchBcItemPicture(itemNo)
    bcPicture.value = { url: blob ? URL.createObjectURL(blob) : null, loading: false }
  } catch (e) {
    console.error('[C2] Photo BC:', e)
    bcPicture.value = { url: null, loading: false }
  }
}
const isValidPhotoFile = (file) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5 Mo (aligné backend)
  return file && allowed.includes((file.type || '').toLowerCase()) && file.size > 0 && file.size <= maxSize
}
const onUpdatePhoto = async (file) => {
  const itemNo = infoState.value.data?.no
  if (!itemNo || !file) return
  if (!isValidPhotoFile(file)) {
    toast.add({ severity: 'warn', summary: 'Attention', detail: 'Format image invalide ou fichier trop volumineux.', life: 4000 })
    return
  }
  try {
    await store.uploadBcItemPicture(itemNo, file)
    await loadBcPicture(itemNo)
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Photo article mise à jour.', life: 3000 })
  } catch (e) {
    console.error('[C2] Upload photo BC:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de mettre à jour la photo article.', life: 4000 })
  }
}
const onDeletePhoto = async () => {
  const itemNo = infoState.value.data?.no
  if (!itemNo) return
  try {
    await store.deleteBcItemPicture(itemNo)
    revokeBcPicture()
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Photo article supprimée.', life: 3000 })
  } catch (e) {
    console.error('[C2] Suppression photo BC:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer la photo article.', life: 4000 })
  }
}

const closeInfo = () => { infoState.value.open = false; revokeBcPicture() }
const openInfo = async (item) => {
  revokeBcPicture()
  currentImageIndex.value = 0
  isOemSectionExpanded.value = true
  isPdfSectionExpanded.value = false
  isKitPartsExpanded.value = false
  isVehiclesExpanded.value = false
  expandedVehBrands.value = new Set()
  is360.value = false
  frame360.value = 0
  expandedOemBrands.value = new Set()
  infoState.value = {
    open: true, loading: true,
    data: {
      no: item.no,
      description: item.descriptionStructured,
      vendor: item.buyFromVendorNo || item.vendorNo || '',
      qtyStock: item.inventoryWithoutImport ?? item.qtyStock ?? null,
      price: item.unitPrice ?? item.lastCurrPrice ?? item.directUnitCost ?? null,
      brand: '', brandLogo: '', thumbnails: [], images360: [],
      specs: [], oemNumbers: [], gtins: [], pdfs: [], genericDescription: '',
      articleId: null, articleParts: [], vehicles: []
    }
  }
  // Réf TecDoc + fabricant (mêmes casses que l'ancien composant)
  const articleRef = item.VendorItemNo || item.vendorItemNo || item.articleNumber
  const manufacturerId = item.ManufacturerTecdocId || item.manufacturerTecdocId || item.dataSupplierId || item.manufacturerId
  if (!articleRef || !manufacturerId) { infoState.value.loading = false; loadBcPicture(item.no); return }
  try {
    const response = await store.fetchTecdocArticleDetails(articleRef, manufacturerId)
    const article = response && response.articles && response.articles.length ? response.articles[0] : null
    if (article) {
      const thumbnails = []
      const images360 = []
      ;(article.images || []).forEach(img => {
        if (img.fileName && img.fileName.toUpperCase().endsWith('.ZIP')) { if (img.imageURL800) images360.push(img.imageURL800) }
        else if (img.imageURL800) thumbnails.push(img.imageURL800)
      })
      infoState.value.data = {
        ...infoState.value.data,
        brand: article.mfrName || '',
        brandLogo: article.supplierLogoUrl || '',
        thumbnails,
        images360,
        articleId: (article.genericArticles && article.genericArticles[0] && article.genericArticles[0].legacyArticleId) || null,
        specs: (article.articleCriteria || []).map(c => ({ label: c.criteriaDescription, value: c.formattedValue })),
        oemNumbers: (article.oemNumbers || []).map(o => ({ mfrName: o.mfrName, articleNumber: o.articleNumber })),
        gtins: article.gtins || [],
        pdfs: (article.pdfs || []).map(p => ({ url: p.url || p.pdfURL || p.docURL || '', fileName: p.fileName || p.docTypeName || 'Document' })),
        articleParts: (article.articleParts || []).map(p => ({ articleNo: p.articleNo || p.articleNumber || '—', articleName: p.articleName || '—', brandName: p.brandName || '—', quantity: p.quantity || 1 })),
        vehicles: (article.linkedVehicles || []).map(v => ({ brand: v.manuName, id: v.manuId, models: [], isLoading: false, loaded: false })),
        genericDescription: (article.genericArticles && article.genericArticles[0] && article.genericArticles[0].genericArticleDescription) || item.descriptionStructured
      }
    }
  } catch (error) {
    console.error('[C2 Phase 10A] Erreur TecDoc:', error)
  } finally {
    infoState.value.loading = false
  }
  // Fallback photo BC si aucune image TecDoc (ne bloque pas l'affichage du dialog)
  const d = infoState.value.data
  if (d && !(d.thumbnails && d.thumbnails.length) && !(d.images360 && d.images360.length)) {
    loadBcPicture(d.no)
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 10B — Dialog historique / détail stock par SOCIÉTÉ (clic bande STOCKS)
   ──────────────────────────────────────────────────────────────────────────
   Reprend openHistory + fetchDialogHistory de l'ancien : mêmes écritures (item
   ledger) que la sidebar, mais filtrées par companyId (société cliquée), pour
   l'article sélectionné (selectedHistoryItem). Colonnes "expanded", KPI, année.
══════════════════════════════════════════════════════════════════════════ */
const companyHist = ref({ open: false, company: '', companyId: null, year: getCurrentYear(), kpis: { stock: 0, achat: 0, vente: 0, rupt: 0 }, entries: [], loading: false, page: 0, totalPages: 0 })
let companyHistToken = 0
const closeCompanyHist = () => { companyHist.value.open = false }
const loadCompanyHist = async (page = 0) => {
  const item = selectedHistoryItem.value
  if (!item || !item.no) return
  if (companyHist.value.loading && page > 0) return
  const token = (page === 0) ? ++companyHistToken : companyHistToken
  companyHist.value.loading = true
  try {
    // 5e param = companyId (société cliquée) → historique filtré par société
    const data = await store.fetchItemLedgerEntries(item.no, companyHist.value.year, page, historyPageSize, companyHist.value.companyId)
    if (token !== companyHistToken) return
    const rows = (data && Array.isArray(data.content)) ? data.content : (Array.isArray(data) ? data : [])
    companyHist.value.entries = page === 0 ? rows : [...companyHist.value.entries, ...rows]
    companyHist.value.page = (data && data.page != null) ? data.page : (data && data.number != null ? data.number : page)
    companyHist.value.totalPages = (data && data.totalPages != null) ? data.totalPages : 1
    if (data && data.quantityByEntryType) {
      companyHist.value.kpis = { ...companyHist.value.kpis, achat: data.quantityByEntryType.Purchase || 0, vente: data.quantityByEntryType.Sale || 0, rupt: data.quantityByEntryType.Rupture || 0 }
    }
  } catch (error) {
    console.error('[C2 Phase 10B] Erreur historique société:', error)
    if (token === companyHistToken && page === 0) companyHist.value.entries = []
  } finally {
    if (token === companyHistToken) companyHist.value.loading = false
  }
}
const onCompanyHistScroll = (event) => {
  const { scrollTop, clientHeight, scrollHeight } = event.target
  if (scrollTop + clientHeight >= scrollHeight - 20 && !companyHist.value.loading && companyHist.value.page < companyHist.value.totalPages - 1) {
    loadCompanyHist(companyHist.value.page + 1)
  }
}
const changeCompanyYear = (delta) => { companyHist.value.year += delta; loadCompanyHist(0) }
const openHistory = (company, companyId = null, stock = 0) => {
  if (!selectedHistoryItem.value || !selectedHistoryItem.value.no) return   // besoin d'un article sélectionné
  companyHist.value = { open: true, company, companyId, year: getCurrentYear(), kpis: { stock: stock ?? 0, achat: 0, vente: 0, rupt: 0 }, entries: [], loading: false, page: 0, totalPages: 0 }
  loadCompanyHist(0)
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 10C — Dialog Historique prix d'achat (clic cellule coût FRS/EQV/KIT)
   ──────────────────────────────────────────────────────────────────────────
   Reprend openPurchasePriceDialog de l'ancien : store.fetchPurchasePrices(itemNo)
   (liste complète, filtrée client par fournisseur). Filtre verrouillé sur le
   fournisseur si ouvert depuis FRS. Colonnes : Frs, Date Début, Date Fin, Devise,
   Coût Unitaire Direct. Pas de pagination serveur (l'API renvoie tout).
══════════════════════════════════════════════════════════════════════════ */
const priceHist = ref({ open: false, loading: false, itemNo: '', description: '', vendorFilter: '', filterLocked: false, prices: [] })
const closePriceHist = () => { priceHist.value.open = false }
/* (vendors distincts + filtrage par fournisseur → dérivés DANS le composant partagé
   ArticlePurchasePriceHistoryDialog ; le parent ne garde que l'état + l'appel API.) */
const openPriceHist = async (vendorNo, itemNo, description, fromSuppliers = false) => {
  if (!itemNo) return
  priceHist.value = {
    open: true, loading: true, itemNo, description: description || '',
    vendorFilter: (fromSuppliers && vendorNo) ? vendorNo : '',
    filterLocked: !!fromSuppliers, prices: []
  }
  try {
    const data = await store.fetchPurchasePrices(itemNo)
    priceHist.value.prices = Array.isArray(data) ? data : (data ? [data] : [])
  } catch (error) {
    console.error('[C2 Phase 10C] Erreur historique prix achat:', error)
    priceHist.value.prices = []
  } finally {
    priceHist.value.loading = false
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 10D — Dialog Lignes commande achat (clic badge "Cmd" FRS/EQV/KIT)
   ──────────────────────────────────────────────────────────────────────────
   Reprend openPurchaseLinesDialog de l'ancien : ouvre si qtyOnPurchOrder > 0,
   store.fetchPurchaseLines(no, page, size) (GET /api/sqlserver/purchase-lines/{no}),
   pagination page/size (footer prev/suiv, comme la source). Tri colonnes non repris (mineur).
══════════════════════════════════════════════════════════════════════════ */
const poLines = ref({ open: false, loading: false, no: '', entries: [], page: 0, size: 10, totalElements: 0, totalPages: 0, sortField: '', sortDirection: '' })
const closePoLines = () => { poLines.value.open = false }
/* (poVal lecture tolérante + formatPoDate → helpers de présentation déplacés DANS
   les composants partagés ArticlePurchaseLinesDialog / ArticleDerPHistoryDialog.) */
const loadPoLines = async (no, page = 0) => {
  if (!no) return
  poLines.value.loading = true
  try {
    const sort = poLines.value.sortField ? `${poLines.value.sortField},${poLines.value.sortDirection}` : ''
    const data = await store.fetchPurchaseLines(no, page, poLines.value.size, sort)
    if (data && data.content) {
      poLines.value.entries = data.content
      poLines.value.page = data.page?.number ?? data.number ?? page
      poLines.value.totalElements = data.page?.totalElements ?? data.totalElements ?? data.content.length
      poLines.value.totalPages = data.page?.totalPages ?? data.totalPages ?? 1
    } else {
      const items = Array.isArray(data) ? data : (data ? [data] : [])
      poLines.value.entries = items
      poLines.value.page = 0
      poLines.value.totalElements = items.length
      poLines.value.totalPages = 1
    }
  } catch (error) {
    console.error('[C2 Phase 10D] Erreur lignes commande achat:', error)
    poLines.value.entries = []
  } finally {
    poLines.value.loading = false
  }
}
const openPoLines = (item) => {
  const qty = item ? item.qtyOnPurchOrder : 0
  if (!qty || qty <= 0) return                       // ouvre uniquement s'il existe des lignes (comme la source)
  poLines.value = { open: true, loading: false, no: item.no, entries: [], page: 0, size: 10, totalElements: 0, totalPages: 0, sortField: '', sortDirection: '' }
  loadPoLines(item.no, 0)
}
const goPoPage = (page) => {
  if (page < 0 || page > (poLines.value.totalPages - 1)) return
  loadPoLines(poLines.value.no, page)
}
// Tri Lignes Commande Achat (cycle asc → desc → aucun), recharge page 0
const onPoSort = (field) => {
  const s = poLines.value
  if (s.sortField === field) {
    if (s.sortDirection === 'asc') s.sortDirection = 'desc'
    else { s.sortField = ''; s.sortDirection = '' }
  } else {
    s.sortField = field; s.sortDirection = 'asc'
  }
  loadPoLines(s.no, 0)
}

/* ══════════════════════════════════════════════════════════════════════════
   Dialog Lignes Import (clic quantité « I » de la colonne Appro, FRS/EQV/KIT).
   Source : store.fetchImportLedgerLines(itemNo, sourceNo, page, size) →
   GET /api/bc/import-ledger-entries (BC specificItemLedgerEntries,
   filtres isImportLocation eq true + RemainingQuantity gt 0). Pagination page/size.
══════════════════════════════════════════════════════════════════════════ */
const importLines = ref({ open: false, loading: false, itemNo: '', sourceNo: '', entries: [], page: 0, size: 50, totalElements: 0, totalPages: 0, sortField: '', sortDirection: '' })
const closeImportLines = () => { importLines.value.open = false }
const loadImportLines = async (itemNo, sourceNo, page = 0) => {
  if (!itemNo || !sourceNo) return
  importLines.value.loading = true
  try {
    const sort = importLines.value.sortField ? `${importLines.value.sortField},${importLines.value.sortDirection}` : ''
    const data = await store.fetchImportLedgerLines(itemNo, sourceNo, page, importLines.value.size, sort)
    if (data && data.content) {
      importLines.value.entries = data.content
      importLines.value.page = data.page ?? page
      importLines.value.totalElements = data.totalElements ?? data.content.length
      importLines.value.totalPages = data.totalPages ?? 1
    } else {
      const items = Array.isArray(data) ? data : (data ? [data] : [])
      importLines.value.entries = items
      importLines.value.page = 0
      importLines.value.totalElements = items.length
      importLines.value.totalPages = items.length ? 1 : 0
    }
  } catch (error) {
    console.error('[C2 Import] Erreur lignes import:', error)
    importLines.value.entries = []
  } finally {
    importLines.value.loading = false
  }
}
const openImportLines = (itemNo, sourceNo, qty) => {
  if (!qty || qty <= 0 || !itemNo || !sourceNo) return   // ouvre uniquement s'il existe une qté import (comme le badge Cmd)
  importLines.value = { open: true, loading: false, itemNo, sourceNo, entries: [], page: 0, size: 50, totalElements: 0, totalPages: 0, sortField: '', sortDirection: '' }
  loadImportLines(itemNo, sourceNo, 0)
}
const goImportPage = (page) => {
  if (page < 0 || page > (importLines.value.totalPages - 1)) return
  loadImportLines(importLines.value.itemNo, importLines.value.sourceNo, page)
}
// Tri Lignes Import (cycle asc → desc → aucun), recharge page 0
const onImportSort = (field) => {
  const s = importLines.value
  if (s.sortField === field) {
    if (s.sortDirection === 'asc') s.sortDirection = 'desc'
    else { s.sortField = ''; s.sortDirection = '' }
  } else {
    s.sortField = field; s.sortDirection = 'asc'
  }
  loadImportLines(s.itemNo, s.sourceNo, 0)
}

/* ══════════════════════════════════════════════════════════════════════════
   Dialog "Historique Der P" (clic sur le prix de la colonne Der P, FRS/EQV/KIT).
   Source : store.fetchLastInvoicedItemCosts(itemNo, page, size) →
   GET /api/sqlserver/last-invoiced-item-costs/{itemNo} (vue SQL LastInvoicedItemCost,
   triée date desc, paginée). DISTINCT de l'historique prix d'achat (/api/purchase-prices).
══════════════════════════════════════════════════════════════════════════ */
const derp = ref({ open: false, loading: false, itemNo: '', desc: '', entries: [], page: 0, size: 20, totalElements: 0, totalPages: 0 })
const closeDerp = () => { derp.value.open = false }
const loadDerp = async (itemNo, page = 0) => {
  if (!itemNo) return
  derp.value.loading = true
  try {
    const data = await store.fetchLastInvoicedItemCosts(itemNo, page, derp.value.size)
    if (data && data.content) {
      derp.value.entries = data.content
      derp.value.page = data.page?.number ?? data.number ?? page
      derp.value.totalElements = data.page?.totalElements ?? data.totalElements ?? data.content.length
      derp.value.totalPages = data.page?.totalPages ?? data.totalPages ?? 1
    } else {
      const items = Array.isArray(data) ? data : (data ? [data] : [])
      derp.value.entries = items
      derp.value.page = 0
      derp.value.totalElements = items.length
      derp.value.totalPages = items.length ? 1 : 0
    }
  } catch (error) {
    console.error('[C2 Der P] Erreur historique Der P:', error)
    derp.value.entries = []
  } finally {
    derp.value.loading = false
  }
}
const openDerp = (itemNo, desc) => {
  if (!itemNo) return
  derp.value = { open: true, loading: false, itemNo, desc: desc || '', entries: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }
  loadDerp(itemNo, 0)
}
const goDerpPage = (page) => {
  if (page < 0 || page > (derp.value.totalPages - 1)) return
  loadDerp(derp.value.itemNo, page)
}
const saveComment = async () => {
  const s = commentState.value
  if (!s.item || s.busy) return
  s.busy = true
  try {
    if (s.type === 'frs') {
      await store.updateQuoteLineComment(s.item.id, s.text)
      s.item.quoteLineComment = s.text
    } else if (s.item.existPurchaseCart && s.item.purchaseCartLineNo) {
      await store.updateCartItemComment(s.item.purchaseCartLineNo, s.text)
      s.item.commentPurchaseCart = s.text
    } else {
      s.item.comment = s.text     // EQV/KIT hors panier : commentaire local (comportement ancien)
    }
    commentState.value.open = false
  } catch (error) {
    console.error('[C2 Phase 9D] Erreur enregistrement commentaire:', error)
  } finally {
    commentState.value.busy = false
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 4B — Clic FRS → EQV + KIT RÉELS (lecture simple)
   ──────────────────────────────────────────────────────────────────────────
   Au clic sur une ligne FRS : sélection visuelle + chargement des vraies lignes
   ÉQUIVALENCE et KIT (page 0) via le store existant. AUCUN historique réel,
   AUCUN total/stocks/panier, AUCUN filtre, AUCUNE action complexe.
══════════════════════════════════════════════════════════════════════════ */
const equivalenceItems = ref([])
const kitItems = ref([])
const isLoadingEquivalence = ref(false)
const isLoadingKit = ref(false)
const hasSelectedFrs = ref(false)       // false tant qu'aucune ligne FRS cliquée
const eqvKitPageSize = 5                 // PHASE 4C : 5 lignes visibles pour EQV et KIT
const selectedDetailRow = ref(null)      // ligne FRS courante (pour paginer EQV/KIT au scroll)

// PHASE 4D : sélection visuelle dans EQV / KIT (style C2 identique à FRS) + auto-sélection 1ère ligne FRS
const selectedEqvIndex = ref(-1)
const selectedKitIndex = ref(-1)
const hasAutoSelectedFirstFrs = ref(false)
// PHASE 4E : une SEULE sélection visuelle active entre les 3 tables ('frs' | 'eqv' | 'kit').
// La sélection MÉTIER (selectedDetailRow / selectedFrs pour EQV/KIT) est conservée indépendamment.
const activeTableSelection = ref('frs')
const selectEqv = (i) => {
  activeTableSelection.value = 'eqv'; selectedEqvIndex.value = i; selectedKitIndex.value = -1
  // PHASE 5 : recharge l'historique réel pour la ligne EQV cliquée (pas de rechargement EQV/KIT)
  setHistorySource(equivalenceItems.value[i], equivalenceItems.value[i]?.qtyStock)
}
const selectKit = (i) => {
  activeTableSelection.value = 'kit'; selectedKitIndex.value = i; selectedEqvIndex.value = -1
  // PHASE 5 : recharge l'historique réel pour la ligne KIT cliquée
  setHistorySource(kitItems.value[i], kitItems.value[i]?.qtyStock)
}

// Pagination EQV / KIT (totalElements déjà présent dans le JSON de ces endpoints)
const eqvPage = ref(0)
const eqvTotalElements = ref(0)
const eqvHasMore = ref(false)
const kitPage = ref(0)
const kitTotalElements = ref(0)
const kitHasMore = ref(false)
// Totaux de synthèse EQV/KIT (CMD = qtyOnPurchOrder, IMP = qtyImport) calculés côté backend
// sur toutes les lignes filtrées (champs totalCmdQuantity / totalImportQuantity de la réponse).
const eqvTotalCmd = ref(0)
const eqvTotalImp = ref(0)
const kitTotalCmd = ref(0)
const kitTotalImp = ref(0)
// Affichage compact : entier si entier, sinon 2 décimales (les badges ligne ne sont pas arrondis).
const fmtSum = (v) => { const n = Number(v) || 0; return Number.isInteger(n) ? n : n.toFixed(2) }

// Jeton anti-résultats périmés : si on reclique vite, on ignore les réponses obsolètes
let selectionToken = 0

const loadEquivalence = async (detail, token, page = 0) => {
  // Le DTO sérialise le master en "ReferenceMaster" (majuscule, via @JsonProperty)
  const refMaster = detail ? (detail.ReferenceMaster ?? detail.referenceMaster) : null
  if (!detail || !refMaster || !detail.no) { equivalenceItems.value = []; eqvTotalElements.value = 0; eqvHasMore.value = false; eqvTotalCmd.value = 0; eqvTotalImp.value = 0; return }
  if (page === 0) { eqvTotalCmd.value = 0; eqvTotalImp.value = 0 }   // reset pendant le (re)chargement → pas de totaux stale
  isLoadingEquivalence.value = true
  try {
    const data = await store.fetchEquivalenceItems(refMaster, detail.no, page, eqvKitPageSize, props.compareQuoteNo, buildEqvFilterParams())
    if (token !== selectionToken) return            // sélection changée entre-temps → on ignore
    const rows = withDefaultQty(normalizeRows(data))
    equivalenceItems.value = page === 0 ? rows : [...equivalenceItems.value, ...rows]
    eqvPage.value = page
    eqvTotalElements.value = pickTotal(data, equivalenceItems.value)
    eqvTotalCmd.value = Number(data?.totalCmdQuantity ?? 0)
    eqvTotalImp.value = Number(data?.totalImportQuantity ?? 0)
    eqvHasMore.value = equivalenceItems.value.length < eqvTotalElements.value
  } catch (error) {
    console.error('[C2 Phase 4] Erreur chargement EQV:', error)
    if (token === selectionToken && page === 0) { equivalenceItems.value = []; eqvTotalElements.value = 0; eqvHasMore.value = false; eqvTotalCmd.value = 0; eqvTotalImp.value = 0 }
  } finally {
    if (token === selectionToken) isLoadingEquivalence.value = false
  }
}

const loadKit = async (detail, token, page = 0) => {
  if (!detail || !detail.no) { kitItems.value = []; kitTotalElements.value = 0; kitHasMore.value = false; kitTotalCmd.value = 0; kitTotalImp.value = 0; return }
  if (page === 0) { kitTotalCmd.value = 0; kitTotalImp.value = 0 }   // reset pendant le (re)chargement → pas de totaux stale
  isLoadingKit.value = true
  try {
    const data = await store.fetchKitItems(detail.no, page, eqvKitPageSize, props.compareQuoteNo, buildKitFilterParams())
    if (token !== selectionToken) return
    const rows = withDefaultQty(normalizeRows(data))
    kitItems.value = page === 0 ? rows : [...kitItems.value, ...rows]
    kitPage.value = page
    kitTotalElements.value = pickTotal(data, kitItems.value)
    kitTotalCmd.value = Number(data?.totalCmdQuantity ?? 0)
    kitTotalImp.value = Number(data?.totalImportQuantity ?? 0)
    kitHasMore.value = kitItems.value.length < kitTotalElements.value
  } catch (error) {
    console.error('[C2 Phase 4] Erreur chargement KIT:', error)
    if (token === selectionToken && page === 0) { kitItems.value = []; kitTotalElements.value = 0; kitHasMore.value = false; kitTotalCmd.value = 0; kitTotalImp.value = 0 }
  } finally {
    if (token === selectionToken) isLoadingKit.value = false
  }
}

// Scroll EQV / KIT : charge la page suivante (append) près du bas
const onEquivalenceScroll = (event) => {
  const { scrollTop, clientHeight, scrollHeight } = event.target
  if (scrollTop + clientHeight >= scrollHeight - 20 && !isLoadingEquivalence.value && eqvHasMore.value && selectedDetailRow.value) {
    loadEquivalence(selectedDetailRow.value, selectionToken, eqvPage.value + 1)
  }
}
const onKitScroll = (event) => {
  const { scrollTop, clientHeight, scrollHeight } = event.target
  if (scrollTop + clientHeight >= scrollHeight - 20 && !isLoadingKit.value && kitHasMore.value && selectedDetailRow.value) {
    loadKit(selectedDetailRow.value, selectionToken, kitPage.value + 1)
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   AUTO-REMPLISSAGE pagination (FRS / EQV / KIT)
   ──────────────────────────────────────────────────────────────────────────
   La pagination repose sur l'event scroll. Si le 1er batch (5 lignes) ne suffit
   pas à créer une scrollbar (peu de lignes, zoom navigateur < ~75 %), l'event
   scroll ne se déclenche jamais → l'utilisateur reste bloqué sur la 1ère page.
   Après chaque (re)chargement, on vérifie si le conteneur est scrollable
   (scrollHeight > clientHeight) ; sinon et s'il reste des pages, on charge la
   suivante, jusqu'à obtenir une scrollbar / plus de pages / garde-fou atteint.
   N'ajoute AUCUN scroll artificiel : s'arrête dès qu'une scrollbar existe.
══════════════════════════════════════════════════════════════════════════ */
const AUTOFILL_MAX = 8   // garde-fou anti-boucle : nb max de pages auto-chargées par cycle
const autoFillTable = async (wrapRef, isLoading, hasMore, loadNext) => {
  for (let i = 0; i < AUTOFILL_MAX; i++) {
    await nextTick()
    const el = wrapRef.value
    if (!el || isLoading() || !hasMore()) return
    if (el.scrollHeight > el.clientHeight + 4) return   // scrollbar déjà présente → terminé
    await loadNext()                                    // charge (append) la page suivante
  }
}
const autoFillFrs = () => autoFillTable(frsWrap, () => isLoadingFrsMore.value, () => frsHasMore.value, () => loadFrsPage())
const autoFillEqv = () => autoFillTable(eqvWrap, () => isLoadingEquivalence.value, () => eqvHasMore.value, () => loadEquivalence(selectedDetailRow.value, selectionToken, eqvPage.value + 1))
const autoFillKit = () => autoFillTable(kitWrap, () => isLoadingKit.value, () => kitHasMore.value, () => loadKit(selectedDetailRow.value, selectionToken, kitPage.value + 1))

/* ══════════════════════════════════════════════════════════════════════════
   COUNT OEM — équivalences OEM du master de la ligne FRS sélectionnée.
   Source : action store EXISTANTE store.fetchOemEquivalenceCount(ReferenceMaster)
   → GET /api/sqlserver/oem-equivalence-count/{masterItemNo}. Réponse
   { totalCount, details:[{reference,count}] }. 1 appel par sélection FRS
   (jamais par ligne). Anti-périmé via selectionToken (partagé EQV/KIT).
══════════════════════════════════════════════════════════════════════════ */
const oemCount = ref(null)
const oemCountDetails = ref([])
const isLoadingOemCount = ref(false)
const oemDialog = ref({ open: false, master: '' })
const sortedOemCountDetails = computed(() =>
  [...oemCountDetails.value].sort((a, b) => (b.count || 0) - (a.count || 0))
)
const loadOemCount = async (detail, token) => {
  const master = detail ? (detail.ReferenceMaster ?? detail.referenceMaster) : null
  if (!master) { oemCount.value = null; oemCountDetails.value = []; return }
  isLoadingOemCount.value = true
  try {
    const res = await store.fetchOemEquivalenceCount(master)
    if (token !== selectionToken) return            // sélection changée entre-temps → on ignore
    oemCount.value = (res && res.totalCount !== undefined) ? res.totalCount : (Number(res) || 0)
    oemCountDetails.value = Array.isArray(res?.details) ? res.details : []
  } catch (error) {
    if (token === selectionToken) { oemCount.value = 0; oemCountDetails.value = [] }
    console.error('[C2 OEM] Erreur count OEM:', error)
  } finally {
    if (token === selectionToken) isLoadingOemCount.value = false
  }
}
const openOemDialog = () => {
  if (isLoadingOemCount.value || !oemCountDetails.value.length) return   // 0 détail → non cliquable
  oemDialog.value = {
    open: true,
    master: selectedDetailRow.value?.ReferenceMaster ?? selectedDetailRow.value?.referenceMaster ?? ''
  }
}
const closeOemDialog = () => { oemDialog.value.open = false }

// Clic FRS : sélection visuelle + chargement EQV puis KIT (page 0, uniquement pour la ligne cliquée)
const selectFrs = async (i) => {
  selectedFrs.value = i
  hasSelectedFrs.value = true
  const detail = quoteLineDetails.value[i]
  selectedDetailRow.value = detail || null
  if (!detail) return
  const token = ++selectionToken
  eqvPage.value = 0
  kitPage.value = 0
  activeTableSelection.value = 'frs'                 // PHASE 4E : la sélection visuelle active repasse sur FRS
  selectedEqvIndex.value = -1                         // reset sélection visuelle EQV/KIT au changement de FRS
  selectedKitIndex.value = -1
  // PHASE 5 : historique réel pour la ligne FRS sélectionnée (stock KPI = stock dispo FRS)
  setHistorySource(detail, detail.inventoryWithoutImport)
  // PHASE 7 : total document réel (lié à la ligne FRS)
  loadTotalAmount(detail.documentNo, token)
  // COUNT OEM : 1 appel pour le master de la ligne (asynchrone, ne bloque pas EQV/KIT)
  loadOemCount(detail, token)
  isLoadingKit.value = true                          // feedback immédiat côté KIT
  await loadEquivalence(detail, token, 0)
  await loadKit(detail, token, 0)
  // Réinitialise le scroll des tables EQV / KIT en haut (nouvelle ligne FRS = nouveau contenu)
  if (token === selectionToken) {
    await nextTick()
    if (eqvWrap.value) eqvWrap.value.scrollTop = 0
    if (kitWrap.value) kitWrap.value.scrollTop = 0
    // Auto-remplissage si le conteneur n'est pas scrollable (sinon scroll-pagination bloquée)
    autoFillEqv()
    autoFillKit()
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 5 — HISTORIQUE RÉEL (sidebar C2)
   ──────────────────────────────────────────────────────────────────────────
   Charge les écritures (item ledger) de la ligne sélectionnée (FRS / EQV / KIT)
   via le store existant. Pagination scroll + navigation année + KPI Achat/Vente/
   Rupt (quantityByEntryType) + Stock (stock de la ligne). AUCUN header
   Total/STOCKS/panier, AUCUNE action complexe.
══════════════════════════════════════════════════════════════════════════ */
const selectedHistoryItem = ref(null)             // ligne dont on affiche l'historique (FRS/EQV/KIT)
const selectedYear = ref(new Date().getFullYear())
const historyEntries = ref([])
const isLoadingHistory = ref(false)
const historyPage = ref(0)
const historyTotalPages = ref(0)
const historyPageSize = 20
const historyKpis = ref({ stock: 0, achat: 0, vente: 0, rupt: 0 })
const historyWrap = ref(null)
let historyToken = 0

// Helpers historique (mêmes mappings que l'ancien composant)
const histTypeLetter = (t) => ({ Purchase: 'A', Sale: 'V', Rupture: 'R', Transfer: 'T' }[t] || (t ? t[0] : ''))
const histTypeClass = (t) => ({ Purchase: 'Achat', Sale: 'Vente', Rupture: 'Rupture', Transfer: 'Transfert' }[t] || 'Transfert')
const calculatePU = (entry) => {
  if (!entry) return 0
  const qty = Math.abs(Number(entry.quantity)) || 1
  if (entry.entryType === 'Sale') return ((entry.salesAmountActual ?? entry.salesAmountExpected ?? 0)) / qty
  if (entry.entryType === 'Purchase') return ((entry.costAmountActual ?? entry.costAmountExpected ?? 0)) / qty
  return 0
}
const histMontant = (entry) => {
  if (!entry) return null
  if (entry.entryType === 'Sale') return entry.salesAmountActual ?? entry.salesAmountExpected ?? null
  if (entry.entryType === 'Purchase') return entry.costAmountActual ?? entry.costAmountExpected ?? null
  return null
}

const loadHistory = async (page = 0) => {
  const item = selectedHistoryItem.value
  if (!item || !item.no) { historyEntries.value = []; historyTotalPages.value = 0; historyPage.value = 0; return }
  if (isLoadingHistory.value && page > 0) return
  const token = (page === 0) ? ++historyToken : historyToken
  isLoadingHistory.value = true
  try {
    // companyId = null → historique global (comme la sidebar de l'ancien composant)
    const data = await store.fetchItemLedgerEntries(item.no, selectedYear.value, page, historyPageSize, null)
    if (token !== historyToken) return
    const rows = (data && Array.isArray(data.content)) ? data.content : (Array.isArray(data) ? data : [])
    historyEntries.value = page === 0 ? rows : [...historyEntries.value, ...rows]
    historyPage.value = (data && data.page != null) ? data.page : (data && data.number != null ? data.number : page)
    historyTotalPages.value = (data && data.totalPages != null) ? data.totalPages : 1
    if (data && data.quantityByEntryType) {
      historyKpis.value = {
        ...historyKpis.value,
        achat: data.quantityByEntryType.Purchase || 0,
        vente: data.quantityByEntryType.Sale || 0,
        rupt: data.quantityByEntryType.Rupture || 0
      }
    }
  } catch (error) {
    console.error('[C2 Phase 5] Erreur chargement historique:', error)
    if (token === historyToken && page === 0) historyEntries.value = []
  } finally {
    if (token === historyToken) isLoadingHistory.value = false
  }
}

const onHistoryScroll = (event) => {
  const { scrollTop, clientHeight, scrollHeight } = event.target
  if (scrollTop + clientHeight >= scrollHeight - 20 && !isLoadingHistory.value && historyPage.value < historyTotalPages.value - 1) {
    loadHistory(historyPage.value + 1)
  }
}

// Déclaration de FONCTION (hoistée) : disponible avant toute initialisation de ref qui l'utilise
// (ex. companyHist en Phase 10B), évite « Cannot access 'getCurrentYear' before initialization ».
function getCurrentYear() { return new Date().getFullYear() }
const changeYear = (delta) => { selectedYear.value += delta; loadHistory(0) }

// Point d'entrée commun (selectFrs / selectEqv / selectKit + auto-sélection) :
// PHASE 5C : remet l'année à l'année courante à CHAQUE nouvelle sélection (comme l'ancienne page),
// définit la ligne source + son stock KPI, puis (re)charge page 0. Un seul appel historique.
// (changeYear(delta) ne passe PAS par ici → les changements d'année manuels restent possibles.)
const setHistorySource = (item, stockVal) => {
  // PHASE 8C : sélectionner une ligne FRS/EQV/KIT pendant que le panier est ouvert
  // referme le panier et revient à l'historique (année courante, ci-dessous). Un seul appel historique.
  sidebarMode.value = 'history'
  selectedYear.value = getCurrentYear()
  selectedHistoryItem.value = item || null
  historyKpis.value.stock = (stockVal != null && stockVal !== '') ? stockVal : 0
  historyEntries.value = []
  historyPage.value = 0
  historyTotalPages.value = 0
  loadHistory(0)
  loadIntercompanyStocks(item?.no)        // PHASE 7 : KPI STOCKS (intersociétés) suivent la ligne sélectionnée
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 7 — Header réel : Total document + KPI STOCKS (intersociétés) + panier
   ──────────────────────────────────────────────────────────────────────────
   • Total document : store.fetchTotalAmount(documentNo) — lié à la ligne FRS.
   • KPI STOCKS : store.fetchIntercompanyStock(no) — lié à la ligne sélectionnée
     (FRS/EQV/KIT), via setHistorySource (même cycle que l'historique).
   • Panier : store.cartCount via store.fetchCartCount(compareQuoteNo) (badge seul).
   Aucune action panier / dialog / validation dans cette phase.
══════════════════════════════════════════════════════════════════════════ */
const totalAmount = ref(null)
const intercompanyStocks = ref([])
const isLoadingStocks = ref(false)

// Total document (lié à la ligne FRS sélectionnée). Jeton de sélection FRS pour ignorer les réponses périmées.
const loadTotalAmount = async (documentNo, token) => {
  if (!documentNo) { totalAmount.value = null; return }
  try {
    const amount = await store.fetchTotalAmount(documentNo)
    if (token !== selectionToken) return
    totalAmount.value = amount
  } catch (error) {
    console.error('[C2 Phase 7] Erreur total document:', error)
    if (token === selectionToken) totalAmount.value = null
  }
}

// Stocks intersociétés de la ligne sélectionnée (FRS/EQV/KIT). Jeton historique (même cycle que l'historique).
const loadIntercompanyStocks = async (itemNo) => {
  const token = historyToken
  if (!itemNo) { intercompanyStocks.value = []; return }
  isLoadingStocks.value = true
  try {
    const data = await store.fetchIntercompanyStock(itemNo)
    if (token !== historyToken) return
    intercompanyStocks.value = Array.isArray(data) ? data : (data ? [data] : [])
  } catch (error) {
    console.error('[C2 Phase 7] Erreur stocks intersociétés:', error)
    if (token === historyToken) intercompanyStocks.value = []
  } finally {
    if (token === historyToken) isLoadingStocks.value = false
  }
}

// Format monétaire façon C2 : séparateur de milliers (espace) + 2 décimales (point). Ex. 18 920.27
const formatMoney = (v) => {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (isNaN(n)) return '—'
  const [intPart, dec] = n.toFixed(2).split('.')
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '.' + dec
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 8A — Panier (EQV / KIT)
   ──────────────────────────────────────────────────────────────────────────
   Ajoute une équivalence / un kit au panier d'achat via l'action store existante
   (store.addToCart → POST /api/bc/purchase-cart), puis rafraîchit le badge panier
   (store.fetchCartCount). Quantité éditable = item.quantityToOrder.
   FRS n'a pas de panier (ses lignes = devis ; édition qté = updateLine = phase
   négociation/validation, hors 8A). Aucun commentaire / raison / dialog ici.
══════════════════════════════════════════════════════════════════════════ */
const cartBusyKey = ref(null)                          // clé de la ligne en cours d'ajout (loading local)
const cartKey = (item) => (item ? (item.id ?? item.no) : null)

const addToCart = async (item) => {
  if (!item || item.existPurchaseCart) return          // déjà au panier => pas de doublon
  const refMaster = selectedDetailRow.value
    ? (selectedDetailRow.value.ReferenceMaster ?? selectedDetailRow.value.referenceMaster ?? '')
    : ''
  cartBusyKey.value = cartKey(item)
  try {
    const payload = {
      buyFromVendorNo: item.vendorNo,
      itemNo: item.no,
      refMaster,
      quantity: Number(item.quantityToOrder) || 1,
      directUnitCost: item.lastCurrPrice,
      compareQuoteNo: props.compareQuoteNo,
      comment: ''
    }
    const response = await store.addToCart(payload)
    item.existPurchaseCart = true                       // état local immédiat (icône "au panier")
    if (response && response.lineNo) item.purchaseCartLineNo = response.lineNo
    await store.fetchCartCount(props.compareQuoteNo)     // refresh badge panier header
    if (sidebarMode.value === 'cart') await loadCart(store.cartPagination.page)  // PHASE 8B : refresh liste panier si ouverte
  } catch (error) {
    console.error('[C2 Phase 8A] Erreur ajout panier:', error)
  } finally {
    cartBusyKey.value = null
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 8B — Panier dans la sidebar C2 (variante de la sidebar Historique)
   ──────────────────────────────────────────────────────────────────────────
   sidebarMode : 'history' (défaut) | 'cart'. Le panier réutilise les actions
   store existantes : fetchCartItems (liste), updateCartItemStatus (vérifier/
   annuler = retrait), fetchCartCount (badge). Onglet 'current' = comparateur
   courant, 'all' = tout le panier. Aucun dialog, aucune modif backend.
══════════════════════════════════════════════════════════════════════════ */
const sidebarMode = ref('history')
const cartTab = ref('current')          // 'current' (ce comparateur) | 'all'
const cartBusyLineNo = ref(null)        // ligne panier en cours d'action (loading local)
// PHASE 8F : filtres panier (mêmes champs que l'ancienne page). status null => store renvoie New+Verified.
const cartFilters = ref({ compareQuoteNo: '', status: null, itemNo: '', vendorNo: '' })

const loadCart = (page = 0) => store.fetchCartItems(cartFilters.value, page)

const openCart = () => {
  sidebarMode.value = 'cart'
  cartTab.value = 'current'
  // reset des filtres + compareQuoteNo imposé par l'onglet courant
  cartFilters.value = { compareQuoteNo: props.compareQuoteNo, status: null, itemNo: '', vendorNo: '' }
  loadCart(0)
}
const closeCart = () => { sidebarMode.value = 'history' }   // l'historique de la ligne courante est déjà chargé

// Onglet : 'current' impose compareQuoteNo ; 'all' le retire (filtrable via le champ Comparateur)
const switchCartTab = (tab) => {
  cartTab.value = tab
  cartFilters.value.compareQuoteNo = (tab === 'current') ? props.compareQuoteNo : ''
  loadCart(0)
}
// Recherche : debounce sur la saisie texte, immédiat sur le statut. Reset page 0, filtres conservés.
let cartDebounce = null
const applyCartFilters = () => { loadCart(0) }
const debouncedCartFilter = () => {
  if (cartDebounce) clearTimeout(cartDebounce)
  cartDebounce = setTimeout(() => loadCart(0), 400)
}
const clearCartFilters = () => {
  cartFilters.value = { compareQuoteNo: (cartTab.value === 'current') ? props.compareQuoteNo : '', status: null, itemNo: '', vendorNo: '' }
  loadCart(0)
}
const goCartPage = (page) => {
  if (page < 0 || page > (store.cartPagination.totalPages - 1)) return
  loadCart(page)
}
// Vérifier / Annuler (retrait) une ligne panier, puis refresh liste + badge
const cartAction = async (lineNo, status) => {
  if (!lineNo) return
  cartBusyLineNo.value = lineNo
  try {
    await store.updateCartItemStatus(lineNo, status)
    await store.fetchCartCount(props.compareQuoteNo)
    await loadCart(store.cartPagination.page)
  } catch (error) {
    console.error('[C2 Phase 8B] Erreur action panier:', error)
  } finally {
    cartBusyLineNo.value = null
  }
}

onMounted(async () => {
  isLoadingDetails.value = true
  try {
    // PHASE 7 : compteur panier réel (badge) pour ce comparateur — lecture seule
    store.fetchCartCount(props.compareQuoteNo).catch(e => console.error('[C2 Phase 7] Erreur compteur panier:', e))
    await loadFrsPage()
    autoFillFrs()   // charge auto les pages FRS suivantes si pas de scrollbar (zoom / peu de lignes)
    // PHASE 4D : auto-sélection de la 1ère ligne FRS (comportement de l'ancienne version)
    // → charge EQV + KIT pour cette ligne, une seule fois (garde anti-double).
    if (!hasAutoSelectedFirstFrs.value && quoteLineDetails.value.length > 0) {
      hasAutoSelectedFirstFrs.value = true
      await selectFrs(0)
    }
  } finally {
    isLoadingDetails.value = false
  }
})

// Historique : 3 états (collapsed | normal | expanded) — purement visuel
const histState = ref('normal')
const widenHist = () => { histState.value = histState.value === 'collapsed' ? 'normal' : 'expanded' }
const narrowHist = () => { histState.value = histState.value === 'expanded' ? 'normal' : 'collapsed' }

// Système de filtres unifié C2.
// PHASE 6 : les filtres FRS sont branchés sur le backend (stock / date / qty).
// EQV / KIT restent VISUELS uniquement (pas de filtre backend dans cette phase).
const c2Filters = ref({
  frs: [],
  eqv: [],
  kit: []
})
const c2Menu = ref({ open: false, table: null, col: null, label: '', op: 'gt', value: null, x: 0, y: 0 })
const opSym = (v) => ops.find(o => o.v === v)?.s || opsText.find(o => o.v === v)?.s || '>'
const isColFiltered = (table, col) => c2Filters.value[table].some(f => f.key === col)
const openMenu = (e, table, col, label) => {
  const existing = c2Filters.value[table].find(f => f.key === col)
  // Repositionnement anti-coupure : si le menu déborderait en bas, on l'ouvre au-dessus de l'icône.
  const MENU_H = 250
  const below = e.clientY + 14
  const y = (below + MENU_H > window.innerHeight) ? Math.max(8, e.clientY - MENU_H - 8) : below
  c2Menu.value = {
    open: true, table, col, label,
    op: existing ? existing.op : (col === 'ref' ? 'contains' : 'gt'),
    value: existing ? existing.value : null,
    x: Math.min(e.clientX, window.innerWidth - 280),
    y
  }
}
const closeMenu = () => { c2Menu.value.open = false }
const applyMenu = () => {
  const m = c2Menu.value
  let val = m.value
  if (typeof val === 'string') val = val.trim()
  if (val === null || val === undefined || val === '') { closeMenu(); return }
  const arr = c2Filters.value[m.table].filter(f => f.key !== m.col)
  arr.push({ key: m.col, op: m.op, value: val, label: `${m.label} ${opSym(m.op)} ${val}` })
  c2Filters.value[m.table] = arr
  closeMenu()
  reloadTableFilters(m.table)                       // PHASE 6/6B : filtre FRS/EQV/KIT → rechargement backend page 0
}
const clearMenuCol = () => {
  const m = c2Menu.value
  c2Filters.value[m.table] = c2Filters.value[m.table].filter(f => f.key !== m.col)
  closeMenu()
  reloadTableFilters(m.table)
}
const removeFilter = (table, key) => {
  c2Filters.value[table] = c2Filters.value[table].filter(f => f.key !== key)
  reloadTableFilters(table)                          // suppression chip → rechargement avec filtres restants
}
const clearAll = (table) => {
  c2Filters.value[table] = []
  reloadTableFilters(table)                          // Effacer tout → rechargement sans filtres
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASE 6 — Filtres FRS backend (appliqués AVANT pagination)
   ──────────────────────────────────────────────────────────────────────────
   Convertit les chips C2 FRS en paramètres backend existants. Mapping opérateur
   UI→backend : gt/ge/eq/le/lt (identiques, aucun renommage).
══════════════════════════════════════════════════════════════════════════ */
const FRS_FILTER_TO_PARAMS = {
  stock: (f) => ({ stockOperator: f.op, stockValue: f.value }),
  date:  (f) => ({ dateDernierAchatOperator: f.op, dateDernierAchatValue: f.value }),
  qty:   (f) => ({ quantityOperator: f.op, quantityValue: f.value }),
  firstconf: (f) => ({ qtyFirstConfirmationOperator: f.op, qtyFirstConfirmationValue: f.value }),
  ref:   (f) => ({ referenceOperator: f.op, referenceValue: f.value })
}
const buildFrsFilterParams = () => {
  const params = {}
  for (const f of c2Filters.value.frs) {
    const map = FRS_FILTER_TO_PARAMS[f.key]
    if (map) Object.assign(params, map(f))
  }
  return params
}

// Réinitialise EQV / KIT / Historique + sélection (cas "aucune ligne FRS")
const resetDependentSelections = () => {
  hasSelectedFrs.value = false
  selectedFrs.value = -1
  selectedDetailRow.value = null
  activeTableSelection.value = 'frs'
  selectedEqvIndex.value = -1
  selectedKitIndex.value = -1
  equivalenceItems.value = []; eqvTotalElements.value = 0; eqvHasMore.value = false; eqvPage.value = 0
  kitItems.value = []; kitTotalElements.value = 0; kitHasMore.value = false; kitPage.value = 0
  selectedHistoryItem.value = null
  historyEntries.value = []; historyTotalPages.value = 0; historyPage.value = 0
  historyKpis.value = { stock: 0, achat: 0, vente: 0, rupt: 0 }
  // PHASE 7 : header cohérent quand aucune ligne FRS (total + stocks vidés)
  totalAmount.value = null
  intercompanyStocks.value = []
}

// Applique les filtres FRS : reset pagination + reload page 0 (filtré côté backend),
// puis auto-sélection de la 1ère ligne filtrée (→ EQV/KIT/Historique) ou reset si 0 ligne.
const applyFrsFilters = async () => {
  quoteLineDetails.value = []
  frsPage.value = 0
  frsHasMore.value = true
  frsTotalElements.value = 0
  await loadFrsPage()
  autoFillFrs()   // charge auto les pages FRS suivantes si pas de scrollbar
  if (quoteLineDetails.value.length > 0) {
    await selectFrs(0)                              // recharge EQV/KIT/Historique pour la 1ère ligne filtrée
  } else {
    resetDependentSelections()
  }
}

/* PHASE 6B — Filtres EQV / KIT backend (stock + dernier achat). Mêmes opérateurs gt/ge/eq/le/lt. */
const EQVKIT_FILTER_TO_PARAMS = {
  stock: (f) => ({ stockOperator: f.op, stockValue: f.value }),
  date:  (f) => ({ dateDernierAchatOperator: f.op, dateDernierAchatValue: f.value }),
  ref:   (f) => ({ referenceOperator: f.op, referenceValue: f.value })
  // (pas de filtre quantité pour EQV/KIT — choix produit)
}
const buildTableFilterParams = (table) => {
  const params = {}
  for (const f of c2Filters.value[table]) {
    const map = EQVKIT_FILTER_TO_PARAMS[f.key]
    if (map) Object.assign(params, map(f))
  }
  return params
}
const buildEqvFilterParams = () => buildTableFilterParams('eqv')
const buildKitFilterParams = () => buildTableFilterParams('kit')

// Applique les filtres EQV : reload page 0 (filtré) pour la ligne FRS source. Ne touche ni FRS, ni KIT, ni l'historique.
const applyEqvFilters = () => {
  if (!selectedDetailRow.value) return
  selectedEqvIndex.value = -1
  if (activeTableSelection.value === 'eqv') activeTableSelection.value = 'frs'  // la ligne EQV sélectionnée peut disparaître
  eqvPage.value = 0
  loadEquivalence(selectedDetailRow.value, selectionToken, 0)   // token courant → résultat accepté, KIT non impacté
    .then(() => autoFillEqv())   // auto-remplissage si pas de scrollbar après filtrage
}
// Applique les filtres KIT : reload page 0 (filtré) pour la ligne FRS source. Ne touche ni FRS, ni EQV, ni l'historique.
const applyKitFilters = () => {
  if (!selectedDetailRow.value) return
  selectedKitIndex.value = -1
  if (activeTableSelection.value === 'kit') activeTableSelection.value = 'frs'
  kitPage.value = 0
  loadKit(selectedDetailRow.value, selectionToken, 0)
    .then(() => autoFillKit())   // auto-remplissage si pas de scrollbar après filtrage
}

// Dispatcher : rechargement backend selon la table dont un filtre vient de changer
const reloadTableFilters = (table) => {
  if (table === 'frs') applyFrsFilters()
  else if (table === 'eqv') applyEqvFilters()
  else if (table === 'kit') applyKitFilters()
}
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
// Opérateurs texte pour le filtre Réf / Désignation (référence article)
const opsText = [
  { s: 'Contient', v: 'contains', t: 'Contient' },
  { s: 'Égale', v: 'equals', t: 'Égale' }
]

// Grille de colonnes COMMUNE aux 3 tableaux FRS / EQV / KIT (mêmes largeurs => alignement)
// PHASE 10B : colonne Actions élargie (10%) pour loger jusqu'à 5 icônes EQV/KIT sans "…". Somme = 100%.
// Grille COMMUNE aux 3 tables FRS / EQV / KIT → mêmes largeurs par rang (séparateurs alignés verticalement).
// Rang : 1 Frs · 2 Réf/Désignation · 3 Stock · 4 Appro · 5 Dern.Achat · 6 Coût Dir./Prix Dev. ·
//        7 Prix Rev./Coût Calc. · 8 Prix Vte · 9 Négoc./Achat · 10 1er Conf./Vente · 11 Qté Cf/Panier · 12 Actions.
// Actions très compacte (6%) ; espace réinjecté dans Réf/Désignation (18%) et Dern. Achat (9%). Somme = 100%.
// Frs 9% / Dern. Achat 7% (inversés) ; CF F 8% ; Actions 8% (tient 4 icônes sans scroll H).
const cols = ['9%', '18%', '6%', '7%', '7%', '8%', '8%', '8%', '7%', '6%', '8%', '8%']
// Mode Historique EXPANDED : on masque les rangs 9 (Négoc./Achat) et 10 (CF I/Vente) dans les 3 tables
// → grille réduite à 10 colonnes (alignée FRS/EQV/KIT), espace redonné à Réf / Dern. Achat / Coût-Prix.
const colsExpanded = ['10%', '21%', '6%', '7%', '12%', '10%', '10%', '8%', '10%', '6%']
const isHistExpanded = computed(() => histState.value === 'expanded')
const activeCols = computed(() => isHistExpanded.value ? colsExpanded : cols)

/* ──────────────────────────────────────────────────────────────────────────
   DONNÉES 100 % MOCKÉES (copiées du prototype C2) — PHASE 1 UNIQUEMENT.
   TODO Phase 3 (FRS) / Phase 4 (EQV+KIT) / Phase 5 (Historique) :
   remplacer `mock` par les vraies données chargées via l'API / le store.
─────────────────────────────────────────────────────────────────────────── */
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

<!-- ════════════════════════════════════════════════════════════════════════
     STYLES — copiés intégralement du Design C2 du prototype
     (src/views/ConfirmationAchatUiLabView.vue). Aucune modification visuelle.
════════════════════════════════════════════════════════════════════════ -->
<style scoped>
.num { text-align: right; }

/* Boutons segmentés (communs) */
.seg { display: flex; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; padding: 3px; gap: 0; }
.seg button { flex: 1; height: 30px; border: none; background: transparent; color: #64748b; font-weight: 800; font-size: 0.95rem; border-radius: 7px; cursor: pointer; transition: all .15s; }
.seg button:hover { background: #e2e8f0; color: #0f172a; }
.seg button.on { background: #fff; color: #2563eb; box-shadow: 0 1px 2px rgba(16,24,40,.18); }

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
  --c2-right-width: min(564px, 41vw);  /* normal légèrement élargi (DATE Historique lisible), borné (zone gauche préservée) */
  /* Largeur FIGÉE du header droit : indépendante de l'état historique (= largeur du mode normal).
     Le collapse/expand de la sidebar ne doit PAS déplacer/étirer le header. */
  --c2-header-right-width: min(564px, 41vw);   /* aligné sur la sidebar en mode normal, et figé sur tous les modes */
  font-family: var(--c2-font-sans);
  font-size: 13px;
  line-height: 1.45;
  color: #1f2937;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.c2-root.hist-collapsed { --c2-right-width: 54px; }                      /* rail compact */
/* PHASE 8C : largeurs par MODE — normal 440px, expanded ~700→840px (colonnes détaillées), collapsed 54px */
.c2-root.hist-expanded  { --c2-right-width: clamp(700px, 52%, 840px); } /* historique/panier détaillé, élargi vers la gauche */

/* Une seule police partout ; tabular-nums pour aligner les chiffres (pas de police mono distincte) */
.c2-root, .c2-root input, .c2-root button { font-family: var(--c2-font-sans); }
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
  background: var(--c2-head-bg);
  color: #e2e8f0;
  border-radius: 12px;
  /* Pas de padding à droite : la zone droite va jusqu'au bord (aligné avec la sidebar) */
  padding: 10px 0 10px 16px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
  /* Hauteur FIXE = autres headers C2 (76px). Ne grandit JAMAIS quand les stocks société
     se chargent (intercompanyStocks vide → peuplé) : le contenu se compacte dans cette hauteur. */
  height: var(--c2-head-h);
  min-height: var(--c2-head-h);
  max-height: var(--c2-head-h);
  box-sizing: border-box;
  overflow: hidden;
}
/* Bouton retour = reproduction du bouton de l'ancien détail comparateur
   (PrimeVue text rounded icon-only) : transparent, 36×40, icône #cbd5e1, hover clair. */
.c2-back {
  width: 36px; height: 40px; flex-shrink: 0;
  border-radius: 8px; border: none; background: transparent; color: #cbd5e1; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background .15s, color .15s;
}
.c2-back i { font-size: 16px; }
.c2-back:hover { background: rgba(255, 255, 255, .1); color: #fff; }
.c2-titlewrap { flex-shrink: 0; }
.c2-titlewrap h1 { margin: 0; font-size: 1.02rem; font-weight: 800; letter-spacing: -0.01em; color: #fff; }
.c2-sub { font-size: 0.95rem; color: #aab6c6; display: flex; align-items: center; gap: 7px; margin-top: 2px; }
.c2-no { color: #93c5fd; font-weight: 800; font-size: 1rem; }
.c2-dot { color: #475569; }
/* Bande STOCKS — design STE / Stock / Dern. Achat par société (réf. détail comparateur) */
.c2-stockband {
  flex: 1; display: flex; align-items: center; gap: 0;
  background: rgba(255,255,255,0.06); border: 1px solid var(--c2-head-border); border-radius: 10px;
  padding: 0 12px; min-width: 0; height: 56px; max-height: 100%; overflow: hidden; box-sizing: border-box;
}
.c2-stocklabel { font-size: 14px; font-weight: 800; letter-spacing: .12em; color: var(--c2-head-accent); flex-shrink: 0; padding-right: 12px; }
/* Une colonne par société, séparée par un trait vertical clair */
.c2-stkcol { flex: 1; display: flex; align-items: center; height: 100%; min-width: 0; position: relative; }
.c2-stkcol:not(:last-child)::after { content: ""; position: absolute; right: 0; top: 18%; height: 64%; width: 1px; background: rgba(255,255,255,.18); }
/* Sous-parties STE / Stock / Dern. Achat (mini-label au-dessus, valeur en dessous) */
.c2-stkpart { display: flex; flex-direction: column; justify-content: center; padding: 0 9px; min-width: 0; position: relative; }
.c2-stkpart:nth-child(1) { flex: 1.3; }   /* STE (nom société) */
.c2-stkpart:nth-child(2) { flex: 1; }     /* Stock (cliquable) */
.c2-stkpart:nth-child(3) { flex: 1.4; }   /* Dern. Achat */
.c2-stkpart:not(:last-child)::after { content: ""; position: absolute; right: 0; top: 28%; height: 44%; width: 1px; background: rgba(255,255,255,.1); }
.c2-stkpart.click { cursor: pointer; border-radius: 6px; transition: background .15s; }
.c2-stkpart.click:hover { background: rgba(255,255,255,.08); }
.c2-stkmini { font-size: 11px; color: #9fb3c8; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; line-height: 1; margin-bottom: 3px; white-space: nowrap; }
.c2-stkval { font-size: 16px; font-weight: 800; color: #fff; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.c2-stkval.company { color: var(--c2-head-accent); font-size: 14px; }
.c2-stkval.pos { color: #34d399; } .c2-stkval.neg { color: #f87171; }
.c2-stkval.date { font-size: 13px; color: #cbd5e1; font-weight: 700; }
.c2-total { display: flex; flex-direction: column; align-items: flex-start; flex-shrink: 0; }
.c2-total span { font-size: 0.66rem; color: #94a3b8; }
.c2-total b { font-size: 1.12rem; color: #93c5fd; font-weight: 800; }
.c2-total em { font-size: 0.66rem; font-style: normal; color: #94a3b8; font-weight: 600; }
.c2-cart { position: relative; display: inline-flex; align-items: center; gap: 5px; background: #2b3a4f; border: 1px solid var(--c2-head-border); color: #fdba74; border-radius: 9px; padding: 7px 11px; font-weight: 700; cursor: pointer; flex-shrink: 0; }
.c2-confirm { display: inline-flex; align-items: center; gap: 7px; background: var(--ok); color: #fff; border: none; border-radius: 9px; padding: 9px 16px; font-weight: 700; cursor: pointer; flex-shrink: 0; box-shadow: 0 4px 12px rgba(22,163,74,.3); }
.c2-confirm:hover { background: #15803d; }
/* COUNT OEM : chip compact dans l'en-tête sombre. Fond transparent, texte + contour
   VERTS (comme le bouton Confirmer) pour le distinguer du TOTAL (bleu). */
.c2-oem { display: inline-flex; align-items: center; gap: 5px; background: transparent; border: 1px solid var(--ok); color: #4ade80; border-radius: 9px; padding: 7px 11px; font-weight: 700; font-size: 0.82rem; font-variant-numeric: tabular-nums; cursor: pointer; flex-shrink: 0; }
.c2-oem.clickable:hover { background: rgba(22,163,74,.16); border-color: #22c55e; }
.c2-oem.z { color: #94a3b8; border-color: var(--c2-head-border); }
.c2-oem:disabled { cursor: default; }
.c2-oem i { font-size: 0.9rem; }

/* ── Corps ── */
.c2-body { display: flex; gap: var(--c2-page-pad); margin-top: var(--c2-page-pad); align-items: stretch; }
.c2-left { flex: 1; display: flex; flex-direction: column; gap: var(--c2-page-pad); min-width: 0; }
.c2-side { width: var(--c2-right-width); flex-shrink: 0; align-self: stretch; display: flex; flex-direction: column; background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(16,24,40,.05); transition: width .25s cubic-bezier(.4,0,.2,1); }
/* L'historique remplit la hauteur restante (jusqu'en bas du KIT) et défile si besoin */
.c2-hist { flex: 1; min-height: 0; overflow-y: auto; }
.c2-rail { flex: 1; }

/* Zone droite du header : même largeur que la sidebar Historique (alignement) */
.c2-header-right { width: var(--c2-header-right-width); min-width: 360px; max-width: 564px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 0 16px; box-sizing: border-box; border-left: 1px solid var(--c2-head-border); }

/* ── Cartes grilles ── */
.c2-grid { background: #fff; border: 1px solid var(--line); border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(16,24,40,.05); position: relative; }
.c2-grid-head { display: flex; align-items: center; gap: 14px; padding: 10px 14px; border-bottom: 1px solid var(--line); background: #fcfdff; }
.c2-grid-title { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 0.74rem; letter-spacing: .08em; color: var(--ink); }
.c2-acc { width: 4px; height: 16px; border-radius: 3px; background: var(--p); }
.c2-acc.eqv { background: #0ea5e9; } .c2-acc.kit { background: #8b5cf6; }
.c2-count { background: var(--p-soft); color: var(--p); font-weight: 800; font-size: 0.66rem; padding: 1px 8px; border-radius: 9999px; }

/* ── Barre de filtres actifs ── */
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
/* FRS / EQV / KIT : la hauteur n'est plus figée (ancien max-height: 272px). Le shell C2
   (bloc de layout en fin de fichier) répartit les 3 sections en parts égales (flex: 1 1 0)
   et chaque .c2-tablewrap scrolle en interne. Le scroll déclenche la pagination serveur. */
.c2-frs-scroll, .c2-eqv-scroll, .c2-kit-scroll { overflow-y: auto; }
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
.c2-table th.c2-th-c { text-align: center; }   /* en-têtes Qté Cf (FRS) + Panier (EQV/KIT) centrés sur le contenu */
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

.mono { font-family: var(--c2-font-mono); font-variant-numeric: tabular-nums; }
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
/* Badges de synthèse header EQV/KIT (CMD orange comme le badge C, IMP bleu comme le badge I) */
.c2-sum { display: inline-flex; align-items: center; margin-left: 8px; padding: 1px 7px; border-radius: 9999px; font-size: 0.62rem; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: .02em; }
.c2-sum.cmd { color: #c2410c; background: #fff7ed; border: 1px solid #fed7aa; }
.c2-sum.imp { color: #1d4ed8; background: #eff6ff; border: 1px solid #dbeafe; }
.c2-sum.dp { color: #4338ca; background: #eef2ff; border: 1px solid #c7d2fe; }  /* DP : indigo, distinct du total */
.c2-appro .z { color: #94a3b8; background: #f8fafc; border-color: #eef2f7; }

.c2-pricecell b { display: block; font-size: 14px; color: var(--ink); font-weight: 650; }
.c2-pricecell em { font-style: normal; font-size: 11px; font-weight: 700; }
.c2-pricecell em.up { color: var(--bad); } .c2-pricecell em.down { color: var(--ok); }

/* Dernier Achat (FRS) : prix + badge quantité (ligne 1) + date (ligne 2) */
.c2-lastbuy .c2-lb-top { display: inline-flex; align-items: center; gap: 5px; justify-content: flex-end; }
.c2-lastbuy .c2-lb-top b { font-size: 14px; color: var(--ink); font-weight: 650; font-variant-numeric: tabular-nums; }
.c2-qbadge { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 16px; padding: 0 5px; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 9999px; font-size: 0.66rem; font-weight: 800; line-height: 1; }
.c2-lb-date { display: block; font-style: normal; font-size: 11px; color: var(--muted); font-weight: 600; font-variant-numeric: tabular-nums; }
/* Prix "Der P" cliquable : hover/soulignement uniquement sur le prix (pas badge ni date) */
.c2-derp-link { cursor: pointer; }
.c2-derp-link:hover { color: var(--p); text-decoration: underline; text-underline-offset: 2px; }
/* Coût Direct (FRS) : prix + icône préférentiel (ligne 1) + % évolution (ligne 2) */
.c2-costdir .c2-cd-top { display: inline-flex; align-items: center; gap: 0; justify-content: flex-end; }
/* Icône préférentiel : même taille/alignement true & false, espacée du prix (FRS flex + EQV inline) */
.c2-pref { font-size: 0.82rem; margin-left: 5px; vertical-align: middle; line-height: 1; }
.c2-pref.on { color: var(--ok); }       /* préférentiel = vert */
.c2-pref.off { color: #ef4444; }         /* non préférentiel = rouge doux */
.c2-pct { display: block; font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; }
.c2-pct.up { color: var(--warn); }      /* hausse du coût = orange (cf. ancienne page) */
.c2-pct.down { color: var(--ok); }       /* baisse = vert */
.c2-pct.neutral { color: var(--muted); }

.c2-input { width: 48px; text-align: right; border: 1px solid #d8dee7; border-radius: 6px; padding: 4px 6px; font-size: 14px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
.c2-input:focus { outline: none; border-color: var(--p); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.c2-raison { font-size: 12px; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.c2-raison.empty { color: #cbd5e1; }
.c2-actcol { text-align: center !important; }
/* Option A — action-strip C2 légère : toutes les actions visibles (pas de menu caché, pas de pastille
   permanente). Chaque icône = bouton à zone cliquable confortable (~25px), fond transparent par défaut,
   hover discret #f5f9ff, radius 6px. .c2-acts = strip ; .c2-acts i = icône-bouton. */
.c2-acts { text-align: center; white-space: nowrap; line-height: 1; }
.c2-acts i {
  display: inline-flex; align-items: center; justify-content: center;
  width: 25px; height: 25px; margin: 0 2px; vertical-align: middle;
  border-radius: 6px; color: #94a3b8; cursor: pointer; font-size: 0.95rem;
  background: transparent; transition: background .15s, color .15s;
}
.c2-acts i:hover { background: #f5f9ff; }
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
/* Filtre texte Réf (Contient / Égale) : libellés plus longs → police réduite */
.seg.c2.txt button { font-size: 0.74rem; font-weight: 700; }
.c2-fmenu-val { width: 100%; box-sizing: border-box; border: 1px solid #d8dee7; border-radius: 8px; padding: 7px 9px; font-family: var(--c2-font-mono); }
.c2-fmenu-val:focus { outline: none; border-color: var(--p); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.c2-fmenu-actions { display: flex; justify-content: space-between; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line-soft); }
.c2-fmenu-actions .ghost { border: 1px solid #d8dee7; background: #fff; color: #475569; border-radius: 8px; padding: 6px 12px; font-weight: 600; cursor: pointer; }
.c2-fmenu-actions .ghost:hover { background: #f8fafc; }
.c2-fmenu-actions .prim { display: inline-flex; align-items: center; gap: 5px; border: none; background: var(--p); color: #fff; border-radius: 8px; padding: 6px 14px; font-weight: 700; cursor: pointer; }
.c2-fmenu-actions .prim:hover { background: #1d4ed8; }

/* ── Sidebar Historique premium ── */
.c2-side-head { display: flex; align-items: center; justify-content: space-between; background: var(--c2-head-bg); color: #fff; padding: 10px 14px; }
.c2-side-title { font-weight: 800; font-size: 0.78rem; letter-spacing: .04em; display: inline-flex; align-items: center; gap: 7px; }
.c2-side-title i { color: var(--c2-head-accent); }
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
/* Numéro de ligne global FRS (purement visuel, basé sur l'ordre affiché : index + 1) */
.c2-row-index {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 16px; margin-right: 6px; padding: 0 5px;
  font-size: 0.62rem; font-weight: 800; font-variant-numeric: tabular-nums;
  color: #64748b; background: linear-gradient(180deg, #f8fafc, #eef2f7);
  border: 1px solid #e2e8f0; border-radius: 6px; line-height: 1;
  vertical-align: middle; box-shadow: 0 1px 1px rgba(16,24,40,.04);
  transition: color .15s ease, background .15s ease, border-color .15s ease;
}
/* Ligne FRS contexte (source EQV/KIT) → badge bleu plein, MÊME si la sélection active est EQV/KIT.
   tr.sel le couvre quand FRS est la table active ; .ctx-active le maintient quand EQV/KIT est actif. */
.c2-maintable tr.sel .c2-row-index,
.c2-row-index.ctx-active {
  color: #fff; background: var(--p); border-color: var(--p);
  box-shadow: 0 1px 3px rgba(37,99,235,.35);
}

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
.c2-rail { height: 100%; min-height: 360px; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px 0; cursor: pointer; background: var(--c2-head-bg); color: #cbd5e1; }
.c2-rail .c2-collapse { background: rgba(255,255,255,0.12); }
.c2-rail-icon { font-size: 1.1rem; color: var(--c2-head-accent); margin-top: 4px; }
.c2-rail-label { writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: 0.18em; font-size: 0.66rem; font-weight: 800; color: #94a3b8; }
.c2-rail:hover .c2-rail-label { color: #e2e8f0; }
/* PHASE 8C : compteur panier sur le rail collapsed */
.c2-rail-count { margin-top: 6px; background: #ea580c; color: #fff; font-size: 0.64rem; font-weight: 800; border-radius: 9px; padding: 1px 6px; }

/* ── Mini-menu de filtre flottant (positionné au clic) ── */
.c2-menu-backdrop { position: fixed; inset: 0; z-index: 40; }
.c2-fmenu.floating {
  position: fixed; left: auto; top: auto; width: 248px; z-index: 41;
  background: #fff; border: 1px solid var(--line); border-radius: 12px;
  box-shadow: 0 18px 44px rgba(15,23,42,.26); padding: 12px;
}
</style>

<!-- ════════════════════════════════════════════════════════════════════════
     SHELL C2 STANDARD — header 76px + body (left/right) + footer page 48px.
     • .c2-root = flex column borné à la hauteur visible (token, pas de magic number).
     • header fixe (76px) ; footer page fixe (48px, Deep Ocean, aligné footer sidebar) ; body = reste.
     • Panneau gauche : PAS de scroll global → FRS/EQV/KIT se partagent la hauteur (flex 1 1 0)
       et chaque table scrolle EN INTERNE (header de section fixe).
     • Right panel : épouse la hauteur du body (jusqu'au footer), scroll interne (.c2-hist).
     Bloc déclaré en dernier => prime.
════════════════════════════════════════════════════════════════════════ -->
<style scoped>
.c2-root {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 2 * var(--c2-page-pad));   /* viewport - padding vertical de .main-content (token) */
  overflow: hidden;
}
.c2-header { flex-shrink: 0; }                     /* header fixe 76px */
.c2-body { flex: 1; min-height: 0; }               /* le corps prend la hauteur restante (entre header et footer) */

/* Footer page C2 — shell standard 48px, Deep Ocean, aligné avec le footer de la sidebar verticale */
.c2-footer {
  flex-shrink: 0;
  height: 48px; box-sizing: border-box;
  margin-top: var(--c2-page-pad);
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 0 16px;
  background: var(--c2-head-bg);
  border: 1px solid var(--c2-head-border);
  border-radius: var(--c2-head-radius, 12px);
  box-shadow: var(--c2-head-shadow, 0 4px 14px rgba(15,23,42,.25));
  color: #fff;
}
.c2-footer-label { font-weight: 800; font-size: 0.8rem; letter-spacing: .04em; color: #fff; white-space: nowrap; }
.c2-footer-meta { min-width: 0; display: flex; align-items: baseline; gap: 8px; overflow: hidden; }
.c2-footer-meta b { font-weight: 800; font-size: 0.82rem; color: #fff; font-variant-numeric: tabular-nums; white-space: nowrap; }
.c2-footer-meta em { font-style: normal; font-size: 0.78rem; color: #fff; opacity: .8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Panneau gauche : les 3 sections se partagent équitablement la hauteur, scroll interne par table */
.c2-left { min-height: 0; overflow: hidden; }                                   /* pas de scroll global */
.c2-left .c2-grid { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; }  /* FRS/EQV/KIT = parts égales */
.c2-left .c2-grid-head { flex-shrink: 0; }                                      /* en-tête de section fixe */
.c2-left .c2-tablewrap { flex: 1 1 auto; min-height: 0; max-height: none; overflow-y: auto; }  /* SEULE zone scrollable de la section */

.c2-side { align-self: stretch; }                  /* le right panel épouse la hauteur du corps (jusqu'au footer) */
.c2-hist { flex: 1; min-height: 0; overflow-y: auto; }  /* seule la table historique/panier scrolle */

/* PHASE 10B : cellule STOCKS cliquable (ouvre l'historique société) */
.c2-stockcell--click { cursor: pointer; border-radius: 8px; transition: background .15s; padding: 2px 6px; margin: -2px -6px; }
.c2-stockcell--click:hover { background: rgba(255,255,255,0.08); }

/* PHASE 10C : cellule coût cliquable (ouvre l'historique prix d'achat) */
.c2-clickprice { cursor: pointer; }
.c2-clickprice:hover { color: var(--p) !important; text-decoration: underline; text-underline-offset: 2px; }
/* PHASE 10C : dialog Historique Prix Achat → extrait dans le composant PARTAGÉ
   src/components/article/ArticlePurchasePriceHistoryDialog.vue. Classes
   .c2-pricehist-modal/table/filter retirées (mortes). */

/* PHASE 10D : badge "Cmd" cliquable (conservé) + dialog Lignes commande achat → composant PARTAGÉ
   src/components/article/ArticlePurchaseLinesDialog.vue. .c2-po-modal / .c2-po-footer retirés (morts).
   CONSERVÉ : .c2-po-table (encore utilisé par le dialog count OEM ci-dessous). */
.c2-appro .cmd.clickable { cursor: pointer; }
.c2-appro .cmd.clickable:hover { text-decoration: underline; filter: brightness(0.92); }
.c2-appro .imp.clickable { cursor: pointer; }
.c2-appro .imp.clickable:hover { text-decoration: underline; filter: brightness(0.92); }
.c2-po-table { overflow-y: auto; max-height: 56vh; min-height: 220px; padding: 0 2px; }
/* Dialog count OEM (réutilise .c2-info-modal + .c2-po-table + .c2-histtable) */
.c2-oem-modal { width: min(560px, 94vw); }
/* En-tête dialog OEM : badge "Total : N" à droite, juste avant la croix */
.c2-oem-headright { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.c2-oem-total { background: rgba(255,255,255,.12); color: #fff; font-weight: 800; font-size: 0.82rem; padding: 3px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.2); white-space: nowrap; font-variant-numeric: tabular-nums; }

/* PHASE 10B/10C : dialogs historique société + historique prix achat → extraits dans les composants
   PARTAGÉS src/components/article/ArticleStockHistoryDialog.vue + ArticlePurchasePriceHistoryDialog.vue.
   Classes .c2-cohist-* (dont .c2-cohist-headright) entièrement retirées (mortes). */

/* PHASE 10A : dialog Info article / TecDoc (centré, scroll interne si haut) */
.c2-info-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(880px, 94vw); max-height: 88vh; z-index: 61; background: #fff; border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 24px 60px rgba(15,23,42,.32); display: flex; flex-direction: column; overflow: hidden; }
.c2-info-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; background: var(--c2-head-bg); color: #fff; flex-shrink: 0; }
.c2-info-title { display: flex; flex-direction: column; min-width: 0; }
.c2-info-title b { font-size: 0.98rem; font-weight: 800; }
.c2-info-title span { font-size: 0.8rem; color: #aab6c6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.c2-info-close { border: 1px solid var(--c2-head-border); background: #2b3a4f; color: #cbd5e1; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; flex-shrink: 0; }
.c2-info-close:hover { background: #34465e; color: #fff; }
.c2-info-loading { padding: 40px; text-align: center; color: var(--muted); font-weight: 600; }
.c2-info-loading i { margin-right: 8px; color: var(--p); }
.c2-info-scroll { overflow-y: auto; padding: 16px 18px; }
.c2-info-top { display: flex; gap: 18px; }
.c2-info-media { width: 300px; flex-shrink: 0; }
.c2-info-mainimg { width: 100%; height: 230px; border: 1px solid var(--line); border-radius: 12px; display: flex; align-items: center; justify-content: center; background: #fcfdff; overflow: hidden; }
.c2-info-mainimg img { max-width: 100%; max-height: 100%; object-fit: contain; }
.c2-info-noimg { color: #cbd5e1; font-size: 2.4rem; }
.c2-info-thumbs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.c2-info-thumbs img { width: 50px; height: 50px; object-fit: contain; border: 1px solid var(--line); border-radius: 8px; padding: 3px; background: #fff; cursor: pointer; }
.c2-info-thumbs img.on { border-color: var(--p); box-shadow: 0 0 0 2px rgba(37,99,235,.15); }
/* Bloc identité / marque */
.c2-info-ident { flex: 1; min-width: 0; }
.c2-info-brand { display: flex; gap: 12px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--line); }
.c2-info-brandlogo { height: 38px; max-width: 120px; object-fit: contain; }
.c2-info-brandtxt { min-width: 0; }
.c2-info-brandref { font-size: 0.78rem; color: var(--muted); } .c2-info-brandref b { color: var(--ink); }
.c2-info-branddesc { font-size: 0.95rem; font-weight: 800; color: var(--ink); margin: 2px 0; }
.c2-info-brandname { font-size: 0.8rem; font-weight: 700; color: var(--p); }
.c2-info-meta { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.c2-info-meta span { display: flex; flex-direction: column; background: #f8fafc; border: 1px solid var(--line); border-radius: 9px; padding: 6px 10px; min-width: 68px; }
.c2-info-meta i { font-style: normal; font-size: 0.64rem; text-transform: uppercase; color: var(--muted); font-weight: 700; }
.c2-info-meta b { font-size: 0.88rem; color: var(--ink); font-variant-numeric: tabular-nums; }
.c2-info-specsbox { margin-top: 6px; }
.c2-info-sectitle { font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--p); margin-bottom: 8px; }
/* PHASE 10A-ter : caractéristiques en UNE colonne, hauteur bornée + scroll interne (comme la source) */
.c2-info-specs { display: flex; flex-direction: column; max-height: 200px; overflow-y: auto; border: 1px solid var(--line-soft); border-radius: 8px; padding: 2px 10px; }
.c2-info-spec { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 0.8rem; padding: 5px 0; border-bottom: 1px dashed var(--line-soft); }
.c2-info-spec:last-child { border-bottom: none; }
.c2-info-spec span { color: var(--muted); flex: 1; min-width: 0; } .c2-info-spec b { color: var(--ink); text-align: right; flex-shrink: 0; max-width: 55%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c2-info-nodata { font-size: 0.82rem; color: var(--muted); font-style: italic; }
/* Sections collapsibles (OEM / PDF) */
.c2-info-sections { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
.c2-info-acc { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
.c2-info-acchead { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f8fafc; cursor: pointer; font-weight: 800; font-size: 0.8rem; color: var(--ink); }
.c2-info-acchead span { display: inline-flex; align-items: center; gap: 8px; }
.c2-info-acchead span > i { color: var(--p); }
.c2-info-accbody { padding: 8px 12px; }
.c2-info-oemgroup { border-bottom: 1px solid var(--line-soft); }
.c2-info-oemgroup:last-child { border-bottom: none; }
.c2-info-oembrand { display: flex; align-items: center; gap: 8px; padding: 7px 0; cursor: pointer; }
.c2-info-oembrand > i { color: var(--p); font-size: 0.72rem; }
.c2-info-oembrandname { font-weight: 700; font-size: 0.82rem; color: var(--ink); flex: 1; }
.c2-info-oemcount { background: var(--p-soft); color: var(--p); font-weight: 800; font-size: 0.66rem; padding: 1px 8px; border-radius: 9999px; }
.c2-info-oemlist { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 0 10px 22px; }
.c2-info-oemchip { font-size: 0.74rem; font-weight: 700; color: #334155; background: #f1f5f9; border: 1px solid var(--line); border-radius: 7px; padding: 3px 8px; font-variant-numeric: tabular-nums; }
.c2-info-pdf { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 8px; color: var(--p); font-size: 0.82rem; font-weight: 600; text-decoration: none; }
.c2-info-pdf:hover { background: var(--p-soft); }
.c2-info-pdf span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.c2-info-empty { padding: 24px; text-align: center; color: var(--muted); font-style: italic; }
.c2-info-empty i { margin-right: 6px; }
/* PHASE 10A-ter : 360°, compteur de section, table Kit, véhicules */
.c2-info-mainimg { position: relative; }
.c2-info-mainimg.is360 { cursor: ew-resize; }
.c2-info-360btn { position: absolute; bottom: 8px; right: 8px; width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--line); background: #fff; color: var(--p); cursor: pointer; box-shadow: 0 2px 6px rgba(16,24,40,.12); }
.c2-info-360btn.on { background: var(--p); color: #fff; border-color: var(--p); }
.c2-info-360hint { margin-top: 8px; font-size: 0.72rem; color: var(--muted); text-align: center; }
.c2-info-acccount { background: var(--p-soft); color: var(--p); font-weight: 800; font-size: 0.64rem; padding: 1px 7px; border-radius: 9999px; margin-left: 6px; }
.c2-info-kittable { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.c2-info-kittable th { text-align: right; font-size: 0.66rem; text-transform: uppercase; letter-spacing: .03em; color: var(--muted); font-weight: 700; padding: 6px 8px; border-bottom: 1.5px solid var(--line); }
.c2-info-kittable th.left { text-align: left; }
.c2-info-kittable td { padding: 6px 8px; border-bottom: 1px solid var(--line-soft); color: #334155; }
.c2-info-kittable td.left { text-align: left; } .c2-info-kittable td b { color: var(--ink); }
.c2-info-kitqty { text-align: center; font-weight: 700; color: var(--ink); }
.c2-info-vehbody { max-height: 280px; overflow-y: auto; }
.c2-info-vehgroup { border-bottom: 1px solid var(--line-soft); }
.c2-info-vehgroup:last-child { border-bottom: none; }
.c2-info-vehbrand { display: flex; align-items: center; gap: 8px; padding: 7px 0; cursor: pointer; }
.c2-info-vehbrand > i { color: var(--p); font-size: 0.72rem; }
.c2-info-vehbrandname { font-weight: 700; font-size: 0.82rem; color: var(--ink); }
.c2-info-vehmodels { padding: 0 0 8px 22px; }
.c2-info-vehmodel { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #475569; padding: 3px 0; }
.c2-info-vehmodel > i { color: var(--muted); font-size: 0.7rem; }
.c2-info-vehloading, .c2-info-vehempty { font-size: 0.78rem; color: var(--muted); font-style: italic; padding: 6px 0; }
.c2-info-vehloading i { margin-right: 6px; color: var(--p); }
@media (max-width: 760px) { .c2-info-top { flex-direction: column; } .c2-info-media { width: 100%; } }

/* PHASE 9F : dialog de confirmation C2 (centré, au-dessus des autres overlays) */
.c2-confirm-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.45); backdrop-filter: blur(1px); z-index: 60; }
.c2-confirm-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(420px, 92vw); z-index: 61; background: #fff; border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 24px 60px rgba(15,23,42,.32); padding: 18px 18px 14px; }
.c2-confirm-title { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.95rem; color: var(--ink); }
.c2-confirm-title i { color: var(--warn); }
.c2-confirm-msg { margin: 10px 0 16px; font-size: 0.88rem; color: #475569; line-height: 1.5; }
.c2-confirm-actions { display: flex; justify-content: flex-end; gap: 10px; }
.c2-confirm-actions .ghost { border: 1px solid #d8dee7; background: #fff; color: #475569; border-radius: 9px; padding: 8px 16px; font-weight: 600; cursor: pointer; }
.c2-confirm-actions .ghost:hover { background: #f8fafc; }
.c2-confirm-actions .prim { display: inline-flex; align-items: center; gap: 6px; border: none; background: var(--p); color: #fff; border-radius: 9px; padding: 8px 18px; font-weight: 700; cursor: pointer; }
.c2-confirm-actions .prim:hover { background: #1d4ed8; }
.c2-confirm-actions .danger { display: inline-flex; align-items: center; gap: 6px; border: none; background: var(--bad); color: #fff; border-radius: 9px; padding: 8px 18px; font-weight: 700; cursor: pointer; }
.c2-confirm-actions .danger:hover { background: #b91c1c; }
.c2-confirm-actions button:disabled { opacity: .55; cursor: default; }

/* PHASE 9E : icône « à vérifier » (flag). Indigo inactif, orange plein si toVerify. */
.c2-acts i.pi-flag, .c2-acts i.pi-flag-fill { color: #6366f1; }
.c2-acts i.pi-flag:hover { color: #4f46e5; }
.c2-acts i.to-verify { color: var(--warn); }
.c2-acts i.to-verify:hover { color: #c2410c; }
/* Action-strip : espacement régulier des icônes-boutons (jusqu'à 5 en EQV/KIT) — cf. bloc .c2-acts plus haut */
.c2-acts i { margin: 0 2px; font-size: 0.95rem; }
/* PHASE 10B : la cellule Actions ne doit PAS tronquer en "…" (icônes uniquement) ; padding confortable */
.c2-maintable td.c2-acts, .c2-maintable th.c2-actcol { overflow: visible; text-overflow: clip; padding-left: 6px; padding-right: 6px; }
.c2-acts { white-space: nowrap; text-align: center; }

/* PHASE 9D : icône commentaire active (orange) si commentaire présent + overlay commentaire C2 */
.c2-acts i.pi-comment.has-comment { color: var(--warn); }
.c2-acts i.pi-comment:hover { color: var(--warn); }
.c2-comment-pop { position: fixed; left: auto; top: auto; width: 300px; z-index: 41; background: #fff; border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 18px 44px rgba(15,23,42,.26); padding: 12px; }
.c2-comment-head { display: flex; align-items: center; justify-content: space-between; font-weight: 800; color: var(--ink); font-size: 0.8rem; padding-bottom: 9px; border-bottom: 1px solid var(--line-soft); }
.c2-comment-head i { color: var(--p); }
.c2-comment-head button { border: none; background: transparent; color: #94a3b8; cursor: pointer; }
.c2-comment-head button:hover { color: var(--bad); }
.c2-comment-text { width: 100%; box-sizing: border-box; margin-top: 10px; border: 1px solid #d8dee7; border-radius: 8px; padding: 8px; font-size: 0.82rem; font-family: inherit; resize: vertical; color: var(--ink); }
.c2-comment-text:focus { outline: none; border-color: var(--p); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.c2-comment-actions { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.c2-comment-count { font-size: 0.7rem; color: var(--muted); margin-right: auto; }
.c2-comment-actions .ghost { border: 1px solid #d8dee7; background: #fff; color: #475569; border-radius: 8px; padding: 6px 12px; font-weight: 600; cursor: pointer; }
.c2-comment-actions .prim { display: inline-flex; align-items: center; gap: 5px; border: none; background: var(--p); color: #fff; border-radius: 8px; padding: 6px 14px; font-weight: 700; cursor: pointer; }
.c2-comment-actions .prim:disabled { opacity: .5; cursor: default; }
/* Icône Raison (1ère position Actions) + popover lecture seule */
.c2-reason-ic { color: var(--warn); }
/* Icône Raison dans Actions (FRS/EQV/KIT) : orange/rouge visible (surclasse .c2-acts i gris) */
.c2-acts i.c2-reason-ic { color: #ea580c; }
.c2-acts i.c2-reason-ic:hover { color: var(--bad); }
.c2-reason-text { margin-top: 10px; max-height: 160px; overflow-y: auto; border: 1px solid var(--line); background: #f8fafc; border-radius: 8px; padding: 8px 10px; font-size: 0.82rem; color: var(--ink); line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
/* Cellule Négoc. (FRS) : Px / Qté fusionnés, lecture seule, dense */
/* Colonne Négoc. (FRS) : 2 badges compacts empilés (PX / QTÉ), lecture seule */
.c2-negoc { font-variant-numeric: tabular-nums; }
.c2-negoc-cell { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 3px; }
.c2-negoc-badge { display: inline-flex; align-items: center; gap: 4px; max-width: 100%; padding: 1px 7px; border-radius: 9999px; border: 1px solid var(--line); background: #f8fafc; line-height: 1.25; }
.c2-negoc-label { font-size: 0.55rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .02em; }
.c2-negoc-value { font-size: 0.72rem; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; }
.c2-negoc-price { background: #eff6ff; border-color: #dbeafe; }
.c2-negoc-price .c2-negoc-value { color: #1d4ed8; }

/* PHASE 9C : select raison FRS compact (tient dans la colonne, ne casse pas la hauteur de ligne) */
.c2-reason-select { width: 100%; max-width: 100%; box-sizing: border-box; border: 1px solid #d8dee7; border-radius: 6px; padding: 3px 4px; font-size: 11.5px; color: var(--ink); background: #fff; cursor: pointer; }
.c2-reason-select:focus { outline: none; border-color: var(--p); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.c2-reason-select:disabled { opacity: .6; cursor: default; }

/* PHASE 9B : icône validation ligne FRS — ✓ vert plein si treated (lisible même ligne sélectionnée) */
.c2-acts i.pi-check-circle.treated { color: var(--ok); }
.c2-acts i.pi-check-circle.treated:hover { color: #15803d; }

/* PHASE 8A : état "déjà au panier" sur l'icône panier EQV/KIT */
.c2-acts i.pi-shopping-cart:hover { color: var(--p); }
.c2-acts i.in-cart { color: var(--ok); }
.c2-acts i.in-cart:hover { color: var(--ok); }
/* Colonnes quantité HARMONISÉES : FRS "Qté Cf" + EQV/KIT "Panier".
   IMPORTANT : le <td> reste une cellule de tableau normale (hérite hauteur de ligne +
   border-bottom alignée). Le centrage se fait sur un WRAPPER interne, pas sur le td,
   sinon le td en flex perd table-cell et le séparateur horizontal se décale. */
.c2-qtycell { text-align: center; }
.c2-qtywrap { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; }
/* Input Qté (CF F FRS + Panier EQV/KIT) : prend le max de largeur dispo dans la colonne (8%) ; l'icône reste fixe à droite. */
.c2-qtywrap .c2-input { flex: 1 1 auto; width: auto; min-width: 0; max-width: 100%; text-align: center; box-sizing: border-box; }
.c2-cart-add { flex-shrink: 0; color: #94a3b8; cursor: pointer; font-size: 0.95rem; transition: color .15s, transform .15s; }
.c2-cart-add:hover { color: var(--p); transform: scale(1.15); }
.c2-cart-add.in-cart { color: var(--ok); }
/* Icône Valider Qté Cf (FRS) — même taille que l'icône panier, vert discret. Même traitement (updateFrsLine). */
.c2-validate { flex-shrink: 0; color: var(--ok); cursor: pointer; font-size: 0.95rem; transition: color .15s, transform .15s; }
.c2-validate:hover { color: #15803d; transform: scale(1.15); }
.c2-qtywrap .pi-spinner { flex-shrink: 0; color: var(--p); font-size: 0.95rem; }

/* PHASE 8D : tables sidebar (Historique + Panier) en largeurs fixes => aucun scroll horizontal,
   texte long tronqué en ellipsis (Nom / Désignation / Commentaire). Seul le scroll vertical reste. */
.c2-histtable { table-layout: fixed; width: 100%; }
.c2-histtable th, .c2-histtable td { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* PHASE 8B : panier dans la sidebar C2 */
.c2-cart.active { background: #2563eb; border-color: #2563eb; color: #fff; }
.c2-carttabs { display: inline-flex; background: rgba(255,255,255,.08); border-radius: 7px; padding: 2px; gap: 2px; }
.c2-carttabs button { border: none; background: transparent; color: #cbd5e1; font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 5px; cursor: pointer; }
.c2-carttabs button.on { background: #2563eb; color: #fff; }
.c2-cart-status { display: inline-block; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; }
.c2-cart-status.st-new { background: #eff6ff; color: #1d4ed8; }
.c2-cart-status.st-verified { background: #dcfce7; color: #15803d; }
.c2-cart-status.st-cancelled { background: #fee2e2; color: #b91c1c; }
.c2-acts i.pi-trash:hover { color: var(--bad); }
/* PHASE 8F : ligne de filtres panier (compacte, sans scroll horizontal) */
.c2-cart-filters { display: flex; align-items: center; gap: 6px; padding: 8px 10px; background: #f8fafc; border-bottom: 1px solid var(--line); flex-shrink: 0; }
.c2-cf-input { min-width: 0; width: 64px; height: 28px; border: 1px solid #d8dee7; border-radius: 7px; padding: 0 8px; font-size: 0.78rem; color: var(--ink); background: #fff; box-sizing: border-box; }
.c2-cf-input:focus { outline: none; border-color: var(--p); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.c2-cf-grow { flex: 1; }
.c2-cf-status { width: 96px; flex-shrink: 0; cursor: pointer; }
.c2-cf-clear { flex-shrink: 0; width: 28px; height: 28px; border: 1px solid #d8dee7; background: #fff; color: #94a3b8; border-radius: 7px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.c2-cf-clear:hover { background: var(--p-soft); color: var(--bad); border-color: #fecaca; }
.c2-cart-footer { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 8px; border-top: 1px solid var(--line); font-size: 0.78rem; font-weight: 700; color: var(--muted); flex-shrink: 0; background: #fcfdff; }
.c2-pager-btn { width: 26px; height: 24px; border: 1px solid var(--line); background: #fff; color: #475569; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.c2-pager-btn:hover:not(:disabled) { background: var(--p-soft); color: var(--p); border-color: #bfdbfe; }
.c2-pager-btn:disabled { opacity: .4; cursor: default; }
</style>
