<template>
    <div class="line-detail-container">
        <!-- Section 1: Full-width Header -->
        <div class="top-header">
            <!-- 3% -->
            <Button icon="pi pi-arrow-left" text rounded @click="$emit('back')" class="back-btn" />

            <!-- 10% -->
            <div class="item-info">
                <div class="info-left">
                    <h1 class="item-no">{{ line.itemNo }}</h1>
                    <div class="description-row">
                        <span class="item-desc">{{ line.structuredDescription || line.description || 'Description'
                            }}</span>
                        <div class="page-indicator">
                            Ligne {{ currentIndex + 1 }} / {{ totalElements }}
                        </div>
                    </div>
                </div>
                <div class="info-right">
                    <div class="status-dot-container">
                        <div class="status-badge-rect" :class="statusDotClass" @click="openVerificationDialog"
                            :title="`TecDoc: ${verificationStatus?.countNotCreated || 0} à créer`">
                            <img src="/images/articles/tecalliance_partner.png" alt="TecAlliance"
                                class="status-badge-icon">
                        </div>
                        <span v-if="verificationStatus && verificationStatus.countNotCreated > 0"
                            class="status-dot-badge">{{ verificationStatus.countNotCreated }}</span>
                    </div>
                </div>
            </div>

            <!-- 7% -->
            <div class="header-middle">
                <div class="count-badge">
                    Count : {{ line.countItemManual || 0 }}
                </div>
            </div>

            <!-- 60% -->
            <div class="header-stocks">
                <div class="stock-column label-column">
                    <div class="stocks-label">STOCKS</div>
                </div>
                <div v-for="stock in intercompanyStocks" :key="stock.companyId" class="stock-column dynamic-column">
                    <div class="stock-part ste">
                        <span class="stock-label-mini">STE</span>
                        <span class="stock-value-main company">{{ stock.company }}</span>
                    </div>
                    <div class="stock-part stock clickable"
                        @click="openHistory(stock.company, stock.companyId, stock.stock)">
                        <span class="stock-label-mini">Stock</span>
                        <span class="stock-value-main" :class="stock.stock > 0 ? 'green' : 'red'">{{ stock.stock
                        }}</span>
                    </div>
                    <div class="stock-part purchase">
                        <span class="stock-label-mini">Dernier Achat</span>
                        <span class="stock-value-main date">{{ formatDate(stock.lastPurchaseDate) }}</span>
                    </div>
                </div>
            </div>

            <!-- 15% -->
            <div class="order-total" style="display: flex; align-items: center; gap: 10px;">
                <div class="amount-wrapper" style="display: flex; flex-direction: column; align-items: flex-start;">
                    <span v-if="selectedDocumentNo" class="doc-no"
                        style="font-size: 0.8rem; color: #64748b; font-weight: 600;">{{
                            selectedDocumentNo }}</span>
                    <span class="amount" style="font-size: 1.1rem; font-weight: 700;">{{ totalAmount ?
                        formatNumber(totalAmount, 2) : '-' }}</span>
                </div>
                <i class="pi pi-calculator" style="font-size: 1.2rem;"></i>
            </div>

            <!-- 5% -->
            <button class="cart-btn">
                <div class="cart-icon-wrapper">
                    <i class="pi pi-shopping-cart"></i>
                    <span class="cart-badge">1</span>
                </div>
            </button>
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
                <div class="table-container">
                    <div class="table-header-row">
                        <span class="table-title">Fournisseurs</span>
                    </div>
                    <div class="table-wrapper">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Frs</th>
                                    <th :style="{ width: isSidebarExpanded ? '18%' : '12%' }">Réf / Desig
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '8%' : '5%' }">Stocks</th>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Appro</th>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Dernier Achat
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '11%' : '7%' }">Cout Directe
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '15%' : '10%' }">Prix Revient
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '15%' : '10%' }">Prix de Vente
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
                                    <td>
                                        <div class="flex flex-col gap-1">
                                            <span class="stock-tag tag-import"
                                                :class="getImportStyleClass(detail.importInventory)">
                                                <span>Imp :</span>
                                                <span>{{ detail.importInventory }}</span>
                                            </span>
                                            <span class="stock-tag tag-cmd"
                                                :class="getQteCmdStyleClass(detail.qtyOnPurchOrder)">
                                                <span>Cmd :</span>
                                                <span>{{ detail.qtyOnPurchOrder }}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">
                                            {{
                                                formatNumber(getLastInvoicedData(detail.buyFromVendorNo)?.lastInvoicedDirectCost,
                                                    2) }}
                                            <span v-if="getLastInvoicedData(detail.buyFromVendorNo)?.quantity"
                                                class="qty-badge">
                                                {{
                                                    Math.round(getLastInvoicedData(detail.buyFromVendorNo)?.quantity)
                                                }}
                                            </span>
                                        </div>
                                        <div class="cell-description">
                                            {{
                                                formatDate(getLastInvoicedData(detail.buyFromVendorNo)?.lastInvoicedCostDate)
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
                                                v-if="calculatePercentageChange(detail.directUnitCost, getSecondLastPurchasePrice(detail.buyFromVendorNo))"
                                                :class="getPercentageClass(calculatePercentageChange(detail.directUnitCost, getSecondLastPurchasePrice(detail.buyFromVendorNo)))"
                                                class="percentage-indicator">
                                                {{ calculatePercentageChange(detail.directUnitCost,
                                                    getSecondLastPurchasePrice(detail.buyFromVendorNo)) }}
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
                                                class="qty-input mini" placeholder="Prix Nég"
                                                @change="updateLine(detail)" :disabled="detail.isUpdating" />
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="qty-input-wrapper mini">
                                            <span class="initial-tag" title="Quantité Initiale">{{
                                                detail.initialQuantity }}</span>
                                            <input type="number" v-model.number="detail.askingQty"
                                                class="qty-input mini" placeholder="Qte Nég"
                                                @change="updateLine(detail)" :disabled="detail.isUpdating" />
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="qty-input-wrapper">
                                            <input type="number" v-model.number="detail.quantity" class="qty-input"
                                                min="0" @change="updateLine(detail)" :disabled="detail.isUpdating" />
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
                                                @change="updateLine(detail)" :disabled="detail.isUpdating">
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
                                        <div class="flex justify-center items-center h-full">
                                            <i class="pi pi-info-circle info-icon cursor-pointer"
                                                @click.stop="openInfoDialog(detail)"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="flex justify-center items-center h-full">
                                            <i class="pi pi-comment comment-icon cursor-pointer"
                                                :class="{ 'has-comment': detail.comment }"
                                                @click.stop="toggleCommentOverlay($event, detail)"
                                                title="Ajouter un commentaire"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="flex justify-center items-center h-full">
                                            <button class="validate-line-btn" title="Valider la ligne"
                                                @click="updateLine(detail)" :disabled="detail.isUpdating">
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
                <div class="table-container">
                    <div class="table-header-row">
                        <span class="table-title">Equivalence</span>
                    </div>
                    <div class="table-wrapper">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Frs</th>
                                    <th :style="{ width: isSidebarExpanded ? '18%' : '12%' }">Réf / Desig
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '8%' : '5%' }">Stocks</th>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Appro</th>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Dernier Achat
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '11%' : '7%' }">Prix Devise
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '15%' : '10%' }">Cout Calculé /
                                        Date</th>
                                    <th :style="{ width: isSidebarExpanded ? '15%' : '10%' }">Prix de vente
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
                                <tr v-if="isLoadingEquivalence">
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
                                        <div class="cell-reference">{{ item.no }}</div>
                                        <div class="cell-description">{{ item.descriptionStructured }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference" :class="getStyleClass(item.styleQty)">{{
                                            item.qtyStock }}</div>
                                    </td>
                                    <td>
                                        <div class="flex flex-col gap-1">
                                            <span class="stock-tag tag-import"
                                                :class="getImportStyleClass(item.qtyImport)">
                                                <span>Imp :</span>
                                                <span>{{ item.qtyImport }}</span>
                                            </span>
                                            <span class="stock-tag tag-cmd"
                                                :class="getQteCmdStyleClass(item.qtyOnPurchOrder)">
                                                <span>Cmd :</span>
                                                <span>{{ item.qtyOnPurchOrder }}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-reference" :class="getStyleClass(item.styleDate)">
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
                                        <div class="cell-reference">{{ item.acheteCurrYear || 0 }}</div>
                                        <div class="cell-description">{{ item.totalAchete || 0 }}</div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="cell-reference">{{ item.venduCurrYear || 0 }}</div>
                                        <div class="cell-description">{{ item.totalVendu || 0 }}</div>
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
                                        <div class="flex justify-center items-center h-full">
                                            <i class="pi pi-info-circle info-icon cursor-pointer"
                                                @click.stop="openInfoDialog(item)"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="flex justify-center items-center h-full">
                                            <i class="pi pi-comment comment-icon cursor-pointer"
                                                :class="{ 'has-comment': item.comment }"
                                                @click.stop="toggleCommentOverlay($event, item)"
                                                title="Ajouter un commentaire"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="flex justify-center items-center h-full">
                                            <button class="validate-line-btn" title="Valider la ligne">
                                                <i class="pi pi-check"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="table-footer">
                        <div class="pagination-info" v-if="equivalenceItems.length > 0">
                            {{ equivalencePagination.page * equivalencePagination.size + 1 }}-{{
                                Math.min((equivalencePagination.page + 1) *
                                    equivalencePagination.size, equivalencePagination.totalElements) }} sur {{
                                equivalencePagination.totalElements }}
                        </div>
                        <div class="pagination-controls">
                            <button class="p-btn" :disabled="equivalencePagination.page === 0"
                                @click="fetchEquivalenceItems(selectedDetail, equivalencePagination.page - 1)">
                                <i class="pi pi-angle-left"></i>
                            </button>
                            <span class="p-current">{{ equivalencePagination.page + 1 }}</span>
                            <button class="p-btn"
                                :disabled="equivalencePagination.page >= equivalencePagination.totalPages - 1"
                                @click="fetchEquivalenceItems(selectedDetail, equivalencePagination.page + 1)">
                                <i class="pi pi-angle-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Kit Table -->
                <div class="table-container">
                    <div class="table-header-row">
                        <span class="table-title">Kit</span>
                    </div>
                    <div class="table-wrapper">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Composant</th>
                                    <th :style="{ width: isSidebarExpanded ? '18%' : '12%' }">Réf / Desig
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '8%' : '5%' }">Stocks</th>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Appro</th>
                                    <th :style="{ width: isSidebarExpanded ? '9%' : '6%' }">Dernier Achat
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '11%' : '7%' }">Prix Devise
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '15%' : '10%' }">Cout Calculé /
                                        Date</th>
                                    <th :style="{ width: isSidebarExpanded ? '15%' : '10%' }">Prix de vente
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
                                        <div class="cell-reference">{{ item.no }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{ item.no }}</div>
                                        <div class="cell-description">{{ item.descriptionStructured }}</div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">{{ item.qtyStock || 0 }}</div>
                                    </td>
                                    <td>
                                        <div class="flex flex-col gap-1">
                                            <span class="stock-tag tag-import"
                                                :class="getImportStyleClass(item.qtyImport || 0)">
                                                <span>Imp :</span>
                                                <span>{{ item.qtyImport || 0 }}</span>
                                            </span>
                                            <span class="stock-tag tag-cmd"
                                                :class="getQteCmdStyleClass(item.qtyOnPurchOrder || 0)">
                                                <span>Cmd :</span>
                                                <span>{{ item.qtyOnPurchOrder || 0 }}</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="cell-reference">
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
                                        <div class="cell-reference">{{ item.acheteCurrYear || 0 }}</div>
                                        <div class="cell-description">{{ item.totalAchete || 0 }}</div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="cell-reference">{{ item.venduCurrYear || 0 }}</div>
                                        <div class="cell-description">{{ item.totalVendu || 0 }}</div>
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
                                        <div class="flex justify-center items-center h-full">
                                            <i class="pi pi-info-circle info-icon cursor-pointer"
                                                @click.stop="openInfoDialog(item)"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="flex justify-center items-center h-full">
                                            <i class="pi pi-comment comment-icon cursor-pointer"
                                                :class="{ 'has-comment': item.comment }"
                                                @click.stop="toggleCommentOverlay($event, item)"
                                                title="Ajouter un commentaire"></i>
                                        </div>
                                    </td>
                                    <td v-if="!isSidebarExpanded">
                                        <div class="flex justify-center items-center h-full">
                                            <button class="validate-line-btn" title="Valider la ligne">
                                                <i class="pi pi-check"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="table-footer">
                        <div class="pagination-info" v-if="kitItems.length > 0">
                            {{ kitPagination.page * kitPagination.size + 1 }}-{{
                                Math.min((kitPagination.page + 1) *
                                    kitPagination.size, kitPagination.totalElements) }} sur {{
                                kitPagination.totalElements }}
                        </div>
                        <div class="pagination-controls">
                            <button class="p-btn" :disabled="kitPagination.page === 0"
                                @click="fetchKitItems(selectedDetail.no, kitPagination.page - 1)">
                                <i class="pi pi-angle-left"></i>
                            </button>
                            <span class="p-current">{{ kitPagination.page + 1 }}</span>
                            <button class="p-btn" :disabled="kitPagination.page >= kitPagination.totalPages - 1"
                                @click="fetchKitItems(selectedDetail.no, kitPagination.page + 1)">
                                <i class="pi pi-angle-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section 3: Sidebar (30% or 50% width) -->
            <div class="right-column" :class="{ 'expanded': isSidebarExpanded }">
                <div class="sidebar-header">
                    <div class="header-actions">
                        <Button :icon="isSidebarExpanded ? 'pi pi-chevron-right' : 'pi pi-chevron-left'" text rounded
                            @click="isSidebarExpanded = !isSidebarExpanded" class="toggle-sidebar-btn" />
                        <button class="history-btn">Historique</button>
                        <div class="item-title-inline" v-if="selectedHistoryItem">
                            {{ selectedHistoryItem.no || selectedHistoryItem.itemNo }} • {{
                                selectedHistoryItem.descriptionStructured ||
                                selectedHistoryItem.structuredDescription ||
                                selectedHistoryItem.description || 'Temoins de freins' }}
                        </div>
                        <div class="item-title-inline" v-else>
                            {{ line.itemNo }} • {{ line.structuredDescription || line.description ||
                                'Temoins de freins'
                            }}
                        </div>
                        <div class="year-selector">
                            <button class="year-arrow" @click="changeYear(-1)">
                                <i class="pi pi-chevron-left"></i>
                            </button>
                            <span class="year-display">{{ selectedYear }}</span>
                            <button class="year-arrow" @click="changeYear(1)">
                                <i class="pi pi-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="stats-bar">
                    <div class="stats-column">Stock : {{ historyKpis.stock }}</div>
                    <div class="stats-column">Achat : {{ historyKpis.achat }}</div>
                    <div class="stats-column">Vente : {{ Math.abs(historyKpis.vente) }}</div>
                    <div class="stats-column">Rupt : {{ historyKpis.rupt }}</div>
                </div>

                <div class="table-footer top-pagination">
                    <div class="pagination-info" v-if="historyEntries.length > 0">
                        {{ historyPagination.page * historyPagination.size + 1 }}-{{
                            Math.min((historyPagination.page + 1) *
                                historyPagination.size, historyPagination.totalElements) }} sur {{
                            historyPagination.totalElements }}
                    </div>
                    <div class="pagination-controls">
                        <button class="p-btn" :disabled="historyPagination.page === 0"
                            @click="fetchHistory(historyPagination.page - 1)">
                            <i class="pi pi-angle-left"></i>
                        </button>
                        <span class="p-current">{{ historyPagination.page + 1 }}</span>
                        <button class="p-btn" :disabled="historyPagination.page >= historyPagination.totalPages - 1"
                            @click="fetchHistory(historyPagination.page + 1)">
                            <i class="pi pi-angle-right"></i>
                        </button>
                    </div>
                </div>

                <div class="table-container history-container">
                    <div class="table-wrapper">
                        <table class="modern-table history-table">
                            <thead>
                                <tr>
                                    <th :style="{ width: isSidebarExpanded ? '8%' : '15%' }">Date</th>
                                    <th :style="{ width: isSidebarExpanded ? '5%' : '8%' }">Type</th>
                                    <template v-if="isSidebarExpanded">
                                        <th style="width: 10%">Type Doc</th>
                                        <th style="width: 10%">N° Document</th>
                                    </template>
                                    <th :style="{ width: isSidebarExpanded ? '10%' : '15%' }">Client / Frs
                                    </th>
                                    <th :style="{ width: isSidebarExpanded ? '35%' : '42%' }">Nom</th>
                                    <th :style="{ width: isSidebarExpanded ? '6%' : '8%' }" class="text-right">Qte</th>
                                    <template v-if="isSidebarExpanded">
                                        <th style="width: 6%">Magasin</th>
                                    </template>
                                    <th :style="{ width: isSidebarExpanded ? '10%' : '12%' }" class="text-right">PU</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="isLoadingHistory">
                                    <td :colspan="isSidebarExpanded ? 8 : 5" class="text-center p-4">
                                        Chargement...</td>
                                </tr>
                                <tr v-else-if="historyEntries.length === 0">
                                    <td :colspan="isSidebarExpanded ? 8 : 5" class="text-center p-4">Aucune
                                        donnée
                                        disponible</td>
                                </tr>
                                <tr v-else v-for="(entry, index) in historyEntries" :key="index"
                                    :class="{ 'rupture-row': entry.entryType === 'Rupture' }">
                                    <td>{{ formatDate(entry.postingDate) }}</td>
                                    <td>
                                        <div class="type-indicator-circle" :class="getEntryTypeClass(entry.entryType)">
                                            {{ getEntryTypeLetter(entry.entryType) }}
                                        </div>
                                    </td>
                                    <template v-if="isSidebarExpanded">
                                        <td>{{ entry.documentType }}</td>
                                        <td>{{ entry.documentNo }}</td>
                                    </template>
                                    <td>{{ entry.sourceNo }}</td>
                                    <td>{{ entry.sourceName }}</td>
                                    <td class="text-right">{{ entry.quantity }}</td>
                                    <template v-if="isSidebarExpanded">
                                        <td>{{ entry.locationCode }}</td>
                                    </template>
                                    <td class="text-right">{{ formatNumber(calculatePU(entry), 2) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Article Info Dialog -->
        <div v-if="showInfoDialog" class="info-dialog-overlay" @click.self="showInfoDialog = false">
            <div class="info-dialog-container">
                <!-- Header -->
                <div class="info-dialog-header">
                    <div class="header-title">
                        Informations Article . {{ selectedInfoItem?.no }} . {{
                            selectedInfoItem?.descriptionStructured
                        }}
                    </div>
                    <div class="header-right">
                        <img src="/images/articles/tecalliance_partner.png" alt="TecAlliance" class="tecalliance-logo">
                        <button class="close-info-btn" @click="showInfoDialog = false">
                            <i class="pi pi-times"></i>
                        </button>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="info-dialog-body">
                    <!-- Loading State -->
                    <div v-if="selectedInfoItem?.isLoading" class="loading-state">
                        <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #3b82f6;"></i>
                        <p>Chargement des informations...</p>
                    </div>

                    <template v-else>
                        <div class="info-top-section">
                            <!-- Image Gallery -->
                            <div class="info-gallery">
                                <div class="thumbnail-list"
                                    v-if="!isViewing360 && selectedInfoItem?.thumbnails?.length > 0">
                                    <button class="thumb-nav-btn up" @click="prevImage"
                                        v-if="selectedInfoItem.thumbnails.length > 1"><i
                                            class="pi pi-chevron-up"></i></button>
                                    <div class="thumbnail-scroll-container">
                                        <div v-for="(thumb, index) in selectedInfoItem?.thumbnails" :key="index"
                                            class="thumb-item" :class="{ active: index === currentImageIndex }"
                                            @click="currentImageIndex = index">
                                            <img :src="thumb" alt="thumbnail">
                                        </div>
                                    </div>
                                    <button class="thumb-nav-btn down" @click="nextImage"
                                        v-if="selectedInfoItem.thumbnails.length > 1"><i
                                            class="pi pi-chevron-down"></i></button>
                                </div>
                                <div class="main-image-container">
                                    <!-- 360 Toggle Button -->
                                    <button v-if="selectedInfoItem?.images360?.length > 0" class="viewer-360-toggle-btn"
                                        @click="isViewing360 = !isViewing360"
                                        :title="isViewing360 ? 'Retour aux photos' : 'Vue 360°'">
                                        <i class="pi" :class="isViewing360 ? 'pi-images' : 'pi-sync'"
                                            style="font-size: 1.2rem;"></i>
                                    </button>

                                    <!-- Standard Image View -->
                                    <template v-if="!isViewing360">
                                        <img v-if="selectedInfoItem?.thumbnails?.[currentImageIndex]"
                                            :src="selectedInfoItem?.thumbnails[currentImageIndex]" alt="Article Image"
                                            class="main-article-image">
                                        <div v-else class="no-image-placeholder">
                                            <i class="pi pi-image" style="font-size: 3rem; color: #94a3b8;"></i>
                                            <p>Aucune image disponible</p>
                                        </div>
                                    </template>

                                    <!-- 360 View -->
                                    <div v-else class="viewer-360-container" @mousemove="handle360MouseMove"
                                        @touchmove.prevent="handle360TouchMove">
                                        <img :src="selectedInfoItem?.images360?.[current360Frame]" alt="360 View"
                                            class="image-360" draggable="false">
                                        <div class="viewer-360-overlay">
                                            <i class="pi pi-sync spin-icon"></i>
                                            <span>Faites glisser pour tourner</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Technical Specs -->
                            <div class="info-specs-container">
                                <div class="brand-header">
                                    <img v-if="selectedInfoItem?.brandLogo" :src="selectedInfoItem?.brandLogo"
                                        alt="Brand" class="brand-logo">
                                    <div class="brand-info">
                                        <div class="brand-ref">N° de référence: {{ selectedInfoItem?.no }}
                                        </div>
                                        <div class="brand-desc">{{ selectedInfoItem?.genericDescription ||
                                            selectedInfoItem?.descriptionStructured }}</div>
                                        <div class="brand-name" v-if="selectedInfoItem?.brand">{{
                                            selectedInfoItem?.brand }}</div>
                                    </div>
                                </div>
                                <div class="specs-table" v-if="selectedInfoItem?.specs?.length > 0">
                                    <div v-for="(spec, index) in selectedInfoItem?.specs" :key="index" class="spec-row">
                                        <div class="spec-label">{{ spec.label }}</div>
                                        <div class="spec-value">{{ spec.value }}</div>
                                    </div>
                                </div>
                                <div v-else class="no-data-message">
                                    Aucune spécification technique disponible.
                                </div>
                            </div>
                        </div>

                        <!-- Stacked Sections -->
                        <div class="info-sections-container">
                            <!-- OEM Numbers Section -->
                            <div class="info-section" v-if="selectedInfoItem?.oemNumbers?.length > 0">
                                <div class="info-section-header">
                                    <i class="pi pi-list"></i>
                                    <span>Numéros OEM</span>
                                </div>
                                <div class="info-section-content">
                                    <div class="oe-numbers-list">
                                        <div v-for="(num, index) in selectedInfoItem?.oemNumbers" :key="index"
                                            class="oe-number-item">
                                            {{ num }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- PDFs Section -->
                            <div class="info-section" v-if="selectedInfoItem?.pdfs?.length > 0">
                                <div class="info-section-header">
                                    <i class="pi pi-file-pdf"></i>
                                    <span>Documents PDF</span>
                                </div>
                                <div class="info-section-content">
                                    <div class="pdfs-list">
                                        <a v-for="(pdf, index) in selectedInfoItem?.pdfs" :key="index" :href="pdf.url"
                                            target="_blank" rel="noopener noreferrer" class="pdf-item">
                                            <i class="pi pi-file-pdf"></i>
                                            <span>{{ pdf.fileName }}</span>
                                            <i class="pi pi-external-link"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <!-- GTINs Section -->
                            <div class="info-section" v-if="selectedInfoItem?.gtins?.length > 0">
                                <div class="info-section-header">
                                    <i class="pi pi-barcode"></i>
                                    <span>Codes-barres (GTIN)</span>
                                </div>
                                <div class="info-section-content">
                                    <div class="oe-numbers-list">
                                        <div v-for="(gtin, index) in selectedInfoItem?.gtins" :key="index"
                                            class="oe-number-item">
                                            {{ gtin }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Vehicles Section -->
                            <div class="info-section" v-if="selectedInfoItem?.vehicles?.length > 0">
                                <div class="info-section-header">
                                    <i class="pi pi-car"></i>
                                    <span>Véhicules concernés</span>
                                </div>
                                <div class="info-section-content">
                                    <div class="vehicles-list-container">
                                        <div v-if="selectedInfoItem?.vehicles && selectedInfoItem.vehicles.length > 0">
                                            <div v-for="(brandGroup, bIndex) in selectedInfoItem.vehicles" :key="bIndex"
                                                class="brand-group">
                                                <div class="brand-toggle-row" @click="toggleBrand(brandGroup.brand)">
                                                    <i class="pi"
                                                        :class="expandedBrands.has(brandGroup.brand) ? 'pi-minus' : 'pi-plus'"></i>
                                                    <span class="brand-name">{{ brandGroup.brand }}</span>
                                                </div>
                                                <div v-if="expandedBrands.has(brandGroup.brand)" class="models-list">
                                                    <div v-for="(model, mIndex) in brandGroup.models" :key="mIndex"
                                                        class="model-item">
                                                        <i class="pi pi-plus model-plus-icon"></i>
                                                        <span class="model-text">{{ model }}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-else class="no-data-message">
                                            Aucune donnée de véhicule disponible pour cet article.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <!-- Stock History Dialog -->
        <Dialog v-model:visible="showHistoryDialog" modal :style="{ width: '50vw' }" class="history-dialog"
            :showHeader="false">
            <div class="dialog-content-wrapper">
                <div class="sidebar-header dialog-header">
                    <div class="header-actions">
                        <button class="history-btn">Historique</button>
                        <div class="item-title-inline" v-if="selectedHistoryItem">
                            {{ selectedHistoryItem.no || selectedHistoryItem.itemNo }} • {{
                                selectedHistoryItem.descriptionStructured ||
                                selectedHistoryItem.structuredDescription ||
                                selectedHistoryItem.description || 'Temoins de freins' }}
                            <span v-if="selectedCompany" class="company-badge"> ({{ selectedCompany
                            }})</span>
                        </div>
                        <div class="year-selector">
                            <button class="year-arrow" @click="changeDialogYear(-1)">
                                <i class="pi pi-chevron-left"></i>
                            </button>
                            <span class="year-display">{{ dialogSelectedYear }}</span>
                            <button class="year-arrow" @click="changeDialogYear(1)">
                                <i class="pi pi-chevron-right"></i>
                            </button>
                        </div>
                        <Button icon="pi pi-times" text rounded @click="showHistoryDialog = false"
                            class="close-dialog-btn" />
                    </div>
                </div>

                <div class="stats-bar dialog-stats-bar">
                    <div class="stats-column">Stock : {{ dialogHistoryKpis.stock }}</div>
                    <div class="stats-column">Achat : {{ dialogHistoryKpis.achat }}</div>
                    <div class="stats-column">Vente : {{ Math.abs(dialogHistoryKpis.vente) }}</div>
                    <div class="stats-column">Rupt : {{ dialogHistoryKpis.rupt }}</div>
                </div>

                <div class="table-footer centered-footer top-pagination">
                    <div class="pagination-info" v-if="dialogHistoryEntries.length > 0">
                        {{ dialogHistoryPagination.page * dialogHistoryPagination.size + 1 }}-{{
                            Math.min((dialogHistoryPagination.page +
                                1) *
                                dialogHistoryPagination.size, dialogHistoryPagination.totalElements) }} sur {{
                            dialogHistoryPagination.totalElements
                        }}
                    </div>
                    <div class="pagination-controls centered">
                        <button class="p-btn" :disabled="dialogHistoryPagination.page === 0"
                            @click="fetchDialogHistory(dialogHistoryPagination.page - 1)">
                            <i class="pi pi-angle-left"></i>
                        </button>
                        <span class="p-current">{{ dialogHistoryPagination.page + 1 }}</span>
                        <button class="p-btn"
                            :disabled="dialogHistoryPagination.page >= dialogHistoryPagination.totalPages - 1"
                            @click="fetchDialogHistory(dialogHistoryPagination.page + 1)">
                            <i class="pi pi-angle-right"></i>
                        </button>
                    </div>
                </div>

                <div class="table-container dialog-history-container">
                    <div class="table-wrapper">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th style="width: 10%">Date</th>
                                    <th style="width: 5%">Type</th>
                                    <th style="width: 10%">Type Doc</th>
                                    <th style="width: 12%">N° Document</th>
                                    <th style="width: 15%">Client / Frs</th>
                                    <th style="width: 18%">Nom</th>
                                    <th style="width: 8%" class="text-right">Qte</th>
                                    <th style="width: 10%">Magasin</th>
                                    <th style="width: 12%" class="text-right">PU</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="isLoadingDialogHistory">
                                    <td colspan="9" class="text-center p-4">Chargement...</td>
                                </tr>
                                <tr v-else-if="dialogHistoryEntries.length === 0">
                                    <td colspan="9" class="text-center p-4">Aucune donnée disponible</td>
                                </tr>
                                <tr v-else v-for="(entry, index) in dialogHistoryEntries" :key="index">
                                    <td>{{ formatDate(entry.postingDate) }}</td>
                                    <td>
                                        <div class="type-indicator-circle" :class="getEntryTypeClass(entry.entryType)">
                                            {{ getEntryTypeLetter(entry.entryType) }}
                                        </div>
                                    </td>
                                    <td>{{ entry.documentType }}</td>
                                    <td>{{ entry.documentNo }}</td>
                                    <td>{{ entry.sourceNo }}</td>
                                    <td>{{ entry.sourceName }}</td>
                                    <td class="text-right">{{ entry.quantity }}</td>
                                    <td>{{ entry.locationCode }}</td>
                                    <td class="text-right">{{ formatNumber(calculatePU(entry), 2) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Dialog>

        <Dialog v-model:visible="showPurchasePriceDialog" modal :style="{ width: '50vw' }" class="history-dialog"
            :showHeader="false">
            <div class="dialog-content-wrapper">
                <div class="sidebar-header dialog-header">
                    <div class="header-actions">
                        <button class="history-btn">Historique Prix Achat</button>
                        <div class="item-title-inline" v-if="selectedPurchasePriceItem">
                            {{ selectedPurchasePriceItem.itemNo }} • {{
                                selectedPurchasePriceItem.description }}
                        </div>
                        <div class="header-filter-container" v-if="availableVendors.length > 1">
                            <select v-model="purchasePriceVendorFilter" class="vendor-filter-select"
                                :disabled="isPurchasePriceFilterDisabled">
                                <option value="">Tous les fournisseurs</option>
                                <option v-for="vendor in availableVendors" :key="vendor" :value="vendor">
                                    {{ vendor }}
                                </option>
                            </select>
                        </div>
                        <Button icon="pi pi-times" text rounded @click="showPurchasePriceDialog = false"
                            class="close-dialog-btn" style="margin-left: 0;" />
                    </div>
                </div>

                <div class="table-container dialog-history-container" style="margin-top: 20px;">
                    <div class="table-wrapper">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th style="width: 15%">Frs</th>
                                    <th style="width: 15%">Date Début</th>
                                    <th style="width: 15%">Date Fin</th>
                                    <th style="width: 15%">Devise</th>
                                    <th style="width: 20%" class="text-right">Coût Unitaire Direct</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="isLoadingPurchasePrices">
                                    <td colspan="5" class="text-center p-4">Chargement...</td>
                                </tr>
                                <tr v-else-if="purchasePrices.length === 0">
                                    <td colspan="5" class="text-center p-4">Aucun historique de prix
                                        disponible</td>
                                </tr>
                                <tr v-else v-for="(price, index) in filteredPurchasePrices" :key="index">
                                    <td>{{ price.vendorNo }}</td>
                                    <td>{{ formatDate(price.startingDate) }}</td>
                                    <td>{{ formatDate(price.endingDate) }}</td>
                                    <td>{{ price.currencyCode }}</td>
                                    <td class="text-right">{{ formatNumber(price.directUnitCost, 2) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Dialog>

        <!-- TecDoc Verification Dialog -->
        <Dialog v-model:visible="showVerificationDialog" modal :style="{ width: '70vw' }" class="history-dialog"
            :showHeader="false">
            <div class="dialog-content-wrapper">
                <div class="sidebar-header dialog-header">
                    <div class="header-actions">
                        <button class="history-btn">Vérification TecDoc</button>
                        <div class="item-title-inline" v-if="line">
                            {{ masterItemNo }} • {{ line.structuredDescription || line.description }}
                        </div>
                        <Button icon="pi pi-times" text rounded @click="showVerificationDialog = false"
                            class="close-dialog-btn" />
                    </div>
                </div>

                <div class="stats-bar dialog-stats-bar">
                    <div class="stats-column">Total : {{ verificationStatus?.totalTecDocItems || 0 }}</div>
                    <div class="stats-column">Éligibles : {{ verificationStatus?.countEligible || 0 }}</div>
                    <div class="stats-column">Créés : {{ verificationStatus?.countCreated || 0 }}</div>
                    <div class="stats-column">Non Créés : {{ verificationStatus?.countNotCreated || 0 }}
                    </div>
                </div>

                <div class="verification-filter" style="padding: 10px 20px;">
                    <label style="font-weight: 600; margin-right: 10px;">Fabricant:</label>
                    <select v-model="verificationManufacturerFilter" class="manufacturer-filter"
                        style="padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.9rem;">
                        <option value="">Tous les fabricants</option>
                        <option v-for="mfr in availableManufacturers" :key="mfr" :value="mfr">
                            {{ mfr }}
                        </option>
                    </select>
                </div>

                <div class="table-footer centered-footer top-pagination">
                    <div class="pagination-info" v-if="filteredVerificationItems.length > 0">
                        {{ verificationPagination.page * verificationPagination.size + 1 }}-{{
                            Math.min((verificationPagination.page + 1) * verificationPagination.size,
                                filteredVerificationItems.length) }} sur {{ filteredVerificationItems.length }}
                    </div>
                    <div class="pagination-controls centered">
                        <button class="p-btn" :disabled="verificationPagination.page === 0"
                            @click="changeVerificationPage(verificationPagination.page - 1)">
                            <i class="pi pi-angle-left"></i>
                        </button>
                        <span class="p-current">{{ verificationPagination.page + 1 }}</span>
                        <button class="p-btn" :disabled="verificationPagination.page >= verificationTotalPages - 1"
                            @click="changeVerificationPage(verificationPagination.page + 1)">
                            <i class="pi pi-angle-right"></i>
                        </button>
                    </div>
                </div>

                <div class="table-container dialog-history-container">
                    <div class="table-wrapper">
                        <table class="modern-table">
                            <thead>
                                <tr>
                                    <th style="width: 25%">Fabricant</th>
                                    <th style="width: 20%">Référence</th>
                                    <th style="width: 15%">MASTER ERP</th>
                                    <th style="width: 15%">Statut</th>
                                    <th style="width: 25%">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-if="isLoadingVerification">
                                    <td colspan="4" class="text-center p-4">Chargement...</td>
                                </tr>
                                <tr v-else-if="paginatedVerificationItems.length === 0">
                                    <td colspan="4" class="text-center p-4">Aucun article trouvé</td>
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
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Dialog>

        <!-- Create Article Master Dialog -->
        <Dialog v-model:visible="showCreateArticleMasterDialog" modal :style="{ width: '50vw' }" class="history-dialog"
            :showHeader="false">
            <div class="dialog-content-wrapper">
                <div class="sidebar-header dialog-header">
                    <div class="header-actions">
                        <button class="history-btn">Création Article Master</button>
                        <Button icon="pi pi-times" text rounded @click="showCreateArticleMasterDialog = false"
                            class="close-dialog-btn" />
                    </div>
                </div>

                <div class="info-dialog-body" v-if="selectedArticleMasterCandidate">
                    <!-- Master Info Section -->
                    <div class="info-section">
                        <div class="info-section-header">
                            <i class="pi pi-box"></i>
                            <span>Informations Master</span>
                        </div>
                        <div class="info-section-content">
                            <div class="specs-table">
                                <div class="spec-row">
                                    <div class="spec-label">Référence Master</div>
                                    <div class="spec-value">{{ selectedArticleMasterCandidate.masterItemNo
                                    }}</div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-label">Description</div>
                                    <div class="spec-value">{{
                                        selectedArticleMasterCandidate.masterDescription }}</div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-label">Groupe</div>
                                    <div class="spec-value">{{ selectedArticleMasterCandidate.groupName }}
                                    </div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-label">Sous-Groupe</div>
                                    <div class="spec-value">{{ selectedArticleMasterCandidate.subGroupName
                                    }}</div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-label">Marque (MakeCode)</div>
                                    <div class="spec-value">{{ selectedArticleMasterCandidate.makeCode }}
                                    </div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-label">Champ Libre</div>
                                    <div class="spec-value">{{ selectedArticleMasterCandidate.champsLibre }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Candidate Info Section -->
                    <div class="info-section">
                        <div class="info-section-header">
                            <i class="pi pi-plus-circle"></i>
                            <span>Nouvel Article (Candidat)</span>
                        </div>
                        <div class="info-section-content">
                            <div class="specs-table">
                                <div class="spec-row">
                                    <div class="spec-label">Fabricant</div>
                                    <div class="spec-value">{{
                                        selectedArticleMasterCandidate.manufacturerName }}</div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-label">Référence Article</div>
                                    <div class="spec-value">{{ selectedArticleMasterCandidate.articleNumber
                                    }}</div>
                                </div>
                                <div class="spec-row">
                                    <div class="spec-label">Code Fournisseur (VendorNo)</div>
                                    <div class="spec-value">{{ selectedArticleMasterCandidate.vendorNo }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dialog-footer"
                    style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
                    <Button label="Annuler" icon="pi pi-times" class="p-button-text p-button-secondary dialog-btn"
                        @click="showCreateArticleMasterDialog = false" />
                    <Button label="Valider la création" icon="pi pi-check" class="p-button-primary dialog-btn"
                        @click="confirmCreateArticleMaster" />
                </div>
            </div>
        </Dialog>


        <!-- Comment Overlay -->
        <OverlayPanel ref="commentOverlay" class="comment-overlay" appendTo="body"
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
        </OverlayPanel>
    </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import OverlayPanel from 'primevue/overlaypanel'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

import { useCompareQuoteStore } from '../stores/compareQuote'
import { useAuthStore } from '../stores/auth'


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
const toast = useToast()
const isSidebarExpanded = ref(false)
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

// Comment State
const commentOverlay = ref(null)
const commentText = ref('')
const selectedCommentItem = ref(null)

const toggleCommentOverlay = (event, item) => {
    selectedCommentItem.value = item
    commentText.value = item.comment || ''
    commentOverlay.value.toggle(event)
}

const saveComment = () => {
    if (selectedCommentItem.value) {
        selectedCommentItem.value.comment = commentText.value
    }
    commentOverlay.value.hide()
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

// Purchase Price Dialog State
const showPurchasePriceDialog = ref(false)
const purchasePrices = ref([])
const isLoadingPurchasePrices = ref(false)
const selectedPurchasePriceItem = ref(null)
const purchasePriceVendorFilter = ref('')
const allPurchasePrices = ref([])
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
    if (!selectedHistoryItem.value || !selectedHistoryItem.value.no) return

    try {
        const data = await store.fetchLastInvoicedCost(selectedHistoryItem.value.no)
        if (Array.isArray(data)) {
            const costMap = new Map()
            data.forEach(item => {
                if (item.frs) {
                    costMap.set(item.frs, item)
                }
            })
            lastInvoicedCosts.value = costMap
        }
    } catch (error) {
        console.error('Error fetching last invoiced costs:', error)
    }
}

const getLastInvoicedData = (vendorNo) => {
    if (!vendorNo) return null
    return lastInvoicedCosts.value.get(vendorNo)
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

const getSecondLastPurchasePrice = (vendorNo) => {
    if (!vendorNo || !allPurchasePrices.value.length) return null

    // Filter by vendor (use loose equality to handle string/number differences)
    const vendorPrices = allPurchasePrices.value.filter(p => p.vendorNo == vendorNo)

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

const toggleBrand = (brand) => {
    if (expandedBrands.value.has(brand)) {
        expandedBrands.value.delete(brand)
    } else {
        expandedBrands.value.add(brand)
    }
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
        emit('prev')
    } else if (event.key === 'F9') {
        event.preventDefault()
        emit('next')
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

const formatDate = (dateString) => {
    if (!dateString || dateString === '0001-01-01') return '-'
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
const selectedArticleMasterCandidate = ref(null)

const createArticleMaster = (item) => {
    console.log('Create Article Master for:', item)
    console.log('Props Line:', props.line)

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
        vendorNo: item.vendorNo || '401230'
    }

    showCreateArticleMasterDialog.value = true
}

const isCreatingArticleMaster = ref(false)
const hasCreatedArticleMaster = ref(false)

const confirmCreateArticleMaster = async () => {
    if (!selectedArticleMasterCandidate.value) return

    const candidate = selectedArticleMasterCandidate.value
    const payload = {
        ref: candidate.articleNumber,
        frs: candidate.vendorNo,
        refTecdoc: candidate.articleNumber,
        refMaster: candidate.masterItemNo,
        group: candidate.groupCode,
        subGroup: candidate.subGroupCode,
        champsLibre: candidate.champsLibre,
        manufacturer: candidate.manufacturerCode,
        marque: candidate.makeCode
    }

    isCreatingArticleMaster.value = true
    try {
        await store.createArticleMaster(payload)
        // Success handling
        hasCreatedArticleMaster.value = true
        showCreateArticleMasterDialog.value = false
        // Refresh verification status to update the list
        await fetchVerificationStatus()
        // Optional: Show success toast/notification
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Article Master créé avec succès', life: 3000 })
    } catch (error) {
        console.error('Failed to create article master:', error)
        // Optional: Show error toast/notification
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la création de l\'Article Master', life: 3000 })
    } finally {
        isCreatingArticleMaster.value = false
    }
}


const updateLine = async (detail) => {
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

    try {
        await store.updateQuoteLine(detail.id, detail['@odata.etag'], payload, userCompanyId)
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Ligne mise à jour', life: 2000 })
        // Silent refresh to get new ETag without global loading
        await fetchDetails(true)
    } catch (error) {
        console.error('Update line error:', error)
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la mise à jour', life: 3000 })
        detail.isUpdating = false // Reset loading state on error
        if (error.response && error.response.status === 412) {
            // ETag mismatch, refresh data
            await fetchDetails(true)
        }
    }
}

const openInfoDialog = async (item) => {
    // Show dialog immediately with loading state
    currentImageIndex.value = 0
    isViewing360.value = false
    current360Frame.value = 0
    showInfoDialog.value = true

    // Debug: Log the item to verify fields are present
    console.log('openInfoDialog called with item:', item)
    console.log('VendorItemNo:', item.VendorItemNo)
    console.log('ManufacturerTecdocId:', item.ManufacturerTecdocId ||
        item.manufacturerTecdocId)

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
        pdfs: []
    }

    // Fetch TecDoc data
    try {
        // Support both possible field name casings
        const articleRef = item.VendorItemNo || item.vendorItemNo
        const manufacturerId = item.ManufacturerTecdocId || item.manufacturerTecdocId

        if (!articleRef || !manufacturerId) {
            console.error('Missing article reference or manufacturer ID')
            console.error('articleRef:', articleRef, 'manufacturerId:', manufacturerId)
            selectedInfoItem.value.isLoading = false
            return
        }

        console.log('Fetching TecDoc details for:', { articleRef, manufacturerId })
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
            const oemNumbers = article.oemNumbers?.map(oem =>
                `${oem.mfrName} ${oem.articleNumber}`
            ) || []

            // Map PDFs
            const pdfs = article.pdfs || []

            // Get generic article description for brand/description
            const genericDesc = article.genericArticles?.[0]?.genericArticleDescription ||
                item.descriptionStructured

            // Update selectedInfoItem with API data
            selectedInfoItem.value = {
                ...item,
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
                vehicles: [], // TODO: Add vehicle compatibility if available in future API response
                gtins: article.gtins || []
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

const fetchHistory = async (page = 0) => {
    if (!selectedHistoryItem.value || !selectedHistoryItem.value.no) return

    isLoadingHistory.value = true
    try {
        const data = await store.fetchItemLedgerEntries(
            selectedHistoryItem.value.no,
            selectedYear.value,
            page,
            historyPagination.value.size,
            null // Global history for sidebar
        )

        console.log('History Data:', data)

        if (data && data.content) {
            historyEntries.value = data.content
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
            historyEntries.value = Array.isArray(data) ? data : []
            historyPagination.value.totalElements = historyEntries.value.length
            historyPagination.value.page = 0
            historyPagination.value.totalPages = 1
        }
    } catch (error) {
        console.error('Error fetching sidebar history:', error)
        historyEntries.value = []
    } finally {
        isLoadingHistory.value = false
    }
}

const fetchDialogHistory = async (page = 0) => {
    if (!selectedHistoryItem.value || !selectedHistoryItem.value.no) return

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
            dialogHistoryEntries.value = data.content
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
            dialogHistoryEntries.value = Array.isArray(data) ? data : []
            dialogHistoryPagination.value.totalElements = dialogHistoryEntries.value.length
            dialogHistoryPagination.value.page = 0
            dialogHistoryPagination.value.totalPages = 1
        }
    } catch (error) {
        console.error('Error fetching dialog history:', error)
        dialogHistoryEntries.value = []
    } finally {
        isLoadingDialogHistory.value = false
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

const getEntryTypeLetter = (entryType) => {
    if (!entryType) return ''
    if (entryType === 'Sale') return 'S'
    if (entryType === 'Purchase') return 'P'
    if (entryType === 'Transfer') return 'T'
    if (entryType === 'Rupture') return 'R'
    return entryType.charAt(0).toUpperCase()
}

const getEntryTypeClass = (entryType) => {
    if (!entryType) return ''
    if (entryType === 'Sale') return 'type-s'
    if (entryType === 'Purchase') return 'type-p'
    if (entryType === 'Transfer') return 'type-t'
    if (entryType === 'Rupture') return 'type-r'
    return 'type-t'
}

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

    if (!silent) isLoadingDetails.value = true
    try {
        const data = await
            store.fetchQuoteLineDetails(props.line.compareQuoteNo,
                props.line.itemNo)
        quoteLineDetails.value = Array.isArray(data) ? data : [data]
        if (quoteLineDetails.value.length > 0) {
            const firstDetail = quoteLineDetails.value[0]
            selectedDetail.value = firstDetail
            selectedHistoryItem.value = firstDetail
            historyKpis.value.stock = firstDetail.inventoryWithoutImport || 0
            // Auto-load equivalence and kit items for the first line
            isLoadingKit.value = true // Show loading in Kit table immediately
            await fetchEquivalenceItems(firstDetail)
            await fetchKitItems(firstDetail.no)

            // Auto-load intercompany stock
            fetchIntercompanyStock()
            // Auto-load last invoiced costs
            fetchLastInvoicedCosts()

            // Fetch all purchase prices for comparison
            try {
                const itemNoToFetch = firstDetail.no || props.line.itemNo
                const prices = await store.fetchPurchasePrices(itemNoToFetch)
                allPurchasePrices.value = prices || []
            } catch (err) {
                console.error('Error fetching all purchase prices:', err)
                allPurchasePrices.value = []
            }
        }
    } catch (error) {
        console.error('Error fetching details:', error)
    } finally {
        if (!silent) isLoadingDetails.value = false
    }
}

const fetchEquivalenceItems = async (detail, page = 0) => {
    if (!detail || !detail.ReferenceMaster || !detail.no) return

    isLoadingEquivalence.value = true
    try {
        const data = await store.fetchEquivalenceItems(
            detail.ReferenceMaster,
            detail.no,
            page,
            equivalencePagination.value.size
        )

        if (data && data.content) {
            equivalenceItems.value = data.content.map(item => ({
                ...item,
                quantityToOrder: 1
            }))
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
            equivalenceItems.value = items.map(item => ({
                ...item,
                quantityToOrder: 1
            }))
            equivalencePagination.value.totalElements =
                equivalenceItems.value.length
            equivalencePagination.value.page = 0
            equivalencePagination.value.totalPages = 1
        }
    } catch (error) {
        console.error('Error fetching equivalence items:', error)
        equivalenceItems.value = []
    } finally {
        isLoadingEquivalence.value = false
    }
}

const fetchKitItems = async (itemNo, page = 0) => {
    if (!itemNo) return

    isLoadingKit.value = true
    try {
        const data = await store.fetchKitItems(
            itemNo,
            page,
            kitPagination.value.size
        )

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
watch(() => props.line, () => {
    fetchDetails()
    fetchVerificationStatus()
}, { deep: true })

// Watch for verification dialog close to refresh data if an article was created
watch(showVerificationDialog, (newValue) => {
    if (!newValue && hasCreatedArticleMaster.value) {
        fetchDetails()
        fetchVerificationStatus()
        hasCreatedArticleMaster.value = false
    }
})

onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    fetchDetails()
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

.line-detail-container {
    padding: 15px;
    background-color: #f1f5f9;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 15px;
    font-family: 'Inter', sans-serif;
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
}

.info-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    padding-right: 5px;
    height: 100%;
}

.item-no {
    font-size: 1.3rem;
    font-weight: 800;
    margin: 0;
    color: #1e293b;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.item-desc {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 8px;
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

.info-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
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

.page-indicator {
    background: #e2e8f0;
    color: #1e293b;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 800;
    white-space: nowrap;
    border: 1px solid #cbd5e1;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    margin: 0;
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

.header-stocks {
    width: 65%;
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
    width: 20%;
}

.stock-part.stock {
    width: 40%;
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
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    border: 2px solid white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.cart-btn:hover {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
}

.cart-btn i {
    font-size: 1.6rem;
    color: #f59e0b;
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
    font-family: 'Inter', sans-serif;
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
    width: 73%;
    display: flex;
    flex-direction: column;
    gap: 15px;
    overflow-y: auto;
    padding-right: 5px;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.right-column {
    width: 27%;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: white;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.right-column.expanded {
    width: 50%;
}

.right-column.expanded~.left-column,
.main-layout:has(.right-column.expanded) .left-column {
    width: 50%;
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
    flex-grow: 1;
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
}

.dialog-history-container {
    border: 1px solid #e2e8f0;
    background: white;
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

.header-title {
    color: #1e293b;
    /* Noir / Slate 900 */
    font-size: 1.4rem;
    font-weight: 700;
}

.header-right {
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

/* Custom Toast Styles */
body .custom-toast {
    width: 400px !important;
}

body .custom-toast .p-toast-message .p-toast-message-content {
    padding: 10px !important;
    gap: 5px !important;
}

body .custom-toast .p-toast-detail {
    margin-top: 8px !important;
    line-height: 1.5 !important;
}

.master-erp-match {
    color: #16a34a;
    font-weight: 700;
}

.master-erp-mismatch {
    color: #dc2626;
    font-weight: 700;
}
</style>
