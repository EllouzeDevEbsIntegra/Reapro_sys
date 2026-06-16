<template>
    <div class="page-layout">
        <TheNavbar />

        <main class="main-content">

            <!-- ─── HEADER BAR ──────────────────────────────────────────────── -->
            <div class="header-bar mb-5" :class="{ 'expanded': isAdvancedSearchExpanded }">
                <div class="header-main-row">
                    <div class="header-left">
                        <h1>B2B</h1>

                        <!-- Sélecteur Client -->
                        <div class="client-select-wrapper">
                            <i class="pi pi-users select-icon"></i>
                            <Select
                                v-model="selectedClient"
                                :options="customers"
                                :optionLabel="clientLabel"
                                optionValue="extId"
                                placeholder="Sélectionner un client..."
                                :loading="isLoadingCustomers"
                                filter
                                autoFilterFocus
                                filterPlaceholder="Rechercher par code ou nom..."
                                class="client-select"
                                showClear
                                panelClass="c2-dropdown-panel"
                            >
                                <template #option="{ option }">
                                    <div class="option-row">
                                        <span class="option-code">{{ option.extId }}</span>
                                        <span class="option-sep">—</span>
                                        <span class="option-name">{{ option.companyName }}</span>
                                    </div>
                                </template>
                                <template #value="{ value }">
                                    <div v-if="value" class="selected-row">
                                        <span class="option-code">{{ selectedCustomerObj?.extId }}</span>
                                        <span class="option-sep">—</span>
                                        <span class="selected-name">{{ selectedCustomerObj?.companyName }}</span>
                                    </div>
                                    <span v-else class="select-ph">Sélectionner un client...</span>
                                </template>
                            </Select>
                        </div>

                        <!-- Bouton info client -->
                        <Transition name="fade-slide">
                            <button
                                v-if="selectedCustomerObj"
                                class="info-btn"
                                :class="{ 'is-contre': customerFinancials?.contreRemboursement }"
                                @click="showClientDialog = true"
                                title="Voir les détails du client"
                            >
                                <i class="pi pi-info-circle"></i>
                            </button>
                        </Transition>

                        <!-- Barre de recherche -->
                        <div class="search-wrapper" :class="{ 'disabled-wrapper': !selectedClient }">
                            <i class="pi pi-search search-input-icon"></i>
                            <input
                                v-model="searchQuery"
                                type="text"
                                class="search-input"
                                placeholder="Rechercher une référence, un article..."
                                @keyup.enter="handleSearch"
                                :disabled="!selectedClient"
                            />
                        </div>

                        <!-- Icone Recherche Avancée -->
                        <button
                            class="adv-search-btn"
                            :class="{ 'active': isAdvancedSearchExpanded }"
                            @click="toggleAdvancedSearch"
                            title="Recherche avancée"
                            type="button"
                            :disabled="!selectedClient"
                        >
                            <i class="pi pi-sliders-h"></i>
                        </button>
                    </div>

                    <div class="header-right">
                        <!-- KPI chips -->
                        <div class="header-kpis" v-if="selectedClient">
                            
                            <!-- 1er KPI : Encours Commercial / Plafond -->
                            <div class="kpi-card kpi-blue-theme" title="Encours Commercial / Plafond">
                                <div v-if="isLoadingFinancials" class="kpi-loading-skeleton">
                                    <div class="skeleton-line w-2/3 mb-2" style="width: 70%;"></div>
                                    <div class="skeleton-line w-1/2" style="width: 50%;"></div>
                                </div>
                                <div v-else class="kpi-card-inner">
                                    <!-- Left: Icon Badge -->
                                    <div class="kpi-icon-container blue" title="Encours Commercial">
                                        <i class="pi pi-credit-card"></i>
                                    </div>
                                    
                                    <!-- Divider -->
                                    <div class="kpi-divider blue"></div>
                                    
                                    <!-- Right: Main Content (2 lines) -->
                                    <div class="kpi-main-content">
                                        <!-- Line 1: Value & Percent Badge -->
                                        <div class="kpi-val-row">
                                            <span class="kpi-main-value blue">
                                                {{ formatPrice(customerFinancials?.encoursCommercial) }} TND
                                            </span>
                                            <span class="kpi-mini-percent blue">{{ encoursCommercialPercent }}%</span>
                                        </div>
                                        
                                        <!-- Line 2: Gauge -->
                                        <div class="kpi-gauge-row">
                                            <span class="kpi-gauge-min">0</span>
                                            <div class="kpi-gauge-bar-bg">
                                                <div class="kpi-gauge-bar-fill blue" :style="{ width: Math.min(100, encoursCommercialPercent) + '%' }"></div>
                                            </div>
                                            <span class="kpi-gauge-max">{{ formatPrice(customerFinancials?.plafondCommercial) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 2eme KPI : Factures & Avoirs -->
                            <div class="kpi-card kpi-amber-theme" title="Factures &amp; Avoirs non soldés">
                                <div v-if="isLoadingFinancials" class="kpi-loading-skeleton">
                                    <div class="skeleton-line w-2/3 mb-2" style="width: 70%;"></div>
                                    <div class="skeleton-line w-1/2" style="width: 50%;"></div>
                                </div>
                                <div v-else class="kpi-card-inner">
                                    <!-- Left: Icon Badge -->
                                    <div class="kpi-icon-container amber" title="Factures &amp; Avoirs">
                                        <i class="pi pi-receipt"></i>
                                    </div>
                                    
                                    <!-- Divider -->
                                    <div class="kpi-divider amber"></div>
                                    
                                    <!-- Right: Main Content -->
                                    <div class="kpi-main-content">
                                        <!-- Line 1: Value -->
                                        <div class="kpi-val-row">
                                            <span class="kpi-main-value amber">
                                                {{ formatPrice(customerFinancials?.factureEtAvoirs) }} TND
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 3eme KPI : Encours Financier / Encaissement en coffre -->
                            <div class="kpi-card kpi-emerald-theme" title="Encours Financier / En Coffre">
                                <div v-if="isLoadingFinancials" class="kpi-loading-skeleton">
                                    <div class="skeleton-line w-2/3 mb-2" style="width: 70%;"></div>
                                    <div class="skeleton-line w-1/2" style="width: 50%;"></div>
                                </div>
                                <div v-else class="kpi-card-inner">
                                    <!-- Left: Icon Badge -->
                                    <div class="kpi-icon-container emerald" title="Encours Financier">
                                        <i class="pi pi-wallet"></i>
                                    </div>
                                    
                                    <!-- Divider -->
                                    <div class="kpi-divider emerald"></div>
                                    
                                    <!-- Right: Main Content -->
                                    <div class="kpi-main-content">
                                        <!-- Line 1: Value & Percent Badge -->
                                        <div class="kpi-val-row">
                                            <span class="kpi-main-value emerald">
                                                {{ formatPrice(customerFinancials?.encoursFinancier) }} TND
                                            </span>
                                            <span class="kpi-mini-percent emerald">{{ encoursFinancierPercent }}%</span>
                                        </div>
                                        
                                        <!-- Line 2: Gauge -->
                                        <div class="kpi-gauge-row">
                                            <span class="kpi-gauge-min">0</span>
                                            <div class="kpi-gauge-bar-bg">
                                                <div class="kpi-gauge-bar-fill emerald" :style="{ width: Math.min(100, encoursFinancierPercent) + '%' }"></div>
                                            </div>
                                            <span class="kpi-gauge-max">{{ formatPrice(customerFinancials?.encoursEncaissementEnCoffre) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <!-- Section Filtres Avancés (Expand/Collapse) -->
                <div class="advanced-filters-panel" :class="{ 'expanded': isAdvancedSearchExpanded }">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label class="filter-label">Groupe</label>
                            <Select
                                v-model="selectedGroup"
                                :options="groups"
                                optionLabel="displayName"
                                optionValue="code"
                                placeholder="Tous les groupes"
                                class="filter-select"
                                showClear
                                :loading="isLoadingGroups"
                                @change="onGroupChange"
                                filter
                                autoFilterFocus
                                filterPlaceholder="Rechercher un groupe..."
                                panelClass="c2-dropdown-panel"
                                :disabled="!selectedClient"
                            >
  <template #option="{ option }">
    <div class="option-row">
      <span class="option-code">{{ option.code }}</span>
      <span class="option-sep">—</span>
      <span class="option-name">{{ option.displayName }}</span>
    </div>
  </template>
</Select>
                        </div>

                        <div class="filter-group">
    <label class="filter-label">Sous-groupe</label>
    <Select
        v-model="selectedSubGroup"
        :options="subGroups"
        optionLabel="displayName"
        optionValue="code"
        placeholder="Tous les sous-groupes"
        class="filter-select"
        showClear
        :loading="isLoadingSubGroups"
        :disabled="!selectedClient || !selectedGroup"
        @change="handleSearch"
        filter
        autoFilterFocus
        filterPlaceholder="Rechercher un sous-groupe..."
        panelClass="c2-dropdown-panel"
    >
      <template #option="{ option }">
        <div class="option-row">
          <span class="option-code">{{ option.code }}</span>
          <span class="option-sep">—</span>
          <span class="option-name">{{ option.displayName }}</span>
        </div>
      </template>
    </Select>
</div>

                        <div class="filter-group">
                            <label class="filter-label">Fabricant</label>
                            <Select
                                v-model="selectedManufacturer"
                                :options="manufacturers"
                                optionLabel="Name"
                                optionValue="Code"
                                placeholder="Tous les fabricants"
                                class="filter-select"
                                showClear
                                @change="handleSearch"
                                filter
                                autoFilterFocus
                                filterPlaceholder="Rechercher un fabricant..."
                                :loading="isLoadingManufacturers"
                                panelClass="c2-dropdown-panel"
                                :disabled="!selectedClient"
                            >
                                <template #option="{ option }">
                                    <div class="option-row">
                                        <span class="option-code">{{ option.Code }}</span>
                                        <span class="option-sep">—</span>
                                        <span class="option-name">{{ option.Name }}</span>
                                    </div>
                                </template>
                            </Select>
                        </div>

                        <div class="filter-actions">
                            <button class="filter-btn-search" @click="handleSearch" title="Rechercher avec les filtres" :disabled="!selectedClient">
                                <i class="pi pi-search"></i>
                                <span>Rechercher</span>
                            </button>
                            <button class="filter-btn-reset" @click="resetFilters" title="Réinitialiser les filtres" :disabled="!selectedClient">
                                <i class="pi pi-refresh"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ─── BODY ────────────────────────────────────────────────────── -->
            <div class="body-layout">
                <div class="left-panel" :class="{ 'left-panel--expanded': isRightExpanded }">
                    <div class="table-container">
                        <div class="table-header-row">
                            <span class="table-title">Résultats de recherche</span>
                        </div>
                        <div class="table-wrapper" @scroll="handleScroll">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th style="width: 23%">Réf / Désig</th>
                                        <th style="width: 18%">Fabricant</th>
                                        <th style="width: 13%; text-align: right;">Prix</th>
                                        <th style="width: 10%; text-align: right;">Stock</th>
                                        <th style="width: 12%; text-align: right;">Rés. / Réc.</th>
                                        <th style="width: 7%; text-align: center;">Info</th>
                                        <th style="width: 17%; text-align: center;">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="!selectedClient">
                                        <td colspan="7" class="text-center p-4" style="color: #ea580c; font-weight: 500; background-color: #fff7ed; font-style: italic;">
                                            <i class="pi pi-exclamation-triangle mr-2"></i> Veuillez sélectionner un client dans la liste déroulante en haut pour commencer la recherche.
                                        </td>
                                    </tr>
                                    <tr v-else-if="isLoadingSearch">
                                        <td colspan="7" class="text-center p-4" style="color: #64748b; font-style: italic;">
                                            <i class="pi pi-spin pi-spinner mr-2"></i> Recherche en cours...
                                        </td>
                                    </tr>
                                    <tr v-else-if="!isLoadingSearch && searchResults.length === 0">
                                        <td colspan="7" class="text-center p-4" style="color: #64748b; font-style: italic;">
                                            Saisissez une référence et appuyez sur Entrée pour rechercher.
                                        </td>
                                    </tr>
                                    <tr 
                                        v-for="item in searchResults" 
                                        :key="item.no || item.id"
                                        @click="selectItem(item)"
                                        :class="{ 'selected-orange-row': selectedItemNo === item.no }"
                                        style="cursor: pointer;"
                                    >
                                        <td>
                                            <div class="cell-reference" :title="formatReference(item.no)">
                                                {{ formatReference(item.no) }}
                                                <i v-if="isProductItem(item)" class="pi pi-bookmark-fill product-flag" title="Référence Master"></i>
                                            </div>
                                            <div class="cell-description" :title="item.descriptionStructuree">{{ item.descriptionStructuree }}</div>
                                        </td>
                                        <!-- Colonne 2 : fabricant et makeCode -->
                                        <td>
                                            <div class="cell-reference" :title="item.fabricant">{{ item.fabricant }}</div>
                                            <div class="cell-description" :title="item.makeCode">{{ item.makeCode }}</div>
                                        </td>
                                        <!-- Colonne 3 : unitPrice -->
                                        <td class="text-right">
                                            <div class="cell-reference">{{ formatNumber(item.unitPrice, 3) }}</div>
                                        </td>
                                        <!-- Colonne 4 : quantite -->
                                        <td class="text-right">
                                            <div class="cell-reference" :class="{ 'positive-qty': (item.quantite || 0) > 0 }">{{ formatNumber(item.quantite !== null ? item.quantite : 0, 0) }}</div>
                                        </td>
                                        <!-- Colonne 5 : reservedQuantity et receptionQty -->
                                        <td class="text-right">
                                            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                                <span class="stock-tag tag-cmd" v-if="parseFloat(item.reservedQuantity || 0) !== 0">
                                                    <span>Rsv :</span><span>{{ formatNumber(item.reservedQuantity || 0, 0) }}</span>
                                                </span>
                                                <span class="stock-tag tag-import" v-if="parseFloat(item.receptionQty || 0) !== 0">
                                                    <span>Rec :</span><span>{{ formatNumber(item.receptionQty || 0, 0) }}</span>
                                                </span>
                                            </div>
                                        </td>
                                        <!-- Colonne 6 : bouton info pour ouvrir dialog tecdoc -->
                                        <td class="text-center">
                                            <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                                                <i v-if="item.isOem == '0' || item.isOem === 0" class="pi pi-info-circle info-icon" @click="openTecdocDialog(item)" title="Voir les détails TecDoc"></i>
                                            </div>
                                        </td>
                                        <!-- Colonne 7 : champ de qté à saisir + panier -->
                                        <td class="text-center">
                                            <div class="qty-input-wrapper" style="justify-content: center;">
                                                <button @click="item.orderQty = Math.max(1, (item.orderQty || 1) - 1)" class="qty-btn" type="button">-</button>
                                                <input type="number" v-model.number="item.orderQty" class="qty-input" min="1" />
                                                <button @click="item.orderQty = (item.orderQty || 1) + 1" class="qty-btn" type="button">+</button>
                                                <button class="cart-btn-mini" :disabled="!selectedClient" @click="addToCart(item)" :title="!selectedClient ? 'Veuillez sélectionner un client' : 'Ajouter au panier'" type="button">
                                                    <i class="pi pi-shopping-cart"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <!-- Row de chargement supplémentaire (Infinite Scroll) -->
                                    <tr v-if="!isLoadingSearch && searchResults.length > 0 && isLoadingMore">
                                        <td colspan="7" class="text-center p-3" style="color: #3b82f6; font-style: italic; font-weight: 500; background: #f8fafc;">
                                            <i class="pi pi-spin pi-spinner mr-2"></i> Chargement des articles suivants...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="table-container">
                        <div class="table-header-row">
                            <span class="table-title">Équivalences</span>
                        </div>
                        <div class="table-wrapper">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th style="width: 23%">Réf / Désig</th>
                                        <th style="width: 18%">Fabricant</th>
                                        <th style="width: 13%; text-align: right;">Prix</th>
                                        <th style="width: 10%; text-align: right;">Stock</th>
                                        <th style="width: 12%; text-align: right;">Rés. / Réc.</th>
                                        <th style="width: 7%; text-align: center;">Info</th>
                                        <th style="width: 17%; text-align: center;">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="isLoadingEquivalences">
                                        <td colspan="7" class="text-center p-4" style="color: #64748b; font-style: italic;">
                                            <i class="pi pi-spin pi-spinner mr-2"></i> Chargement des équivalences...
                                        </td>
                                    </tr>
                                    <tr v-else-if="!selectedItemNo">
                                        <td colspan="7" class="text-center p-4" style="color: #64748b; font-style: italic;">
                                            Sélectionnez un article ci-dessus pour afficher ses équivalences.
                                        </td>
                                    </tr>
                                    <tr v-else-if="equivalences.length === 0">
                                        <td colspan="7" class="text-center p-4" style="color: #64748b; font-style: italic;">
                                            Aucune équivalence trouvée pour cet article.
                                        </td>
                                    </tr>
                                    <template v-else>
                                        <tr v-for="eq in equivalences" :key="eq.id || eq.no" @click="selectEquivalence(eq)" :class="{ 'selected-row-highlight': selectedEquivalenceNo === eq.no }" style="cursor: pointer;">
                                            <!-- Colonne 1 : no et descriptionStructuree -->
                                            <td>
                                                <div class="cell-reference" :title="formatReference(eq.no)">
                                                    {{ formatReference(eq.no) }}
                                                    <i v-if="isProductItem(eq)" class="pi pi-bookmark-fill product-flag" title="Référence Master"></i>
                                                </div>
                                                <div class="cell-description" :title="eq.descriptionStructuree">{{ eq.descriptionStructuree }}</div>
                                            </td>
                                            <!-- Colonne 2 : fabricant et makeCode -->
                                            <td>
                                                <div class="cell-reference" :title="eq.fabricant">{{ eq.fabricant }}</div>
                                                <div class="cell-description" :title="eq.makeCode">{{ eq.makeCode }}</div>
                                            </td>
                                            <!-- Colonne 3 : unitPrice -->
                                            <td class="text-right">
                                                <div class="cell-reference">{{ formatNumber(eq.unitPrice, 3) }}</div>
                                            </td>
                                            <!-- Colonne 4 : quantite -->
                                            <td class="text-right">
                                                <div class="cell-reference" :class="{ 'positive-qty': (eq.quantite || 0) > 0 }">{{ formatNumber(eq.quantite !== null ? eq.quantite : 0, 0) }}</div>
                                            </td>
                                            <!-- Colonne 5 : reservedQuantity et receptionQty -->
                                            <td class="text-right">
                                                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                                    <span class="stock-tag tag-cmd" v-if="parseFloat(eq.reservedQuantity || 0) !== 0">
                                                        <span>Rsv :</span><span>{{ formatNumber(eq.reservedQuantity || 0, 0) }}</span>
                                                    </span>
                                                    <span class="stock-tag tag-import" v-if="parseFloat(eq.receptionQty || 0) !== 0">
                                                        <span>Rec :</span><span>{{ formatNumber(eq.receptionQty || 0, 0) }}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <!-- Colonne 6 : bouton info pour ouvrir dialog tecdoc -->
                                            <td class="text-center">
                                                <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                                                    <i v-if="eq.isOem == '0' || eq.isOem === 0" class="pi pi-info-circle info-icon" @click="openTecdocDialog(eq)" title="Voir les détails TecDoc"></i>
                                                </div>
                                            </td>
                                            <!-- Colonne 7 : champ de qté à saisir + panier -->
                                            <td class="text-center">
                                                <div class="qty-input-wrapper" style="justify-content: center;">
                                                    <button @click="eq.orderQty = Math.max(1, (eq.orderQty || 1) - 1)" class="qty-btn" type="button">-</button>
                                                    <input type="number" v-model.number="eq.orderQty" class="qty-input" min="1" />
                                                    <button @click="eq.orderQty = (eq.orderQty || 1) + 1" class="qty-btn" type="button">+</button>
                                                    <button class="cart-btn-mini" :disabled="!selectedClient" @click="addToCart(eq)" :title="!selectedClient ? 'Veuillez sélectionner un client' : 'Ajouter au panier'" type="button">
                                                        <i class="pi pi-shopping-cart"></i>
                                                     </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="table-container">
                        <div class="table-header-row">
                            <span class="table-title">Kits</span>
                        </div>
                        <div class="table-wrapper">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th style="width: 23%">Réf / Désig</th>
                                        <th style="width: 18%">Fabricant</th>
                                        <th style="width: 13%; text-align: right;">Prix</th>
                                        <th style="width: 10%; text-align: right;">Stock</th>
                                        <th style="width: 12%; text-align: right;">Rés. / Réc.</th>
                                        <th style="width: 7%; text-align: center;">Info</th>
                                        <th style="width: 17%; text-align: center;">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="isLoadingKits">
                                        <td colspan="7" class="text-center p-4" style="color: #64748b; font-style: italic;">
                                            <i class="pi pi-spin pi-spinner mr-2"></i> Chargement des kits...
                                        </td>
                                    </tr>
                                    <tr v-else-if="!selectedItemNo">
                                        <td colspan="7" class="text-center p-4" style="color: #64748b; font-style: italic;">
                                            Sélectionnez un article ci-dessus pour afficher ses kits.
                                        </td>
                                    </tr>
                                    <tr v-else-if="kits.length === 0">
                                        <td colspan="7" class="text-center p-4" style="color: #64748b; font-style: italic;">
                                            Aucun kit trouvé pour cet article.
                                        </td>
                                    </tr>
                                    <template v-else>
                                        <tr v-for="k in kits" :key="k.id || k.no" @click="selectKit(k)" :class="{ 'selected-row-highlight': selectedKitNo === k.no }" style="cursor: pointer;">
                                            <!-- Colonne 1 : no et descriptionStructuree -->
                                            <td>
                                                <div class="cell-reference" :title="formatReference(k.no)">
                                                    {{ formatReference(k.no) }}
                                                    <i v-if="isProductItem(k)" class="pi pi-bookmark-fill product-flag" title="Référence Master"></i>
                                                </div>
                                                <div class="cell-description" :title="k.descriptionStructuree">{{ k.descriptionStructuree }}</div>
                                            </td>
                                            <!-- Colonne 2 : fabricant et makeCode -->
                                            <td>
                                                <div class="cell-reference" :title="k.fabricant">{{ k.fabricant }}</div>
                                                <div class="cell-description" :title="k.makeCode">{{ k.makeCode }}</div>
                                            </td>
                                            <!-- Colonne 3 : unitPrice -->
                                            <td class="text-right">
                                                <div class="cell-reference">{{ formatNumber(k.unitPrice, 3) }}</div>
                                            </td>
                                            <!-- Colonne 4 : quantite -->
                                            <td class="text-right">
                                                <div class="cell-reference" :class="{ 'positive-qty': (k.quantite || 0) > 0 }">{{ formatNumber(k.quantite !== null ? k.quantite : 0, 0) }}</div>
                                            </td>
                                            <!-- Colonne 5 : reservedQuantity et receptionQty -->
                                            <td class="text-right">
                                                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                                    <span class="stock-tag tag-cmd" v-if="parseFloat(k.reservedQuantity || 0) !== 0">
                                                        <span>Rsv :</span><span>{{ formatNumber(k.reservedQuantity || 0, 0) }}</span>
                                                    </span>
                                                    <span class="stock-tag tag-import" v-if="parseFloat(k.receptionQty || 0) !== 0">
                                                        <span>Rec :</span><span>{{ formatNumber(k.receptionQty || 0, 0) }}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <!-- Colonne 6 : bouton info pour ouvrir dialog tecdoc -->
                                            <td class="text-center">
                                                <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
                                                    <i v-if="k.isOem == '0' || k.isOem === 0" class="pi pi-info-circle info-icon" @click="openTecdocDialog(k)" title="Voir les détails TecDoc"></i>
                                                </div>
                                            </td>
                                            <!-- Colonne 7 : champ de qté à saisir + panier -->
                                            <td class="text-center">
                                                <div class="qty-input-wrapper" style="justify-content: center;">
                                                    <button @click="k.orderQty = Math.max(1, (k.orderQty || 1) - 1)" class="qty-btn" type="button">-</button>
                                                    <input type="number" v-model.number="k.orderQty" class="qty-input" min="1" />
                                                    <button @click="k.orderQty = (k.orderQty || 1) + 1" class="qty-btn" type="button">+</button>
                                                    <button class="cart-btn-mini" :disabled="!selectedClient" @click="addToCart(k)" :title="!selectedClient ? 'Veuillez sélectionner un client' : 'Ajouter au panier'" type="button">
                                                        <i class="pi pi-shopping-cart"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="right-panel" :class="{ 'right-panel--expanded': isRightExpanded }">
                    <template v-if="selectedClient">
                        <SalesOrderSidebar />
                    </template>
                    <template v-else>
                        <div class="empty-client-sidebar">
                            <i class="pi pi-users placeholder-icon"></i>
                            <span class="placeholder-text">Aucun client sélectionné</span>
                            <span class="placeholder-desc">Veuillez choisir un client dans le sélecteur en haut pour gérer son panier et son historique.</span>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Footer de page (charte C2, structure standard) — discret, sans action -->
            <footer class="b2b-footer">
                <span class="b2b-footer-label">B2B</span>
                <span class="b2b-footer-sub">Commande / Panier</span>
            </footer>
        </main>

        <!-- ═══════════════════════════════════════════════════════════════
             DIALOG DÉTAILS CLIENT
        ════════════════════════════════════════════════════════════════ -->
        <Dialog
            v-model:visible="showClientDialog"
            modal
            :showHeader="false"
            :style="{ width: '720px', maxWidth: '94vw', padding: '0', borderRadius: '14px', overflow: 'hidden' }"
            :contentStyle="{ padding: '0', borderRadius: '14px' }"
            dismissableMask
            class="c2-client-dialog"
        >
            <div class="c2-client" v-if="selectedCustomerObj">

                <!-- Header Deep Ocean -->
                <div class="c2-client-head">
                    <div class="c2-client-headleft">
                        <b class="c2-client-name"><span class="c2-client-code">{{ selectedCustomerObj.extId || '—' }}</span> · {{ selectedCustomerObj.companyName || 'Client' }}</b>
                    </div>
                    <div class="c2-client-headright">
                        <span v-if="customerFinancials?.contreRemboursement" class="c2-client-flag" title="Client en Contre Remboursement">
                            <i class="pi pi-wallet"></i> Contre Remboursement
                        </span>
                        <button class="c2-client-close" @click="showClientDialog = false"><i class="pi pi-times"></i></button>
                    </div>
                </div>

                <!-- Corps : grille de champs -->
                <div class="c2-client-body">
                    <div class="c2-client-grid">

                        <div class="c2-client-field">
                            <span class="c2-client-flabel"><i class="pi pi-id-card"></i> Code Client</span>
                            <span class="c2-client-fvalue mono">{{ selectedCustomerObj.extId || '—' }}</span>
                        </div>

                        <div class="c2-client-field">
                            <span class="c2-client-flabel"><i class="pi pi-building"></i> Raison Sociale</span>
                            <span class="c2-client-fvalue">{{ selectedCustomerObj.companyName || '—' }}</span>
                        </div>

                        <div class="c2-client-field">
                            <span class="c2-client-flabel"><i class="pi pi-phone"></i> Téléphone</span>
                            <span class="c2-client-fvalue">
                                <span v-if="getPhoneNumbersList(selectedCustomerObj.phone).length > 0" class="c2-client-phones">
                                    <span v-for="phone in getPhoneNumbersList(selectedCustomerObj.phone)" :key="phone" class="c2-client-chip">{{ phone }}</span>
                                </span>
                                <template v-else>—</template>
                            </span>
                        </div>

                        <div class="c2-client-field">
                            <span class="c2-client-flabel"><i class="pi pi-envelope"></i> Email</span>
                            <span class="c2-client-fvalue">{{ selectedCustomerObj.email || '—' }}</span>
                        </div>

                        <div class="c2-client-field">
                            <span class="c2-client-flabel"><i class="pi pi-file-edit"></i> Matricule Fiscal</span>
                            <span class="c2-client-fvalue">{{ selectedCustomerObj.taxRegistrationNumber || '—' }}</span>
                        </div>

                        <div class="c2-client-field">
                            <span class="c2-client-flabel"><i class="pi pi-map"></i> Ville</span>
                            <span class="c2-client-fvalue">{{ selectedCustomerObj.city || '—' }}</span>
                        </div>

                        <div class="c2-client-field full">
                            <span class="c2-client-flabel"><i class="pi pi-map-marker"></i> Adresse</span>
                            <span class="c2-client-fvalue">{{ selectedCustomerObj.address || '—' }}</span>
                        </div>

                    </div>
                </div>

                <!-- Pied de dialog -->
                <div class="c2-client-foot">
                    <button class="c2-client-btn" @click="showClientDialog = false">Fermer</button>
                </div>
            </div>
        </Dialog>

        <!-- Dialog Info Article TecDoc — composant PARTAGÉ (réf. visuelle = B2B) -->
        <TecDocArticleInfoDialog
            v-model:visible="showInfoDialog"
            :item="selectedInfoItem"
            :loading="selectedInfoItem?.isLoading"
            :is-master="selectedInfoItem ? isProductItem(selectedInfoItem) : false"
            @load-vehicle-models="fetchVehiclesForBrand"
        />


    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import TheNavbar from '../components/TheNavbar.vue'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import apiClient from '../api/axios'
import { useCompareQuoteStore } from '../stores/compareQuote'
import { useAuthStore } from '../stores/auth'
import { useSalesOrderStore } from '../stores/salesOrderStore'
import SalesOrderSidebar from '../components/SalesOrderSidebar.vue'
import TecDocArticleInfoDialog from '../components/tecdoc/TecDocArticleInfoDialog.vue'

const compareStore = useCompareQuoteStore()
const authStore = useAuthStore()
const salesOrderStore = useSalesOrderStore()

const formatReference = (refVal) => {
    if (!refVal) return ''
    return refVal.replace(/MASTER/gi, '').trim()
}

const getPhoneNumbersList = (phoneStr) => {
    if (!phoneStr) return []
    
    // Split by common delimiters like slash, comma, asterisk, pipe, semicolon, newline
    const segments = phoneStr.split(/[\/\,\*\n\r\|;]/)
    const formattedNumbers = []
    
    for (let segment of segments) {
        segment = segment.trim()
        if (!segment) continue
        
        // Extract digits and leading + only
        const onlyDigits = segment.replace(/[^\d+]/g, '')
        const cleanDigits = onlyDigits.replace(/\+/g, '')
        
        if (cleanDigits.length === 8) {
            formattedNumbers.push(`${cleanDigits.slice(0, 2)} ${cleanDigits.slice(2, 5)} ${cleanDigits.slice(5)}`)
        } else if (cleanDigits.length === 11 && (cleanDigits.startsWith('216') || cleanDigits.startsWith('002'))) {
            const mainPart = cleanDigits.slice(-8)
            formattedNumbers.push(`(+216) ${mainPart.slice(0, 2)} ${mainPart.slice(2, 5)} ${mainPart.slice(5)}`)
        } else if (cleanDigits.length === 12 && cleanDigits.startsWith('00216')) {
            const mainPart = cleanDigits.slice(-8)
            formattedNumbers.push(`(+216) ${mainPart.slice(0, 2)} ${mainPart.slice(2, 5)} ${mainPart.slice(5)}`)
        } else if (cleanDigits.length > 8 && cleanDigits.length % 8 === 0) {
            for (let i = 0; i < cleanDigits.length; i += 8) {
                const num = cleanDigits.slice(i, i + 8)
                formattedNumbers.push(`${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5)}`)
            }
        } else {
            // Keep cleaned fallback
            const cleaned = segment.replace(/\s+/g, ' ')
            if (cleaned.length > 0) {
                formattedNumbers.push(cleaned)
            }
        }
    }
    
    return formattedNumbers
}

const isProductItem = (item) => {
    if (!item) return false
    const p = item.produit !== undefined ? item.produit : item.Produit
    return p === true || p === 'true' || p === 1 || p === '1'
}

const isRightExpanded = computed({
    get: () => salesOrderStore.isExpanded,
    set: (val) => salesOrderStore.isExpanded = val
})
const customers          = ref([])
const selectedClient     = ref(null)
const isLoadingCustomers = ref(false)
const showClientDialog   = ref(false)
const searchQuery        = ref('')

// Informations financières du client
const customerFinancials = ref(null)
const isLoadingFinancials = ref(false)

const formatPrice = (val) => {
    if (val == null || isNaN(val)) return '0'
    return Number(val).toLocaleString('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })
}

const toSafeNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0

    const normalized = String(value).trim().replace(/\s+/g, '').replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
}

const computeSafePercent = (numerator, denominator) => {
    const val = toSafeNumber(numerator)
    const max = toSafeNumber(denominator)
    if (max <= 0) return 0

    const percent = Math.round((val / max) * 100)
    if (!Number.isFinite(percent)) return 0
    return Math.max(0, percent)
}

const encoursCommercialPercent = computed(() => {
    if (!customerFinancials.value) return 0
    return computeSafePercent(
        customerFinancials.value.encoursCommercial,
        customerFinancials.value.plafondCommercial
    )
})

const encoursFinancierPercent = computed(() => {
    if (!customerFinancials.value) return 0
    return computeSafePercent(
        customerFinancials.value.encoursFinancier,
        customerFinancials.value.encoursEncaissementEnCoffre
    )
})

const fetchCustomerFinancials = async (clientId) => {
    isLoadingFinancials.value = true
    try {
        const response = await apiClient.get(`/api/customer-financials/${clientId}`)
        customerFinancials.value = response.data
    } catch (error) {
        console.error('Erreur lors du chargement des informations financières', error)
        customerFinancials.value = null
    } finally {
        isLoadingFinancials.value = false
    }
}

const searchResults      = ref([])
const isLoadingSearch    = ref(false)
const isLoadingMore      = ref(false)
const currentPage        = ref(0)
const hasMore            = ref(true)

// Variables pour les équivalences
const selectedItemNo = ref(null)
const selectedEquivalenceNo = ref(null)
const equivalences = ref([])
const isLoadingEquivalences = ref(false)

// Variables pour les kits
const selectedKitNo = ref(null)
const kits = ref([])
const isLoadingKits = ref(false)

// ─── Watch selectedClient → charger le panier actif et l'historique ───────────────
watch(selectedClient, (newClientId) => {
    // Réinitialiser les critères et résultats de recherche lors du changement de client
    searchQuery.value = ''
    searchResults.value = []
    selectedGroup.value = null
    selectedSubGroup.value = null
    selectedManufacturer.value = null
    subGroups.value = []
    isAdvancedSearchExpanded.value = false
    selectedItemNo.value = null
    selectedEquivalenceNo.value = null
    selectedKitNo.value = null
    salesOrderStore.selectedTransactionItem = null
    salesOrderStore.activeTab = 'order'
    equivalences.value = []
    kits.value = []
    customerFinancials.value = null

    if (newClientId) {
        salesOrderStore.loadActiveOrder(newClientId)
        salesOrderStore.loadHistory({ clientId: newClientId, page: 0, size: 20 })
        fetchCustomerFinancials(newClientId)
    } else {
        // Reset le store quand on désélectionne le client
        salesOrderStore.resetOrder()
    }
})

// Advanced search filters
const isAdvancedSearchExpanded = ref(false)
const selectedGroup = ref(null)
const selectedSubGroup = ref(null)
const selectedManufacturer = ref(null)

const groups = ref([])
const subGroups = ref([])
const manufacturers = ref([])

const isLoadingGroups = ref(false)
const isLoadingSubGroups = ref(false)
const isLoadingManufacturers = ref(false)

const toggleAdvancedSearch = async () => {
    isAdvancedSearchExpanded.value = !isAdvancedSearchExpanded.value
    if (isAdvancedSearchExpanded.value) {
        if (groups.value.length === 0) {
            await fetchGroups()
        }
        if (manufacturers.value.length === 0) {
            await fetchManufacturers()
        }
    }
}

const fetchGroups = async () => {
    isLoadingGroups.value = true
    try {
        const companyId = authStore.user?.bcCompanyId || '20C5337E-2E49-EC11-A103-00155DB6A301'
        groups.value = await compareStore.fetchCategories(1, 'PR', companyId)
    } catch (err) {
        console.error('Error fetching groups:', err)
    } finally {
        isLoadingGroups.value = false
    }
}

const fetchSubGroups = async (groupCode) => {
    if (!groupCode) {
        subGroups.value = []
        return
    }
    isLoadingSubGroups.value = true
    try {
        const companyId = authStore.user?.bcCompanyId || '20C5337E-2E49-EC11-A103-00155DB6A301'
        subGroups.value = await compareStore.fetchCategories(2, groupCode, companyId)
    } catch (err) {
        console.error('Error fetching sub-groups:', err)
        subGroups.value = []
    } finally {
        isLoadingSubGroups.value = false
    }
}

const onGroupChange = async () => {
    selectedSubGroup.value = null
    await fetchSubGroups(selectedGroup.value)
    handleSearch()
}

const fetchManufacturers = async () => {
    isLoadingManufacturers.value = true
    try {
        const companyId = authStore.user?.bcCompanyId || '20C5337E-2E49-EC11-A103-00155DB6A301'
        const response = await apiClient.get(`/api/bc/manufacturers?companyId=${encodeURIComponent(companyId)}`)
        manufacturers.value = response.data || []
    } catch (err) {
        console.error('Error fetching manufacturers:', err)
        manufacturers.value = []
    } finally {
        isLoadingManufacturers.value = false
    }
}

const resetFilters = () => {
    selectedGroup.value = null
    selectedSubGroup.value = null
    selectedManufacturer.value = null
    subGroups.value = []
}

// State variables for Article Info Dialog
const showInfoDialog = ref(false)
const selectedInfoItem = ref(null)
const currentImageIndex = ref(0)
const isViewing360 = ref(false)
const current360Frame = ref(0)
const expandedBrands = ref(new Set())
const expandedOemBrands = ref(new Set())

// Info Section Collapse State
const isOemSectionExpanded      = ref(false)
const isPdfSectionExpanded      = ref(false)
const isVehiclesSectionExpanded = ref(false)
const isKitPartsSectionExpanded = ref(false)

const selectedCustomerObj = computed(() =>
    customers.value.find(c => c.extId === selectedClient.value) ?? null
)

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

const clientLabel = (c) => `${c.extId} ${c.companyName}`

const formatNumber = (value, decimals = 2) => {
    if (value === undefined || value === null || isNaN(value)) return '—'
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value)
}

const openTecdocDialog = async (item) => {
    currentImageIndex.value = 0
    isViewing360.value = false
    current360Frame.value = 0
    showInfoDialog.value = true
    expandedBrands.value.clear()
    expandedOemBrands.value.clear()
    isOemSectionExpanded.value      = false
    isPdfSectionExpanded.value      = false
    isVehiclesSectionExpanded.value = false
    isKitPartsSectionExpanded.value = false

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

    try {
        const articleRef = item.vendorItemNo || item.no
        const manufacturerId = item.tecdocIdFabricant || item.manufacturerId

        if (!articleRef || !manufacturerId) {
            console.error('Missing article reference or manufacturer ID')
            selectedInfoItem.value.isLoading = false
            return
        }

        const response = await compareStore.fetchTecdocArticleDetails(articleRef, manufacturerId)

        if (response && response.articles && response.articles.length > 0) {
            const article = response.articles[0]

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

            const specs = article.articleCriteria?.map(criteria => ({
                label: criteria.criteriaDescription,
                value: criteria.formattedValue
            })) || []

            const oemNumbers = article.oemNumbers?.map(oem => ({
                mfrName: oem.mfrName,
                articleNumber: oem.articleNumber
            })) || []

            const pdfs = article.pdfs || []

            const genericDesc = article.genericArticles?.[0]?.genericArticleDescription ||
                item.descriptionStructured || item.descriptionStructuree

            selectedInfoItem.value = {
                ...item,
                articleId: article.genericArticles?.[0]?.legacyArticleId,
                tecdocArticleNumber: article.articleNumber || '',
                isLoading: false,
                brand: article.mfrName || '',
                brandLogo: article.supplierLogoUrl || '/images/articles/febi_logo.png',
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
            selectedInfoItem.value.isLoading = false
        }
    } catch (error) {
        console.error('Error fetching TecDoc article details:', error)
        selectedInfoItem.value.isLoading = false
    }
}

const toggleOemBrand = (brand) => {
    if (expandedOemBrands.value.has(brand)) {
        expandedOemBrands.value.delete(brand)
    } else {
        expandedOemBrands.value.add(brand)
    }
}

const toggleBrand = async (brandGroup) => {
    const isExpanded = expandedBrands.value.has(brandGroup.brand)
    expandedBrands.value.clear()

    if (!isExpanded) {
        expandedBrands.value.add(brandGroup.brand)
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
        const vehicles = await compareStore.fetchArticleVehicles(selectedInfoItem.value.articleId, brandGroup.id)

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

            if (v.yearOfConstructionFrom < group.minYear) group.minYear = v.yearOfConstructionFrom
            if (v.yearOfConstructionTo > group.maxYear) group.maxYear = v.yearOfConstructionTo
            if (v.powerHpFrom < group.minHp) group.minHp = v.powerHpFrom
            if (v.powerHpFrom > group.maxHp) group.maxHp = v.powerHpFrom
        })

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

// Sync : la vignette active reste visible dans le scroll horizontal quand on change de photo
const thumbsRef = ref(null)
watch(currentImageIndex, (i) => {
    const cont = thumbsRef.value
    const el = cont && cont.children ? cont.children[i] : null
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
})

const handle360MouseMove = (event) => {
    if (!selectedInfoItem.value?.images360?.length) return

    const container = event.currentTarget
    const rect = container.getBoundingClientRect()
    const x = event.clientX - rect.left
    const width = rect.width

    const totalFrames = selectedInfoItem.value.images360.length
    const frameIndex = Math.floor((x / width) * totalFrames)

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

const addToCart = async (item) => {
    if (!selectedClient.value) return
    // Si pas de commande active, en créer une d'abord
    if (!salesOrderStore.activeOrder) {
        await salesOrderStore.loadActiveOrder(selectedClient.value)
    }
    const reference = item.no
    const quantity = item.orderQty || 1
    await salesOrderStore.addLine(reference, quantity, item.unitPrice)
    // Basculer sur l'onglet Commande pour voir la ligne mise en évidence
    salesOrderStore.activeTab = 'order'
}

const fetchCustomers = async () => {
    isLoadingCustomers.value = true
    try {
        const { data } = await apiClient.get('/api/customers')
        customers.value = data
    } catch (err) {
        console.error('Erreur chargement clients :', err)
    } finally {
        isLoadingCustomers.value = false
    }
}

// ─── Tri de pertinence par rapport au terme de recherche ─────────────────────
// Score 0 = meilleur (exact), 5 = faible pertinence. Zéro appel réseau supplémentaire.
const relevanceScore = (item, term) => {
    if (!term) return 9
    const t = term.toLowerCase().trim()
    const no   = (item.no || '').toLowerCase()
    const vid  = (item.vendorItemNo || '').toLowerCase()
    const desc = (item.searchDescription || '').toLowerCase()

    if (no  === t) return 0          // correspondance exacte sur no
    if (vid === t) return 1          // correspondance exacte sur vendorItemNo
    if (no.startsWith(t))  return 2  // no commence par le terme
    if (vid.startsWith(t)) return 3  // vendorItemNo commence par le terme
    if (no.includes(t))    return 4  // no contient le terme
    if (desc.includes(t))  return 5  // autre champ contient le terme
    return 6
}

const sortByRelevance = (items, term) => {
    if (!term || !term.trim()) return items
    return [...items].sort((a, b) => relevanceScore(a, term) - relevanceScore(b, term))
}

// Fonction de recherche temporaire pour observer la réponse réseau
// Fonction de recherche temporaire pour observer la réponse réseau
const handleSearch = async () => {
    if (!selectedClient.value) return
    
    if (searchQuery.value) {
        searchQuery.value = searchQuery.value.replace(/\s/g, '')
    }
    const hasActiveFilters = searchQuery.value || selectedGroup.value || selectedManufacturer.value
    if (!hasActiveFilters) return
    
    // Réinitialiser la sélection, les équivalences et les kits
    selectedItemNo.value = null
    equivalences.value = []
    kits.value = []
    
    isLoadingSearch.value = true
    currentPage.value = 0
    hasMore.value = true
    try {
        const params = {
            clientId: selectedClient.value,
            page: 0,
            size: 20
        }
        if (searchQuery.value.trim()) {
            params.searchTerm = searchQuery.value.trim()
        }
        if (selectedGroup.value) {
            params.itemProductCode = selectedGroup.value
        }
        if (selectedSubGroup.value) {
            params.itemSubProductCode = selectedSubGroup.value
        }
        if (selectedManufacturer.value) {
            params.codeFabricant = selectedManufacturer.value
        }

        const data = await compareStore.searchItems(params)
        
        if (data && data.content) {
            const rawItems = data.content.map(item => ({
                ...item,
                orderQty: 1
            }))
            // Tri par pertinence : correspondance exacte en premier
            searchResults.value = sortByRelevance(rawItems, searchQuery.value.trim())
            
            if (searchResults.value.length > 0) {
                selectItem(searchResults.value[0])
            }
            
            const pageInfo = data.page
            if (pageInfo) {
                hasMore.value = pageInfo.number < pageInfo.totalPages - 1
            } else {
                hasMore.value = false
            }
        } else {
            searchResults.value = []
            hasMore.value = false
        }
    } catch (err) {
        console.error('Erreur lors de la recherche :', err)
        searchResults.value = []
        hasMore.value = false
    } finally {
        isLoadingSearch.value = false
    }
}

const selectItem = async (item) => {
    if (selectedItemNo.value === item.no) {
        selectedEquivalenceNo.value = null
        selectedKitNo.value = null
        salesOrderStore.selectedTransactionItem = {
            no: item.no,
            descriptionStructured: item.descriptionStructuree || item.description,
            produit: item.produit
        }
        return
    }
    selectedItemNo.value = item.no
    selectedEquivalenceNo.value = null
    selectedKitNo.value = null
    salesOrderStore.selectedTransactionItem = {
        no: item.no,
        descriptionStructured: item.descriptionStructuree || item.description,
        produit: item.produit
    }
    equivalences.value = []
    kits.value = []
    
    isLoadingEquivalences.value = true
    isLoadingKits.value = true

    const loadEquivalences = async () => {
        if (!item.referenceOrigineLie) {
            isLoadingEquivalences.value = false
            return
        }
        try {
            const response = await apiClient.get('/api/elva-items/equivalences', {
                params: {
                    no: item.no,
                    referenceOrigineLie: item.referenceOrigineLie,
                    clientId: selectedClient.value
                }
            })
            equivalences.value = (response.data || []).map(eq => ({
                ...eq,
                orderQty: 1
            }))
        } catch (err) {
            console.error('Erreur lors du chargement des équivalences :', err)
            equivalences.value = []
        } finally {
            isLoadingEquivalences.value = false
        }
    }

    const loadKits = async () => {
        try {
            const response = await apiClient.get('/api/elva-items/kits', {
                params: {
                    no: item.no,
                    clientId: selectedClient.value
                }
            })
            kits.value = (response.data || []).map(k => ({
                ...k,
                orderQty: 1
            }))
        } catch (err) {
            console.error('Erreur lors du chargement des kits :', err)
            kits.value = []
        } finally {
            isLoadingKits.value = false
        }
    }

    await Promise.all([loadEquivalences(), loadKits()])
}

const selectEquivalence = (eq) => {
    selectedEquivalenceNo.value = eq.no
    selectedKitNo.value = null
    salesOrderStore.selectedTransactionItem = {
        no: eq.no,
        descriptionStructured: eq.descriptionStructuree || eq.description,
        produit: eq.produit
    }
}

const selectKit = (k) => {
    selectedKitNo.value = k.no
    selectedEquivalenceNo.value = null
    salesOrderStore.selectedTransactionItem = {
        no: k.no,
        descriptionStructured: k.descriptionStructuree || k.description,
        produit: k.produit
    }
}

const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target
    // Si on arrive à moins de 30px du bas du défilement
    if (scrollHeight - scrollTop - clientHeight < 30) {
        loadMore()
    }
}

const loadMore = async () => {
    if (!selectedClient.value) return
    if (isLoadingSearch.value || isLoadingMore.value || !hasMore.value) return
    
    isLoadingMore.value = true
    try {
        const nextPage = currentPage.value + 1
        const params = {
            clientId: selectedClient.value,
            page: nextPage,
            size: 20
        }
        if (searchQuery.value.trim()) {
            params.searchTerm = searchQuery.value.trim()
        }
        if (selectedGroup.value) {
            params.itemProductCode = selectedGroup.value
        }
        if (selectedSubGroup.value) {
            params.itemSubProductCode = selectedSubGroup.value
        }
        if (selectedManufacturer.value) {
            params.codeFabricant = selectedManufacturer.value
        }

        const data = await compareStore.searchItems(params)
        
        if (data && data.content) {
            const newItems = sortByRelevance(
                data.content.map(item => ({ ...item, orderQty: 1 })),
                searchQuery.value.trim()
            )
            searchResults.value.push(...newItems)
            currentPage.value = nextPage
            
            const pageInfo = data.page
            if (pageInfo) {
                hasMore.value = pageInfo.number < pageInfo.totalPages - 1
            } else {
                hasMore.value = false
            }
        } else {
            hasMore.value = false
        }
    } catch (err) {
        console.error('Erreur lors du chargement de la page suivante :', err)
    } finally {
        isLoadingMore.value = false
    }
}

onMounted(async () => {
    await fetchCustomers()
    if (selectedClient.value) {
        fetchCustomerFinancials(selectedClient.value)
    }
})
</script>

<!-- ── SCOPED : trigger + layout ──────────────────────────────────── -->
<style scoped>
.page-layout { min-height: 100vh; background-color: #f8fafc; }
/* Flex column : header (auto, grandit avec les filtres) + corps (flex:1) + footer (auto)
   → le corps remplit TOUJOURS l'espace restant, filtres ouverts ou fermés (sans calc figé). */
.main-content { width: 100%; height: 100vh; box-sizing: border-box; display: flex; flex-direction: column; padding: var(--c2-page-pad) var(--c2-page-pad); }

/* Header */
.header-bar {
    position: sticky;
    top: var(--c2-head-sticky-top);
    z-index: var(--c2-head-z);
    flex-shrink: 0;
    background: var(--c2-head-bg);
    border: 1px solid var(--c2-head-border);
    border-radius: var(--c2-head-radius);
    box-shadow: var(--c2-head-shadow);
    height: var(--c2-head-h);
    box-sizing: border-box;
    margin-bottom: var(--c2-head-gap);
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
/* Filtres ouverts : le header grandit pour révéler .advanced-filters-panel (fix régression) */
.header-bar.expanded {
    height: auto;
    overflow: hidden;   /* clippe les coins du panneau filtres aux angles arrondis du header */
}
.header-bar.expanded .header-main-row {
    height: var(--c2-head-h);
}
.header-main-row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 1.5rem; /* same gap as body-layout */
    padding: 0 1.5rem;
    height: 100%;
    box-sizing: border-box;
}
.header-left {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex: 2;

}
.header-right {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;

    padding-left: 1rem;
}
.header-bar h1 {
    font-size: 1.25rem; font-weight: 800; color: var(--c2-head-title); margin: 0; white-space: nowrap;
}
.spacer { flex-grow: 1; }

/* ── Barre de recherche (même style que Select client) ──────────── */
.search-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
}
.search-input-icon {
    position: absolute;
    left: 0.85rem;
    z-index: 2;
    color: #94a3b8;
    font-size: 0.85rem;
    pointer-events: none;
    transition: color 0.2s;
}
.search-input {
    width: 100%;
    height: 40px;
    padding: 0 1rem 0 2.25rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    font-size: 0.875rem;
    color: #1e293b;
    font-weight: 500;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-family: inherit;
}
.search-input::placeholder { color: #94a3b8; font-style: italic; }
.search-input:hover:not(:disabled)  { border-color: #cbd5e1; }
.search-input:focus:not(:disabled)  {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
}
.search-input:disabled {
    background-color: #f1f5f9;
    border-color: #e2e8f0;
    color: #cbd5e1;
    cursor: not-allowed;
}
.search-wrapper.disabled-wrapper {
    cursor: not-allowed;
}
.search-wrapper.disabled-wrapper .search-input-icon {
    color: #cbd5e1;
}
.search-wrapper:focus-within:not(.disabled-wrapper) .search-input-icon { color: #3b82f6; }

/* ── KPI Strip ──────────────────────────────────────────────── */
.kpi-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.75rem;
}
.kpi-tile {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background: white;
    border-radius: 10px;
    padding: 0.85rem 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    transition: box-shadow 0.2s, transform 0.18s;
    cursor: default;
}
.kpi-tile:hover {
    box-shadow: 0 4px 14px rgba(0,0,0,0.07);
    transform: translateY(-1px);
}
.kpi-tile-icon {
    width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem;
}
.kpi-tile-body { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; flex: 1; }
.kpi-tile-label {
    font-size: 0.72rem; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.05em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.kpi-tile-value {
    font-size: 1.1rem; font-weight: 700; color: #1e293b; line-height: 1.2;
}
.kpi-chip-value.positive { color: #16a34a; }

/* ── Séparateur vertical | ─────────────────────────────────── */
.header-divider {
    position: absolute;
    left: -0.75rem; /* center in the 1.5rem gap */
    top: 50%;
    transform: translate(-50%, -50%); /* perfectly centers the 1px line */
    width: 1px; height: 36px; background: #e2e8f0; flex-shrink: 0;
}

/* ── Container KPIs inline ────────────────────────────── */
.header-kpis {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
}

/* ── Modern Premium KPI Cards ────────────────────────── */
.kpi-card {
    flex: 1;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 0.25rem 0.6rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    position: relative;
    overflow: hidden;
    min-height: 52px;
}

.kpi-card.kpi-blue-theme:hover {
    border-color: #93c5fd;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
}

.kpi-card.kpi-amber-theme:hover {
    border-color: #fde047;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);
}

.kpi-card.kpi-emerald-theme:hover {
    border-color: #6ee7b7;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
}

/* Divider styling */
.kpi-divider {
    width: 2px;
    height: 24px;
    border-radius: 99px;
    flex-shrink: 0;
}
.kpi-divider.blue {
    background: linear-gradient(180deg, #3b82f6, #60a5fa);
}
.kpi-divider.amber {
    background: linear-gradient(180deg, #f59e0b, #fbbf24);
}
.kpi-divider.emerald {
    background: linear-gradient(180deg, #10b981, #34d399);
}

/* Card inner structure */
.kpi-card-inner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    height: 100%;
}

/* Left Icon Container styling */
.kpi-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    flex-shrink: 0;
    transition: transform 0.2s ease;
}
.kpi-card:hover .kpi-icon-container {
    transform: scale(1.05);
}

.kpi-icon-container.blue {
    background: #eff6ff;
    color: #2563eb;
    border: 1px solid #dbeafe;
}
.kpi-icon-container.amber {
    background: #fffbeb;
    color: #d97706;
    border: 1px solid #fef3c7;
}
.kpi-icon-container.emerald {
    background: #f0fdf4;
    color: #059669;
    border: 1px solid #dcfce7;
}

.kpi-icon-container i {
    font-size: 0.85rem;
}

/* Right main content area */
.kpi-main-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.18rem;
    min-width: 0;
}
.kpi-val-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.kpi-main-value {
    font-size: 0.92rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
}
.kpi-main-value.blue { color: #1e3a8a; }
.kpi-main-value.amber { color: #78350f; }
.kpi-main-value.emerald { color: #064e3b; }

.kpi-main-value .curr {
    font-style: normal;
    font-size: 0.58rem;
    color: #94a3b8;
    font-weight: 600;
    margin-left: 1px;
}

.kpi-mini-percent {
    font-size: 0.58rem;
    font-weight: 800;
    padding: 1px 4px;
    border-radius: 4px;
    line-height: 1;
    margin-left: 0.4rem;
}
.kpi-mini-percent.blue {
    color: #2563eb;
    background: #eff6ff;
    border: 1px solid #dbeafe;
}
.kpi-mini-percent.emerald {
    color: #059669;
    background: #f0fdf4;
    border: 1px solid #dcfce7;
}

/* Line 2 elements: Gauge and spacer */
.kpi-gauge-row {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    width: 100%;
    margin-top: 0.15rem;
}
.kpi-gauge-row-spacer {
    height: 10px;
    margin-top: 0.15rem;
}

.kpi-gauge-min {
    font-size: 0.55rem;
    color: #94a3b8;
    font-weight: 500;
}
.kpi-gauge-max {
    font-size: 0.55rem;
    color: #64748b;
    font-weight: 600;
    white-space: nowrap;
}
.kpi-gauge-max .curr-unit {
    font-style: normal;
    font-size: 0.48rem;
    color: #94a3b8;
}

.kpi-gauge-bar-bg {
    width: 100%;
    height: 3px;
    background: #f1f5f9;
    border-radius: 99px;
    overflow: hidden;
    flex-grow: 1;
}
.kpi-gauge-bar-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.kpi-gauge-bar-fill.blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
.kpi-gauge-bar-fill.emerald { background: linear-gradient(90deg, #10b981, #34d399); }

/* Skeleton loader inside KPI */
.kpi-loading-skeleton {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 2px 0;
}
.skeleton-line {
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    animation: skeleton-pulse 1.5s infinite ease-in-out;
}
@keyframes skeleton-pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
}

/* Select wrapper */
.client-select-wrapper {
    position: relative; display: flex; align-items: center;
    width: 45%; flex-shrink: 0;
}
.select-icon {
    position: absolute; left: 0.85rem; z-index: 2;
    color: #94a3b8; font-size: 0.85rem; pointer-events: none; transition: color 0.2s;
}
.client-select-wrapper:focus-within .select-icon { color: #3b82f6; }
.client-select { width: 100% !important; }

:deep(.p-select) {
    width: 100% !important; height: 40px !important; background: white !important;
    border: 1.5px solid #e2e8f0 !important; border-radius: 8px !important;
    display: flex !important; align-items: center !important;
    transition: border-color 0.2s, box-shadow 0.2s !important; cursor: pointer !important;
}
:deep(.p-select:hover) { border-color: #cbd5e1 !important; }
:deep(.p-select.p-focus) {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important; outline: none !important;
}
:deep(.p-select-label) {
    padding: 0 0.75rem 0 2.25rem !important; font-size: 0.875rem !important;
    color: #1e293b !important; font-weight: 500 !important; flex: 1 !important;
    min-width: 0 !important; display: flex !important; align-items: center !important;
    height: 100% !important; overflow: hidden !important;
}
:deep(.p-select-dropdown) {
    width: 2rem !important; color: #94a3b8 !important;
    display: flex !important; align-items: center !important;
    justify-content: center !important; flex-shrink: 0 !important;
}

/* Selected value */
.selected-row { display: flex; align-items: center; gap: 0.45rem; overflow: hidden; width: 100%; }
.selected-name { font-size: 0.875rem; color: #1e293b; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.select-ph { color: #94a3b8; font-size: 0.875rem; font-style: italic; }

/* Shared option atoms */
.option-code {
    font-size: 0.72rem; font-weight: 700; color: #3b82f6; background: #eff6ff;
    border-radius: 4px; padding: 0.1rem 0.45rem; white-space: nowrap; flex-shrink: 0;
    letter-spacing: 0.04em; font-family: var(--c2-font-mono);
}
.option-sep { color: #d1d5db; font-size: 0.8rem; flex-shrink: 0; }
.option-name {
    font-size: 0.875rem; color: #334155; font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.option-row { display: flex; align-items: center; gap: 0.5rem; width: 100%; overflow: hidden; }

/* ── Bouton info ──────────────────────────────────────────────────── */
.info-btn {
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px; border-radius: 50%;
    background: #eff6ff; border: 1.5px solid #bfdbfe;
    color: #3b82f6; cursor: pointer; flex-shrink: 0;
    transition: background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    font-size: 1rem;
}
.info-btn:hover {
    background: #3b82f6; border-color: #3b82f6; color: white;
    transform: scale(1.08); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
.info-btn.is-contre {
    background: #fef2f2;
    border-color: #fca5a5;
    color: #ef4444;
}
.info-btn.is-contre:hover {
    background: #ef4444;
    border-color: #ef4444;
    color: white;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* Transition du bouton info */
.fade-slide-enter-active, .fade-slide-leave-active {
    transition: opacity 0.2s, transform 0.2s;
}
.fade-slide-enter-from, .fade-slide-leave-to {
    opacity: 0; transform: scale(0.7);
}

/* Placeholder */
.placeholder-hint {
    display: inline-flex; align-items: center; padding: 0.35rem 0.9rem;
    border: 2px dashed #cbd5e1; border-radius: 6px; font-size: 0.75rem;
    color: #94a3b8; white-space: nowrap;
}

/* Body */
/* Gap gauche/droite compact (= padding page) + hauteur tokenisée → le corps remplit
   l'espace ENTRE header et footer (plus de "nombre magique", plus de vide bas, pas de chevauchement). */
.main-content { --b2b-footer-h: 48px; }   /* = hauteur footer page/sidebar (utilisée par .b2b-footer) */
/* Corps = espace restant entre header (variable selon filtres) et footer ; scroll INTERNE des panneaux. */
.body-layout { flex: 1; min-height: 0; display: flex; gap: var(--c2-page-pad); overflow: hidden; }

/* Footer de page B2B (charte C2, structure standard) — navy, 48px, discret (libellé structurel) */
.b2b-footer {
    flex-shrink: 0;
    height: var(--b2b-footer-h);
    margin-top: var(--c2-head-gap);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0 1.5rem;
    background: var(--c2-head-bg);
    border: 1px solid var(--c2-head-border);
    border-radius: var(--c2-head-radius);
    box-shadow: var(--c2-head-shadow);
    position: sticky;
    bottom: var(--c2-page-pad);
    z-index: var(--c2-head-z);
}
.b2b-footer-label { color: #e2e8f0; font-size: .82rem; font-weight: 700; letter-spacing: .02em; white-space: nowrap; }
.b2b-footer-sub { color: #94a3b8; font-size: .76rem; font-weight: 600; white-space: nowrap; }
/* Panneau gauche : ne scrolle PAS globalement (desktop) — chaque table scrolle en interne (cf. .table-wrapper).
   Les 3 sections partagent la hauteur du panneau via flex. */
.left-panel { flex: 2; transition: flex 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; gap: 1.5rem; min-height: 0; overflow: hidden; }
/* Fallback viewport très court : scroll global de secours */
@media (max-height: 620px) { .left-panel { overflow-y: auto; } }
.left-panel--expanded { flex: 1; }
.right-panel { position: relative; flex: 1; transition: flex 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; overflow: hidden; min-width: 320px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.right-panel--expanded { flex: 1; }
.toggle-btn {
    position: absolute; left: -16px; top: 50%; transform: translateY(-50%); z-index: 10;
    width: 32px; height: 32px; background: white; border: 1px solid #e2e8f0;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.08); transition: all 0.2s; color: #64748b;
}
.toggle-btn:hover { background: #eff6ff; box-shadow: 0 4px 12px rgba(59,130,246,0.15); color: #2563eb; }
.zone-border {
    height: 100%; border-radius: 8px; border: 2px dashed #cbd5e1; background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06); display: flex; align-items: center; justify-content: center;
}
.zone-left  { border-color: #93c5fd; }
.zone-right { border-color: #6ee7b7; }
.zone-label { font-size: 0.85rem; font-weight: 600; color: #94a3b8; letter-spacing: 0.03em; text-align: center; }

/* ── Dialog interne ───────────────────────────────────────────────── */
.dialog-inner { border-radius: 20px; overflow: hidden; background: white; border-left: 4px solid #3b82f6; }

/* Hero — fond blanc, layout horizontal gauche */
.dialog-hero {
    background: white;
    padding: 1.5rem 2rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    position: relative;
    border-bottom: 1px solid #f1f5f9;
    text-align: left;
}
.dialog-close {
    position: absolute; top: 1rem; right: 1rem;
    background: #f8fafc; border: 1px solid #e2e8f0;
    color: #94a3b8; width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; font-size: 0.75rem;
}
.dialog-close:hover { background: #fee2e2; border-color: #fca5a5; color: #ef4444; }

.contre-remboursement-flag {
    position: absolute; top: 1rem; right: 3.5rem;
    background: #fef2f2; border: 1px solid #fee2e2;
    color: #ef4444; border-radius: 999px;
    padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700;
    display: flex; align-items: center; gap: 0.4rem;
    box-shadow: 0 1px 2px rgba(239, 68, 68, 0.05);
}
.contre-remboursement-flag i {
    font-size: 0.8rem;
}

.phone-tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
}
.phone-tag {
    background-color: #f1f5f9;
    color: #0f172a;
    border: 1px solid #e2e8f0;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 700;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
}

.hero-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: #eff6ff; border: 2px solid #bfdbfe;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
}
.avatar-initials { font-size: 1.4rem; font-weight: 800; color: #2563eb; }

.hero-info {
    display: flex; flex-direction: column; gap: 0.35rem;
    min-width: 0;
    padding-right: 2rem; /* espace pour la croix */
}
.hero-name {
    font-size: 1.05rem; font-weight: 700; color: #1e293b;
    margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hero-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: #eff6ff; border: 1px solid #bfdbfe;
    color: #2563eb; border-radius: 999px;
    padding: 0.2rem 0.75rem; font-size: 0.75rem; font-weight: 700;
    letter-spacing: 0.05em; font-family: var(--c2-font-mono);
    width: fit-content;
}

/* Body infos */
.dialog-body { padding: 1.5rem; background: #f8fafc; }
.info-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;
}
.info-card {
    display: flex; align-items: center; gap: 0.9rem;
    background: white; border-radius: 12px;
    padding: 0.9rem 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    transition: box-shadow 0.2s, transform 0.2s;
}
.info-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.07); transform: translateY(-1px); }
.info-card.full { grid-column: 1 / -1; }

.info-icon-wrap {
    width: 38px; height: 38px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.95rem;
}
.info-icon-wrap.blue   { background: #eff6ff; color: #3b82f6; }
.info-icon-wrap.green  { background: #f0fdf4; color: #22c55e; }
.info-icon-wrap.orange { background: #fff7ed; color: #f97316; }
.info-icon-wrap.purple { background: #faf5ff; color: #a855f7; }
.info-icon-wrap.red    { background: #fef2f2; color: #ef4444; }
.info-icon-wrap.cyan   { background: #ecfeff; color: #0891b2; }
.info-icon-wrap.teal   { background: #f0fdfa; color: #0d9488; }

.info-content { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.info-label { font-size: 0.72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
.info-value {
    font-size: 0.875rem; font-weight: 600; color: #1e293b;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.info-value.mono { font-family: var(--c2-font-mono); color: #2563eb; font-size: 0.85rem; }

/* Footer */
.dialog-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #f1f5f9;
    display: flex; justify-content: flex-end;
    background: white;
}
.close-dialog-btn {
    padding: 0.55rem 1.5rem; border-radius: 8px;
    background: #f1f5f9; border: 1px solid #e2e8f0;
    color: #475569; font-size: 0.875rem; font-weight: 600;
    cursor: pointer; transition: background 0.2s, color 0.2s;
}
.close-dialog-btn:hover { background: #e2e8f0; color: #1e293b; }

/* ════════════ Dialog Info article — style Confirmation Achat C2 (scoped) ════════════ */
/* ════════════════════════════════════════════════════════════════
   DIALOG INFO CLIENT — chrome C2/Reapro (Deep Ocean header)
   Préfixe dédié .c2-client- (n'impacte pas l'ancien CSS .dialog- / .info-
   partagé par d'autres composants). Wrapper PrimeVue Dialog conservé.
   ════════════════════════════════════════════════════════════════ */
.c2-client-dialog :deep(.p-dialog-content) { padding: 0; border-radius: 14px; }
.c2-client {
    --ink: #0f172a; --line: #e8edf3;
    display: flex; flex-direction: column; background: #fff; border-radius: 14px; overflow: hidden;
}
.c2-client-head {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 16px; background: var(--c2-head-bg); border-bottom: 1px solid var(--c2-head-border); color: #fff;
}
.c2-client-headleft { display: flex; align-items: center; gap: 12px; min-width: 0; }
.c2-client-name { font-family: var(--c2-font-sans); font-size: 1rem; font-weight: 800; line-height: 1.3; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
/* Code dans le titre = même police/poids/couleur que le reste du header (pas de look mono/technique). */
.c2-client-code { color: inherit; }
.c2-client-headright { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.c2-client-flag {
    display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
    font-size: 0.72rem; font-weight: 700; padding: 4px 9px; border-radius: 7px;
    background: rgba(245, 158, 11, .16); color: #fde68a; border: 1px solid rgba(245, 158, 11, .38);
}
.c2-client-close {
    border: 1px solid var(--c2-head-border); background: #0e3f6e; color: #cbd5e1;
    width: 30px; height: 30px; border-radius: 8px; cursor: pointer; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center; transition: background .15s, color .15s;
}
.c2-client-close:hover { background: #155088; color: #fff; }

.c2-client-body { padding: 16px 18px; }
.c2-client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.c2-client-field {
    display: flex; flex-direction: column; gap: 4px; min-width: 0;
    padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: #fff;
}
.c2-client-field.full { grid-column: 1 / -1; }
.c2-client-flabel {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.66rem; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: var(--c2-muted-blue);
}
.c2-client-flabel i { color: var(--c2-primary); font-size: 0.78rem; }
.c2-client-fvalue { font-size: 0.9rem; color: var(--ink); font-weight: 600; word-break: break-word; }
/* Code client = identifiant métier court → Inter + tabular-nums (pas de mono agressif). */
.c2-client-fvalue.mono { font-family: var(--c2-font-sans); font-variant-numeric: tabular-nums; }
.c2-client-phones { display: flex; flex-wrap: wrap; gap: 5px; }
.c2-client-chip {
    font-size: 0.8rem; font-weight: 600; color: var(--c2-primary);
    background: #eff6ff; border: 1px solid #dbeafe; border-radius: 6px; padding: 2px 8px;
}

.c2-client-foot {
    display: flex; justify-content: flex-end; gap: 10px;
    padding: 12px 18px; border-top: 1px solid var(--line); background: #fafbfc;
}
.c2-client-btn {
    height: 36px; padding: 0 18px; border-radius: 8px; border: 1px solid #d6deea;
    background: #fff; color: #334155; font-weight: 700; font-size: 0.85rem; cursor: pointer;
    transition: background .15s, border-color .15s, box-shadow .15s;
}
.c2-client-btn:hover { background: #f1f5f9; border-color: #c2cedd; }
.c2-client-btn:focus-visible { outline: none; border-color: var(--c2-focus); box-shadow: 0 0 0 3px rgba(130, 201, 229, .35); }

</style>

<!-- ── GLOBAL : Panel overlay Select ─────────────────────────────── -->
<style>
.b2b-client-panel {
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.10), 0 2px 8px rgba(15, 23, 42, 0.06) !important;
    overflow: hidden !important; padding: 0 !important; margin-top: 5px !important;
    background: white !important; min-width: 40vw !important;
}
.b2b-client-panel .p-select-header { padding: 0 !important; border-bottom: 1px solid #f1f5f9 !important; background: white !important; }
.b2b-client-panel .p-select-filter-container { position: relative !important; display: flex !important; align-items: center !important; }
.b2b-client-panel .p-select-filter-icon { position: absolute !important; left: 0.9rem !important; color: #94a3b8 !important; font-size: 0.8rem !important; pointer-events: none !important; z-index: 1 !important; }
.b2b-client-panel .p-select-filter { width: 100% !important; border: none !important; border-radius: 0 !important; padding: 0.75rem 1rem 0.75rem 2.4rem !important; font-size: 0.875rem !important; color: #1e293b !important; background: white !important; outline: none !important; box-shadow: none !important; }
.b2b-client-panel .p-select-filter::placeholder { color: #b0bac8 !important; font-style: italic !important; }
.b2b-client-panel .p-select-list-container { max-height: 280px !important; overflow-y: auto !important; }
.b2b-client-panel .p-select-list { padding: 0.4rem !important; margin: 0 !important; }
.b2b-client-panel .p-select-list-container::-webkit-scrollbar { width: 4px !important; }
.b2b-client-panel .p-select-list-container::-webkit-scrollbar-track { background: transparent !important; }
.b2b-client-panel .p-select-list-container::-webkit-scrollbar-thumb { background: #e2e8f0 !important; border-radius: 2px !important; }
.b2b-client-panel .p-select-option { padding: 0 !important; border-radius: 7px !important; background: transparent !important; cursor: pointer !important; transition: background 0.13s !important; margin-bottom: 1px !important; }
.b2b-client-panel .p-select-option .option-row { padding: 0.6rem 0.75rem !important; border-radius: 7px !important; transition: background 0.13s !important; }
.b2b-client-panel .p-select-option:not(.p-select-option-selected):hover .option-row { background: #f0f7ff !important; }
.b2b-client-panel .p-select-option:not(.p-select-option-selected):hover .option-name { color: #1e293b !important; }
.b2b-client-panel .p-select-option.p-select-option-selected .option-row { background: #eff6ff !important; }
.b2b-client-panel .p-select-option.p-select-option-selected .option-code { background: #dbeafe !important; color: #1d4ed8 !important; }
.b2b-client-panel .p-select-option.p-select-option-selected .option-name { color: #1e40af !important; font-weight: 600 !important; }
.b2b-client-panel .p-select-option.p-select-option-selected .option-sep { color: #93c5fd !important; }
.b2b-client-panel .p-select-empty-message { padding: 1.5rem !important; text-align: center !important; color: #94a3b8 !important; font-size: 0.875rem !important; font-style: italic !important; }

/* Dialog border-radius override */
.client-detail-dialog .p-dialog-content { padding: 0 !important; border-radius: 20px !important; overflow: hidden !important; }
.client-detail-dialog { border-radius: 20px !important; overflow: hidden !important; box-shadow: 0 25px 50px rgba(0,0,0,0.15) !important; }

/* ── TABLES (Zone Gauche) ───────────────────────────────── */
.table-container {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    flex: 0 1 auto;   /* compact si peu de lignes, peut rétrécir → scroll interne du wrapper */
    min-height: 0;
}
/* Répartition STABLE (≈ 50/25/25) avec min ET max par section → aucune n'est jamais
   ni écrasée (min-height) ni trop grande (max-height) ; chacune scrolle en interne au-delà.
   FRS (1re) = part double ; EQV/KIT (2e/3e) = part simple. flex-basis 0 → part indépendante du contenu. */
/* Les 3 sections à HAUTEUR ÉGALE dans tous les cas (≈ 1/3 chacune), indépendamment du contenu :
   même poids flex + flex-basis 0 + même min/max → chacune scrolle en interne au-delà. */
.left-panel > .table-container:first-child,
.left-panel > .table-container:nth-child(2),
.left-panel > .table-container:nth-child(3) { flex: 1 1 0; min-height: 175px; max-height: 40%; }

.table-header-row {
    background-color: #f8fafc;
    padding: 12px 15px;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;   /* le titre reste visible quand le tableau scrolle */
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
    flex: 1 1 auto;
    min-height: 0;   /* hauteur pilotée par le partage flex de .table-container → scroll interne */
}
/* Scrollbar discrète (charte C2) */
.table-wrapper::-webkit-scrollbar { width: 7px; height: 7px; }
.table-wrapper::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
.table-wrapper::-webkit-scrollbar-track { background: transparent; }

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
    padding: 12px 15px;
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
.modern-table tbody tr.selected-row-highlight {
    background-color: #eff6ff !important;
}
.modern-table tbody tr.selected-row-highlight td:first-child {
    border-left: 4px solid #3b82f6 !important;
}
.modern-table tbody tr.selected-row-highlight:hover {
    background-color: #dbeafe !important;
}
.modern-table tbody tr.selected-orange-row {
    background-color: #fff7ed !important;
}
.modern-table tbody tr.selected-orange-row td:first-child {
    border-left: 4px solid #f97316 !important;
}
.modern-table tbody tr.selected-orange-row:hover {
    background-color: #ffedd5 !important;
}

/* Styles pour les cellules du tableau B2B */
.positive-qty {
    color: #16a34a !important;
}
.cell-reference {
    font-size: 0.95rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin-bottom: 2px;
    font-family: var(--c2-font-sans);
    letter-spacing: -0.025em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.cell-description {
    font-size: 0.78rem;
    color: #64748b;
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
    gap: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 700;
    white-space: nowrap;
    width: fit-content;
    background-color: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
}

.stock-tag.tag-cmd {
    background-color: #fef3c7;
    color: #d97706;
    border-color: #fde68a;
}

.stock-tag.tag-import {
    background-color: #e0f2fe;
    color: #0284c7;
    border-color: #bae6fd;
}

.qty-input-wrapper {
    display: flex;
    align-items: center;
    gap: 4px;
}

.qty-btn {
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #475569;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0;
}

.qty-btn:hover {
    background-color: #e2e8f0;
    border-color: #94a3b8;
}

.qty-input {
    width: 40px;
    height: 24px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    text-align: center;
    font-size: 0.85rem;
    outline: none;
    -moz-appearance: textfield;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.cart-btn-mini {
    background-color: #3b82f6;
    border: none;
    color: white;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    margin-left: 4px;
}
.cart-btn-mini:disabled {
    background-color: #cbd5e1 !important;
    border-color: #cbd5e1 !important;
    color: #94a3b8 !important;
    cursor: not-allowed !important;
    transform: none !important;
    box-shadow: none !important;
}

.info-icon {
    font-size: 1.15rem;
    color: #3b82f6;
    cursor: pointer;
    transition: all 0.2s ease;
}

.info-icon:hover {
    color: #2563eb;
    transform: scale(1.15);
}

.text-center {
    text-align: center;
}

.text-right {
    text-align: right;
}

.p-4 {
    padding: 1rem;
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
    font-size: 1.2rem;
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
}

.close-info-btn:hover {
    color: #ef4444;
}

.info-dialog-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: 85vh;
    overflow-y: auto;
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

.viewer-360-toggle-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: white;
    border: 1px solid #cbd5e1;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    transition: all 0.2s;
}

.viewer-360-toggle-btn:hover {
    background: #f1f5f9;
    color: #1e293b;
    border-color: #94a3b8;
}

.viewer-360-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    cursor: ew-resize;
}

.image-360 {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.viewer-360-overlay {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: none;
    font-size: 0.8rem;
    font-weight: 500;
}

.spin-icon {
    animation: spin 4s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.info-specs-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
    border: 1px solid #16a34a;
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

.brand-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
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

.brand-name {
    font-size: 0.85rem;
    color: #16a34a;
    font-weight: 700;
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

.pdfs-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.pdf-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 15px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #334155;
    text-decoration: none;
    transition: all 0.2s;
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

/* Advanced Search Toggler */
.adv-search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    color: #64748b;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s ease-in-out;
    font-size: 1rem;
}
.adv-search-btn:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1e293b;
    transform: translateY(-1px);
}
.adv-search-btn.active {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.adv-search-btn:disabled {
    background-color: #f1f5f9;
    border-color: #e2e8f0;
    color: #cbd5e1;
    cursor: not-allowed;
}

/* Advanced Filters Panel */
.advanced-filters-panel {
    border-top: none;
    background: #f8fafc;
    padding: 0 1.5rem;
    /* Hauteur RÉELLE animée via grid-rows 0fr→1fr : fluide et exact (pas d'overshoot de max-height) */
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    overflow: hidden;
    transition: grid-template-rows 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                padding 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.16s ease;
}
.advanced-filters-panel > * { overflow: hidden; min-height: 0; }
.advanced-filters-panel.expanded {
    border-top: 1px solid #f1f5f9;
    padding: 1.25rem 1.5rem;
    grid-template-rows: 1fr;
    opacity: 1;
}

.filter-row {
    display: flex;
    align-items: flex-end;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    flex: 1;
    min-width: 200px;
}

.filter-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: left;
}

.filter-select {
    width: 100% !important;
}

.filter-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
}

/* Bouton d'action principal — harmonisé charte C2 (bleu --c2-select-accent) */
.filter-btn-search {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    height: 40px;
    padding: 0 1.25rem;
    background: var(--c2-primary);
    color: #fff;
    border: 1px solid transparent;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: .01em;
    cursor: pointer;
    transition: background .15s ease, box-shadow .15s ease, transform .15s ease;
}
.filter-btn-search .pi { font-size: .85rem; }

.filter-btn-search:hover:not(:disabled) {
    background: var(--c2-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(24, 89, 179, 0.30);
}

.filter-btn-search:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 6px rgba(24, 89, 179, 0.24); }

.filter-btn-search:focus-visible { outline: 2px solid var(--c2-focus); outline-offset: 2px; }

.filter-btn-search:disabled {
    background: #cbd5e1;
    color: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.filter-btn-reset {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: white;
    border: 1.5px solid #e2e8f0;
    color: #64748b;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
}

.filter-btn-reset:hover:not(:disabled) {
    background: #f1f5f9;
    color: #1e293b;
    border-color: #cbd5e1;
}

.filter-btn-reset:disabled {
    background: #f1f5f9;
    border-color: #e2e8f0;
    color: #cbd5e1;
    cursor: not-allowed;
}

/* Custom styles for Select components in filter panel */
.advanced-filters-panel :deep(.p-select) {
    height: 40px !important;
    border-radius: 8px !important;
    border: 1.5px solid #e2e8f0 !important;
    background: white !important;
}
.advanced-filters-panel :deep(.p-select:hover) {
    border-color: #cbd5e1 !important;
}
.advanced-filters-panel :deep(.p-select-focus) {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* Styles for empty client placeholder in right sidebar */
.empty-client-sidebar {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 32px 24px;
    text-align: center;
    color: #64748b;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px dashed #cbd5e1;
    margin: 12px;
}
.empty-client-sidebar .placeholder-icon {
    font-size: 2.5rem;
    color: #94a3b8;
    margin-bottom: 16px;
}
.empty-client-sidebar .placeholder-text {
    font-size: 1rem;
    font-weight: 600;
    color: #334155;
    margin-bottom: 8px;
}
.empty-client-sidebar .placeholder-desc {
    font-size: 0.8rem;
    line-height: 1.5;
    color: #64748b;
    max-width: 260px;
}

/* Transition expand no longer needed as we use native CSS transitions */

.product-flag {
    color: #3b82f6; /* master reference blue */
    margin-left: 6px;
    font-size: 0.85rem;
    vertical-align: middle;
    display: inline-block;
}
</style>











