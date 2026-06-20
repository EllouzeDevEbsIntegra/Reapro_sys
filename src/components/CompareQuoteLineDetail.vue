<template>
    <div class="line-detail-container">
        <!-- Section 1: Full-width Header -->
        <div class="top-header">
            <!-- Zone GAUCHE (largeur fixe = zone « Confirmation Commandes Achat » de C2) :
                 retour + réf/désignation + indicateur de ligne → STOCKS démarre au même x qu'en C2. -->
            <div class="cmp-header-left">
            <Button icon="pi pi-arrow-left" text rounded @click="$emit('back')" class="back-btn" />

            <!-- 10% -->
            <div class="item-info">
                <div class="info-left">
                    <div class="ref-row">
                        <h1 class="item-no">
                            {{ formatReference(line.itemNo) }}
                        </h1>
                        <i v-if="isLoadingMasterData" class="pi pi-spin pi-spinner"
                            style="color: #3b82f6; font-size: 1.1rem;" title="Chargement en cours..."></i>
                        <i v-else class="pi pi-check-circle" style="color: #22c55e; font-size: 1.1rem;"
                            title="Chargement terminé"></i>
                        <!-- N° de ligne : badge fin sur la ligne de la réf (libère la 2e ligne pour la désignation) -->
                        <span class="line-badge" :title="`Ligne ${currentIndex + 1} / ${totalElements}`">
                            <i class="pi pi-bars"></i>{{ currentIndex + 1 }} / {{ totalElements }}
                        </span>
                    </div>
                    <div class="description-row">
                        <span class="item-desc">{{ line.structuredDescription || line.description || 'Description'
                            }}</span>
                    </div>
                </div>
            </div>

            </div><!-- /cmp-header-left -->

            <!-- STOCKS — reproduction EXACTE du composant STOCKS de C2 (mêmes classes c2-stk* + même CSS) -->
            <div class="c2-stockband">
                <span class="c2-stocklabel">STOCKS</span>
                <div v-for="stock in intercompanyStocks" :key="stock.companyId" class="c2-stkcol">
                    <div class="c2-stkpart">
                        <span class="c2-stkmini">STE</span>
                        <span class="c2-stkval company">{{ stock.company }}</span>
                    </div>
                    <div class="c2-stkpart click" :title="'Voir l\'historique — ' + stock.company"
                        @click="openHistory(stock.company, stock.companyId, stock.stock)">
                        <span class="c2-stkmini">Stock</span>
                        <span class="c2-stkval" :class="Number(stock.stock) > 0 ? 'pos' : 'neg'">{{ stock.stock }}</span>
                    </div>
                    <div class="c2-stkpart">
                        <span class="c2-stkmini">Dern. Achat</span>
                        <span class="c2-stkval date">{{ formatDate(stock.lastPurchaseDate) }}</span>
                    </div>
                </div>
            </div>

            <!-- Zone droite — composants/espacement/largeurs identiques à C2 (.c2-header-right) :
                 Total · OEM · Panier · bouton Vérification TecDoc (à la place du bouton Confirmer de C2). -->
            <div class="cmp-header-right">
                <!-- Total demande de prix — style C2 (.c2-total) : n° demande de prix au-dessus, montant + TND -->
                <div class="order-total">
                    <span class="doc-no">{{ selectedDocumentNo || '—' }}</span>
                    <b class="amount">{{ formatMoney(totalAmount) }} <em>TND</em></b>
                </div>

                <!-- Count OEM — style chip vert C2 (.c2-oem). Handler inchangé. -->
                <button class="oem-chip" :class="{ z: !oemCount, clickable: !isLoadingOemCount }"
                    @click="openOemCountDialog"
                    :title="isLoadingOemCount ? 'Calcul du count en cours...' : 'Voir les détails du count'">
                    <i class="pi" :class="isLoadingOemCount ? 'pi-spin pi-spinner' : 'pi-sitemap'"></i>
                    <span>OEM {{ isLoadingOemCount ? '…' : (oemCount !== null ? oemCount : (line.countItemManual || 0)) }}</span>
                </button>

                <!-- Panier — style chip C2 (.c2-cart) -->
                <button class="cart-btn" @click="openCartSidebar">
                    <div class="cart-icon-wrapper">
                        <i class="pi pi-shopping-cart"></i>
                        <span class="cart-badge">{{ store.cartCount }}</span>
                    </div>
                </button>

                <!-- Vérification TecDoc (TecAlliance) — à la place/dimension du bouton Confirmer C2, couleur orangée conservée -->
                <div class="status-dot-container">
                    <div class="status-badge-rect" :class="statusDotClass" @click="openVerificationDialog"
                        :title="`TecDoc: ${verificationStatus?.countNotCreated || 0} à créer`">
                        <i class="pi pi-check-circle"></i><span class="status-badge-text">TecDoc</span>
                    </div>
                    <span v-if="verificationStatus && verificationStatus.countNotCreated > 0"
                        class="status-dot-badge">{{ verificationStatus.countNotCreated }}</span>
                </div>
            </div>
        </div>



        <!-- Navigation Arrows -->
        <button class="nav-arrow left" @click="$emit('prev')" aria-label="Précédent">
            <i class="pi pi-chevron-left"></i>
        </button>
        <button class="nav-arrow right" @click="$emit('next')" aria-label="Suivant">
            <i class="pi pi-chevron-right"></i>
        </button>

        <!-- Body Section: 70/30 Split -->
        <div class="main-layout">
            <!-- Section 2: Tables (70% width) -->
            <div class="left-column">
                <!-- Frs Table -->
                <div class="table-container sec-frs">
                    <div class="table-header-row">
                        <span class="table-title">Fournisseurs</span>
                    </div>
                    <div class="table-wrapper">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Frs</th>
                                    <th :style="{ width: isSidebarExpanded ? '24%' : '16%' }">Réf / Desig
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '8%' : '5%' }">Stocks</th>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Appro</th>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Dernier Achat
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '11%' : '7%' }">Cout Directe
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '12%' : '8%' }">Prix Revient
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '12%' : '8%' }">Prix de Vente
                                    </th>
                                    <th style="width: 8%" v-if="!isSidebarExpanded">Nég Prix</th>
                                    <th style="width: 7%" v-if="!isSidebarExpanded">Nég Qte</th>
                                    <th style="width: 7%" v-if="!isSidebarExpanded">Qte à confirmer</th>
                                    <th style="width: 8%" v-if="!isSidebarExpanded">Raison</th>
                                    <th :style="{ width: isSidebarExpanded ? '5%' : '3%' }">Info</th>
                                    <th style="width: 2%" v-if="!isSidebarExpanded"></th>
                                    <th style="width: 3%" v-if="!isSidebarExpanded"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="isLoadingDetails">
                                    <td colspan="11" class="text-center p-4">Chargement...</td>
                                </tr>
                                <tr v-else-if="quoteLineDetails.length === 0">
                                    <td colspan="11" class="text-center p-4">Aucune donnée disponible</td>
                                </tr>
                                <tr v-else v-for="detail in quoteLineDetails" :key="detail.id"
                                    @click="selectLine(detail)"
                                    class="cursor-pointer transition-colors hover:bg-blue-50"
                                    :class="{ 'bg-blue-100': isItemSelected(detail) }">
                                    <td>
                                        <div class="cell-reference">{{ detail.buyFromVendorNo }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{ detail.no }}</div>
                                        <div class="cell-description">{{ detail.descriptionStructured }}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-reference" :class="getStyleClass(detail.styleInvNoImport)">{{
                                            detail.inventoryWithoutImport }}</div>
                                    </td>
                                    <td class="c2-appro">
                                        <span class="imp" :class="{ z: !detail.importInventory, clickable: detail.importInventory > 0 }"
                                            :title="`Qté Import : ${detail.importInventory ?? 0}`"
                                            @click.stop="openImportLines(detail.no, detail.buyFromVendorNo, detail.importInventory)">{{ detail.importInventory ?? 0 }}</span>
                                        <span class="cmd" :class="{ z: !detail.qtyOnPurchOrder, clickable: detail.qtyOnPurchOrder > 0 }"
                                            :title="`Qté Commandée : ${detail.qtyOnPurchOrder ?? 0}`"
                                            @click.stop="openPurchaseLinesDialog(detail.no, detail.qtyOnPurchOrder)">{{ detail.qtyOnPurchOrder ?? 0 }}</span>
                                    </td>
                                    <td>
                                        <div class="cell-reference" :class="{ 'derp-link': !!detail.no }"
                                            title="Voir l'historique Der P"
                                            @click.stop="openDerp(detail.no, detail.descriptionStructured)">
                                            {{
                                                formatNumber(getLastInvoicedData(detail.buyFromVendorNo,
                                                    detail.no)?.lastInvoicedDirectCost,
                                                    2) }}
                                            <span
                                                v-if="getLastInvoicedData(detail.buyFromVendorNo, detail.no)?.quantity"
                                                class="qty-badge">
                                                {{
                                                    Math.round(getLastInvoicedData(detail.buyFromVendorNo,
                                                        detail.no)?.quantity)
                                                }}
                                            </span>
                                        </div>
                                        <div class="cell-description">
                                            {{
                                                formatDate(getLastInvoicedData(detail.buyFromVendorNo,
                                                    detail.no)?.lastInvoicedCostDate)
                                            }}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-reference clickable-cell"
                                            @click.stop="openPurchasePriceDialog(detail.buyFromVendorNo, detail.no, detail.descriptionStructured, true)"
                                            title="Voir l'historique des prix">
                                            {{ formatNumber(detail.directUnitCost, 2) }}
                                            <i :class="detail.preferential ? 'pi pi-check-circle preferential-icon active' : 'pi pi-times-circle preferential-icon inactive'"
                                                :title="detail.preferential ? 'Fournisseur préférentiel' : 'Non préférentiel'"></i>
                                        </div>
                                        <div class="cell-description">
                                            <span
                                                v-if="calculatePercentageChange(detail.directUnitCost, getSecondLastPurchasePrice(detail.buyFromVendorNo, detail.no))"
                                                :class="getPercentageClass(calculatePercentageChange(detail.directUnitCost, getSecondLastPurchasePrice(detail.buyFromVendorNo, detail.no)))"
                                                class="percentage-indicator">
                                                {{ calculatePercentageChange(detail.directUnitCost,
                                                    getSecondLastPurchasePrice(detail.buyFromVendorNo, detail.no)) }}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{
                                            formatNumber(detail.prixDeRevientCalcule, 3) }}
                                        </div>
                                        <div class="cell-description">
                                            {{ formatNumber(detail.lastDirectUnitCostCalculated, 3) }}
                                            <span
                                                v-if="getPercentageChange(detail, 'prixDeRevientCalcule', 'lastDirectUnitCostCalculated')"
                                                :class="getPercentageClass(getPercentageChange(detail, 'prixDeRevientCalcule', 'lastDirectUnitCostCalculated'))"
                                                class="percentage-indicator">
                                                {{ getPercentageChange(detail, 'prixDeRevientCalcule',
                                                    'lastDirectUnitCostCalculated') }}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{
                                            formatNumber(detail.calcAncienPrixDeVente, 3) }}
                                        </div>
                                        <div class="cell-description">
                                            {{ formatNumber(detail.unitPriceLCY, 3) }}
                                            <span
                                                v-if="getPercentageChange(detail, 'calcAncienPrixDeVente', 'unitPriceLCY')"
                                                :class="getPercentageClass(getPercentageChange(detail, 'calcAncienPrixDeVente', 'unitPriceLCY'))"
                                                class="percentage-indicator">
                                                {{ getPercentageChange(detail,
                                                    'calcAncienPrixDeVente', 'unitPriceLCY') }}
                                            </span>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="qty-input-wrapper mini">
                                            <span class="initial-tag" title="Prix Initial">{{
                                                formatNumber(detail.initialVendorPrice, 2) }}</span>
                                            <input type="number" v-model.number="detail.askingPrice"
                                                :id="`askingPrice-${detail.id}`" class="qty-input mini"
                                                placeholder="Prix Nég" @change="updateLine(detail, false)"
                                                @keydown.tab.prevent="focusNextField('askingPrice', detail.id)" />
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="qty-input-wrapper mini">
                                            <span class="initial-tag" title="Quantité Initiale">{{
                                                detail.initialQuantity }}</span>
                                            <input type="number" v-model.number="detail.askingQty"
                                                :id="`askingQty-${detail.id}`" class="qty-input mini"
                                                placeholder="Qte Nég" @change="updateLine(detail, false)"
                                                @keydown.tab.prevent="focusNextField('askingQty', detail.id)" />
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="qty-input-wrapper">
                                            <input type="number" v-model.number="detail.quantity" class="qty-input"
                                                :id="`quantity-${detail.id}`" min="0" @change="updateLine(detail, true)"
                                                @keydown.tab.prevent="focusNextField('quantity', detail.id)" />
                                            <i v-if="detail.treated" class="pi pi-check-circle"
                                                style="color: #22c55e; margin-left: 8px; font-size: 1.1rem;"
                                                title="Ligne traitée"></i>
                                            <i v-else class="pi pi-exclamation-circle"
                                                style="color: #f97316; margin-left: 8px; font-size: 1.1rem;"
                                                title="Non traité"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="reason-select-container">
                                            <select v-model="detail.quoteLineReason" class="reason-select"
                                                @change="updateLine(detail, false)">
                                                <option value=""></option>
                                                <option v-for="reason in orderReasons" :key="reason.value"
                                                    :value="reason.value">
                                                    {{ reason.label }}
                                                </option>
                                            </select>
                                            <button v-if="detail.quoteLineReason" class="clear-reason-btn"
                                                @click="detail.quoteLineReason = ''" title="Effacer">
                                                <i class="pi pi-times"></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="flex justify-center items-center gap-4 h-full">
                                            <i class="pi pi-info-circle info-icon cursor-pointer"
                                                @click.stop="openInfoDialog(detail)"></i>
                                            <i v-if="!detail.isVerifying" class="pi pi-check-circle cursor-pointer text-indigo-500 hover:text-indigo-700" style="font-size: 1.1rem;"
                                                @click.stop="markAsToVerify(detail)" title="A vérifier"></i>
                                            <i v-else class="pi pi-spin pi-spinner text-indigo-500" style="font-size: 1.1rem;"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="flex justify-center items-center h-full">
                                            <i class="pi comment-icon cursor-pointer"
                                                :class="[(detail.quoteLineComment || detail.QuoteLineComment) ? 'pi-comments has-comment' : 'pi-comment']"
                                                @click.stop="toggleCommentOverlay($event, detail)"
                                                :title="(detail.quoteLineComment || detail.QuoteLineComment) ? 'Modifier commentaire' : 'Ajouter un commentaire'"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="flex justify-center items-center h-full">
                                            <button class="validate-line-btn" title="Valider la ligne"
                                                :id="`validateBtn-${detail.id}`" @click="updateLine(detail, true)">
                                                <i class="pi"
                                                    :class="detail.isUpdating ? 'pi-spin pi-spinner' : 'pi-check'"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="table-footer">
                        <div class="pagination-info" v-if="quoteLineDetails.length > 0">
                            1-{{ quoteLineDetails.length }} sur {{ quoteLineDetails.length }}
                        </div>
                        <div class="pagination-info" v-else>
                            Aucune ligne
                        </div>
                        <div class="pagination-controls">
                            <button class="p-btn" disabled><i class="pi pi-angle-double-left"></i></button>
                            <button class="p-btn" disabled><i class="pi pi-angle-left"></i></button>
                            <span class="p-current">1</span>
                            <button class="p-btn" disabled><i class="pi pi-angle-right"></i></button>
                            <button class="p-btn" disabled><i class="pi pi-angle-double-right"></i></button>
                        </div>
                    </div>
                </div>

                <!-- Equivalence Table -->
                <div class="table-container sec-eqv">
                    <div class="table-header-row">
                        <span class="table-title">Equivalence</span>
                        <span class="c2-count">{{ eqvCount }}</span>
                        <span class="c2-sum cmd" title="Total Commande (lignes chargées)">CMD {{ fmtSum(eqvTotalCmd) }}</span>
                        <span class="c2-sum imp" title="Total Import (lignes chargées)">IMP {{ fmtSum(eqvTotalImp) }}</span>
                    </div>
                    <div class="table-wrapper" @scroll="onEquivalenceScroll" ref="equivalenceTableWrapper">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Frs</th>
                                    <th :style="{ width: isSidebarExpanded ? '24%' : '16%' }">Réf / Desig
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '8%' : '5%' }">Stocks</th>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Appro</th>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Dernier Achat
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '11%' : '7%' }">Prix Devise
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '12%' : '8%' }">Cout Calculé /
                                        Date</th>
                                    <th :style="{ width: isSidebarExpanded ? '12%' : '8%' }">Prix de vente
                                    </th>
                                    <th style="width: 8%" v-if="!isSidebarExpanded">Achat</th>
                                    <th style="width: 7%" v-if="!isSidebarExpanded">Vente</th>
                                    <th style="width: 7%" v-if="!isSidebarExpanded">Panier à Cmd</th>
                                    <th style="width: 8%" v-if="!isSidebarExpanded">Raison</th>
                                    <th :style="{ width: isSidebarExpanded ? '5%' : '3%' }">Info</th>
                                    <th style="width: 2%" v-if="!isSidebarExpanded"></th>
                                    <th style="width: 3%" v-if="!isSidebarExpanded"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="isLoadingEquivalence && equivalenceItems.length === 0">
                                    <td colspan="14" class="text-center p-4">Chargement...</td>
                                </tr>
                                <tr v-else-if="equivalenceItems.length === 0">
                                    <td colspan="14" class="text-center p-4">Aucune donnée disponible</td>
                                </tr>
                                <tr v-else v-for="item in equivalenceItems" :key="item.id"
                                    @click="selectEquivalenceItem(item)"
                                    class="cursor-pointer transition-colors hover:bg-blue-50"
                                    :class="{ 'bg-blue-100': isItemSelected(item) }">
                                    <td>
                                        <div class="cell-reference">{{ item.vendorNo }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">
                                            {{ formatReference(item.no) }}
                                        </div>
                                        <div class="cell-description">{{ item.descriptionStructured }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference" :class="getStyleClass(item.styleQty)">{{
                                            item.qtyStock }}</div>
                                    </td>
                                    <td class="c2-appro">
                                        <span class="imp" :class="{ z: !item.qtyImport, clickable: item.qtyImport > 0 }"
                                            :title="`Qté Import : ${item.qtyImport ?? 0}`"
                                            @click.stop="openImportLines(item.no, item.vendorNo, item.qtyImport)">{{ item.qtyImport ?? 0 }}</span>
                                        <span class="cmd" :class="{ z: !item.qtyOnPurchOrder, clickable: item.qtyOnPurchOrder > 0 }"
                                            :title="`Qté Commandée : ${item.qtyOnPurchOrder ?? 0}`"
                                            @click.stop="openPurchaseLinesDialog(item.no, item.qtyOnPurchOrder)">{{ item.qtyOnPurchOrder ?? 0 }}</span>
                                    </td>
                                    <td>
                                        <div class="cell-reference" :class="[getStyleClass(item.styleDate), { 'derp-link': !!item.no }]"
                                            title="Voir l'historique Der P"
                                            @click.stop="openDerp(item.no, item.descriptionStructured)">
                                            {{ formatNumber(item.lastInvoicedDirectCost, 2) }}
                                            <span v-if="item.quantity" class="qty-badge">
                                                {{ Math.round(item.quantity) }}
                                            </span>
                                        </div>
                                        <div class="cell-description">
                                            {{ formatDate(item.lastInvoicedCostDate) }}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-reference clickable-cell"
                                            @click.stop="openPurchasePriceDialog(item.vendorNo, item.no, item.descriptionStructured, false)"
                                            title="Voir l'historique des prix">
                                            {{ formatNumber(item.lastCurrPrice, 2) }}
                                            <i :class="item.LastPreferential ? 'pi pi-check-circle preferential-icon active' : 'pi pi-times-circle preferential-icon inactive'"
                                                :title="item.LastPreferential ? 'Fournisseur préférentiel' : 'Non préférentiel'"></i>
                                        </div>
                                        <div class="cell-description">{{ formatDate(item.lastDate) }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{ formatNumber(item.lastPurshCostDS, 3)
                                        }}</div>
                                        <div class="cell-description">{{ formatDate(item.lastPurshDate) }}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{ formatNumber(item.unitPrice, 3) }}
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="cell-reference"
                                            :class="{ 'status-favorable': (item.acheteCurrYear || 0) > 0 }">{{
                                                item.acheteCurrYear || 0 }}</div>
                                        <div class="cell-description"
                                            :class="{ 'status-favorable': (item.totalAchete || 0) > 0 }">{{
                                                item.totalAchete || 0 }}</div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="cell-reference"
                                            :class="{ 'status-favorable': (item.venduCurrYear || 0) > 0 }">{{
                                                item.venduCurrYear || 0 }}</div>
                                        <div class="cell-description"
                                            :class="{ 'status-favorable': (item.totalVendu || 0) > 0 }">{{
                                                item.totalVendu || 0 }}</div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="qty-input-wrapper">
                                            <input type="number" v-model.number="item.quantityToOrder" class="qty-input"
                                                min="0" />
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="reason-select-container">
                                            <select v-model="item.orderReason" class="reason-select">
                                                <option value=""></option>
                                                <option v-for="reason in orderReasons" :key="reason.value"
                                                    :value="reason.value">
                                                    {{ reason.label }}
                                                </option>
                                            </select>
                                            <button v-if="item.orderReason" class="clear-reason-btn"
                                                @click="item.orderReason = ''" title="Effacer">
                                                <i class="pi pi-times"></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="flex justify-center items-center gap-4 h-full">
                                            <i class="pi pi-info-circle info-icon cursor-pointer"
                                                @click.stop="openInfoDialog(item)"></i>
                                            <i v-if="!item.isVerifying" class="pi pi-check-circle cursor-pointer text-indigo-500 hover:text-indigo-700" style="font-size: 1.1rem;"
                                                @click.stop="markAsToVerify(item)" title="A vérifier"></i>
                                            <i v-else class="pi pi-spin pi-spinner text-indigo-500" style="font-size: 1.1rem;"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="flex justify-center items-center h-full">
                                            <i class="pi pi-comment comment-icon cursor-pointer"
                                                :class="{ 'has-comment': item.comment || item.commentPurchaseCart, 'text-orange-500': item.commentPurchaseCart }"
                                                @click.stop="toggleCommentOverlay($event, item)"
                                                title="Ajouter un commentaire"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="flex justify-center items-center h-full">
                                            <button v-if="item.existPurchaseCart" class="validate-line-btn in-cart"
                                                title="Voir dans le panier" @click.stop="openCartForItem(item)">
                                                <i class="pi pi-shopping-cart"></i>
                                            </button>
                                            <button v-else class="validate-line-btn" title="Valider la ligne"
                                                @click.stop="addToCart(item)">
                                                <i class="pi pi-check"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="loading-indicator" v-if="isLoadingEquivalence && equivalenceItems.length > 0">
                        <i class="pi pi-spin pi-spinner"></i> Chargement...
                    </div>
                </div>

                <!-- Kit Table -->
                <div class="table-container sec-kit">
                    <div class="table-header-row">
                        <span class="table-title">Kit</span>
                        <span class="c2-count">{{ kitCount }}</span>
                        <span class="c2-sum cmd" title="Total Commande (lignes chargées)">CMD {{ fmtSum(kitTotalCmd) }}</span>
                        <span class="c2-sum imp" title="Total Import (lignes chargées)">IMP {{ fmtSum(kitTotalImp) }}</span>
                    </div>
                    <div class="table-wrapper">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Frs</th>
                                    <th :style="{ width: isSidebarExpanded ? '24%' : '16%' }">Réf / Desig
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '8%' : '5%' }">Stocks</th>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Appro</th>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Dernier Achat
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '11%' : '7%' }">Prix Devise
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '12%' : '8%' }">Cout Calculé /
                                        Date</th>
                                    <th :style="{ width: isSidebarExpanded ? '12%' : '8%' }">Prix de vente
                                    </th>
                                    <th style="width: 8%" v-if="!isSidebarExpanded">Achat</th>
                                    <th style="width: 7%" v-if="!isSidebarExpanded">Vente</th>
                                    <th style="width: 7%" v-if="!isSidebarExpanded">Panier à Cmd</th>
                                    <th style="width: 8%" v-if="!isSidebarExpanded">Raison</th>
                                    <th :style="{ width: isSidebarExpanded ? '5%' : '3%' }">Info</th>
                                    <th style="width: 2%" v-if="!isSidebarExpanded"></th>
                                    <th style="width: 3%" v-if="!isSidebarExpanded"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="isLoadingKit">
                                    <td colspan="15" class="text-center p-4">Chargement...</td>
                                </tr>
                                <tr v-else-if="kitItems.length === 0">
                                    <td colspan="15" class="text-center p-4">Aucune donnée disponible</td>
                                </tr>
                                <tr v-else v-for="item in kitItems" :key="item.no" @click="selectKitItem(item)"
                                    class="cursor-pointer transition-colors hover:bg-blue-50"
                                    :class="{ 'bg-blue-100': isItemSelected(item) }">
                                    <td>
                                        <div class="cell-reference">{{ item.vendorNo }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">
                                            {{ formatReference(item.no) }}
                                        </div>
                                        <div class="cell-description">{{ item.descriptionStructured }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{ item.qtyStock || 0 }}</div>
                                    </td>
                                    <td class="c2-appro">
                                        <span class="imp" :class="{ z: !(item.qtyImport || 0), clickable: (item.qtyImport || 0) > 0 }"
                                            :title="`Qté Import : ${item.qtyImport || 0}`"
                                            @click.stop="openImportLines(item.no, item.vendorNo, item.qtyImport || 0)">{{ item.qtyImport || 0 }}</span>
                                        <span class="cmd" :class="{ z: !(item.qtyOnPurchOrder || 0), clickable: (item.qtyOnPurchOrder || 0) > 0 }"
                                            :title="`Qté Commandée : ${item.qtyOnPurchOrder || 0}`"
                                            @click.stop="openPurchaseLinesDialog(item.no, item.qtyOnPurchOrder || 0)">{{ item.qtyOnPurchOrder || 0 }}</span>
                                    </td>
                                    <td>
                                        <div class="cell-reference" :class="{ 'derp-link': !!item.no }"
                                            title="Voir l'historique Der P"
                                            @click.stop="openDerp(item.no, item.descriptionStructured)">
                                            {{ formatNumber(item.lastInvoicedDirectCost, 2) }}
                                            <span v-if="item.quantity" class="qty-badge">
                                                {{ Math.round(item.quantity) }}
                                            </span>
                                        </div>
                                        <div class="cell-description">
                                            {{ formatDate(item.lastInvoicedCostDate) }}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-reference clickable-cell"
                                            @click.stop="openPurchasePriceDialog(item.vendorNo, item.no, item.descriptionStructured, false)"
                                            title="Voir l'historique des prix">
                                            {{ formatNumber(item.lastCurrPrice ||
                                                item.lastInvoicedDirectCost, 2) }}
                                        </div>
                                        <div class="cell-description">{{ formatDate(item.lastDate) }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{ formatNumber(item.lastPurshCostDS ||
                                            item.lastInvoicedDirectCost, 3) }}
                                        </div>
                                        <div class="cell-description">{{ formatDate(item.lastPurshDate) }}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{ formatNumber(item.unitPrice, 3) }}
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="cell-reference"
                                            :class="{ 'text-green-600': (item.acheteCurrYear || 0) > 0 }">{{
                                                item.acheteCurrYear || 0 }}</div>
                                        <div class="cell-description"
                                            :class="{ 'text-green-600': (item.totalAchete || 0) > 0 }">{{
                                                item.totalAchete || 0 }}</div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="cell-reference"
                                            :class="{ 'text-green-600': (item.venduCurrYear || 0) > 0 }">{{
                                                item.venduCurrYear || 0 }}</div>
                                        <div class="cell-description"
                                            :class="{ 'text-green-600': (item.totalVendu || 0) > 0 }">{{ item.totalVendu
                                                || 0 }}</div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="qty-input-wrapper">
                                            <input type="number" v-model.number="item.quantityToOrder" class="qty-input"
                                                min="0" />
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="reason-select-container">
                                            <select v-model="item.orderReason" class="reason-select">
                                                <option value=""></option>
                                                <option v-for="reason in orderReasons" :key="reason.value"
                                                    :value="reason.value">
                                                    {{ reason.label }}
                                                </option>
                                            </select>
                                            <button v-if="item.orderReason" class="clear-reason-btn"
                                                @click="item.orderReason = ''" title="Effacer">
                                                <i class="pi pi-times"></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="flex justify-center items-center gap-4 h-full">
                                            <i class="pi pi-info-circle info-icon cursor-pointer"
                                                @click.stop="openInfoDialog(item)"></i>
                                            <i v-if="!item.isVerifying" class="pi pi-check-circle cursor-pointer text-indigo-500 hover:text-indigo-700" style="font-size: 1.1rem;"
                                                @click.stop="markAsToVerify(item)" title="A vérifier"></i>
                                            <i v-else class="pi pi-spin pi-spinner text-indigo-500" style="font-size: 1.1rem;"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="flex justify-center items-center h-full">
                                            <i class="pi pi-comment comment-icon cursor-pointer"
                                                :class="{ 'has-comment': item.comment || item.commentPurchaseCart, 'text-orange-500': item.commentPurchaseCart }"
                                                @click.stop="toggleCommentOverlay($event, item)"
                                                title="Ajouter un commentaire"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="flex justify-center items-center h-full">
                                            <button v-if="item.existPurchaseCart" class="validate-line-btn in-cart"
                                                title="Voir dans le panier" @click.stop="openCartForItem(item)">
                                                <i class="pi pi-shopping-cart"></i>
                                            </button>
                                            <button v-else class="validate-line-btn" title="Valider la ligne"
                                                @click.stop="addToCart(item)">
                                                <i class="pi pi-check"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Section 3 : Sidebar Historique / Panier — IDENTIQUE C2 (3 états : collapsed / normal / expanded) -->
            <aside class="right-column c2-side"
                :class="{ collapsed: histState === 'collapsed', expanded: histState === 'expanded' }">
                <template v-if="histState !== 'collapsed'">
                    <!-- ═══ PANIER ═══ -->
                    <template v-if="activeRightPanel === 'cart'">
                        <div class="c2-side-head">
                            <button class="c2-collapse grow" @click="widenHist" :disabled="histState === 'expanded'"
                                title="Agrandir le panier"><i class="pi pi-angle-double-left"></i></button>
                            <span class="c2-side-title"><i class="pi pi-shopping-cart"></i> Panier</span>
                            <div class="c2-side-headright">
                                <span class="c2-carttabs">
                                    <button :class="{ on: activeCartTab === 'current' }"
                                        @click="switchCartTab('current')">Ce comparateur</button>
                                    <button :class="{ on: activeCartTab === 'all' }"
                                        @click="switchCartTab('all')">Tous</button>
                                </span>
                                <button class="c2-collapse" @click="narrowHist"
                                    :title="histState === 'expanded' ? 'Revenir normal' : 'Réduire le panier'"><i
                                        class="pi pi-angle-double-right"></i></button>
                                <button class="c2-collapse" @click="activeRightPanel = 'history'"
                                    title="Retour à l'historique"><i class="pi pi-times"></i></button>
                            </div>
                        </div>
                        <div class="c2-cart-filters">
                            <input class="c2-cf-input" v-model="cartFilters.vendorNo" placeholder="Frs"
                                @input="debouncedFilter" />
                            <input class="c2-cf-input c2-cf-grow" v-model="cartFilters.itemNo" placeholder="Référence"
                                @input="debouncedFilter" />
                            <input v-if="activeCartTab === 'all'" class="c2-cf-input" v-model="cartFilters.compareQuoteNo"
                                placeholder="Comparateur" @input="debouncedFilter" />
                            <select class="c2-cf-input c2-cf-status" v-model="cartFilters.status"
                                @change="applyFilters()">
                                <option :value="null">Statut</option>
                                <option value="New">New</option>
                                <option value="Verified">Verified</option>
                                <option value="All">Tous</option>
                            </select>
                            <button class="c2-cf-clear" @click="clearCartFilters" title="Effacer les filtres"><i
                                    class="pi pi-times"></i></button>
                        </div>
                        <div class="c2-hist">
                            <table class="c2-table c2-histtable">
                                <thead>
                                    <tr>
                                        <th class="left" :style="{ width: isSidebarExpanded ? '9%' : '15%' }">Frs</th>
                                        <template v-if="isSidebarExpanded">
                                            <th class="left" style="width:12%">Réf</th>
                                            <th class="left" style="width:21%">Désignation</th>
                                        </template>
                                        <th v-else class="left" style="width:35%">Réf / Désignation</th>
                                        <th class="num" :style="{ width: isSidebarExpanded ? '6%' : '11%' }">Qté</th>
                                        <th class="num" :style="{ width: isSidebarExpanded ? '10%' : '14%' }">Coût</th>
                                        <th :style="{ width: isSidebarExpanded ? '11%' : '13%' }">Statut</th>
                                        <template v-if="isSidebarExpanded">
                                            <th class="left" style="width:11%">Comparateur</th>
                                            <th class="left" style="width:11%">Commentaire</th>
                                        </template>
                                        <th class="c2-actcol" :style="{ width: isSidebarExpanded ? '9%' : '12%' }">
                                            Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="c in store.cartItems" :key="c.lineNo">
                                        <td class="left"><span class="c2-frs-code">{{ c.buyFromVendorNo || '—' }}</span>
                                        </td>
                                        <template v-if="isSidebarExpanded">
                                            <td class="left"><b class="c2-frs-code">{{ c.itemNo }}</b></td>
                                            <td class="left c2-ref" :title="c.description"><span>{{ c.description
                                                    }}</span></td>
                                        </template>
                                        <td v-else class="left c2-ref" :title="c.description"><b>{{ c.itemNo }}</b><span>{{
                                                c.description }}</span></td>
                                        <td class="num mono">{{ c.quantity }}</td>
                                        <td class="num mono">{{ formatNumber(c.directUnitCost, 2) }}</td>
                                        <td><span class="c2-cart-status" :class="'st-' + (c.status || '').toLowerCase()">{{
                                                c.status }}</span></td>
                                        <template v-if="isSidebarExpanded">
                                            <td class="left mono muted" :title="c.compareQuoteNo">{{ c.compareQuoteNo ||
                                                '—' }}</td>
                                            <td class="left muted" :title="c.comment">{{ c.comment || '—' }}</td>
                                        </template>
                                        <td class="c2-acts">
                                            <template v-if="cartBusyLineNo === c.lineNo"><i
                                                    class="pi pi-spin pi-spinner"></i></template>
                                            <template v-else>
                                                <i v-if="c.status !== 'Verified'" class="pi pi-check ok" title="Vérifier"
                                                    @click.stop="updateCartStatus(c.lineNo, 'Verified')"></i>
                                                <i class="pi pi-trash" title="Retirer du panier"
                                                    @click.stop="updateCartStatus(c.lineNo, 'Cancelled')"></i>
                                            </template>
                                        </td>
                                    </tr>
                                    <tr v-if="store.isLoading && !store.cartItems.length">
                                        <td :colspan="isSidebarExpanded ? 9 : 6" class="c2-empty"><i
                                                class="pi pi-spin pi-spinner"></i> Chargement du panier…</td>
                                    </tr>
                                    <tr v-else-if="!store.cartItems.length">
                                        <td :colspan="isSidebarExpanded ? 9 : 6" class="c2-empty"><i
                                                class="pi pi-inbox"></i> Votre panier est vide</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="c2-cart-footer" v-if="store.cartPagination.totalPages > 1">
                            <button class="c2-pager-btn" :disabled="store.cartPagination.page === 0"
                                @click="applyFilters(store.cartPagination.page - 1)"><i
                                    class="pi pi-chevron-left"></i></button>
                            <span>{{ store.cartPagination.page + 1 }} / {{ store.cartPagination.totalPages }}</span>
                            <button class="c2-pager-btn"
                                :disabled="store.cartPagination.page >= store.cartPagination.totalPages - 1"
                                @click="applyFilters(store.cartPagination.page + 1)"><i
                                    class="pi pi-chevron-right"></i></button>
                        </div>
                    </template>
                    <!-- ═══ HISTORIQUE ═══ -->
                    <template v-else>
                        <div class="c2-side-head">
                            <button class="c2-collapse grow" @click="widenHist" :disabled="histState === 'expanded'"
                                title="Agrandir l'historique"><i class="pi pi-angle-double-left"></i></button>
                            <span class="c2-side-title"><i class="pi pi-history"></i> Historique</span>
                            <div class="c2-side-headright">
                                <span class="c2-year"><i class="pi pi-chevron-left" @click="changeYear(-1)"></i>{{
                                        selectedYear }}<i class="pi pi-chevron-right" @click="changeYear(1)"></i></span>
                                <button class="c2-collapse" @click="narrowHist"
                                    :title="histState === 'expanded' ? 'Revenir normal' : 'Réduire l\'historique'"><i
                                        class="pi pi-angle-double-right"></i></button>
                            </div>
                        </div>
                        <div class="c2-side-ref">
                            <b>{{ formatReference(selectedHistoryItem?.no || selectedHistoryItem?.itemNo) ||
                                formatReference(line.itemNo) || '—' }}</b>
                            <span>{{ selectedHistoryItem?.descriptionStructured ||
                                selectedHistoryItem?.structuredDescription || selectedHistoryItem?.description ||
                                line.structuredDescription || line.description || '' }}</span>
                        </div>
                        <div class="c2-side-kpis">
                            <span class="kpi"><i>Stock</i><b>{{ historyKpis.stock }}</b></span>
                            <span class="kpi"><i>Achat</i><b class="pos">{{ historyKpis.achat }}</b></span>
                            <span class="kpi"><i>Vente</i><b class="pos">{{ Math.abs(historyKpis.vente) }}</b></span>
                            <span class="kpi"><i>Rupt</i><b class="neg">{{ historyKpis.rupt }}</b></span>
                        </div>
                        <div class="c2-hist" ref="historyTableWrapper" @scroll="onHistoryScroll">
                            <table class="c2-table c2-histtable">
                                <thead>
                                    <tr>
                                        <th :style="{ width: isSidebarExpanded ? '12%' : '20%' }">Date</th>
                                        <th :style="{ width: isSidebarExpanded ? '5%' : '8%' }">T</th>
                                        <template v-if="isSidebarExpanded">
                                            <th class="left" style="width:11%">Type Doc</th>
                                            <th class="left" style="width:13%">N° Doc</th>
                                        </template>
                                        <th class="left" :style="{ width: isSidebarExpanded ? '11%' : '18%' }">Client /
                                            Frs</th>
                                        <th class="left" :style="{ width: isSidebarExpanded ? '19%' : '29%' }">Nom</th>
                                        <th class="num" :style="{ width: isSidebarExpanded ? '7%' : '11%' }">Qté</th>
                                        <th v-if="isSidebarExpanded" class="left" style="width:9%">Magasin</th>
                                        <th class="num" :style="{ width: isSidebarExpanded ? '13%' : '14%' }">PU</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(entry, index) in historyEntries" :key="index">
                                        <td class="mono">{{ formatDate(entry.postingDate) }}</td>
                                        <td><span class="c2-typ" :class="getEntryTypeClass(entry.entryType)"
                                                :title="entry.entryType">{{ getEntryTypeLetter(entry.entryType)
                                                }}</span></td>
                                        <template v-if="isSidebarExpanded">
                                            <td class="left muted" :title="entry.documentType">{{ entry.documentType ||
                                                '—' }}</td>
                                            <td class="left mono muted" :title="entry.documentNo">{{ entry.documentNo ||
                                                '—' }}</td>
                                        </template>
                                        <td class="left mono" :title="entry.sourceNo">{{ entry.sourceNo || '—' }}</td>
                                        <td class="left" :title="entry.sourceName">{{ entry.sourceName || '—' }}</td>
                                        <td class="num mono" :class="{ neg: Number(entry.quantity) < 0 }">{{
                                            entry.quantity }}</td>
                                        <td v-if="isSidebarExpanded" class="left muted" :title="entry.locationCode">{{
                                            entry.locationCode || '—' }}</td>
                                        <td class="num mono">{{ formatNumber(calculatePU(entry), 2) }}</td>
                                    </tr>
                                    <tr v-if="isLoadingHistory && !historyEntries.length">
                                        <td :colspan="isSidebarExpanded ? 9 : 6" class="c2-empty"><i
                                                class="pi pi-spin pi-spinner"></i> Chargement de l'historique…</td>
                                    </tr>
                                    <tr v-else-if="!historyEntries.length">
                                        <td :colspan="isSidebarExpanded ? 9 : 6" class="c2-empty"><i
                                                class="pi pi-inbox"></i> Aucun mouvement</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>
                </template>
                <!-- Rail collapsed — reflète le mode courant (Panier compteur / Historique) -->
                <div v-else class="c2-rail" @click="widenHist"
                    :title="activeRightPanel === 'cart' ? 'Afficher le panier' : 'Afficher l\'historique'">
                    <button class="c2-collapse" @click.stop="widenHist"><i class="pi pi-angle-double-left"></i></button>
                    <i class="c2-rail-icon"
                        :class="activeRightPanel === 'cart' ? 'pi pi-shopping-cart' : 'pi pi-history'"></i>
                    <span class="c2-rail-label">{{ activeRightPanel === 'cart' ? 'PANIER' : 'HISTORIQUE' }}</span>
                    <span v-if="activeRightPanel === 'cart'" class="c2-rail-count">{{ store.cartCount }}</span>
                </div>
            </aside>
        </div>

        <!-- ════════ FOOTER PAGE — shell standard 48px (identique aux autres pages C2) ════════ -->
        <footer class="cmp-footer">
            <span class="cmp-footer-label">Détail Comparateur</span>
            <span class="cmp-footer-meta"><b>{{ line.compareQuoteNo || '—' }}</b><em
                    v-if="line.itemNo || line.structuredDescription || line.description">{{ formatReference(line.itemNo)
                    }}<template v-if="line.structuredDescription || line.description"> • {{ line.structuredDescription ||
                    line.description }}</template></em></span>
        </footer>

        <!-- Comment Overlay -->
        <Popover ref="commentOverlay" class="comment-overlay" :showCloseIcon="false" :dismissable="true">
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-title">Commentaire</span>
                    <div class="header-actions">
                        <Button icon="pi pi-check" text rounded severity="success" @click="saveComment"
                            tooltip="Enregistrer" />
                        <Button icon="pi pi-times" text rounded severity="secondary"
                            @click="$refs.commentOverlay.hide()" tooltip="Fermer" />
                    </div>
                </div>
                <textarea v-model="commentText" rows="3" class="comment-textarea" placeholder="Saisir un commentaire..."
                    maxlength="250"></textarea>
                <div class="text-xs text-right text-gray-400 mt-1">
                    {{ commentText.length }}/250
                </div>
            </div>
        </Popover>

        <!-- Article Info Dialog — composant PARTAGÉ (réf. visuelle = B2B / Confirmation Achat C2) -->
        <TecDocArticleInfoDialog
            v-model:visible="showInfoDialog"
            :item="selectedInfoItem"
            :loading="selectedInfoItem?.isLoading"
            :is-master="selectedInfoItem ? isProductItem(selectedInfoItem) : false"
            :bc-picture-url="bcPicture.url"
            :bc-picture-loading="bcPicture.loading"
            @load-vehicle-models="fetchVehiclesForBrand"
        />

        <!-- Stock History Dialog — composant PARTAGÉ (réf. visuelle = Confirmation Achat C2) -->
        <ArticleStockHistoryDialog
            v-model:visible="showHistoryDialog"
            :company="selectedCompany"
            :reference="selectedHistoryItem?.no || selectedHistoryItem?.itemNo || ''"
            :description="selectedHistoryItem?.descriptionStructured || selectedHistoryItem?.structuredDescription || selectedHistoryItem?.description || ''"
            :year="dialogSelectedYear"
            :kpis="dialogHistoryKpis"
            :entries="dialogHistoryEntries"
            :loading="isLoadingDialogHistory"
            @change-year="changeDialogYear"
            @scroll="onDialogHistoryScroll"
        />

        <!-- Purchase Price History Dialog — composant PARTAGÉ (réf. visuelle = Confirmation Achat C2) -->
        <ArticlePurchasePriceHistoryDialog
            v-model:visible="showPurchasePriceDialog"
            :item-no="selectedPurchasePriceItem?.itemNo || ''"
            :description="selectedPurchasePriceItem?.description || ''"
            :prices="purchasePrices"
            :loading="isLoadingPurchasePrices"
            :vendor-filter="purchasePriceVendorFilter"
            :filter-locked="isPurchasePriceFilterDisabled"
            @update:vendor-filter="purchasePriceVendorFilter = $event"
        />

        <!-- TecDoc Verification Dialog — dialog LOCAL (pas d'équivalent partagé) harmonisé charte C2 -->
        <Dialog v-model:visible="showVerificationDialog" modal :style="{ width: 'min(1100px, 96vw)' }" class="history-dialog c2-verif-dialog"
            :showHeader="false" dismissableMask>
            <div class="dialog-content-wrapper c2-verif">
                <div class="sidebar-header dialog-header c2-verif-head">
                    <div class="header-actions">
                        <button class="history-btn c2-verif-title">Vérification TecDoc</button>
                        <div class="item-title-inline c2-verif-sub" v-if="line">
                            {{ masterItemNo }} • {{ line.structuredDescription || line.description }}
                        </div>
                        <!-- Filtre fabricant : PrimeVue Select (liste déroulante charte C2 commune) -->
                        <Select v-model="verificationManufacturerFilter" :options="manufacturerOptions"
                            optionLabel="label" optionValue="value" placeholder="Tous les fabricants"
                            class="c2-verif-filter" panelClass="c2-dropdown-panel" title="Filtrer par fabricant" />
                        <Button icon="pi pi-times" text rounded @click="showVerificationDialog = false"
                            class="close-dialog-btn c2-verif-close" />
                    </div>
                </div>

                <div class="stats-bar dialog-stats-bar">
                    <div class="stats-column">Total : {{ verificationStatus?.totalTecDocItems || 0 }}</div>
                    <div class="stats-column">Éligibles : {{ verificationStatus?.countEligible || 0 }}</div>
                    <div class="stats-column">Créés : {{ verificationStatus?.countCreated || 0 }}</div>
                    <div class="stats-column">Non Créés : {{ verificationStatus?.countNotCreated || 0 }}
                    </div>
                </div>

                <div class="table-container dialog-history-container">
                    <div class="table-wrapper">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th style="width: 20%">Fabricant</th>
                                    <th style="width: 15%">Référence</th>
                                    <th style="width: 15%">MASTER ERP</th>
                                    <th style="width: 15%">Statut</th>
                                    <th style="width: 20%">Action</th>
                                    <th style="width: 15%" class="text-center">Information Tecdoc</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="isLoadingVerification">
                                    <td colspan="6" class="text-center p-4">Chargement...</td>
                                </tr>
                                <tr v-else-if="paginatedVerificationItems.length === 0">
                                    <td colspan="6" class="text-center p-4">Aucun article trouvé</td>
                                </tr>
                                <tr v-else v-for="(item, index) in paginatedVerificationItems" :key="index">
                                    <td>{{ item.manufacturerName }}</td>
                                    <td>{{ item.articleNumber }}</td>
                                    <td>
                                        <span :class="getMasterErpClass(item.referenceMaster)">
                                            {{ item.referenceMaster }}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="status-badge"
                                            :class="item.status === 'CREATED' ? 'status-created' : 'status-not-created'">
                                            {{ item.status === 'CREATED' ? 'Créé' : 'Non Créé' }}
                                        </span>
                                    </td>
                                    <td>
                                        <Button v-if="item.status !== 'CREATED'" label="Ajouter AM" icon="pi pi-plus"
                                            class="p-button-sm create-am-btn" @click="createArticleMaster(item)" />
                                        <Button v-if="item.status === 'CREATED'" label="A Vérifier"
                                            icon="pi pi-check-circle" class="p-button-sm verify-btn ml-2"
                                            @click="markAsToVerify(item)" :loading="item.isVerifying" />
                                    </td>
                                    <td class="text-center">
                                        <i class="pi pi-info-circle info-icon cursor-pointer text-blue-500 hover:text-blue-700" style="font-size: 1.2rem;" @click="openInfoDialog(item)" title="Infos TecDoc"></i>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Pagination C2 (footer bas, style charte) -->
                <div class="c2-verif-footer" v-if="filteredVerificationItems.length > 0">
                    <span class="c2-verif-pageinfo">
                        {{ verificationPagination.page * verificationPagination.size + 1 }}–{{
                            Math.min((verificationPagination.page + 1) * verificationPagination.size,
                                filteredVerificationItems.length) }} sur {{ filteredVerificationItems.length }}
                    </span>
                    <div class="c2-verif-pager-group">
                        <button class="c2-verif-pager" :disabled="verificationPagination.page === 0"
                            @click="changeVerificationPage(verificationPagination.page - 1)">
                            <i class="pi pi-chevron-left"></i>
                        </button>
                        <span class="c2-verif-pagenum">{{ verificationPagination.page + 1 }} / {{ verificationTotalPages }}</span>
                        <button class="c2-verif-pager" :disabled="verificationPagination.page >= verificationTotalPages - 1"
                            @click="changeVerificationPage(verificationPagination.page + 1)">
                            <i class="pi pi-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>

        <!-- Create Article Master Dialog -->
        <CreateArticleMasterDialog
            v-model:visible="showCreateArticleMasterDialog"
            :candidate="selectedArticleMasterCandidate"
            @success="onArticleMasterCreated"
        />
        <!-- Purchase Lines Dialog — composant PARTAGÉ (réf. visuelle = Confirmation Achat C2) -->
        <ArticlePurchaseLinesDialog
            v-model:visible="showPurchaseLinesDialog"
            :no="selectedPurchaseLineNo"
            :total-elements="purchaseLinesPagination.totalElements"
            :entries="purchaseLines"
            :loading="isLoadingPurchaseLines"
            :page="purchaseLinesPagination.page"
            :total-pages="purchaseLinesPagination.totalPages"
            :sort-field="purchaseLinesSort.field"
            :sort-direction="purchaseLinesSort.direction"
            @go-page="loadPurchaseLines(selectedPurchaseLineNo, $event)"
            @sort-change="onSortPurchaseLines"
        />

        <!-- Import Ledger Lines Dialog — composant PARTAGÉ (clic quantité « Imp » colonne Appro) -->
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

        <!-- Dialog Der P / Dernier Achat (clic prix colonne Dernier Achat) — composant PARTAGÉ (réf. C2) -->
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

        <!-- OEM Count Details Dialog — composant PARTAGÉ (réf. visuelle = C2) -->
        <ArticleOemCountDialog
            :visible="showOemCountDialog"
            :master="masterItemNo"
            :total="oemCount ?? 0"
            :details="oemCountDetails"
            @update:visible="showOemCountDialog = $event"
        />

        <!-- Comment Overlay -->
        <Popover ref="commentOverlay" class="comment-overlay" appendTo="body"
            :style="{ width: '25vw', minWidth: '25vw', maxWidth: '25vw', border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: 'white' }">
            <div class="comment-content"
                style="width: 100%; display: flex; flex-direction: column; gap: 10px; padding: 10px 10px 0px 10px !important; box-sizing: border-box !important;">
                <textarea v-model="commentText" class="comment-textarea" placeholder="Saisissez votre commentaire..."
                    rows="5"
                    style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: inherit; font-size: 0.9rem; resize: none; outline: none;"></textarea>
                <div class="comment-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                    <Button icon="pi pi-check" text rounded size="small" @click="saveComment" title="Enregistrer" />
                    <Button icon="pi pi-times" text rounded size="small" @click="$refs.commentOverlay.toggle($event)"
                        title="Fermer" />
                </div>
            </div>
        </Popover>
    </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Popover from 'primevue/popover'
import Select from 'primevue/select'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import { useCompareQuoteStore } from '../stores/compareQuote'
import { useAuthStore } from '../stores/auth'
import CreateArticleMasterDialog from '@/components/CreateArticleMasterDialog.vue'
import TecDocArticleInfoDialog from './tecdoc/TecDocArticleInfoDialog.vue'
import ArticleStockHistoryDialog from './article/ArticleStockHistoryDialog.vue'
import ArticlePurchasePriceHistoryDialog from './article/ArticlePurchasePriceHistoryDialog.vue'
import ArticlePurchaseLinesDialog from './article/ArticlePurchaseLinesDialog.vue'
import ArticleImportLedgerLinesDialog from './article/ArticleImportLedgerLinesDialog.vue'
import ArticleDerPHistoryDialog from './article/ArticleDerPHistoryDialog.vue'
import ArticleOemCountDialog from './article/ArticleOemCountDialog.vue'


const props = defineProps({
    line: {
        type: Object,
        required: true
    },
    totalElements: {
        type: Number,
        default: 0
    },
    currentIndex: {
        type: Number,
        default: 0
    }
})

const emit = defineEmits(['back', 'prev', 'next'])

const store = useCompareQuoteStore()
const authStore = useAuthStore()

const formatReference = (refVal) => {
    if (!refVal) return ''
    return refVal.replace(/MASTER/gi, '').trim()
}

const isProductItem = (item) => {
    if (!item) return false
    const p = item.produit !== undefined ? item.produit : item.Produit
    return p === true || p === 'true' || p === 1 || p === '1'
}
const toast = useToast()
const confirm = useConfirm()
/* Right panel — 3 états identiques à C2 : collapsed (rail 54px) / normal / expanded.
   isSidebarExpanded reste exposé (= 'expanded') car la zone GAUCHE l'utilise pour
   masquer/afficher ses colonnes ; il devient une dérivation de histState. */
const histState = ref('normal')           // 'collapsed' | 'normal' | 'expanded'
const isSidebarExpanded = computed(() => histState.value === 'expanded')
const widenHist = () => { histState.value = histState.value === 'collapsed' ? 'normal' : 'expanded' }
const narrowHist = () => { histState.value = histState.value === 'expanded' ? 'normal' : 'collapsed' }
const cartBusyLineNo = ref(null)
const showHistoryDialog = ref(false)
const selectedCompany = ref('')
const selectedCompanyId = ref(null)
const quoteLineDetails = ref([])
const isLoadingDetails = ref(false)
const selectedDetail = ref(null)
const selectedHistoryItem = ref(null)
const equivalenceItems = ref([])
const isLoadingEquivalence = ref(false)
const equivalencePagination = ref({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
})

const kitItems = ref([])
const isLoadingKit = ref(false)
const kitPagination = ref({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
})

/* KPIs d'en-tête EQV / KIT — reproduits de C2 (count + total CMD + total IMP).
   Le backend du comparateur ne renvoie pas de totaux serveur ; on agrège donc
   localement les lignes chargées (qtyOnPurchOrder / qtyImport). fmtSum : entier brut,
   sinon 2 décimales — identique à C2. */
const fmtSum = (v) => { const n = Number(v) || 0; return Number.isInteger(n) ? n : n.toFixed(2) }
const sumBy = (arr, key) => (arr || []).reduce((s, i) => s + (Number(i?.[key]) || 0), 0)
const eqvCount = computed(() => equivalencePagination.value?.totalElements || equivalenceItems.value.length)
const eqvTotalCmd = computed(() => sumBy(equivalenceItems.value, 'qtyOnPurchOrder'))
const eqvTotalImp = computed(() => sumBy(equivalenceItems.value, 'qtyImport'))
const kitCount = computed(() => kitPagination.value?.totalElements || kitItems.value.length)
const kitTotalCmd = computed(() => sumBy(kitItems.value, 'qtyOnPurchOrder'))
const kitTotalImp = computed(() => sumBy(kitItems.value, 'qtyImport'))




// Sidebar History State
const selectedYear = ref(new Date().getFullYear())
const historyEntries = ref([])
const isLoadingHistory = ref(false)
const historyPagination = ref({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
})

// OEM Grouping State
const expandedOemBrands = ref(new Set())

const toggleOemBrand = (brand) => {
    if (expandedOemBrands.value.has(brand)) {
        expandedOemBrands.value.delete(brand)
    } else {
        expandedOemBrands.value.add(brand)
    }
}

const groupedOemNumbers = computed(() => {
    if (!selectedInfoItem.value?.oemNumbers?.length) return []

    const groups = {}
    selectedInfoItem.value.oemNumbers.forEach(oem => {
        const brand = oem.mfrName || 'Autre'
        if (!groups[brand]) {
            groups[brand] = []
        }
        groups[brand].push(oem)
    })

    // Sort brands alphabetically
    return Object.keys(groups).sort().map(brand => ({
        brand,
        numbers: groups[brand]
    }))
})

// Comment State
const commentOverlay = ref(null)
const commentText = ref('')
const selectedCommentItem = ref(null)

const toggleCommentOverlay = (event, item) => {
    selectedCommentItem.value = item
    commentText.value = item.commentPurchaseCart || item.quoteLineComment || item.QuoteLineComment || ''
    commentOverlay.value.toggle(event)
}

const openCartForItem = (item) => {
    activeRightPanel.value = 'cart'
    activeCartTab.value = 'current'
    cartFilters.value = {
        compareQuoteNo: props.line.compareQuoteNo,
        status: null,
        itemNo: item.no,
        vendorNo: ''
    }
    applyFilters()
}

const saveComment = async () => {
    if (selectedCommentItem.value) {
        // For Equivalence/KIT items, just store locally
        if (selectedCommentItem.value.no) {
            // If item is already in cart, update the comment via API
            if (selectedCommentItem.value.existPurchaseCart) {
                let lineNo = selectedCommentItem.value.purchaseCartLineNo;

                // Fallback: Try to find the line number in the store's cart items if not present on the item
                if (!lineNo) {
                    // First check existing store items
                    if (store.cartItems && store.cartItems.length > 0) {
                        const cartItem = store.cartItems.find(ci =>
                            ci.itemNo === selectedCommentItem.value.no &&
                            ci.buyFromVendorNo === selectedCommentItem.value.vendorNo
                        );
                        if (cartItem) {
                            lineNo = cartItem.lineNo;
                        }
                    }

                    // If still not found, fetch from API specifically for this item
                    if (!lineNo) {
                        try {
                            const fetchedItems = await store.fetchCartItems({
                                itemNo: selectedCommentItem.value.no,
                                vendorNo: selectedCommentItem.value.vendorNo,
                                compareQuoteNo: props.line.compareQuoteNo,
                                status: 'All'
                            });

                            if (fetchedItems && fetchedItems.length > 0) {
                                // Find the exact match (though filters should have narrowed it down)
                                const match = fetchedItems.find(ci =>
                                    ci.itemNo === selectedCommentItem.value.no &&
                                    ci.buyFromVendorNo === selectedCommentItem.value.vendorNo
                                );
                                if (match) {
                                    lineNo = match.lineNo;
                                }
                            }
                        } catch (err) {
                            console.error('Error fetching cart item for comment update:', err);
                        }
                    }

                    // Cache it if found
                    if (lineNo) {
                        selectedCommentItem.value.purchaseCartLineNo = lineNo;
                    }
                }

                if (lineNo) {
                    try {
                        await store.updateCartItemComment(lineNo, commentText.value)
                        selectedCommentItem.value.commentPurchaseCart = commentText.value
                        toast.add({ severity: 'success', summary: 'Succès', detail: 'Commentaire mis à jour dans le panier', life: 2000 })
                        commentOverlay.value.hide()
                        return
                    } catch (error) {
                        console.error('Failed to update cart comment:', error)
                        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la mise à jour du commentaire', life: 3000 })
                        return
                    }
                }
            }

            selectedCommentItem.value.comment = commentText.value
            toast.add({ severity: 'success', summary: 'Succès', detail: 'Commentaire enregistré localement', life: 2000 })
            commentOverlay.value.hide()
        } else {
            // For quote line items, update via API
            try {
                await store.updateQuoteLineComment(selectedCommentItem.value.id, commentText.value)
                selectedCommentItem.value.quoteLineComment = commentText.value
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Commentaire enregistré', life: 2000 })
                commentOverlay.value.hide()
            } catch (error) {
                toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de l\'enregistrement', life: 3000 })
            }
        }
    }
}

const addToCart = async (item) => {
    try {
        const payload = {
            buyFromVendorNo: item.vendorNo,
            itemNo: item.no,
            refMaster: props.line.itemNo,
            quantity: item.quantityToOrder || 1,
            directUnitCost: item.lastCurrPrice,
            compareQuoteNo: props.line.compareQuoteNo,
            comment: item.comment || ''
        }

        const response = await store.addToCart(payload)

        // Update local item state immediately
        item.existPurchaseCart = true
        // Capture the line number from the response
        if (response && response.lineNo) {
            item.purchaseCartLineNo = response.lineNo
        }

        if (payload.comment) {
            item.commentPurchaseCart = payload.comment
        }

        toast.add({ severity: 'success', summary: 'Succès', detail: 'Article ajouté au panier', life: 2000 })

        // Refresh cart count and items
        if (props.line.compareQuoteNo) {
            await store.fetchCartCount(props.line.compareQuoteNo)
        }
        if (activeRightPanel.value === 'cart') {
            applyFilters()
        }


    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de l\'ajout au panier', life: 3000 })
    }
}





const updateCartStatus = async (lineNo, status) => {
    try {
        await store.updateCartItemStatus(lineNo, status)
        toast.add({ severity: 'success', summary: 'Succès', detail: `Statut mis à jour: ${status}`, life: 2000 })

        // Refresh cart count and items
        if (props.line.compareQuoteNo) {
            await store.fetchCartCount(props.line.compareQuoteNo)
        }
        applyFilters()
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la mise à jour du statut', life: 3000 })
    }
}
const historyKpis = ref({
    stock: 0,
    vente: 0,
    achat: 0,
    rupt: 0
})

// Dialog History State
const dialogSelectedYear = ref(new Date().getFullYear())
const dialogHistoryEntries = ref([])
const isLoadingDialogHistory = ref(false)
const dialogHistoryPagination = ref({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
})
const dialogHistoryKpis = ref({
    stock: 0,
    vente: 0,
    achat: 0,
    rupt: 0
})
const intercompanyStocks = ref([])
const isLoadingIntercompanyStock = ref(false)
const isLoadingSecondaryData = ref(false)

const oemCount = ref(null)
const oemCountDetails = ref([])
const isLoadingOemCount = ref(false)
const showOemCountDialog = ref(false)

const fetchOemCount = async () => {
    if (!props.line?.itemNo) return

    isLoadingOemCount.value = true
    oemCount.value = null
    oemCountDetails.value = []
    try {
        const response = await store.fetchOemEquivalenceCount(props.line.itemNo)
        oemCount.value = response?.totalCount !== undefined ? response.totalCount : (response || 0)
        oemCountDetails.value = response?.details || []
    } catch (error) {
        console.error('Failed to fetch OEM equivalence count:', error)
        oemCount.value = props.line?.countItemManual || 0
        oemCountDetails.value = []
    } finally {
        isLoadingOemCount.value = false
    }
}

const openOemCountDialog = () => {
    if (!isLoadingOemCount.value && oemCountDetails.value.length > 0) {
        showOemCountDialog.value = true
    } else if (!isLoadingOemCount.value && oemCountDetails.value.length === 0) {
        toast.add({ severity: 'info', summary: 'Information', detail: 'Aucun détail de count disponible', life: 2000 })
    }
}

const sortedOemCountDetails = computed(() => {
    if (!oemCountDetails.value) return []
    return [...oemCountDetails.value].sort((a, b) => (b.count || 0) - (a.count || 0))
})

const isLoadingMasterData = computed(() => {
    return isLoadingDetails.value ||
        isLoadingEquivalence.value ||
        isLoadingKit.value ||
        isLoadingIntercompanyStock.value ||
        isLoadingSecondaryData.value ||
        isLoadingOemCount.value
})

// Article Info Dialog State
const showInfoDialog = ref(false)

// TecDoc Verification State
const verificationStatus = ref(null)
const showVerificationDialog = ref(false)
const isLoadingVerification = ref(false)
const verificationManufacturerFilter = ref('')
const verificationPagination = ref({
    page: 0,
    size: 10
})

// Purchase Lines Dialog State
const showPurchaseLinesDialog = ref(false)
const purchaseLines = ref([])
const isLoadingPurchaseLines = ref(false)
const selectedPurchaseLineNo = ref(null)

const purchaseLinesPagination = ref({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 1
})

const purchaseLinesSort = ref({
    field: '',
    direction: ''
})

const purchaseLinesColumns = [
    { field: 'documentNo', altField: 'Document No', header: 'N° Commande' },
    { field: 'buyFromVendorNo', altField: 'Buy From Vendor No', header: 'Fournisseur', isBold: true },
    { field: 'no', altField: 'No', header: 'Référence' },
    { field: 'locationCode', altField: 'Location Code', header: 'Magasin' },
    { field: 'orderDate', altField: 'Order Date', header: 'Date Commande', isDate: true },
    { field: 'description', altField: 'Description', header: 'Description' },
    { field: 'quantity', altField: 'Quantity', header: 'Qté Commande', isNumber: true },
    { field: 'outstandingQuantity', altField: 'Outstanding Quantity', header: 'Qté Cmd Restante', isBold: true, isNumber: true }
]

const getPurchaseLineValue = (line, col) => {
    if (!line) return ''
    if (line[col.field] !== undefined) return line[col.field]
    if (line[col.altField] !== undefined) return line[col.altField]
    
    const normalizedField = col.field.toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const key of Object.keys(line)) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (normalizedKey === normalizedField || normalizedKey === normalizedField + '_') {
            return line[key]
        }
    }
    return ''
}

const formatPurchaseLineDate = (dateString) => {
    if (!dateString || dateString === '0001-01-01' || dateString.startsWith('1753-01-01')) return '-'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
}

const loadPurchaseLines = async (no, page = 0) => {
    if (!no) return
    selectedPurchaseLineNo.value = no
    isLoadingPurchaseLines.value = true
    
    let sortParam = ''
    if (purchaseLinesSort.value.field) {
        sortParam = `${purchaseLinesSort.value.field},${purchaseLinesSort.value.direction}`
    }

    try {
        const data = await store.fetchPurchaseLines(no, page, purchaseLinesPagination.value.size, sortParam)
        if (data && data.content) {
            purchaseLines.value = data.content
            purchaseLinesPagination.value = {
                ...purchaseLinesPagination.value,
                page: data.page?.number ?? data.number ?? page,
                size: data.page?.size ?? data.size ?? purchaseLinesPagination.value.size,
                totalElements: data.page?.totalElements ?? data.totalElements ?? data.content.length,
                totalPages: data.page?.totalPages ?? data.totalPages ?? 1
            }
        } else {
            const items = Array.isArray(data) ? data : (data ? [data] : [])
            purchaseLines.value = items
            purchaseLinesPagination.value = {
                ...purchaseLinesPagination.value,
                page: 0,
                totalElements: items.length,
                totalPages: 1
            }
        }
    } catch (error) {
        console.error('Error fetching purchase lines:', error)
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la récupération des lignes de commande', life: 3000 })
        purchaseLines.value = []
    } finally {
        isLoadingPurchaseLines.value = false
    }
}

const onSortPurchaseLines = (field) => {
    if (purchaseLinesSort.value.field === field) {
        if (purchaseLinesSort.value.direction === 'asc') {
            purchaseLinesSort.value.direction = 'desc'
        } else if (purchaseLinesSort.value.direction === 'desc') {
            purchaseLinesSort.value.field = ''
            purchaseLinesSort.value.direction = ''
        }
    } else {
        purchaseLinesSort.value.field = field
        purchaseLinesSort.value.direction = 'asc'
    }
    loadPurchaseLines(selectedPurchaseLineNo.value, 0)
}

const openPurchaseLinesDialog = async (no, qtyCmd) => {
    if (!qtyCmd || qtyCmd <= 0) return
    selectedPurchaseLineNo.value = no
    showPurchaseLinesDialog.value = true
    purchaseLinesSort.value = { field: '', direction: '' }
    purchaseLinesPagination.value.page = 0
    await loadPurchaseLines(no, 0)
}

// Lignes Import (clic quantité « Imp » colonne Appro) — dialog partagé ArticleImportLedgerLinesDialog.
// Endpoint déjà créé : GET /api/bc/import-ledger-entries?itemNo=&sourceNo=&page=&size= (store.fetchImportLedgerLines).
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
        console.error('Error fetching import ledger lines:', error)
        importLines.value.entries = []
    } finally {
        importLines.value.loading = false
    }
}
const openImportLines = (itemNo, sourceNo, qty) => {
    if (!qty || qty <= 0 || !itemNo || !sourceNo) return   // cliquable uniquement si quantité import > 0
    importLines.value = { open: true, loading: false, itemNo, sourceNo, entries: [], page: 0, size: 50, totalElements: 0, totalPages: 0, sortField: '', sortDirection: '' }
    loadImportLines(itemNo, sourceNo, 0)
}
const goImportPage = (page) => {
    if (page < 0 || page > (importLines.value.totalPages - 1)) return
    loadImportLines(importLines.value.itemNo, importLines.value.sourceNo, page)
}
// Tri Import (cycle asc → desc → aucun), recharge page 0
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

// Dialog Der P / Dernier Achat (clic prix colonne Dernier Achat, FRS/EQV/KIT) — calqué sur C2.
// Source : store.fetchLastInvoicedItemCosts(itemNo, page, size) → GET /api/sqlserver/last-invoiced-item-costs/{itemNo}.
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
        console.error('[Comparateur Der P] Erreur historique Der P:', error)
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

// Purchase Price Dialog State
const showPurchasePriceDialog = ref(false)
const purchasePrices = ref([])
const isLoadingPurchasePrices = ref(false)
const selectedPurchasePriceItem = ref(null)
const purchasePriceVendorFilter = ref('')
const allPurchasePrices = ref([])
const purchasePricesByItem = ref(new Map())
const totalAmount = ref(null)
const selectedDocumentNo = ref(null)

const availableVendors = computed(() => {
    if (!purchasePrices.value) return []
    const vendors = [...new Set(purchasePrices.value.map(p =>
        p.vendorNo))].filter(Boolean)
    return vendors.sort()
})

const filteredPurchasePrices = computed(() => {
    if (!purchasePriceVendorFilter.value) return purchasePrices.value
    return purchasePrices.value.filter(p => p.vendorNo ===
        purchasePriceVendorFilter.value)
})

const isPurchasePriceFilterDisabled = ref(false)

const openPurchasePriceDialog = async (vendorNo, itemNo, description,
    isFromSuppliers = false) => {
    if (!itemNo) return

    selectedPurchasePriceItem.value = { itemNo, description }
    isPurchasePriceFilterDisabled.value = isFromSuppliers

    if (isFromSuppliers && vendorNo) {
        purchasePriceVendorFilter.value = vendorNo
    } else {
        purchasePriceVendorFilter.value = ''
    }

    showPurchasePriceDialog.value = true
    isLoadingPurchasePrices.value = true
    purchasePrices.value = []

    try {
        const data = await store.fetchPurchasePrices(itemNo)
        purchasePrices.value = data || []
    } catch (error) {
        console.error('Error fetching purchase prices:', error)
    } finally {
        isLoadingPurchasePrices.value = false
    }
}

// Last Invoiced Cost State
// Last Invoiced Cost State
const lastInvoicedCosts = ref(new Map())
const equivalenceLastInvoicedCosts = ref(new Map())
const kitLastInvoicedCosts = ref(new Map())

const fetchLastInvoicedCosts = async () => {
    if (!quoteLineDetails.value || quoteLineDetails.value.length === 0) return

    // Get unique item numbers from the details list
    const uniqueItems = [...new Set(quoteLineDetails.value.map(d => d.no))].filter(Boolean)

    // Clear existing map
    lastInvoicedCosts.value = new Map()

    for (const itemNo of uniqueItems) {
        try {
            const data = await store.fetchLastInvoicedCost(itemNo)
            if (Array.isArray(data)) {
                const costMap = new Map()
                data.forEach(item => {
                    if (item.frs) {
                        costMap.set(item.frs, item)
                    }
                })
                lastInvoicedCosts.value.set(itemNo, costMap)
            }
        } catch (error) {
            console.error(`Error fetching last invoiced costs for item ${itemNo}:`, error)
        }
    }
}

const getLastInvoicedData = (vendorNo, itemNo) => {
    if (!vendorNo || !itemNo) return null
    const itemMap = lastInvoicedCosts.value.get(itemNo)
    if (!itemMap) return null
    return itemMap.get(vendorNo)
}

const getEquivalenceLastInvoicedData = (itemNo, vendorNo) => {
    if (!itemNo || !vendorNo) return null
    const itemMap = equivalenceLastInvoicedCosts.value.get(itemNo)
    if (!itemMap) return null
    return itemMap.get(vendorNo)
}

const getKitLastInvoicedData = (itemNo, vendorNo) => {
    if (!itemNo || !vendorNo) return null
    const itemMap = kitLastInvoicedCosts.value.get(itemNo)
    if (!itemMap) return null
    return itemMap.get(vendorNo)
}

const fetchEquivalenceLastInvoicedCosts = async (items) => {
    if (!items || items.length === 0) return

    for (const item of items) {
        if (!item.no) continue
        try {
            const data = await store.fetchLastInvoicedCost(item.no)
            if (Array.isArray(data)) {
                const costMap = new Map()
                data.forEach(d => {
                    if (d.frs) {
                        costMap.set(d.frs, d)
                    }
                })
                equivalenceLastInvoicedCosts.value.set(item.no, costMap)
            }
        } catch (error) {
            console.error(`Error fetching last invoiced cost for equivalence item ${item.no}:`,
                error)
        }
    }
}

const fetchKitLastInvoicedCosts = async () => {
    // Mock kit items for now, as per template loop
    const kitItems = [1, 2, 3, 4].map(i => ({
        no: 'KIT-' + i, vendorNo: 'MOCK-VENDOR'
    }))

    for (const item of kitItems) {
        try {
            const data = await store.fetchLastInvoicedCost(item.no)
            if (Array.isArray(data)) {
                const costMap = new Map()
                data.forEach(d => {
                    if (d.frs) {
                        costMap.set(d.frs, d)
                    }
                })
                kitLastInvoicedCosts.value.set(item.no, costMap)
            }
        } catch (error) {
            console.error(`Error fetching last invoiced cost for kit item ${item.no}:`, error)
        }
    }
}

const getSecondLastPurchasePrice = (vendorNo, itemNo) => {
    if (!vendorNo || !itemNo) return null

    // Get prices for this specific item
    const itemPrices = purchasePricesByItem.value.get(itemNo)
    if (!itemPrices || !itemPrices.length) return null

    // Filter by vendor (use loose equality to handle string/number differences)
    const vendorPrices = itemPrices.filter(p => p.vendorNo == vendorNo)

    // Sort by startingDate descending
    vendorPrices.sort((a, b) => new Date(b.startingDate) - new Date(a.startingDate))

    // Return the second item (index 1) if it exists
    if (vendorPrices.length >= 2) {
        return vendorPrices[1].directUnitCost
    }

    return null
}

const selectedInfoItem = ref(null)
const currentImageIndex = ref(0)
const isViewing360 = ref(false)
const current360Frame = ref(0)
const expandedBrands = ref(new Set())

// Info Section Collapse State
const isOemSectionExpanded = ref(true)
const isPdfSectionExpanded = ref(true)
const isVehiclesSectionExpanded = ref(true)
const isKitPartsSectionExpanded = ref(true)

// TecDoc Verification Computed Properties
const masterItemNo = computed(() => {
    if (!props.line?.itemNo) return ''
    return props.line.itemNo.replace(/MASTER/gi, '').trim()
})

const availableManufacturers = computed(() => {
    if (!verificationStatus.value?.items) return []
    const manufacturers = [...new Set(verificationStatus.value.items.map(item =>
        item.manufacturerName))]
    return manufacturers.sort()
})

// Options pour le PrimeVue Select du filtre Fabricant (« Tous » + fabricants distincts)
const manufacturerOptions = computed(() => [
    { label: 'Tous les fabricants', value: '' },
    ...availableManufacturers.value.map(m => ({ label: m, value: m }))
])

const filteredVerificationItems = computed(() => {
    if (!verificationStatus.value?.items) return []
    if (!verificationManufacturerFilter.value) return verificationStatus.value.items
    return verificationStatus.value.items.filter(item =>
        item.manufacturerName === verificationManufacturerFilter.value
    )
})

const paginatedVerificationItems = computed(() => {
    const start = verificationPagination.value.page * verificationPagination.value.size
    const end = start + verificationPagination.value.size
    return filteredVerificationItems.value.slice(start, end)
})

const verificationTotalPages = computed(() => {
    return Math.ceil(filteredVerificationItems.value.length /
        verificationPagination.value.size)
})

const statusDotClass = computed(() => {
    if (!verificationStatus.value) return 'loading'
    if (verificationStatus.value.countNotCreated === 0) return 'success'
    return 'warning'
})

const toggleBrand = async (brandGroup) => {
    const isExpanded = expandedBrands.value.has(brandGroup.brand)

    // Collapse all others (Accordion behavior)
    expandedBrands.value.clear()

    if (!isExpanded) {
        expandedBrands.value.add(brandGroup.brand)
        // Fetch vehicles if not already loaded
        if (brandGroup.models.length === 0 && brandGroup.id) {
            await fetchVehiclesForBrand(brandGroup)
        }
    }
}

const fetchVehiclesForBrand = async (brandGroup) => {
    if (!selectedInfoItem.value?.articleId || !brandGroup.id) {
        return
    }

    brandGroup.isLoading = true
    try {
        const vehicles = await store.fetchArticleVehicles(selectedInfoItem.value.articleId, brandGroup.id)

        // Group by modelDesc
        const groupedModels = {}
        vehicles.forEach(v => {
            if (!groupedModels[v.modelDesc]) {
                groupedModels[v.modelDesc] = {
                    manuDesc: v.manuDesc,
                    modelDesc: v.modelDesc,
                    minYear: v.yearOfConstructionFrom,
                    maxYear: v.yearOfConstructionTo,
                    minHp: v.powerHpFrom,
                    maxHp: v.powerHpFrom,
                    count: 0
                }
            }

            const group = groupedModels[v.modelDesc]
            group.count++

            // Update ranges
            if (v.yearOfConstructionFrom < group.minYear) group.minYear = v.yearOfConstructionFrom
            if (v.yearOfConstructionTo > group.maxYear) group.maxYear = v.yearOfConstructionTo
            if (v.powerHpFrom < group.minHp) group.minHp = v.powerHpFrom
            if (v.powerHpFrom > group.maxHp) group.maxHp = v.powerHpFrom
        })

        // Format output
        brandGroup.models = Object.values(groupedModels).map(g => {
            const minDate = formatConstructionDate(g.minYear)
            const maxDate = g.maxYear ? formatConstructionDate(g.maxYear) : '...'
            return `${g.manuDesc} ${g.modelDesc} ( ${minDate} - ${maxDate} , ${g.minHp} - ${g.maxHp} CH)`
        })

    } catch (error) {
        console.error('Error fetching vehicles for brand:', error)
        brandGroup.models = ['Erreur lors du chargement des véhicules']
    } finally {
        brandGroup.isLoading = false
    }
}

const formatConstructionDate = (dateNum) => {
    if (!dateNum) return '...'
    const str = dateNum.toString()
    if (str.length !== 6) return str
    return `${str.substring(4, 6)}.${str.substring(0, 4)}`
}

const nextImage = () => {
    if (!selectedInfoItem.value) return
    currentImageIndex.value = (currentImageIndex.value + 1) %
        selectedInfoItem.value.thumbnails.length
}

const prevImage = () => {
    if (!selectedInfoItem.value) return
    currentImageIndex.value = (currentImageIndex.value - 1 +
        selectedInfoItem.value.thumbnails.length) % selectedInfoItem.value.thumbnails.length
}

const orderReasons = [
    { value: 'Prix augmenté', label: 'Prix augmenté' },
    { value: 'Remplacé autre fabricant', label: 'Remplacé autre fabricant' },
    { value: 'Mouvement lent', label: 'Mouvement lent' },
    { value: 'Nouveau article', label: 'Nouveau article' },
    { value: 'En attente devis autre fabricant', label: 'En attente devis autre fabricant' },
    { value: 'Sur Stockage', label: 'Sur Stockage' }
]

const handleKeyDown = (event) => {
    if (event.key === 'F8') {
        event.preventDefault()
        if (event.ctrlKey) {
            emit('prev')
        } else {
            if (showHistoryDialog.value) {
                changeDialogYear(-1)
            } else {
                changeYear(-1)
            }
        }
    } else if (event.key === 'F9') {
        event.preventDefault()
        if (event.ctrlKey) {
            emit('next')
        } else {
            if (showHistoryDialog.value) {
                changeDialogYear(1)
            } else {
                changeYear(1)
            }
        }
    } else if (event.key === 'F7') {
        event.preventDefault()
        if (selectedHistoryItem.value) {
            const item = selectedHistoryItem.value
            // Handle different vendor field names (buyFromVendorNo for main table, vendorNo for equivalence / kits)
            const vendor = item.buyFromVendorNo || item.vendorNo

            if (vendor && item.no) {
                openPurchasePriceDialog(
                    vendor,
                    item.no,
                    item.descriptionStructured || item.description,
                    !!item.buyFromVendorNo // true if from main table
                )
            }
        }
    }
}

const formatNumber = (value, decimals) => {
    if (value === null || value === undefined) return ''
    return Number(value).toFixed(decimals)
}

// Montant avec séparateur de milliers (espace) — identique au formatMoney de C2
const formatMoney = (v) => {
    if (v == null || v === '') return '—'
    const n = Number(v)
    if (isNaN(n)) return '—'
    const [intPart, dec] = n.toFixed(2).split('.')
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + '.' + dec
}

const formatDate = (dateString) => {
    if (!dateString || dateString === '0001-01-01' || dateString.startsWith('1753-01-01')) return '-'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)

    return `${day}/${month}/${year}`
}

const getStyleClass = (styleValue) => {
    if (styleValue === 'Favorable') return 'status-favorable'
    if (styleValue === 'Unfavorable') return 'status-unfavorable'
    if (styleValue === 'Attention') return 'status-attention'
    return ''
}

const getImportStyleClass = (importQty) => {
    // Import: 0 = blue border + black text, >0 = green background
    return importQty > 0 ? 'import-available' : 'import-empty'
}

const getQteCmdStyleClass = (qteCmdValue) => {
    // Qte Cmd: 0 = dark gray border + black text, >0 = green background
    return qteCmdValue > 0 ? 'qtecmd-available' : 'qtecmd-empty'
}

const getQtyCmdStyleClass = (qtyValue) => {
    // Legacy function for backward compatibility
    return getQteCmdStyleClass(qtyValue)
}

// TecDoc Verification Functions
const fetchVerificationStatus = async () => {
    if (!masterItemNo.value) return

    isLoadingVerification.value = true
    try {
        const data = await store.fetchTecdocVerification(masterItemNo.value)
        verificationStatus.value = data
    } catch (error) {
        console.error('Failed to fetch verification status:', error)
        verificationStatus.value = null
    } finally {
        isLoadingVerification.value = false
    }
}

const openVerificationDialog = () => {
    showVerificationDialog.value = true
}

const closeVerificationDialog = () => {
    showVerificationDialog.value = false
}

const changeVerificationPage = (newPage) => {
    verificationPagination.value.page = newPage
}

const showCreateArticleMasterDialog = ref(false)
const hasCreatedArticleMaster = ref(false)
const selectedArticleMasterCandidate = ref(null)
const vendors = ref([])

const onArticleMasterCreated = () => {
    hasCreatedArticleMaster.value = true
    fetchVerificationStatus()
}

onMounted(async () => {
    try {
        const fetchedVendors = await store.fetchVendors()
        vendors.value = fetchedVendors.map(v => ({
            ...v,
            fullLabel: `${v.number} - ${v.displayName}`
        }))
    } catch (error) {
        console.error('Error fetching initial data:', error)
    }
})

const createArticleMaster = (item) => {
    console.log('Create Article Master for:', item)
    console.log('Props Line:', props.line)

    let initialVendor = ''
    if (item.vendorNo) {
        // Try to find matching vendor in fetched list
        const foundVendor = vendors.value.find(v => v.number === item.vendorNo)
        if (foundVendor) {
            initialVendor = foundVendor.number
        }
    }

    selectedArticleMasterCandidate.value = {
        // Master Info from props.line
        masterItemNo: props.line.itemNo,
        masterDescription: props.line.structuredDescription || props.line.description,
        groupName: props.line.groupe,
        subGroupName: props.line.sousGroupe,
        makeCode: props.line.makeCode,
        champsLibre: props.line.champsLibre,
        // Hidden codes for validation
        groupCode: props.line.itemProductCode,
        subGroupCode: props.line.itemSubProductCode,

        // Candidate Info from item
        manufacturerName: item.bcManufacturerName || item.manufacturerName,
        manufacturerCode: item.bcManufacturerCode,
        articleNumber: item.articleNumber ? item.articleNumber.replace(/\s/g, '') : '',
        bcReference: item.articleNumber ? item.articleNumber.replace(/\s/g, '') : '',
        vendorNo: initialVendor
    }

    showCreateArticleMasterDialog.value = true
}

const markAsToVerify = async (item) => {
    const itemNo = item.bcItemNo || item.no
    if (!itemNo) return

    confirm.require({
        message: `Voulez-vous vraiment marquer la référence ${itemNo} comme "À Vérifier" ?`,
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Oui',
        rejectLabel: 'Non',
        acceptClass: 'p-button-success',
        rejectClass: 'p-button-secondary',
        accept: async () => {
            item.isVerifying = true
            try {
                await store.markAsToVerify(itemNo)
                toast.add({ severity: 'success', summary: 'Succès', detail: 'Article marqué à vérifier', life: 2000 })
                // Refresh verification status to update the list
                await fetchVerificationStatus()
            } catch (error) {
                console.error('Failed to mark as to verify:', error)
                toast.add({ severity: 'error', summary: 'Erreur', detail: 'Echec de mettre l\'article à vérifier', life: 3000 })
            } finally {
                item.isVerifying = false
            }
        }
    })
}


const updateLine = async (detail, markAsTreated = false) => {
    if (!detail || !detail.id) return

    const userCompanyId = authStore.user?.bcCompanyId
    console.log('Updating line:', detail)
    console.log('ETag:', detail['@odata.etag'])
    console.log('User CompanyId:', userCompanyId)

    detail.isUpdating = true // Set loading state

    const payload = {
        askingPrice: detail.askingPrice,
        askingQty: detail.askingQty,
        quantity: detail.quantity,
        quoteLineReason: detail.quoteLineReason
    }

    if (markAsTreated) {
        payload.treated = true
    }

    try {
        const response = await store.updateQuoteLine(detail.id, detail['@odata.etag'], payload, userCompanyId)
        if (markAsTreated) {
            detail.treated = true
        }
        
        // Merge the backend response (which includes the new ETag) directly into this row's object
        // This avoids calling fetchDetails(true) which would overwrite ongoing edits in other rows!
        if (response && response.data) {
            Object.assign(detail, response.data)
        }
        
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Ligne mise à jour', life: 2000 })
    } catch (error) {
        console.error('Update line error:', error)
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la mise à jour', life: 3000 })
        if (error.response && error.response.status === 412) {
            // ETag mismatch, refresh data
            await fetchDetails(true)
        }
    } finally {
        detail.isUpdating = false // Always reset loading state
    }
}

/* Photo Business Central (fallback si pas d'image TecDoc) — blob URL géré ici (parent),
   même comportement que B2B / Confirmation Achat C2 (dialog Info Article partagé). */
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
        console.error('[Comparateur] Photo BC:', e)
        bcPicture.value = { url: null, loading: false }
    }
}
watch(showInfoDialog, (v) => { if (!v) revokeBcPicture() })
onUnmounted(() => revokeBcPicture())

const openInfoDialog = async (item) => {
    // Show dialog immediately with loading state
    currentImageIndex.value = 0
    isViewing360.value = false
    current360Frame.value = 0
    showInfoDialog.value = true
    expandedBrands.value.clear()

    // Photo BC en parallèle (affichée par le dialog seulement s'il n'y a pas d'image TecDoc)
    loadBcPicture(item.no || item.itemNo)

    // Debug: Log the item to verify fields are present


    // Initialize with basic item data
    selectedInfoItem.value = {
        ...item,
        isLoading: true,
        brand: '',
        brandLogo: '',
        thumbnails: [],
        images360: [],
        specs: [],
        oemNumbers: [],
        vehicles: [],
        pdfs: [],
        articleParts: []
    }

    // Fetch TecDoc data
    try {
        // Support both possible field name casings and Verification Table payload
        const articleRef = item.VendorItemNo || item.vendorItemNo || item.articleNumber
        const manufacturerId = item.ManufacturerTecdocId || item.manufacturerTecdocId || item.dataSupplierId || item.manufacturerId

        if (!articleRef || !manufacturerId) {
            console.error('Missing article reference or manufacturer ID')
            console.error('articleRef:', articleRef, 'manufacturerId:', manufacturerId)
            selectedInfoItem.value.isLoading = false
            return
        }


        const response = await store.fetchTecdocArticleDetails(articleRef, manufacturerId)

        if (response && response.articles && response.articles.length > 0) {
            const article = response.articles[0]

            // Map images and separate 360 images (ZIP)
            const allImages = article.images || []
            const thumbnails = []
            const images360 = []

            allImages.forEach(img => {
                if (img.fileName && img.fileName.toUpperCase().endsWith('.ZIP')) {
                    images360.push(img.imageURL800)
                } else {
                    thumbnails.push(img.imageURL800)
                }
            })

            // Map specs from articleCriteria
            const specs = article.articleCriteria?.map(criteria => ({
                label: criteria.criteriaDescription,
                value: criteria.formattedValue
            })) || []

            // Map OEM numbers
            const oemNumbers = article.oemNumbers?.map(oem => ({
                mfrName: oem.mfrName,
                articleNumber: oem.articleNumber
            })) || []

            // Map PDFs
            const pdfs = article.pdfs || []

            // Get generic article description for brand/description
            const genericDesc = article.genericArticles?.[0]?.genericArticleDescription ||
                item.descriptionStructured

            // Update selectedInfoItem with API data
            selectedInfoItem.value = {
                ...item,
                articleId: article.genericArticles?.[0]?.legacyArticleId,
                isLoading: false,
                brand: article.mfrName || '',
                brandLogo: article.supplierLogoUrl || '/images/articles/febi_logo.png', // Use dynamic logo or fallback
                thumbnails: thumbnails,
                images360: images360,
                mainImage: thumbnails[0] || '',
                specs: specs,
                oemNumbers: oemNumbers,
                pdfs: pdfs,
                genericDescription: genericDesc,
                vehicles: article.linkedVehicles?.map(v => ({
                    brand: v.manuName,
                    id: v.manuId,
                    models: []
                })) || [],
                gtins: article.gtins || [],
                articleParts: article.articleParts || []
            }
        } else {
            // No data found
            selectedInfoItem.value.isLoading = false
        }
    } catch (error) {
        console.error('Error fetching TecDoc article details:', error)
        selectedInfoItem.value.isLoading = false
    }
}

const handle360MouseMove = (event) => {
    if (!selectedInfoItem.value?.images360?.length) return

    const container = event.currentTarget
    const rect = container.getBoundingClientRect()
    const x = event.clientX - rect.left
    const width = rect.width

    // Calculate frame based on horizontal position
    // More frames = smoother rotation
    const totalFrames = selectedInfoItem.value.images360.length
    const frameIndex = Math.floor((x / width) * totalFrames)

    // Ensure index is within bounds
    current360Frame.value = Math.max(0, Math.min(frameIndex, totalFrames - 1))
}

const handle360TouchMove = (event) => {
    if (!selectedInfoItem.value?.images360?.length) return

    const container = event.currentTarget
    const rect = container.getBoundingClientRect()
    const touch = event.touches[0]
    const x = touch.clientX - rect.left
    const width = rect.width

    const totalFrames = selectedInfoItem.value.images360.length
    const frameIndex = Math.floor((x / width) * totalFrames)

    current360Frame.value = Math.max(0, Math.min(frameIndex, totalFrames - 1))
}

const selectLine = async (detail) => {
    // Reset year to current year on selection
    selectedYear.value = new Date().getFullYear()
    // Always update history selection
    selectedHistoryItem.value = detail
    // Always update history stock KPI
    historyKpis.value.stock = detail.inventoryWithoutImport || 0

    // Check if it's already the active detail to avoid redundant equivalence fetching
    const isAlreadySelectedDetail = selectedDetail.value &&
        ((detail.id !== undefined && selectedDetail.value.id === detail.id) ||
            (detail.id === undefined && selectedDetail.value.no === detail.no));

    if (isAlreadySelectedDetail) return

    selectedDetail.value = detail


    // Fetch total amount for the document
    if (detail.documentNo) {
        selectedDocumentNo.value = detail.documentNo
        try {
            const amount = await store.fetchTotalAmount(detail.documentNo)
            totalAmount.value = amount
        } catch (error) {
            console.error('Error fetching total amount:', error)
            totalAmount.value = null
        }
    } else {
        selectedDocumentNo.value = null
        totalAmount.value = null
    }

    // Sequential loading: Equivalence first, then Kit
    isLoadingKit.value = true // Show loading in Kit table immediately
    await fetchEquivalenceItems(detail)
    await fetchKitItems(detail.no)
}

const selectEquivalenceItem = (item) => {
    selectedYear.value = new Date().getFullYear()
    selectedHistoryItem.value = item
    historyKpis.value.stock = item.qtyStock || 0
}

const selectKitItem = (item) => {
    selectedYear.value = new Date().getFullYear()
    selectedHistoryItem.value = item
    // For kits, we might need a specific logic if stock is not numeric
    historyKpis.value.stock = item.qtyStock || 0
}

const historyTableWrapper = ref(null)
const equivalenceTableWrapper = ref(null)

const checkAndLoadMore = async () => {
    await nextTick()
    if (historyTableWrapper.value) {
        const { scrollHeight, clientHeight } = historyTableWrapper.value
        // If content fits (no scrollbar) and we have more pages, load next page
        if (scrollHeight <= clientHeight && historyPagination.value.page < historyPagination.value.totalPages - 1) {
            fetchHistory(historyPagination.value.page + 1)
        }
    }
}

const fetchHistory = async (page = 0) => {
    if (!selectedHistoryItem.value || !selectedHistoryItem.value.no) return

    // Prevent duplicate calls if already loading
    if (isLoadingHistory.value) return

    isLoadingHistory.value = true
    try {
        const data = await store.fetchItemLedgerEntries(
            selectedHistoryItem.value.no,
            selectedYear.value,
            page,
            historyPagination.value.size,
            null // Global history for sidebar
        )

        if (data && data.content) {
            if (page === 0) {
                historyEntries.value = data.content
            } else {
                historyEntries.value = [...historyEntries.value, ...data.content]
            }

            historyPagination.value = {
                ...historyPagination.value,
                page: data.page !== undefined ? data.page : (data.number !== undefined ? data.number
                    : 0),
                totalElements: data.totalElements !== undefined ? data.totalElements : 0,
                totalPages: data.totalPages !== undefined ? data.totalPages : 1
            }

            if (data.quantityByEntryType) {
                historyKpis.value = {
                    ...historyKpis.value,
                    vente: data.quantityByEntryType.Sale || 0,
                    achat: data.quantityByEntryType.Purchase || 0,
                    rupt: data.quantityByEntryType.Rupture || 0
                }
            }
        } else {
            const items = Array.isArray(data) ? data : []
            if (page === 0) {
                historyEntries.value = items
            } else {
                historyEntries.value = [...historyEntries.value, ...items]
            }
            historyPagination.value.totalElements = historyEntries.value.length
            historyPagination.value.page = 0
            historyPagination.value.totalPages = 1
        }
    } catch (error) {
        console.error('Error fetching sidebar history:', error)
        if (page === 0) historyEntries.value = []
    } finally {
        isLoadingHistory.value = false
        checkAndLoadMore()
    }
}

const onHistoryScroll = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.target
    // Load more when user is near bottom (20px threshold)
    if (scrollTop + clientHeight >= scrollHeight - 20) {
        if (!isLoadingHistory.value && historyPagination.value.page < historyPagination.value.totalPages - 1) {
            fetchHistory(historyPagination.value.page + 1)
        }
    }
}

const dialogHistoryTableWrapper = ref(null)

const checkAndLoadMoreDialog = async () => {
    await nextTick()
    if (dialogHistoryTableWrapper.value) {
        const { scrollHeight, clientHeight } = dialogHistoryTableWrapper.value
        // If content fits (no scrollbar) and we have more pages, load next page
        if (scrollHeight <= clientHeight && dialogHistoryPagination.value.page < dialogHistoryPagination.value.totalPages - 1) {
            fetchDialogHistory(dialogHistoryPagination.value.page + 1)
        }
    }
}

const onDialogHistoryScroll = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.target
    // Load more when user is near bottom (20px threshold)
    if (scrollTop + clientHeight >= scrollHeight - 20) {
        if (!isLoadingDialogHistory.value && dialogHistoryPagination.value.page < dialogHistoryPagination.value.totalPages - 1) {
            fetchDialogHistory(dialogHistoryPagination.value.page + 1)
        }
    }
}

const fetchDialogHistory = async (page = 0) => {
    if (!selectedHistoryItem.value || !selectedHistoryItem.value.no) return

    // Prevent duplicate calls if already loading
    if (isLoadingDialogHistory.value) return

    isLoadingDialogHistory.value = true
    try {
        const data = await store.fetchItemLedgerEntries(
            selectedHistoryItem.value.no,
            dialogSelectedYear.value,
            page,
            dialogHistoryPagination.value.size,
            selectedCompanyId.value
        )

        if (data && data.content) {
            if (page === 0) {
                dialogHistoryEntries.value = data.content
            } else {
                dialogHistoryEntries.value = [...dialogHistoryEntries.value, ...data.content]
            }

            dialogHistoryPagination.value = {
                ...dialogHistoryPagination.value,
                page: data.page !== undefined ? data.page : (data.number !== undefined ? data.number
                    : 0),
                totalElements: data.totalElements !== undefined ? data.totalElements : 0,
                totalPages: data.totalPages !== undefined ? data.totalPages : 1
            }

            if (data.quantityByEntryType) {
                dialogHistoryKpis.value = {
                    ...dialogHistoryKpis.value,
                    vente: data.quantityByEntryType.Sale || 0,
                    achat: data.quantityByEntryType.Purchase || 0,
                    rupt: data.quantityByEntryType.Rupture || 0
                }
            }
        } else {
            const items = Array.isArray(data) ? data : []
            if (page === 0) {
                dialogHistoryEntries.value = items
            } else {
                dialogHistoryEntries.value = [...dialogHistoryEntries.value, ...items]
            }
            dialogHistoryPagination.value.totalElements = dialogHistoryEntries.value.length
            dialogHistoryPagination.value.page = 0
            dialogHistoryPagination.value.totalPages = 1
        }
    } catch (error) {
        console.error('Error fetching dialog history:', error)
        if (page === 0) dialogHistoryEntries.value = []
    } finally {
        isLoadingDialogHistory.value = false
        checkAndLoadMoreDialog()
    }
}

const changeYear = (delta) => {
    selectedYear.value += delta
}

const changeDialogYear = (delta) => {
    dialogSelectedYear.value += delta
}

const fetchIntercompanyStock = async () => {
    if (!selectedHistoryItem.value || !selectedHistoryItem.value.no) return

    isLoadingIntercompanyStock.value = true
    try {
        const data = await store.fetchIntercompanyStock(selectedHistoryItem.value.no)
        intercompanyStocks.value = data || []
    } catch (error) {
        console.error('Error fetching intercompany stock:', error)
        intercompanyStocks.value = []
    } finally {
        isLoadingIntercompanyStock.value = false
    }
}

// Watch for selection or year changes to refresh sidebar history
watch([selectedHistoryItem, selectedYear], () => {
    if (selectedHistoryItem.value && !showHistoryDialog.value) {
        fetchHistory(0)
        fetchIntercompanyStock()
    }
}, { immediate: true })

// Watch for dialog opening, company or dialog year changes to refresh history in dialog
watch([showHistoryDialog, selectedCompanyId, dialogSelectedYear], () => {
    if (showHistoryDialog.value && selectedHistoryItem.value) {
        fetchDialogHistory(0)
    }
})

const calculatePU = (entry) => {
    if (!entry) return 0
    const qty = Math.abs(entry.quantity) || 1

    if (entry.entryType === 'Sale') {
        const amount = entry.salesAmountActual || entry.salesAmountExpected || 0
        return amount / qty
    } else if (entry.entryType === 'Purchase') {
        const amount = entry.costAmountActual || entry.costAmountExpected || 0
        return amount / qty
    }
    return 0
}

/* Symboles colonne T — IDENTIQUES à C2 (histTypeLetter/histTypeClass) :
   Achat=A (bleu) · Vente=V (vert) · Rupture=R (rouge) · Transfert=T (orange). */
const getEntryTypeLetter = (entryType) =>
    ({ Purchase: 'A', Sale: 'V', Rupture: 'R', Transfer: 'T' }[entryType] || (entryType ? entryType[0] : ''))

const getEntryTypeClass = (entryType) =>
    ({ Purchase: 'Achat', Sale: 'Vente', Rupture: 'Rupture', Transfer: 'Transfert' }[entryType] || 'Transfert')

const getMasterErpClass = (referenceMaster) => {
    if (!referenceMaster) return ''

    // Compare with the original full item number from props (which includes "MASTER")
    // instead of the stripped masterItemNo used in the header
    const currentMaster = props.line?.itemNo ? props.line.itemNo.trim() : ''
    const refMaster = referenceMaster.toString().trim()

    // Case-insensitive comparison
    return currentMaster.toLowerCase() === refMaster.toLowerCase() ? 'master-erp-match' : 'master-erp-mismatch'
}

const isItemSelected = (item) => {
    if (!selectedHistoryItem.value) return false
    // If both have IDs, compare IDs
    if (item.id !== undefined && selectedHistoryItem.value.id !== undefined) {
        return item.id === selectedHistoryItem.value.id
    }
    // Otherwise fallback to comparing item numbers
    return item.no === selectedHistoryItem.value.no
}

const getPercentageChange = (detail, field1, field2) => {
    const value1 = detail[field1]
    const value2 = detail[field2]

    if (value2 === null || value2 === undefined || value2 === 0) return null
    if (value1 === null || value1 === undefined) return null

    const percentageChange = ((value1 - value2) / value2) * 100

    if (Math.abs(percentageChange) < 0.01) return null // Don't show if ~0%
    const arrow = percentageChange > 0 ? '↑' : percentageChange < 0 ? '↓' : ''
    const sign = percentageChange > 0 ? '+' : ''

    return `${arrow} ${sign}${percentageChange.toFixed(1)}%`
}

const calculatePercentageChange = (value1, value2) => {
    if (value2 === null || value2 === undefined || value2 === 0) return null
    if (value1 === null || value1 === undefined) return null

    const percentageChange = ((value1 - value2) / value2) * 100

    // Always show percentage, even if 0
    const arrow = percentageChange > 0 ? '↑' : percentageChange < 0 ? '↓' : ''
    const sign = percentageChange > 0 ? '+' : ''

    return `${arrow} ${sign}${percentageChange.toFixed(1)}%`
}

const getPercentageClass = (percentageText) => {
    if (!percentageText) return ''
    if (percentageText.includes('↑')) return 'percentage-increase'
    if (percentageText.includes('↓')) return 'percentage-decrease'
    return 'percentage-neutral'
}

const fetchDetails = async (silent = false) => {
    if (!props.line || !props.line.compareQuoteNo || !props.line.itemNo)
        return

    if (!silent) {
        isLoadingDetails.value = true
        isLoadingSecondaryData.value = true
        // Clear previous state before fetching to prevent mixing old data
        quoteLineDetails.value = []
        equivalenceItems.value = []
        kitItems.value = []
    }
    try {
        const data = await
            store.fetchQuoteLineDetails(props.line.compareQuoteNo,
                props.line.itemNo)
        quoteLineDetails.value = Array.isArray(data) ? data : [data]

        // Show Suppliers table immediately
        if (!silent) isLoadingDetails.value = false

        if (quoteLineDetails.value.length > 0) {
            const firstDetail = quoteLineDetails.value[0]
            selectedDetail.value = firstDetail
            selectedHistoryItem.value = firstDetail
            historyKpis.value.stock = firstDetail.inventoryWithoutImport || 0

            // 2. Load Equivalence
            await fetchEquivalenceItems(firstDetail)

            // 3. Load Kit
            await fetchKitItems(firstDetail.no)

            // Fetch total amount for the first detail
            if (firstDetail.documentNo) {
                selectedDocumentNo.value = firstDetail.documentNo
                try {
                    const amount = await store.fetchTotalAmount(firstDetail.documentNo)
                    totalAmount.value = amount
                } catch (error) {
                    console.error('Error fetching total amount:', error)
                    totalAmount.value = null
                }
            } else {
                selectedDocumentNo.value = null
                totalAmount.value = null
            }

            // 4. Load secondary data (Intercompany Stock, Last Invoiced, Prices)
            // isLoadingSecondaryData.value = true // Already set at start
            try {
                const secondaryPromises = [
                    fetchIntercompanyStock(),
                    fetchLastInvoicedCosts()
                ]

                // Fetch all purchase prices for comparison for ALL unique items
                purchasePricesByItem.value = new Map()
                const uniqueItems = [...new Set(quoteLineDetails.value.map(d => d.no))].filter(Boolean)

                const pricePromises = uniqueItems.map(async (itemNo) => {
                    try {
                        const prices = await store.fetchPurchasePrices(itemNo)
                        purchasePricesByItem.value.set(itemNo, prices || [])

                        // Keep backward compatibility for single item view if needed
                        if (itemNo === (firstDetail.no || props.line.itemNo)) {
                            allPurchasePrices.value = prices || []
                        }
                    } catch (err) {
                        console.error(`Error fetching purchase prices for item ${itemNo}:`, err)
                    }
                })

                await Promise.all([...secondaryPromises, ...pricePromises])
            } catch (error) {
                console.error('Error loading secondary data:', error)
            } finally {
                isLoadingSecondaryData.value = false
            }
        } else {
            isLoadingSecondaryData.value = false
        }
    } catch (error) {
        console.error('Error fetching details:', error)
        isLoadingSecondaryData.value = false
    } finally {
        if (!silent) isLoadingDetails.value = false
    }
}

const fetchEquivalenceItems = async (detail, page = 0) => {
    if (!detail || !props.line.itemNo || !detail.no) return

    // Prevent duplicate calls only for pagination (not for initial load)
    if (page > 0 && isLoadingEquivalence.value) return

    // Reset scroll position if loading first page
    if (page === 0 && equivalenceTableWrapper.value) {
        equivalenceTableWrapper.value.scrollTop = 0
    }

    isLoadingEquivalence.value = true
    try {
        const data = await store.fetchEquivalenceItems(
            props.line.itemNo,
            detail.no,
            page,
            equivalencePagination.value.size,
            props.line.compareQuoteNo
        )

        // Prevent stale results from overwriting if we switched items
        if (detail.no !== (selectedDetail.value ? selectedDetail.value.no : null)) {
            return
        }

        if (data && data.content) {
            const newItems = data.content.map(item => ({
                ...item,
                quantityToOrder: 1
            }))

            if (page === 0) {
                equivalenceItems.value = newItems
            } else {
                equivalenceItems.value = [...equivalenceItems.value, ...newItems]
            }

            equivalencePagination.value = {
                ...equivalencePagination.value,
                page: data.page !== undefined ? data.page : (data.number !==
                    undefined ? data.number : 0),
                totalElements: data.totalElements !== undefined ? data.totalElements
                    : 0,
                totalPages: data.totalPages !== undefined ? data.totalPages : 1
            }
        } else {
            const items = Array.isArray(data) ? data : [data]
            const newItems = items.map(item => ({
                ...item,
                quantityToOrder: 1
            }))

            if (page === 0) {
                equivalenceItems.value = newItems
            } else {
                equivalenceItems.value = [...equivalenceItems.value, ...newItems]
            }

            equivalencePagination.value.totalElements =
                equivalenceItems.value.length
            equivalencePagination.value.page = 0
            equivalencePagination.value.totalPages = 1
        }
    } catch (error) {
        console.error('Error fetching equivalence items:', error)
        if (page === 0) equivalenceItems.value = []
    } finally {
        isLoadingEquivalence.value = false
    }
}

const onEquivalenceScroll = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.target
    // Load more when user is near bottom (20px threshold)
    if (scrollTop + clientHeight >= scrollHeight - 20) {
        if (!isLoadingEquivalence.value && equivalencePagination.value.page < equivalencePagination.value.totalPages - 1) {
            fetchEquivalenceItems(selectedDetail.value, equivalencePagination.value.page + 1)
        }
    }
}

const fetchKitItems = async (itemNo, page = 0) => {
    if (!itemNo) return

    isLoadingKit.value = true
    try {
        const data = await store.fetchKitItems(
            itemNo,
            page,
            kitPagination.value.size,
            props.line.compareQuoteNo
        )

        // Prevent stale results from overwriting if we switched items
        if (itemNo !== (selectedDetail.value ? selectedDetail.value.no : null)) {
            return
        }

        if (data && data.content) {
            kitItems.value = data.content.map(item => ({
                ...item,
                quantityToOrder: 1
            }))
            kitPagination.value = {
                ...kitPagination.value,
                page: data.page !== undefined ? data.page : (data.number !==
                    undefined ? data.number : 0),
                totalElements: data.totalElements !== undefined ? data.totalElements
                    : 0,
                totalPages: data.totalPages !== undefined ? data.totalPages : 1
            }
        } else {
            const items = Array.isArray(data) ? data : [data]
            kitItems.value = items.map(item => ({
                ...item,
                quantityToOrder: 1
            }))
            kitPagination.value.totalElements = kitItems.value.length
            kitPagination.value.page = 0
            kitPagination.value.totalPages = 1
        }
    } catch (error) {
        console.error('Error fetching kit items:', error)
        kitItems.value = []
    } finally {
        isLoadingKit.value = false
    }
}

// Watch for line changes to refetch data
watch(() => props.line, async () => {
    selectedHistoryItem.value = null
    selectedYear.value = new Date().getFullYear()
    fetchOemCount()
    await fetchDetails()
    fetchVerificationStatus()
    activeRightPanel.value = 'history'
}, { deep: true })

// Watch for verification dialog close to refresh data if an article was created
watch(showVerificationDialog, (newValue) => {
    if (!newValue && hasCreatedArticleMaster.value) {
        fetchDetails()
        fetchVerificationStatus()
        hasCreatedArticleMaster.value = false
    }
})

const activeRightPanel = ref('history') // 'history' or 'cart'
const activeCartTab = ref('current') // 'current' or 'all'
const cartFilters = ref({
    compareQuoteNo: '',
    status: null,
    itemNo: '',
    vendorNo: ''
});

let debounceTimeout = null;
const debouncedFilter = () => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        applyFilters();
    }, 500);
};

const applyFilters = (page = 0) => {
    const pageNum = typeof page === 'number' ? page : 0;
    store.fetchCartItems(cartFilters.value, pageNum);
};

const switchCartTab = (tab) => {
    activeCartTab.value = tab;
    if (tab === 'current') {
        cartFilters.value.compareQuoteNo = props.line ? props.line.compareQuoteNo : '';
    } else {
        cartFilters.value.compareQuoteNo = '';
    }
    applyFilters();
};

const clearCartFilters = () => {
    cartFilters.value = {
        compareQuoteNo: activeCartTab.value === 'current' && props.line ? props.line.compareQuoteNo : '',
        status: null,
        itemNo: '',
        vendorNo: ''
    };
    applyFilters();
};

const openCartSidebar = () => {
    if (activeRightPanel.value === 'cart') {
        activeRightPanel.value = 'history';
    } else {
        activeRightPanel.value = 'cart';
        activeCartTab.value = 'current';
        // Reset filters
        cartFilters.value = {
            compareQuoteNo: props.line ? props.line.compareQuoteNo : '',
            status: null,
            itemNo: '',
            vendorNo: ''
        };
        applyFilters();
    }
};
onMounted(async () => {
    window.addEventListener('keydown', handleKeyDown)
    if (props.line && props.line.compareQuoteNo) {
        store.fetchCartCount(props.line.compareQuoteNo)
    }
    fetchOemCount()
    await fetchDetails()
    fetchVerificationStatus()
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
})

const openHistory = (company, companyId = null, stock = 0) => {
    selectedCompany.value = company
    selectedCompanyId.value = companyId
    dialogSelectedYear.value = new Date().getFullYear()
    dialogHistoryKpis.value.stock = stock
    showHistoryDialog.value = true
}

const textRight = {
    textAlign: 'right'
}

const focusNextField = (currentField, detailId) => {
    let nextFieldId = ''

    if (currentField === 'askingPrice') {
        nextFieldId = `askingQty-${detailId}`
    } else if (currentField === 'askingQty') {
        nextFieldId = `quantity-${detailId}`
    } else if (currentField === 'quantity') {
        nextFieldId = `validateBtn-${detailId}`
    }

    if (nextFieldId) {
        const element = document.getElementById(nextFieldId)
        if (element) {
            element.focus()
            if (currentField !== 'quantity') { // Don't select text for button
                if (element instanceof HTMLInputElement) {
                    element.select()
                }
            }
        }
    }
}
</script>

<style scoped>
.text-right {
    text-align: right !important;
}

.clickable-cell {
    cursor: pointer;
    color: #2563eb;
    text-decoration: underline;
    text-decoration-style: dotted;
    transition: all 0.2s;
}

.clickable-cell:hover {
    color: #1d4ed8;
    text-decoration-style: solid;
    background-color: rgba(37, 99, 235, 0.05);
}

/* Prix « Dernier Achat » cliquable → dialog Der P partagé (discret, aligné C2). N'affecte pas la largeur de colonne. */
.derp-link {
    cursor: pointer;
}
.derp-link:hover {
    color: #1859b3;
    text-decoration: underline;
    text-underline-offset: 2px;
}

.line-detail-container {
    padding: 15px;
    background-color: #f1f5f9;
    height: calc(100vh - 90px);
    display: flex;
    flex-direction: column;
    gap: 15px;
    font-family: var(--c2-font-sans);
    overflow: hidden;
}

/* Top Header Styles */
.top-header {
    display: flex;
    align-items: center;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px 10px;
    gap: 0;
    width: 100%;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.back-btn {
    width: 2%;
    color: #3b82f6 !important;
    padding: 0 !important;
}

.item-info {
    width: 17%;
    display: flex;
    justify-content: space-between;
    padding-left: 5px;
    height: 54px;
    margin: 10px;
    align-items: center;
}

.info-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    padding: 4px 15px;
    height: 100%;
    border: 1px solid #3b82f6;
    border-radius: 10px;
    margin-right: 5px;
    gap: 2px;
}

.item-no {
    font-size: 1.3rem;
    font-weight: 800;
    margin: 0;
    color: #1e293b;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-bottom: 2px;
}

.item-desc {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
}

.info-right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    min-width: fit-content;
    padding: 0;
    height: 100%;
    margin-left: auto;
    gap: 5px;
}

.status-dot-container {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 0;
    padding: 0;
}



.description-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.item-desc {
    flex: 1;
}

.page-indicator-badge {
    background-color: white;
    color: #1e293b;
    padding: 0 8px;
    border-radius: 10px;
    font-weight: 800;
    font-size: 0.9rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    border: 1px solid #3b82f6;
    margin: 10px;
    white-space: nowrap;
}

.header-middle {
    width: 6%;
    display: flex;
    justify-content: center;
    padding-right: 0;
}

.count-badge {
    background-color: white;
    color: #3b82f6;
    padding: 0 4px;
    border-radius: 8px;
    font-weight: 800;
    font-size: 1.1rem;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    border: 3px solid #3b82f6;
    margin: 10px;
}

.count-badge.clickable:hover {
    background-color: #eff6ff;
    border-color: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
}

.header-stocks {
    width: 59%;
    display: flex;
    align-items: center;
    border: 1px solid #3b82f6;
    border-radius: 10px;
    height: 54px;
    overflow: hidden;
    background-color: #f8fafc;
}

.stock-column {
    height: 100%;
    display: flex;
    align-items: center;
    position: relative;
}

.stock-column.label-column {
    width: 10%;
    justify-content: center;
}

.stock-column.dynamic-column {
    flex: 1;
}

.stock-column:not(:last-child)::after {
    content: "";
    position: absolute;
    right: 0;
    top: 15%;
    height: 70%;
    width: 3px;
    background-color: #3b82f6;
    opacity: 0.6;
}

.stocks-label {
    color: #3b82f6;
    font-weight: 800;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    width: 100%;
    text-align: center;
}

.stock-part {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 5px;
    position: relative;
}

.stock-part.stock.clickable {
    cursor: pointer;
    transition: background-color 0.2s;
}

.stock-part.stock.clickable:hover {
    background-color: #f1f5f9;
}

.stock-part.ste {
    width: 35%;
}

.stock-part.stock {
    width: 25%;
}

.stock-part.purchase {
    width: 40%;
}

.stock-part:not(:last-child)::after {
    content: "";
    position: absolute;
    right: 0;
    top: 30%;
    height: 40%;
    width: 1px;
    background-color: #e2e8f0;
}

.stock-label-mini {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 700;
    text-transform: uppercase;
    line-height: 1;
    margin-bottom: 2px;
}

.stock-value-main {
    font-size: 1.0rem;
    font-weight: 800;
    color: #1e293b;
    line-height: 1.1;
}

.stock-value-main.company {
    color: #3b82f6;
    font-size: 0.9rem;
}

.stock-value-main.green {
    color: #16a34a;
}

.stock-value-main.red {
    color: #dc2626;
}

.stock-value-main.date {
    font-size: 0.85rem;
}

.company-badge {
    color: #3b82f6;
    font-weight: 700;
}

.order-total {
    width: 7%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(8px);
    border: 1px solid #3b82f6;
    padding: 0 4px;
    height: 54px;
    border-radius: 8px;
    color: #1e293b;
    font-weight: 700;
    font-size: 1.0rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    margin: 0 3px;
}

.order-total i {
    color: #3b82f6;
    font-size: 1rem;
}

.cart-btn {
    width: 3%;
    border: 1px solid #3b82f6;
    border-radius: 10px;
    padding: 0;
    background: #fff;
    cursor: pointer;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.cart-icon-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cart-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: #ef4444;
    color: white;
    border-radius: 10px;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    border: 2px solid white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    padding: 0 4px;
}

.cart-btn:hover {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
}

.cart-btn i {
    font-size: 1.6rem;
    color: #f59e0b;
}

.cart-tabs {
    display: flex;
    gap: 10px;
    margin-right: 10px;
}

.cart-tab-btn {
    background: transparent;
    border: 1px solid transparent;
    padding: 6px 16px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    border-radius: 20px;
    transition: all 0.2s ease;
}

.cart-tab-btn:hover {
    background-color: #f1f5f9;
    color: #334155;
}

.cart-tab-btn.active {
    background-color: #3b82f6;
    color: white;
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

/* Quantity Input Styles */
.qty-input-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
}

.qty-input-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.qty-input {
    flex: 1;
    min-width: 0;
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.95rem;
    color: #1e293b;
    background-color: #f8fafc;
    transition: all 0.2s ease;
    outline: none;
    text-align: right;
    appearance: none;
    -moz-appearance: textfield;
}

.qty-input.mini {
    padding: 6px 10px;
    font-size: 0.95rem;
}

.qty-input-wrapper.mini {
    margin-top: 4px;
}

.initial-tag {
    background-color: #f1f5f9;
    color: #64748b;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    border: 1px solid #e2e8f0;
    white-space: nowrap;
    flex-shrink: 0;
}

.info-icon {
    color: #3b82f6;
    cursor: pointer;
    transition: all 0.2s ease;
}

.info-icon:hover {
    color: #2563eb;
    transform: scale(1.2);
}

.validate-line-btn {
    background: none;
    border: none;
    color: #16a34a;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    border-radius: 4px;
    flex-shrink: 0;
}

.validate-line-btn:hover {
    color: #16a34a;
    background-color: #f0fdf4;
}

.validate-line-btn i {
    font-size: 1rem;
}

.qty-input:hover {
    border-color: #cbd5e1;
    background-color: #fff;
}

.qty-input:focus {
    border-color: #3b82f6;
    background-color: #fff;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Hide Spinners */
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.reason-select {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
    background-color: #f8fafc;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 16px;
    padding-right: 28px;
}

.reason-select:hover {
    border-color: #cbd5e1;
    background-color: #fff;
}

.reason-select:focus {
    border-color: #3b82f6;
    background-color: #fff;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.reason-select-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
}

.clear-reason-btn {
    position: absolute;
    right: 32px;
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    z-index: 1;
}

.clear-reason-btn:hover {
    color: #ef4444;
}

.clear-reason-btn i {
    font-size: 0.75rem;
}

/* Table Cell Styles */
.cell-reference {
    font-size: 1.1rem;
    font-weight: 800;
    color: #0f172a;
    /* Slate 900 */
    line-height: 1.2;
    margin-bottom: 4px;
    font-family: var(--c2-font-sans);
    letter-spacing: -0.025em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.status-favorable {
    color: #16a34a !important;
    /* Green 600 */
}

.status-unfavorable {
    color: #dc2626 !important;
    /* Red 600 */
}

.status-attention {
    color: #f97316 !important;
    /* Orange 500 */
}

/* Percentage Indicator Styles */
.percentage-indicator {
    display: inline-block;
    margin-left: 0;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    white-space: nowrap;
}

.percentage-increase {
    color: #ef4444 !important;
    background-color: #fee2e2 !important;
}

.percentage-decrease {
    color: #10b981 !important;
    background-color: #d1fae5 !important;
}

.percentage-neutral {
    color: #1e293b !important;
    background-color: #f1f5f9 !important;
}

.cell-description {
    font-size: 0.85rem;
    color: #64748b;
    /* Slate 500 */
    font-weight: 500;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.stock-tag {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 700;
    white-space: nowrap;
    width: 100%;
    transition: all 0.2s ease;
    border: 2px solid transparent;
    background-color: #f1f5f9;
    color: #475569;
}


/* Favorable styles - Solid green background */
.stock-tag.status-favorable {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    color: #065f46 !important;
    border-color: #34d399;
    font-weight: 800;
}

/* Unfavorable styles - Transparent with red border */
.stock-tag.status-unfavorable {
    background: transparent;
    color: #dc2626 !important;
    border-color: #dc2626;
    border-width: 2px;
    font-weight: 800;
}

/* Attention styles - Transparent with orange border */
.stock-tag.status-attention {
    background: transparent;
    color: #ea580c !important;
    border-color: #ea580c;
    border-width: 2px;
    font-weight: 800;
}

.stock-tag:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Import-specific styles */
.stock-tag.import-empty {
    background: transparent;
    color: #1e293b !important;
    border-color: #3b82f6;
    border-width: 2px;
    font-weight: 700;
}

.stock-tag.import-available {
    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    color: #065f46 !important;
    border-color: #34d399;
    font-weight: 800;
}

/* Qte Cmd-specific styles */
.stock-tag.qtecmd-empty {
    background: transparent;
    color: #1e293b !important;
    border-color: #475569;
    border-width: 2px;
    font-weight: 700;
}

.stock-tag.qtecmd-available {
    background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
    color: #7c2d12 !important;
    border-color: #fb923c;
    font-weight: 800;
}

.qty-tag {
    display: inline-flex;
    align-items: center;
    background: #f1f5f9;
    color: #475569;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 700;
    border: 1px solid #e2e8f0;
    margin-left: 6px;
    vertical-align: middle;
}

.qty-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #3b82f6;
    color: white;
    padding: 2px 6px;
    min-width: 20px;
    height: 18px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 800;
    margin-left: 6px;
    vertical-align: middle;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

/* Main Layout Styles */
.main-layout {
    display: flex;
    gap: 15px;
    flex-grow: 1;
    overflow: hidden;
    width: 100%;
}

.left-column {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 15px;
    overflow-y: auto;
    padding-right: 5px;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Le right panel adopte le modèle largeur FIXE de C2 (.c2-side) : la zone gauche
   (flex:1) absorbe le reste. Les 3 largeurs = tokens C2 exacts. */
.right-column {
    width: min(812px, 59vw);   /* +20% supplémentaire (ancien min(677px, 49vw) ; origine min(564px, 41vw)) */
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: white;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.05);
    height: 100%;
    overflow: hidden;
}

.right-column.collapsed {
    width: 54px;
}

.right-column.expanded {
    width: clamp(1008px, 74%, 1210px);   /* +20% supplémentaire (ancien clamp(840px, 62%, 1008px)) */
}

/* Modern Table Styles */
.table-container {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.left-column .table-container {
    flex-shrink: 0;
}

.table-header-row {
    background-color: #f8fafc;
    padding: 15px 15px;
    border-bottom: 1px solid #e2e8f0;
}

.table-title {
    font-weight: 700;
    font-size: 0.95rem;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.table-wrapper {
    overflow-x: auto;
    overflow-y: auto;
    flex-grow: 1;
    max-height: 600px;
}

.modern-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}

.modern-table th {
    background-color: #f1f5f9;
    color: #475569;
    font-weight: 700;
    font-size: 0.85rem;
    text-align: left;
    padding: 18px 15px;
    border-bottom: 2px solid #e2e8f0;
    white-space: nowrap;
    position: sticky;
    top: 0;
    z-index: 10;
}

.modern-table td {
    padding: 10px 15px;
    font-size: 0.9rem;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
    height: 40px;
    vertical-align: middle;
    overflow: hidden;
}

.modern-table tbody tr:nth-child(even) {
    background-color: #f8fafc;
}

.modern-table tbody tr:hover {
    background-color: #f1f5f9;
}

/* Type Indicator Circles */
.type-indicator-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 800;
    color: white;
    margin: 0 auto;
}

.type-s {
    background-color: #10b981;
    /* Green 500 */
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.type-p {
    background-color: #3b82f6;
    /* Blue 500 */
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.type-t {
    background-color: #f97316;
    /* Orange 500 */
    box-shadow: 0 2px 4px rgba(249, 115, 22, 0.2);
}

.type-r {
    background-color: #ef4444;
    /* Red 500 */
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
}

/* Table Footer & Pagination */
.table-footer {
    background-color: #f8fafc;
    padding: 8px 15px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.top-pagination {
    border-top: none;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 0;
    border-radius: 0;
}

.pagination-info {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 4px;
}

.p-btn {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s;
}

.p-btn:hover {
    background-color: #f1f5f9;
    color: #3b82f6;
    border-color: #3b82f6;
}

.p-current {
    font-size: 0.85rem;
    font-weight: 700;
    color: #3b82f6;
    padding: 0 10px;
}

/* Sidebar Specific Styles */
.sidebar-header {
    background-color: #f8fafc;
    padding: 15px;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.toggle-sidebar-btn {
    width: 3% !important;
    min-width: 32px;
    color: #3b82f6 !important;
    padding: 0 !important;
}

.item-title-inline {
    flex-grow: 1;
    font-weight: 800;
    font-size: 0.9rem;
    color: #1e293b;
    background: #f1f5f9;
    padding: 10px 12px;
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
}

.history-btn {
    width: 17%;
    background-color: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 10px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
}

.history-btn:hover {
    background-color: #2563eb;
}

.year-selector {
    width: 20%;
    border: 1px solid #dbeafe;
    border-radius: 10px;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f8fafc;
    box-shadow: 0 1px 2px rgba(59, 130, 246, 0.05);
}

.year-arrow {
    background: transparent;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    border-radius: 6px;
}

.year-arrow:hover {
    background-color: #eff6ff;
    transform: scale(1.1);
}

.year-arrow i {
    font-size: 0.75rem;
    font-weight: 700;
}

.year-display {
    font-weight: 800;
    font-size: 0.9rem;
    color: #1e40af;
    /* Blue 800 */
    min-width: 45px;
    text-align: center;
}

.stats-bar {
    display: flex;
    align-items: center;
    border: 1px solid #fdba74;
    border-radius: 8px;
    height: 40px;
    overflow: hidden;
    background-color: #fff7ed;
    flex-shrink: 0;
    /* Prevent shrinking */
}

.stats-column {
    width: 25%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    font-size: 0.85rem;
    color: #3b82f6;
    font-weight: 700;
}

.stats-column:not(:last-child)::after {
    content: "";
    position: absolute;
    right: 0;
    top: 20%;
    height: 60%;
    width: 1px;
    background-color: #fed7aa;
}

.history-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.history-container .table-wrapper {
    max-height: none !important;
    flex: 1;
    height: 0;
    /* Force flex child to respect container height */
    overflow-y: auto;
}

/* Panier d'achat : hauteur fixe pour garantir le scroll du DataTable PrimeVue */
.cart-table-wrapper {
    max-height: calc(100vh - 280px) !important;
    overflow-y: auto;
    overflow-x: auto;
    flex: 1;
}

/* Dialog Specific Styles */
.history-dialog :deep(.p-dialog-content) {
    padding: 20px !important;
    background-color: #f8fafc;
    border-radius: 20px;
}

.dialog-content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px !important;
}

.dialog-header {
    background: transparent;
    padding: 0;
    border: none;
}

.dialog-stats-bar {
    margin-bottom: 5px;
    flex-shrink: 0;
    /* Prevent shrinking */
}

.dialog-history-container {
    border: 1px solid #e2e8f0;
    background: white;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.dialog-history-container .table-wrapper {
    max-height: none !important;
    flex: 1;
    height: 0;
    overflow-y: auto;
}

.centered-footer {
    justify-content: center !important;
}

.pagination-controls.centered {
    gap: 15px;
}

.status-badge {
    background-color: #dcfce7;
    color: #166534;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
}

/* Navigation Arrows Styles */
.nav-arrow {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 100px;
    background: rgba(255, 255, 255, 0.4);
    border: 1px solid #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1000;
    border-radius: 6px;
}

.nav-arrow:hover {
    background: white;
    color: #3b82f6;
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    width: 38px;
}

.nav-arrow:active {
    transform: translateY(-50%) scale(0.98);
}

.nav-arrow.left {
    left: 10px;
}

.nav-arrow.right {
    right: 10px;
}

.nav-arrow i {
    font-size: 1.2rem;
}

/* Article Info Dialog Styles */
.info-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
}

.info-dialog-container {
    background: white;
    width: 1200px;
    max-width: 95vw;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid #e2e8f0;
}

.info-dialog-header {
    padding: 15px 20px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.info-dialog-header-title {
    color: #1e293b;
    /* Noir / Slate 900 */
    font-size: 1.4rem;
    font-weight: 700;
}

.info-dialog-header-right {
    display: flex;
    align-items: center;
    gap: 20px;
}

.tecalliance-logo {
    height: 50px;
}

.close-info-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    transition: color 0.2s;
    padding: 5px;
}

.header-filter-container {
    margin-left: auto;
    margin-right: 15px;
    display: flex;
    align-items: center;
}

.vendor-filter-select {
    padding: 6px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
    background-color: #f8fafc;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    min-width: 180px;
}

.vendor-filter-select:disabled {
    background-color: #f1f5f9;
    color: #94a3b8;
    cursor: not-allowed;
    border-color: #e2e8f0;
}

.vendor-filter-select:hover {
    border-color: #cbd5e1;
    background-color: #fff;
}

.vendor-filter-select:focus {
    border-color: #3b82f6;
    background-color: #fff;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.preferential-icon {
    font-size: 0.9rem;
    margin-left: 6px;
    vertical-align: middle;
    color: #cbd5e1;
    transition: all 0.2s ease;
}

.preferential-icon.active {
    color: #10b981;
    text-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
}

.preferential-icon.inactive {
    color: #ef4444;
}

.close-info-btn:hover {
    color: #ef4444;
}

.info-dialog-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.info-top-section {
    display: flex;
    gap: 20px;
    height: 500px;
}

.info-gallery {
    flex: 1;
    display: flex;
    gap: 15px;
    border: 1px solid #f59e0b;
    /* Orange border */
    padding: 10px;
    border-radius: 4px;
}

.thumbnail-list {
    width: 80px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
}

.thumb-item {
    width: 70px;
    height: 70px;
    border: 1px solid #e2e8f0;
    padding: 5px;
    cursor: pointer;
}

.thumb-item.active {
    border-color: #f59e0b;
}

.thumb-item img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.thumb-nav-btn {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 2px;
}

.thumbnail-scroll-container {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-right: 5px;
    /* Custom Scrollbar */
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
}

.thumbnail-scroll-container::-webkit-scrollbar {
    width: 6px;
}

.thumbnail-scroll-container::-webkit-scrollbar-track {
    background: transparent;
}

.thumbnail-scroll-container::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 3px;
    transition: background-color 0.2s;
}

.thumbnail-scroll-container::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
}

.thumbnail-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 10px;
    padding: 5px;
    background: rgba(248, 250, 252, 0.8);
    border-radius: 4px;
}

.thumb-page-btn {
    background: white;
    border: 1px solid #e2e8f0;
    color: #64748b;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.thumb-page-btn:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #3b82f6;
    color: #3b82f6;
}

.thumb-page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.thumb-page-info {
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
    min-width: 40px;
    text-align: center;
}

.main-image-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    position: relative;
    background: #f8fafc;
    border-radius: 8px;
    overflow: hidden;
}

.main-article-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.info-specs-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
    border: 1px solid #16a34a;
    /* Green border */
    padding: 15px;
    border-radius: 4px;
}

.brand-header {
    display: flex;
    gap: 15px;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #16a34a;
}

.brand-logo {
    height: 40px;
}

.brand-ref {
    font-weight: 800;
    font-size: 1.1rem;
    color: #1e293b;
}

.brand-desc {
    font-size: 0.9rem;
    color: #64748b;
}

.specs-table {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 350px;
    overflow-y: auto;
    padding-right: 5px;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
}

.specs-table::-webkit-scrollbar {
    width: 6px;
}

.specs-table::-webkit-scrollbar-track {
    background: transparent;
}

.specs-table::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 3px;
    transition: background-color 0.2s;
}

.specs-table::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
}

.spec-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    padding: 4px 0;
}

.spec-label {
    color: #64748b;
    font-weight: 500;
}

.spec-value {
    color: #1e293b;
    font-weight: 700;
    text-align: right;
    max-width: 60%;
}

.info-sections-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.info-section {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.info-section-header {
    background: #f8fafc;
    padding: 10px 15px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    color: #1e293b;
    font-size: 0.95rem;
}

.info-section-header i {
    color: #16a34a;
}

.info-section-content {
    padding: 15px;
}

.content-title {
    font-weight: 700;
    font-size: 1rem;
    color: #334155;
    margin-bottom: 12px;
    letter-spacing: -0.01em;
}

.oe-numbers-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    max-height: 200px;
    overflow-y: auto;
}

.oe-number-item {
    font-size: 0.9rem;
    font-weight: 500;
    color: #475569;
    text-align: left;
    padding: 2px 0;
}

.vehicles-list-container {
    max-height: 400px;
    overflow-y: auto;
    padding: 10px 0;
}

.vehicle-header {
    font-weight: 700;
    font-size: 1.1rem;
    color: #1e293b;
    padding-bottom: 15px;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 15px;
}

.brand-group {
    margin-bottom: 10px;
}

.brand-toggle-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 10px;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s;
    border-radius: 4px;
}

.brand-toggle-row:hover {
    background: #f8fafc;
}

.brand-toggle-row i {
    font-size: 0.8rem;
    color: #64748b;
}

.brand-name {
    font-weight: 700;
    font-size: 0.95rem;
    color: #334155;
    text-transform: uppercase;
}

.models-list {
    padding-left: 35px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 5px;
}

.model-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 0;
}

.model-plus-icon {
    font-size: 0.8rem;
    color: #16a34a;
    font-weight: 900;
}

.model-text {
    font-size: 0.95rem;
    color: #475569;
    font-weight: 500;
}

.no-data-message {
    color: #94a3b8;
    font-style: italic;
    font-size: 0.9rem;
    padding: 10px;
    text-align: center;
}

/* Loading State */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 15px;
}

.loading-state p {
    color: #64748b;
    font-size: 0.95rem;
    font-weight: 500;
}

/* No Image Placeholder */
.no-image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 40px;
    background: #f8fafc;
    border-radius: 4px;
}

.no-image-placeholder p {
    color: #94a3b8;
    font-size: 0.9rem;
    margin: 0;
}

/* Brand Name */
.brand-name {
    font-size: 0.85rem;
    color: #16a34a;
}

.pdf-item:hover {
    background: #f8fafc;
    border-color: #3b82f6;
    transform: translateX(4px);
}

.pdf-item i.pi-file-pdf {
    color: #dc2626;
    font-size: 1.2rem;
}

.pdf-item i.pi-external-link {
    color: #3b82f6;
    font-size: 0.9rem;
    margin-left: auto;
}

.pdf-item span {
    flex: 1;
    font-size: 0.9rem;
    font-weight: 500;
}

.info-dialog-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: 85vh;
    overflow-y: auto;
}

/* Active Row Indicator */
.bg-blue-100 {
    background-color: #dbeafe !important;
}

.bg-blue-100 td:first-child {
    position: relative;
}

.bg-blue-100 td:first-child::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: #3b82f6;
    box-shadow: 2px 0 4px rgba(59, 130, 246, 0.2);
}

.cell-description {
    font-size: 0.8rem;
    color: #64748b;
    text-align: left;
}

.comment-icon {
    font-size: 1.1rem;
    color: #94a3b8;
    transition: all 0.2s ease;
}

.comment-icon:hover {
    color: #3b82f6;
    transform: scale(1.1);
}

.comment-icon.has-comment {
    color: #3b82f6;
}

.comment-textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.95rem;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
}

.comment-textarea:focus {
    border-color: #3b82f6;
}

.comment-dialog :deep(.p-dialog-header) {
    padding: 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.comment-dialog :deep(.p-dialog-content) {
    padding: 1.5rem;
}

.comment-dialog :deep(.p-dialog-footer) {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
}

.comment-icon {
    font-size: 1.1rem;
    color: #94a3b8;
    transition: all 0.2s ease;
}

.comment-icon:hover {
    color: #3b82f6;
    transform: scale(1.1);
}

.comment-icon.has-comment {
    color: #3b82f6;
}
</style>

<style>
.p-overlaypanel.comment-overlay {
    width: 25vw !important;
    min-width: 25vw !important;
    max-width: 25vw !important;
}

.p-overlaypanel.comment-overlay .p-overlaypanel-content {
    padding: 0 !important;
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    box-sizing: border-box !important;
}

.comment-content {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
}

.comment-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    color: #64748b !important;
    margin-bottom: 8px !important;
    padding-bottom: 6px !important;
    border-bottom: 1px solid #f1f5f9 !important;
}

.comment-title {
    flex: 1 !important;
}

.comment-header .header-actions {
    display: flex !important;
    gap: 4px !important;
}

.comment-header .header-actions .p-button.p-button-icon-only {
    width: 24px !important;
    height: 24px !important;
    padding: 0 !important;
}

.comment-textarea {
    width: 100% !important;
    padding: 8px !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 6px !important;
    font-family: inherit !important;
    font-size: 0.9rem !important;
    resize: none !important;
    outline: none !important;
    transition: border-color 0.2s !important;
}

/* Custom Status Dropdown Styles */
.custom-status-dropdown .p-dropdown-label {
    display: flex;
    align-items: center;
}

.custom-status-dropdown-panel .p-dropdown-items {
    padding: 4px !important;
}

.custom-status-dropdown-panel .p-dropdown-item {
    border-radius: 6px !important;
    margin-bottom: 2px !important;
    padding: 8px 12px !important;
    font-size: 0.85rem !important;
    transition: all 0.2s !important;
}

.custom-status-dropdown-panel .p-dropdown-item:hover {
    background-color: #f1f5f9 !important;
    color: #3b82f6 !important;
}

.custom-status-dropdown-panel .p-dropdown-item.p-highlight {
    background-color: #eff6ff !important;
    color: #3b82f6 !important;
    font-weight: 700 !important;
}



/* TecDoc Verification Styles */
.status-dot-container {
    position: relative;
    display: inline-block;
    height: 100%;
}

.status-badge-rect {
    width: 140px;
    height: 100%;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    padding: 6px;
}

.status-badge-rect.loading {
    background-color: #94a3b8;
    animation: pulse 1.5s ease-in-out infinite;
}

.status-badge-rect.success {
    background-color: #10b981;
}

.status-badge-rect.warning {
    background-color: #f59e0b;
}

.status-badge-rect:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-badge-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: brightness(0) invert(1);
}

.status-dot-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: #dc2626;
    color: white;
    font-size: 12px;
    font-weight: 700;
    min-width: 22px;
    height: 22px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    box-shadow: 0 2px 6px rgba(220, 38, 38, 0.5);
    border: 2px solid white;
    pointer-events: none;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-block;
}

.status-badge.status-created {
    background: #d1fae5;
    color: #065f46;
}

.status-badge.status-not-created {
    background: #fef3c7;
    color: #92400e;
}

.status-badge.status-new {
    background-color: #dbeafe;
    color: #1e40af;
}

.status-badge.status-verified {
    background-color: #dcfce7;
    color: #166534;
}

.create-am-btn {
    background-color: white !important;
    color: #3b82f6 !important;
    border: 1px solid #3b82f6 !important;
    border-radius: 6px !important;
    font-weight: 600 !important;
    border-color: #3b82f6;
}

.comment-dialog :deep(.p-dialog-header) {
    padding: 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.comment-dialog :deep(.p-dialog-content) {
    padding: 1.5rem;
}

.comment-dialog :deep(.p-dialog-footer) {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
}

.comment-icon {
    padding: 6px;
    transition: all 0.2s;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
}

.comment-icon:hover {
    background-color: #f1f5f9;
    color: #3b82f6;
    border-radius: 6px;
}

.comment-icon.has-comment {
    color: #f97316 !important;
}

.comment-icon.has-comment:hover {
    background-color: #fff7ed;
    color: #ea580c !important;
    transform: translateY(-1px);
}

.comment-icon:hover {
    color: #3b82f6;
    transform: scale(1.1);
}

.comment-icon.has-comment {
    color: #3b82f6;
}

.rupture-row td {
    color: #dc2626 !important;
    font-weight: 600;
}

/* 360 Viewer Styles */
.viewer-360-toggle-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
    color: #3b82f6;
}

.viewer-360-toggle-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
    background: #f8fafc;
}

.viewer-360-container {
    width: 100%;
    height: 100%;
    position: relative;
    cursor: ew-resize;
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-360 {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    user-select: none;
    -webkit-user-drag: none;
}

.viewer-360-overlay {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    pointer-events: none;
    backdrop-filter: blur(4px);
}

.spin-icon {
    animation: spin 3s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.loading-more {
    text-align: center;
    padding: 10px;
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
}
</style>

<style>
.p-overlaypanel.comment-overlay {
    width: 25vw !important;
    min-width: 25vw !important;
    max-width: 25vw !important;
}

.p-overlaypanel.comment-overlay .p-overlaypanel-content {
    padding: 0 !important;
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    box-sizing: border-box !important;
}

.comment-content {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
}

.comment-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    color: #64748b !important;
    margin-bottom: 8px !important;
    padding-bottom: 6px !important;
    border-bottom: 1px solid #f1f5f9 !important;
}

.comment-title {
    flex: 1 !important;
}

.comment-header .header-actions {
    display: flex !important;
    gap: 4px !important;
}

.comment-header .header-actions .p-button.p-button-icon-only {
    width: 24px !important;
    height: 24px !important;
    padding: 0 !important;
}

.comment-textarea {
    width: 100% !important;
    padding: 8px !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 6px !important;
    font-family: inherit !important;
    font-size: 0.9rem !important;
    resize: none !important;
    outline: none !important;
    transition: border-color 0.2s !important;
}

/* TecDoc Verification Styles */
.status-dot-container {
    position: relative;
    display: inline-block;
    height: 100%;
}

.status-badge-rect {
    width: 140px;
    height: 100%;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    padding: 6px;
}

.status-badge-rect.loading {
    background-color: #94a3b8;
    animation: pulse 1.5s ease-in-out infinite;
}

.status-badge-rect.success {
    background-color: #10b981;
}

.status-badge-rect.warning {
    background-color: #f59e0b;
}

.status-badge-rect:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-badge-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: brightness(0) invert(1);
}

.status-dot-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: #dc2626;
    color: white;
    font-size: 12px;
    font-weight: 700;
    min-width: 22px;
    height: 22px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    box-shadow: 0 2px 6px rgba(220, 38, 38, 0.5);
    border: 2px solid white;
    pointer-events: none;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-block;
}

.status-badge.status-created {
    background: #d1fae5;
    color: #065f46;
}

.status-badge.status-not-created {
    background: #fef3c7;
    color: #92400e;
}

.create-am-btn {
    background-color: white !important;
    color: #3b82f6 !important;
    border: 1px solid #3b82f6 !important;
    border-radius: 6px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
    padding: 6px 12px !important;
    transition: all 0.2s ease !important;
}

.create-am-btn:hover {
    background-color: #eff6ff !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
}

.verify-btn {
    background-color: white !important;
    color: #f59e0b !important;
    border: 1px solid #f59e0b !important;
    border-radius: 6px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
    padding: 6px 12px !important;
    transition: all 0.2s ease !important;
}

.verify-btn:hover {
    background-color: #fffbeb !important;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.15);
}

.header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.history-btn {
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 24px;
    font-weight: 600;
    font-size: 0.9rem;
    min-width: 200px;
    text-align: center;
}

.dialog-btn {
    padding: 10px 20px !important;
    font-size: 1rem !important;
    min-width: 120px !important;
}

.dialog-btn .p-button-icon {
    font-size: 1.1rem !important;
}



.master-erp-match {
    color: #16a34a;
    font-weight: 700;
}

.master-erp-mismatch {
    color: #dc2626;
    font-weight: 700;
}

/* Custom Vendor Dropdown Style */
.vendor-dropdown-custom {
    border: 1px solid #e2e8f0 !important;
    border-radius: 6px !important;
    background-color: #f8fafc !important;
    transition: all 0.2s ease !important;
    box-shadow: none !important;
    height: 42px !important;
    /* Fixed height for better visibility */
    display: flex !important;
    align-items: center !important;
}

.vendor-dropdown-custom:hover {
    border-color: #cbd5e1 !important;
    background-color: #fff !important;
}

.vendor-dropdown-custom.p-focus {
    border-color: #3b82f6 !important;
    background-color: #fff !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

.vendor-dropdown-custom .p-dropdown-label {
    padding: 0 12px !important;
    font-size: 0.9rem !important;
    font-weight: 600 !important;
    color: #334155 !important;
    display: flex !important;
    align-items: center !important;
}

.vendor-dropdown-custom .p-dropdown-trigger {
    width: 2.5rem !important;
    color: #64748b !important;
}

/* Dialog Layout Styles */
.info-section {
    margin-bottom: 20px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
}

.info-section-header {
    background: #f8fafc;
    padding: 12px 15px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    color: #1e293b;
    font-size: 0.95rem;
}

.info-section-header i {
    color: #3b82f6;
    font-size: 1.1rem;
}

.info-section-content {
    padding: 15px;
    /* Add padding to prevent text touching borders */
}


.spec-row:last-child {
    border-bottom: none;
}

.spec-row:nth-child(even) {
    background-color: #f8fafc;
}

.spec-label {
    font-weight: 600;
    color: #64748b;
    font-size: 0.85rem;
    width: 35%;
    flex-shrink: 0;
}

.spec-value {
    font-weight: 700;
    color: #1e293b;
    font-size: 0.9rem;
    flex: 1;
    text-align: right;
    display: flex;
    justify-content: flex-end;
    align-items: center;
}

/* Specific override for rows containing inputs/dropdowns */
.spec-row:has(.vendor-dropdown-custom) .spec-value {
    width: 65%;
    flex: unset;
}

/* Cart action buttons */
.action-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.verify-btn {
    color: #10b981;
}

.verify-btn:hover:not(:disabled) {
    background-color: rgba(16, 185, 129, 0.1);
}

.cancel-btn {
    color: #ef4444;
}

.cancel-btn:hover:not(:disabled) {
    background-color: rgba(239, 68, 68, 0.1);
}


.cart-exists {
    color: #3b82f6;
}

.loading-indicator {
    padding: 10px;
    text-align: center;
    color: #64748b;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
}
.product-flag {
    color: #3b82f6; /* master reference blue */
    margin-left: 6px;
    font-size: 0.85rem;
    vertical-align: middle;
    display: inline-block;
}
</style>

<!-- ════════════════════════════════════════════════════════════════════════
     Harmonisation charte C2 du dialog LOCAL « Vérification TecDoc » (rendu uniquement).
     Tout est scopé sous .c2-verif* → AUCUN impact sur les autres dialogs locaux
     (OEM Count, etc.) qui partagent .history-dialog / .modern-table / .status-badge.
     Bloc déclaré en dernier => prime.
════════════════════════════════════════════════════════════════════════ -->
<style scoped>
/* ── Corps (l'arrondi unique + overflow sont gérés en bloc GLOBAL ci-dessous,
   car le .p-dialog téléporté est hors de portée du scoped) ── */
.c2-verif-dialog :deep(.p-dialog-content) {
    padding: 0 !important;
    background: #fff;
    display: flex; flex-direction: column; min-height: 0; overflow: hidden;
}
.c2-verif { flex: 1; min-height: 0; padding: 0 !important; gap: 0; display: flex; flex-direction: column; }

/* ── Header Deep Ocean — bande pleine largeur, texte blanc ── */
.c2-verif-head {
    flex-shrink: 0;
    background: var(--c2-head-bg);
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 13px 18px;
}
.c2-verif-head .header-actions { gap: 12px; align-items: center; }
.c2-verif-title {
    width: auto;
    background: transparent;
    color: #fff;
    padding: 0;
    font-weight: 800;
    font-size: 1.02rem;
    letter-spacing: .01em;
    cursor: default;
    flex-shrink: 0;
}
.c2-verif-title:hover { background: transparent; }
/* Sous-titre (réf master • désignation) = chip clair translucide sur navy */
.c2-verif-sub {
    background: rgba(255, 255, 255, .1);
    color: #eaf2fb;
    border-left: 3px solid var(--c2-head-accent, #82c9e5);
    font-weight: 700;
    font-size: 0.82rem;
    padding: 7px 12px;
}
/* Filtre fabricant — déclencheur PrimeVue Select navy translucide sur le header (charte C2).
   La liste ouverte est stylée globalement via panelClass="c2-dropdown-panel" (c2-charter.css). */
.c2-verif-filter.p-select {
    height: 32px;
    min-width: 150px;
    max-width: 230px;
    flex-shrink: 0;
    align-items: center;
    background: rgba(255, 255, 255, .1) !important;
    border: 1px solid rgba(255, 255, 255, .22) !important;
    border-radius: 8px !important;
    box-shadow: none !important;
}
.c2-verif-filter.p-select:hover { background: rgba(255, 255, 255, .16) !important; border-color: rgba(255, 255, 255, .32) !important; }
.c2-verif-filter.p-select.p-focus { border-color: var(--c2-head-accent, #82c9e5) !important; box-shadow: 0 0 0 3px rgba(130, 201, 229, .22) !important; }
.c2-verif-filter :deep(.p-select-label) { color: #fff; font-size: .8rem; font-weight: 600; padding: 0 4px 0 10px; display: flex; align-items: center; }
.c2-verif-filter :deep(.p-select-label.p-placeholder) { color: #e2e8f0; }
.c2-verif-filter :deep(.p-select-dropdown) { width: 26px; color: #cbd5e1; }
.c2-verif-filter :deep(.p-select-dropdown svg),
.c2-verif-filter :deep(.p-select-dropdown .p-icon) { width: 13px; height: 13px; color: #cbd5e1; }
/* Bouton fermer lisible sur navy */
.c2-verif-close { color: #cbd5e1 !important; flex-shrink: 0; }
.c2-verif-close:hover { color: #fff !important; background: rgba(255, 255, 255, .14) !important; }

/* ── Bandeau de stats : surface C2 neutre, KPI cobalt (inséré) ── */
.c2-verif .dialog-stats-bar {
    margin: 14px 18px 0;
    background: #f8fbff;
    border-color: #dbeafe;
    flex-shrink: 0;
}
.c2-verif .dialog-stats-bar .stats-column {
    color: var(--c2-primary, #1859b3);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
}

/* ── Corps table : inséré, scroll interne ── */
.c2-verif .dialog-history-container { margin: 14px 18px; flex: 1; min-height: 0; }

/* ── Footer pagination C2 — bande pleine largeur en bas ── */
.c2-verif-footer {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 18px;
    border-top: 1px solid var(--line, #e8edf3);
    background: #fcfdff;
    font-variant-numeric: tabular-nums;
}
.c2-verif-pageinfo { font-size: 0.78rem; font-weight: 700; color: var(--muted, #64748b); }
.c2-verif-pager-group { display: inline-flex; align-items: center; gap: 8px; }
.c2-verif-pagenum {
    font-size: 0.8rem; font-weight: 800; color: var(--ink, #0f172a);
    min-width: 64px; text-align: center; font-variant-numeric: tabular-nums;
    background: #fff; border: 1px solid var(--line, #e8edf3); border-radius: 999px; padding: 4px 12px;
}
.c2-verif-pager {
    width: 30px; height: 30px;
    border: 1px solid var(--line, #e8edf3);
    background: #fff;
    color: #475569;
    border-radius: 8px;
    cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    transition: background .15s ease, color .15s ease, border-color .15s ease, transform .1s ease;
}
.c2-verif-pager:hover:not(:disabled) { background: #eff6ff; color: var(--c2-primary, #1859b3); border-color: #bfdbfe; }
.c2-verif-pager:active:not(:disabled) { transform: translateY(1px); }
.c2-verif-pager:disabled { opacity: .4; cursor: default; }
</style>

<!-- ════════════════════════════════════════════════════════════════════════
     Bloc GLOBAL (non scopé) — UNIQUEMENT pour le .p-dialog téléporté du dialog
     Vérification TecDoc (classe unique `c2-verif-dialog`). Le scoped n'atteint pas
     l'élément racine PrimeVue téléporté → on force ici l'arrondi UNIQUE + le clip.
     Classe unique => aucun impact sur les autres dialogs.
════════════════════════════════════════════════════════════════════════ -->
<style>
/* Un seul arrondi : sur le .p-dialog (porte la classe), clippé pour rogner header/footer */
.c2-verif-dialog.p-dialog,
.c2-verif-dialog .p-dialog {
    max-height: 88vh;
    border-radius: 14px !important;
    overflow: hidden !important;
}
/* Le contenu interne ne pose AUCUN arrondi concurrent */
.c2-verif-dialog .p-dialog-content {
    border-radius: 0 !important;
}
</style>

<!-- ════════════════════════════════════════════════════════════════════════
     Header du détail comparateur — harmonisation charte C2 (Deep Ocean).
     CSS-ONLY (aucune modif de markup/handlers/conditions) : toutes les infos
     et toutes les actions sont conservées ; seules les couleurs/surfaces passent
     en navy + texte clair. Le badge statut TecDoc garde ses couleurs de STATUT
     (indicateur fonctionnel : gris=loading / vert=ok / orange=à créer).
     Bloc scopé déclaré en dernier => prime sur les règles header d'origine.
════════════════════════════════════════════════════════════════════════ -->
<style scoped>
/* Alignement charte : la page parente (.main-content) fournit déjà var(--c2-page-pad).
   On retire le padding 15px en trop du conteneur → header aligné avec les autres pages
   (le gap header/corps passe au gap compact charte). La hauteur étant en border-box,
   le corps récupère l'espace : aucun vide en bas.
   HAUTEUR = modèle C2 (.c2-root) : viewport - padding vertical de .main-content (2×pad).
   L'ancien calc(100vh - 90px) laissait ~74px de vide → le footer ne tombait pas en bas.
   Avec ce calc, le footer s'aligne avec le footer de la navbar comme les autres pages. */
.line-detail-container { padding: 0; gap: var(--c2-page-pad); height: calc(100vh - 2 * var(--c2-page-pad)); }

.top-header {
    /* Largeur FIXE de la zone gauche = zone « Confirmation Commandes Achat » de C2
       (mesuré au pixel : back 36 + gap 14 + titlewrap 272 = 322 ; -1 base = 321).
       → la bande STOCKS démarre exactement au même x qu'en C2. */
    --cmp-left-w: 321px;
    background: var(--c2-head-bg);
    border: 1px solid var(--c2-head-border);
    border-radius: var(--c2-head-radius, 12px);
    box-shadow: var(--c2-head-shadow, 0 4px 14px rgba(15, 23, 42, .25));
    height: var(--c2-head-h, 76px);
    flex-shrink: 0;      /* = header C2 : hauteur FIXE 76px (ne rétrécit pas sous le flex column) */
    box-sizing: border-box;
    padding: 0 0 0 16px; /* = padding C2 (left 16, right 0 → zone droite jusqu'au bord) */
    gap: 14px;           /* = gap du header C2 entre zones */
    overflow: visible;   /* laisse dépasser les pastilles (cart-badge / status-dot-badge en top:-8px) */
}
/* Zone gauche à largeur fixe → la bande STOCKS démarre au même x que C2 */
.top-header .cmp-header-left {
    width: var(--cmp-left-w);
    flex-shrink: 0;
    display: flex; align-items: center; gap: 8px;
    height: 100%; box-sizing: border-box;
}
.top-header .cmp-header-left .back-btn { width: 36px !important; flex-shrink: 0; padding: 0 !important; }
.top-header .cmp-header-left .item-info { width: auto; flex: 1 1 auto; min-width: 0; margin: 0; }
.top-header .cmp-header-left .header-middle { width: auto; flex-shrink: 0; margin: 0; padding: 0; }
.top-header .cmp-header-left .page-indicator-badge { width: auto; min-width: 64px; margin: 0; }
/* Hauteur stable : on annule le margin vertical des blocs internes (54px centrés dans 76px) */
.top-header .item-info,
.top-header .page-indicator-badge,
.top-header .count-badge { margin-top: 0; margin-bottom: 0; }

/* Retour */
.top-header .back-btn { color: #cbd5e1 !important; }
.top-header .back-btn:hover { color: #fff !important; }

/* Référence + désignation — CADRE SUPPRIMÉ (plus de bordure/fond) ;
   la réf reprend la MÊME police/taille que le titre « Confirmation Commandes Achat » de C2
   (Inter, 1.02rem, 800, letter-spacing -0.01em). L'icône check reste sur la même ligne. */
.top-header .info-left { border: none; background: transparent; border-radius: 0; padding: 0; }
/* Ligne 1 = réf + check + badge n° de ligne (fin). Ligne 2 (désignation) prend toute la largeur. */
.top-header .ref-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
.top-header .ref-row .item-no { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.top-header .item-no { color: #fff; font-size: 1.02rem; font-weight: 800; letter-spacing: -0.01em; line-height: 1.45; }
.top-header .item-desc { color: #cbd5e1; }
/* Badge n° de ligne — pilule fine sur navy */
.top-header .line-badge {
    display: inline-flex; align-items: center; gap: 5px;
    flex-shrink: 0; margin-left: auto;   /* poussé à l'extrême droite de la zone (avant STOCKS) */
    font-size: 0.84rem; font-weight: 700; font-variant-numeric: tabular-nums;
    color: #e2e8f0; background: rgba(255, 255, 255, .1);
    border: 1px solid rgba(255, 255, 255, .18); border-radius: 999px;
    padding: 4px 11px; line-height: 1; white-space: nowrap;
}
.top-header .line-badge i { font-size: 0.74rem; opacity: .85; }

/* Indicateur de ligne */
.top-header .page-indicator-badge { background: rgba(255, 255, 255, .1); color: #fff; border-color: rgba(255, 255, 255, .18); box-shadow: none; }

/* Compteur OEM (cliquable) */
.top-header .count-badge { background: rgba(255, 255, 255, .1); color: #fff; border-color: rgba(130, 201, 229, .5); box-shadow: none; }
.top-header .count-badge.clickable:hover { background: rgba(255, 255, 255, .18); border-color: var(--c2-head-accent, #82c9e5); box-shadow: none; }

/* Bande STOCKS — reproduction EXACTE du composant STOCKS de C2 (mêmes dimensions/police/design) */
.top-header .c2-stockband {
    flex: 1; display: flex; align-items: center; gap: 0;
    background: rgba(255, 255, 255, 0.06); border: 1px solid var(--c2-head-border); border-radius: 10px;
    padding: 0 12px; min-width: 0; height: 56px; max-height: 100%; overflow: hidden; box-sizing: border-box;
}
.top-header .c2-stocklabel { font-size: 14px; font-weight: 800; letter-spacing: .12em; color: var(--c2-head-accent); flex-shrink: 0; padding-right: 12px; }
.top-header .c2-stkcol { flex: 1; display: flex; align-items: center; height: 100%; min-width: 0; position: relative; }
.top-header .c2-stkcol:not(:last-child)::after { content: ""; position: absolute; right: 0; top: 18%; height: 64%; width: 1px; background: rgba(255, 255, 255, .18); }
.top-header .c2-stkpart { display: flex; flex-direction: column; justify-content: center; padding: 0 9px; min-width: 0; position: relative; }
.top-header .c2-stkpart:nth-child(1) { flex: 1.3; }
.top-header .c2-stkpart:nth-child(2) { flex: 1; }
.top-header .c2-stkpart:nth-child(3) { flex: 1.4; }
.top-header .c2-stkpart:not(:last-child)::after { content: ""; position: absolute; right: 0; top: 28%; height: 44%; width: 1px; background: rgba(255, 255, 255, .1); }
.top-header .c2-stkpart.click { cursor: pointer; border-radius: 6px; transition: background .15s; }
.top-header .c2-stkpart.click:hover { background: rgba(255, 255, 255, .08); }
.top-header .c2-stkmini { font-size: 11px; color: #9fb3c8; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; line-height: 1; margin-bottom: 3px; white-space: nowrap; }
.top-header .c2-stkval { font-size: 16px; font-weight: 800; color: #fff; line-height: 1.1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.top-header .c2-stkval.company { color: var(--c2-head-accent); font-size: 14px; }
.top-header .c2-stkval.pos { color: #34d399; }
.top-header .c2-stkval.neg { color: #f87171; }
.top-header .c2-stkval.date { font-size: 13px; color: #cbd5e1; font-weight: 700; }
.top-header .stock-column:not(:last-child)::after { background-color: rgba(255, 255, 255, .18); opacity: 1; }
.top-header .stocks-label { color: var(--c2-head-accent, #82c9e5); }
.top-header .stock-label-mini { color: #9fb3c8; }
.top-header .stock-value-main { color: #fff; }
.top-header .stock-value-main.company { color: var(--c2-head-accent, #82c9e5); }
.top-header .stock-value-main.green { color: #34d399; }
.top-header .stock-value-main.red { color: #f87171; }
.top-header .stock-part:not(:last-child)::after { background-color: rgba(255, 255, 255, .12); }
.top-header .stock-part.stock.clickable:hover { background-color: rgba(255, 255, 255, .08); }

/* Total demande de prix — reproduit le style C2 (.c2-total) : texte simple, n° DP gris au-dessus,
   montant bleu + TND. Pas de chip/bordure/icône calculatrice. */
/* Total — valeurs EXACTES de C2 (.c2-total) */
.top-header .order-total {
    width: auto; height: auto;
    background: transparent; border: none; box-shadow: none; backdrop-filter: none;
    display: flex; flex-direction: column; align-items: flex-start;
    gap: 0; padding: 0; margin: 0;
}
.top-header .order-total .doc-no { font-size: 0.66rem; color: #94a3b8; font-weight: 400; font-variant-numeric: tabular-nums; line-height: 1.45; white-space: nowrap; }
.top-header .order-total .amount { font-size: 1.12rem; color: #93c5fd; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.45; white-space: nowrap; }
.top-header .order-total .amount em { font-size: 0.66rem; font-style: normal; color: #94a3b8; font-weight: 600; font-variant-numeric: tabular-nums; }

/* Count OEM — chip vert C2 (.c2-oem), déplacé à droite (emplacement C2) */
.top-header .oem-chip {
    display: inline-flex; align-items: center; gap: 5px;
    background: transparent; border: 1px solid #16a34a; color: #4ade80;
    border-radius: 9px; padding: 7px 11px;
    font-family: var(--c2-font-sans);   /* sinon les <button> tombent sur Arial (UA) au lieu d'Inter */
    font-weight: 700; font-size: 0.82rem; font-variant-numeric: tabular-nums;
    cursor: pointer; flex-shrink: 0; height: auto;
}
.top-header .oem-chip.clickable:hover { background: rgba(22, 163, 74, .16); border-color: #22c55e; }
.top-header .oem-chip.z { color: #94a3b8; border-color: var(--c2-head-border); }
.top-header .oem-chip i { font-size: 0.9rem; }

/* Panier — reproduit le style C2 (.c2-cart) : chip navy + icône ambre + compteur INLINE ambre */
.top-header .cart-btn {
    width: auto; height: auto;
    background: #2b3a4f;
    border: 1px solid var(--c2-head-border);
    border-radius: 9px;
    padding: 7px 11px;
    flex-shrink: 0;
    color: #fdba74; font-weight: 700;   /* = c2-cart */
    font-family: var(--c2-font-sans);   /* sinon le compteur tombe sur Arial (UA) au lieu d'Inter */
}
.top-header .cart-btn:hover { background: #34465e; border-color: var(--c2-head-border); }
.top-header .cart-btn i { color: #fdba74; font-size: 1rem; }   /* = c2-cart icône 16px */
.top-header .cart-icon-wrapper { flex-direction: row; align-items: center; gap: 5px; }
/* La pastille flottante rouge devient un compteur ambre inline (= c2-cart : 13.33px / 700) */
.top-header .cart-badge {
    position: static; top: auto; right: auto;
    background: transparent; color: #fdba74;
    border: none; box-shadow: none;
    min-width: 0; height: auto; padding: 0; margin: 0;
    font-size: 0.833rem; font-weight: 700;
}

/* Zone droite — composants/espacement/largeurs identiques à C2 (.c2-header-right) :
   Total · OEM · Panier · bouton Vérification TecDoc (remplace le Confirmer C2). */
.top-header .cmp-header-right {
    display: flex; align-items: center; justify-content: space-between; gap: 14px;
    flex-shrink: 0;
    /* PAS de height:100% : comme C2, la zone (et donc la BARRE border-left) prend la hauteur
       de son contenu (~41px) et se centre dans le header → barre identique à C2. */
    width: min(812px, 59vw);   /* = largeur du panel droit en mode NORMAL (+20% supplémentaire) → limite gauche du bloc TOTAL alignée sur la limite gauche du panel droit */
    padding: 0 16px;
    border-left: 1px solid var(--c2-head-border);   /* = barre verticale C2 après STOCKS */
}
.top-header .cmp-header-right .status-dot-container { position: relative; flex-shrink: 0; display: flex; align-items: center; }

/* Bouton Vérification TecDoc : MÊME dimension que le bouton Confirmer C2 (.c2-confirm :
   padding 9px 16px, radius 9px, ombre) ; couleur de STATUT TecDoc conservée (orange/vert/gris). */
/* Bouton Vérification TecDoc = visuellement identique au bouton Confirmer C2 (.c2-confirm) :
   même taille (122px), radius 9, padding 9×16, ombre verte. Vert #16a34a par défaut (tout créé),
   ORANGE conservé quand il reste des réfs TecDoc à créer (état .warning). */
.top-header .status-badge-rect {
    width: 122px; height: 34px; box-sizing: border-box;   /* = taille EXACTE du bouton Confirmer C2 (34px) */
    padding: 9px 16px; border-radius: 9px; border: none;
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;   /* = c2-confirm (icône + texte) */
    color: #fff; font-weight: 700; font-size: 0.833rem;   /* = police du texte Confirmer */
    box-shadow: 0 4px 12px rgba(22, 163, 74, .3);   /* = ombre verte Confirmer */
    transition: background .2s ease, box-shadow .2s ease;
}
.top-header .status-badge-rect i { font-size: 16px; }   /* = icône Confirmer (pi 16px) */
.top-header .status-badge-text { font-weight: 700; }
.top-header .status-badge-rect:hover { transform: none; }   /* annule le translateY de base → comme Confirmer */
/* Tout créé → VERT identique au Confirmer */
.top-header .status-badge-rect.success { background: #16a34a; }
.top-header .status-badge-rect.success:hover { background: #15803d; box-shadow: 0 6px 16px rgba(22, 163, 74, .4); }
/* Réfs à créer → ORANGE conservé (+ ombre orange cohérente) */
.top-header .status-badge-rect.warning { background: #f59e0b; box-shadow: 0 4px 12px rgba(245, 158, 11, .35); }
.top-header .status-badge-rect.warning:hover { background: #d97706; box-shadow: 0 6px 16px rgba(245, 158, 11, .45); }
/* Chargement → gris neutre */
.top-header .status-badge-rect.loading { background: #94a3b8; box-shadow: none; }
.top-header .status-badge-icon { width: auto; height: 20px; }

/* ════════════════════════════════════════════════════════════════════════
   RIGHT PANEL Historique / Panier — RÉPLIQUE EXACTE de la sidebar C2 (.c2-side).
   Markup + 3 états (collapsed/normal/expanded) + design copiés tels quels de
   ConfirmationAchatDetailC2.vue. Tokens locaux redéfinis ici (le composant
   comparateur ne les possède pas). Bloc en dernier => prime sur l'ancien CSS.
   ════════════════════════════════════════════════════════════════════════ */
.right-column.c2-side {
    --p: #2563eb; --p-soft: #eff6ff;
    --ink: #0f172a; --muted: #64748b;
    --line: #e8edf3; --line-soft: #f1f5f9;
    --ok: #16a34a; --bad: #dc2626; --warn: #ea580c;
    border: 1px solid var(--line); border-radius: 12px;
    overflow: hidden; box-sizing: border-box;
    font-family: var(--c2-font-sans);
}
/* Comme C2 (.c2-root button/input, ligne 2082) : <button>/<input>/<select> n'héritent
   PAS de font-family → on l'impose, sinon les onglets panier retombent en Arial (UA). */
.right-column.c2-side button,
.right-column.c2-side input,
.right-column.c2-side select { font-family: var(--c2-font-sans); }
/* L'historique/panier remplit la hauteur restante et défile en interne */
.right-column.c2-side .c2-hist { flex: 1; min-height: 0; overflow-y: auto; }

/* ── En-tête sidebar (Deep Ocean) ── */
.right-column.c2-side .c2-side-head { display: flex; align-items: center; justify-content: space-between; background: var(--c2-head-bg); color: #fff; padding: 10px 14px; flex-shrink: 0; }
.right-column.c2-side .c2-side-title { font-weight: 800; font-size: 0.78rem; letter-spacing: .04em; display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; }
.right-column.c2-side .c2-side-title i { color: var(--c2-head-accent); }
.right-column.c2-side .c2-side-headright { display: flex; align-items: center; gap: 8px; }
.right-column.c2-side .c2-year { display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 0.8rem; background: rgba(255,255,255,.08); border-radius: 7px; padding: 3px 9px; color: #fff; }
.right-column.c2-side .c2-year i { cursor: pointer; color: #cbd5e1; }
.right-column.c2-side .c2-year i:hover { color: #fff; }

/* ── Boutons collapse/expand ── */
.right-column.c2-side .c2-collapse { border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.14); color: #e2e8f0; width: 28px; height: 26px; border-radius: 7px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all .15s; flex-shrink: 0; }
.right-column.c2-side .c2-collapse:hover { background: #2563eb; border-color: #2563eb; color: #fff; }
.right-column.c2-side .c2-collapse i { font-size: 0.85rem; }
.right-column.c2-side .c2-collapse:disabled { opacity: .35; cursor: default; }
.right-column.c2-side .c2-collapse:disabled:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.25); color: #e2e8f0; }

/* ── Réf ligne sélectionnée + KPIs ── */
.right-column.c2-side .c2-side-ref { padding: 10px 14px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
.right-column.c2-side .c2-side-ref b { font-weight: 800; color: var(--ink); font-size: 0.92rem; }
.right-column.c2-side .c2-side-ref span { display: block; font-size: 0.78rem; color: var(--muted); }
.right-column.c2-side .c2-side-kpis { display: flex; border-bottom: 1px solid var(--line); background: #fcfdff; flex-shrink: 0; }
.right-column.c2-side .c2-side-kpis .kpi { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 9px 0; border-right: 1px solid var(--line-soft); }
.right-column.c2-side .c2-side-kpis .kpi:last-child { border-right: none; }
.right-column.c2-side .c2-side-kpis .kpi i { font-style: normal; font-size: 0.68rem; text-transform: uppercase; color: var(--muted); letter-spacing: .03em; }
.right-column.c2-side .c2-side-kpis .kpi b { font-size: 1.1rem; color: var(--ink); }
.right-column.c2-side .c2-side-kpis .kpi b.pos { color: var(--ok); }
.right-column.c2-side .c2-side-kpis .kpi b.neg { color: var(--bad); }

/* ── Table dense (historique + panier) ── */
.right-column.c2-side .c2-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.right-column.c2-side .c2-table th, .right-column.c2-side .c2-table td { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.right-column.c2-side .c2-table th {
    background: #f8fafc; color: #475569;
    font-size: 12.5px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase;
    text-align: right; padding: 10px 8px;
    border-bottom: 1.5px solid var(--line); border-right: 1px solid var(--line-soft);
    position: sticky; top: 0; z-index: 2;
}
.right-column.c2-side .c2-table th.left { text-align: left; }
.right-column.c2-side .c2-table th:last-child, .right-column.c2-side .c2-table td:last-child { border-right: none; }
.right-column.c2-side .c2-table td {
    padding: 8px 8px; text-align: right; vertical-align: middle;
    border-bottom: 1px solid var(--line-soft); border-right: 1px solid var(--line-soft);
    color: #334155; font-size: 14px;
}
.right-column.c2-side .c2-table td.left { text-align: left; }
.right-column.c2-side .c2-table td.num { font-weight: 650; color: var(--ink); font-variant-numeric: tabular-nums; }
.right-column.c2-side .c2-table td.mono { font-weight: 650; color: var(--ink); }
.right-column.c2-side .c2-table td.mono.muted, .right-column.c2-side .c2-table td.muted { color: var(--muted); font-weight: 500; }
.right-column.c2-side .c2-table td.neg { color: var(--bad); }
.right-column.c2-side .c2-table tbody tr:nth-child(even) { background: #fcfdfe; }
.right-column.c2-side .c2-table tbody tr:hover { background: #f5f9ff; }
/* Comme C2 (.c2-root .mono, charte §14) : les nombres restent en SANS (Inter),
   on ne garde que l'alignement tabulaire — PAS de police monospace. */
.right-column.c2-side .mono { font-family: inherit; font-variant-numeric: tabular-nums; }
.right-column.c2-side .muted { color: #94a3b8; }
.right-column.c2-side .c2-ref b { display: block; font-weight: 800; color: var(--ink); font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.right-column.c2-side .c2-ref span { display: block; font-size: 12.5px; color: var(--muted); margin-top: 1px; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.right-column.c2-side .c2-frs-code { font-family: inherit; font-size: 13.5px; font-weight: 700; color: var(--ink); line-height: 1.25; text-align: left; font-variant-numeric: tabular-nums; }

/* ── Indicateur Type (T) ── */
.right-column.c2-side .c2-typ { display: inline-block; width: 19px; height: 19px; line-height: 19px; text-align: center; border-radius: 5px; font-weight: 800; font-size: 0.64rem; }
.right-column.c2-side .c2-typ.Achat { background: #dbeafe; color: #1e40af; }
.right-column.c2-side .c2-typ.Vente { background: #dcfce7; color: #166534; }
.right-column.c2-side .c2-typ.Rupture { background: #fee2e2; color: #b91c1c; }
.right-column.c2-side .c2-typ.Transfert { background: #ffedd5; color: #c2410c; }

/* ── Actions panier ── */
.right-column.c2-side .c2-actcol { text-align: center !important; }
.right-column.c2-side .c2-acts { text-align: center; white-space: nowrap; line-height: 1; }
.right-column.c2-side .c2-acts i { display: inline-flex; align-items: center; justify-content: center; width: 25px; height: 25px; margin: 0 2px; vertical-align: middle; border-radius: 6px; color: #94a3b8; cursor: pointer; font-size: 0.95rem; background: transparent; transition: background .15s, color .15s; }
.right-column.c2-side .c2-acts i:hover { background: #f5f9ff; }
.right-column.c2-side .c2-acts i.ok { color: #86efac; }
.right-column.c2-side .c2-acts i.ok:hover { color: var(--ok); }
.right-column.c2-side .c2-acts i.pi-trash:hover { color: var(--bad); }

.right-column.c2-side .c2-empty { text-align: center !important; padding: 22px !important; color: #94a3b8; font-style: italic; }
.right-column.c2-side .c2-empty i { font-size: 1.1rem; margin-right: 6px; }

/* ── Onglets panier + statut + filtres + footer pagination ── */
.right-column.c2-side .c2-carttabs { display: inline-flex; background: rgba(255,255,255,.08); border-radius: 7px; padding: 2px; gap: 2px; }
.right-column.c2-side .c2-carttabs button { border: none; background: transparent; color: #cbd5e1; font-size: 0.7rem; font-weight: 700; padding: 3px 8px; border-radius: 5px; cursor: pointer; }
.right-column.c2-side .c2-carttabs button.on { background: #2563eb; color: #fff; }
.right-column.c2-side .c2-cart-status { display: inline-block; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; }
.right-column.c2-side .c2-cart-status.st-new { background: #eff6ff; color: #1d4ed8; }
.right-column.c2-side .c2-cart-status.st-verified { background: #dcfce7; color: #15803d; }
.right-column.c2-side .c2-cart-status.st-cancelled { background: #fee2e2; color: #b91c1c; }
.right-column.c2-side .c2-cart-filters { display: flex; align-items: center; gap: 6px; padding: 8px 10px; background: #f8fafc; border-bottom: 1px solid var(--line); flex-shrink: 0; }
.right-column.c2-side .c2-cf-input { min-width: 0; width: 64px; height: 28px; border: 1px solid #d8dee7; border-radius: 7px; padding: 0 8px; font-size: 0.78rem; color: var(--ink); background: #fff; box-sizing: border-box; font-family: var(--c2-font-sans); }
.right-column.c2-side .c2-cf-input:focus { outline: none; border-color: var(--p); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.right-column.c2-side .c2-cf-grow { flex: 1; }
.right-column.c2-side .c2-cf-status { width: 96px; flex-shrink: 0; cursor: pointer; }
.right-column.c2-side .c2-cf-clear { flex-shrink: 0; width: 28px; height: 28px; border: 1px solid #d8dee7; background: #fff; color: #94a3b8; border-radius: 7px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.right-column.c2-side .c2-cf-clear:hover { background: var(--p-soft); color: var(--bad); border-color: #fecaca; }
.right-column.c2-side .c2-cart-footer { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 8px; border-top: 1px solid var(--line); font-size: 0.78rem; font-weight: 700; color: var(--muted); flex-shrink: 0; background: #fcfdff; }
.right-column.c2-side .c2-pager-btn { width: 26px; height: 24px; border: 1px solid var(--line); background: #fff; color: #475569; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.right-column.c2-side .c2-pager-btn:hover:not(:disabled) { background: var(--p-soft); color: var(--p); border-color: #bfdbfe; }
.right-column.c2-side .c2-pager-btn:disabled { opacity: .4; cursor: default; }

/* ── Rail collapsed ── */
.right-column.c2-side.collapsed { padding: 0; }
.right-column.c2-side .c2-rail { flex: 1; height: 100%; min-height: 360px; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px 0; cursor: pointer; background: var(--c2-head-bg); color: #cbd5e1; }
.right-column.c2-side .c2-rail .c2-collapse { background: rgba(255,255,255,0.12); }
.right-column.c2-side .c2-rail-icon { font-size: 1.1rem; color: var(--c2-head-accent); margin-top: 4px; }
.right-column.c2-side .c2-rail-label { writing-mode: vertical-rl; transform: rotate(180deg); letter-spacing: 0.18em; font-size: 0.66rem; font-weight: 800; color: #94a3b8; }
.right-column.c2-side .c2-rail:hover .c2-rail-label { color: #e2e8f0; }
.right-column.c2-side .c2-rail-count { margin-top: 6px; background: #ea580c; color: #fff; font-size: 0.64rem; font-weight: 800; border-radius: 9px; padding: 1px 6px; }

/* ════════ FOOTER PAGE — réplique du .c2-footer (shell standard 48px, Deep Ocean).
   Pas de margin-top : .line-detail-container possède déjà gap var(--c2-page-pad). ════════ */
.cmp-footer {
    flex-shrink: 0;
    height: 48px; box-sizing: border-box;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 0 16px;
    background: var(--c2-head-bg);
    border: 1px solid var(--c2-head-border);
    border-radius: var(--c2-head-radius, 12px);
    box-shadow: var(--c2-head-shadow, 0 4px 14px rgba(15, 23, 42, .25));
    color: #fff;
}
.cmp-footer-label { font-weight: 800; font-size: 0.8rem; letter-spacing: .04em; color: #fff; white-space: nowrap; }
.cmp-footer-meta { min-width: 0; display: flex; align-items: baseline; gap: 8px; overflow: hidden; }
.cmp-footer-meta b { font-weight: 800; font-size: 0.82rem; color: #fff; font-variant-numeric: tabular-nums; white-space: nowrap; }
.cmp-footer-meta em { font-style: normal; font-size: 0.78rem; color: #fff; opacity: .8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ════════════════════════════════════════════════════════════════════════
   ZONE GAUCHE — HARMONISATION des 3 tables (FRS / EQV / KIT) avec C2.
   • Mêmes colonnes / mêmes données qu'avant (markup inchangé).
   • Hauteurs ÉGALES + scroll interne par table (shell identique à C2 :
     .c2-left { overflow:hidden } + .c2-grid { flex:1 1 0 } + .c2-tablewrap scroll).
   • Look carte C2 : bordure fine, rayon 12, en-tête barre d'accent + titre dense,
     table dense premium (th #f8fafc uppercase 12px, td 13.5px, zebra, hover #f5f9ff).
   ════════════════════════════════════════════════════════════════════════ */
/* — Shell : les 3 tables se partagent la hauteur, chacune défile en interne — */
.left-column { overflow: hidden; }
.left-column .table-container { flex: 1 1 0; min-height: 0; }
.left-column .table-header-row { flex-shrink: 0; }
.left-column .table-wrapper { flex: 1 1 auto; min-height: 0; max-height: none; overflow-y: auto; }

/* — Carte C2 — */
.left-column .table-container { border: 1px solid #e8edf3; border-radius: 12px; box-shadow: 0 1px 3px rgba(16, 24, 40, .05); }

/* — En-tête de section C2 : barre d'accent + titre dense — */
.left-column .table-header-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #fcfdff; border-bottom: 1px solid #e8edf3; }
.left-column .table-header-row::before { content: ""; width: 4px; height: 16px; border-radius: 3px; background: #1859B3; flex-shrink: 0; }
.left-column .sec-eqv .table-header-row::before { background: #0ea5e9; }
.left-column .sec-kit .table-header-row::before { background: #8b5cf6; }
.left-column .table-title { font-weight: 800; font-size: 0.74rem; letter-spacing: .08em; color: #0f172a; text-transform: uppercase; }
/* KPIs d'en-tête EQV/KIT (count + CMD + IMP) — identiques à C2 (.c2-count / .c2-sum) */
.left-column .table-header-row .c2-count { background: #eff6ff; color: #2563eb; font-weight: 800; font-size: 0.66rem; padding: 1px 8px; border-radius: 9999px; font-variant-numeric: tabular-nums; }
.left-column .table-header-row .c2-sum { display: inline-flex; align-items: center; padding: 1px 7px; border-radius: 9999px; font-size: 0.62rem; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: .02em; }
.left-column .table-header-row .c2-sum.cmd { color: #c2410c; background: #fff7ed; border: 1px solid #fed7aa; }
.left-column .table-header-row .c2-sum.imp { color: #1d4ed8; background: #eff6ff; border: 1px solid #dbeafe; }

/* — Table dense premium C2 — */
.left-column .modern-table th {
    background: #f8fafc; color: #475569;
    font-size: 12px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase;
    text-align: left; padding: 10px 10px; white-space: nowrap;
    border-bottom: 1.5px solid #e8edf3; border-right: 1px solid #f1f5f9;
    position: sticky; top: 0; z-index: 2;
}
.left-column .modern-table th:last-child { border-right: none; }
.left-column .modern-table td {
    padding: 8px 10px; font-size: 13.5px; color: #334155; height: auto;
    vertical-align: middle; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9;
}
.left-column .modern-table td:last-child { border-right: none; }
.left-column .modern-table tbody tr:nth-child(even) { background: #fcfdfe; }
.left-column .modern-table tbody tr:hover { background: #f5f9ff; }
/* Ligne sélectionnée = look C2 (.c2-table tr.sel) — prime sur l'utilitaire bg-blue-100 */
.left-column .modern-table tbody tr.bg-blue-100 { background: #eff6ff !important; box-shadow: inset 3px 0 0 #1859B3; outline: 1px solid #bfdbfe; outline-offset: -1px; }

/* — Densité du texte des cellules alignée sur C2 (réf 14px / désignation 12.5px) — */
.left-column .modern-table .cell-reference { font-size: 14px; font-weight: 700; letter-spacing: 0; margin-bottom: 1px; }
.left-column .modern-table .cell-description { font-size: 12.5px; }

/* — Colonne Appro (Import / Commandé) — badges (.c2-appro .imp/.cmd/.z) :
   quantité seule (sans lettre) · bleu = Import · orange = Commandé · neutre (.z) si 0 ·
   cliquable (souligné au survol) si > 0 · tooltip « Qté Import/Commandée : xxx » même à 0. */
.left-column .c2-appro { text-align: left; white-space: nowrap; }
.left-column .c2-appro span { display: inline-block; font-size: 11.5px; font-weight: 800; padding: 2px 7px; border-radius: 5px; margin-right: 4px; font-variant-numeric: tabular-nums; }
/* > 0 : bleu Import / orange Commandé plus FONCÉS & lisibles (charte C2, sans criard) */
.left-column .c2-appro .imp { color: #1e40af; background: #dbeafe; border: 1px solid #bfdbfe; }
.left-column .c2-appro .cmd { color: #9a3412; background: #ffedd5; border: 1px solid #fdba74; }
/* = 0 : valeur visible mais NEUTRE / discrète (prime sur .imp/.cmd) */
.left-column .c2-appro .z { color: #94a3b8; background: #f8fafc; border: 1px solid #eef2f7; }
.left-column .c2-appro .imp.clickable, .left-column .c2-appro .cmd.clickable { cursor: pointer; }
.left-column .c2-appro .imp.clickable:hover, .left-column .c2-appro .cmd.clickable:hover { text-decoration: underline; filter: brightness(0.92); }
</style>
