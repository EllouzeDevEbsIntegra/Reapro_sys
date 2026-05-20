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
                                filterPlaceholder="Rechercher par code ou nom..."
                                class="client-select"
                                showClear
                                panelClass="b2b-client-panel"
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
                                @click="showClientDialog = true"
                                title="Voir les détails du client"
                            >
                                <i class="pi pi-info-circle"></i>
                            </button>
                        </Transition>

                        <!-- Barre de recherche -->
                        <div class="search-wrapper">
                            <i class="pi pi-search search-input-icon"></i>
                            <input
                                v-model="searchQuery"
                                type="text"
                                class="search-input"
                                placeholder="Rechercher une référence, un article..."
                                @keyup.enter="handleSearch"
                            />
                        </div>

                        <!-- Icone Recherche Avancée -->
                        <button
                            class="adv-search-btn"
                            :class="{ 'active': isAdvancedSearchExpanded }"
                            @click="toggleAdvancedSearch"
                            title="Recherche avancée"
                            type="button"
                        >
                            <i class="pi pi-sliders-h"></i>
                        </button>
                    </div>

                    <div class="header-right">
                        <!-- KPI chips -->
                        <div class="header-kpis">
                            <div class="kpi-chip" title="En Cours Commercial vs Plafond">
                                <span class="kpi-chip-dot" style="background:#3b82f6"></span>
                                <div class="kpi-chip-body">
                                    <span class="kpi-chip-label">En Cours Comm.</span>
                                    <span class="kpi-chip-value" style="color:#3b82f6">45 200 <em>TND</em></span>
                                </div>
                            </div>

                            <div class="kpi-chip" title="Factures et Avoirs non soldés">
                                <span class="kpi-chip-dot" style="background:#d97706"></span>
                                <div class="kpi-chip-body">
                                    <span class="kpi-chip-label">Factures &amp; Avoirs</span>
                                    <span class="kpi-chip-value" style="color:#d97706">12 400 <em>TND</em></span>
                                </div>
                            </div>

                            <div class="kpi-chip" title="Encours Financier">
                                <span class="kpi-chip-dot" style="background:#16a34a"></span>
                                <div class="kpi-chip-body">
                                    <span class="kpi-chip-label">Encours Financier</span>
                                    <span class="kpi-chip-value" style="color:#16a34a">32 800 <em>TND</em></span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <!-- Section Filtres Avancés (Expand/Collapse) -->
                <Transition name="expand">
                    <div v-if="isAdvancedSearchExpanded" class="advanced-filters-panel">
                        <div class="filter-row">
                            <div class="filter-group">
                                <label class="filter-label">Groupe</label>
                                <Select
                                    v-model="selectedGroup"
                                    :options="groups"
                                    optionLabel="description"
                                    optionValue="code"
                                    placeholder="Tous les groupes"
                                    class="filter-select"
                                    showClear
                                    :loading="isLoadingGroups"
                                    @change="onGroupChange"
                                />
                            </div>

                            <div class="filter-group">
                                <label class="filter-label">Sous-groupe</label>
                                <Select
                                    v-model="selectedSubGroup"
                                    :options="subGroups"
                                    optionLabel="description"
                                    optionValue="code"
                                    placeholder="Tous les sous-groupes"
                                    class="filter-select"
                                    showClear
                                    :loading="isLoadingSubGroups"
                                    :disabled="!selectedGroup"
                                />
                            </div>

                            <div class="filter-group">
                                <label class="filter-label">Fabricant</label>
                                <Select
                                    v-model="selectedManufacturer"
                                    :options="manufacturers"
                                    optionLabel="name"
                                    optionValue="code"
                                    placeholder="Tous les fabricants"
                                    class="filter-select"
                                    showClear
                                    filter
                                    filterPlaceholder="Rechercher un fabricant..."
                                    :loading="isLoadingManufacturers"
                                />
                            </div>

                            <div class="filter-actions">
                                <button class="filter-btn-search" @click="handleSearch" title="Rechercher avec les filtres">
                                    <i class="pi pi-search"></i>
                                    <span>Rechercher</span>
                                </button>
                                <button class="filter-btn-reset" @click="resetFilters" title="Réinitialiser les filtres">
                                    <i class="pi pi-refresh"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </Transition>
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
                                    <tr v-if="isLoadingSearch">
                                        <td colspan="7" class="text-center p-4" style="color: #64748b; font-style: italic;">
                                            <i class="pi pi-spin pi-spinner mr-2"></i> Recherche en cours...
                                        </td>
                                    </tr>
                                    <tr v-else-if="searchResults.length === 0">
                                        <td colspan="7" class="text-center p-4" style="color: #64748b; font-style: italic;">
                                            Saisissez une référence et appuyez sur Entrée pour rechercher.
                                        </td>
                                    </tr>
                                    <template v-else>
                                        <tr 
                                            v-for="item in searchResults" 
                                            :key="item.id || item.no"
                                            @click="selectItem(item)"
                                            :class="{ 'selected-row-highlight': selectedItemNo === item.no }"
                                            style="cursor: pointer;"
                                        >
                                            <!-- Colonne 1 : no et descriptionStructuree -->
                                            <td>
                                                <div class="cell-reference" :title="item.no">{{ item.no }}</div>
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
                                                    <span class="stock-tag tag-cmd">
                                                        <span>Rsv :</span><span>{{ formatNumber(item.reservedQuantity || 0, 0) }}</span>
                                                    </span>
                                                    <span class="stock-tag tag-import">
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
                                        <tr v-if="isLoadingMore">
                                            <td colspan="7" class="text-center p-3" style="color: #3b82f6; font-style: italic; font-weight: 500; background: #f8fafc;">
                                                <i class="pi pi-spin pi-spinner mr-2"></i> Chargement des articles suivants...
                                            </td>
                                        </tr>
                                    </template>
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
                                        <tr v-for="eq in equivalences" :key="eq.id || eq.no">
                                            <!-- Colonne 1 : no et descriptionStructuree -->
                                            <td>
                                                <div class="cell-reference" :title="eq.no">{{ eq.no }}</div>
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
                                                    <span class="stock-tag tag-cmd">
                                                        <span>Rsv :</span><span>{{ formatNumber(eq.reservedQuantity || 0, 0) }}</span>
                                                    </span>
                                                    <span class="stock-tag tag-import">
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
                                <!-- En-têtes et lignes à définir -->
                            </table>
                        </div>
                    </div>
                </div>
                <div class="right-panel" :class="{ 'right-panel--expanded': isRightExpanded }">
                    <button class="toggle-btn" @click="isRightExpanded = !isRightExpanded"
                        :title="isRightExpanded ? 'Réduire' : 'Agrandir'">
                        <i class="pi" :class="isRightExpanded ? 'pi-chevron-right' : 'pi-chevron-left'"></i>
                    </button>
                    <div class="zone-border zone-right">
                        <span class="zone-label">Zone Droite – Panier / Historique</span>
                    </div>
                </div>
            </div>
        </main>

        <!-- ═══════════════════════════════════════════════════════════════
             DIALOG DÉTAILS CLIENT
        ════════════════════════════════════════════════════════════════ -->
        <Dialog
            v-model:visible="showClientDialog"
            modal
            :showHeader="false"
            :style="{ width: '850px', maxWidth: '95vw', padding: '0', borderRadius: '20px', overflow: 'hidden' }"
            :contentStyle="{ padding: '0', borderRadius: '20px' }"
            dismissableMask
            class="client-detail-dialog"
        >
            <div class="dialog-inner" v-if="selectedCustomerObj">

                <!-- En-tête gradient -->
                <div class="dialog-hero">
                    <button class="dialog-close" @click="showClientDialog = false">
                        <i class="pi pi-times"></i>
                    </button>

                    <div class="hero-avatar">
                        <span class="avatar-initials">
                            {{ selectedCustomerObj.companyName?.charAt(0)?.toUpperCase() }}
                        </span>
                    </div>

                    <div class="hero-info">
                        <h2 class="hero-name">{{ selectedCustomerObj.companyName }}</h2>
                        <div class="hero-badge">
                            <i class="pi pi-tag"></i>
                            {{ selectedCustomerObj.extId }}
                        </div>
                    </div>
                </div>

                <!-- Infos détaillées -->
                <div class="dialog-body">
                    <div class="info-grid">

                        <div class="info-card">
                            <div class="info-icon-wrap blue">
                                <i class="pi pi-id-card"></i>
                            </div>
                            <div class="info-content">
                                <span class="info-label">Code Client</span>
                                <span class="info-value mono">{{ selectedCustomerObj.extId }}</span>
                            </div>
                        </div>

                        <div class="info-card">
                            <div class="info-icon-wrap green">
                                <i class="pi pi-building"></i>
                            </div>
                            <div class="info-content">
                                <span class="info-label">Raison Sociale</span>
                                <span class="info-value">{{ selectedCustomerObj.companyName }}</span>
                            </div>
                        </div>

                        <div class="info-card">
                            <div class="info-icon-wrap orange">
                                <i class="pi pi-phone"></i>
                            </div>
                            <div class="info-content">
                                <span class="info-label">Téléphone</span>
                                <span class="info-value">
                                    {{ selectedCustomerObj.phone || '—' }}
                                </span>
                            </div>
                        </div>

                        <div class="info-card full">
                            <div class="info-icon-wrap purple">
                                <i class="pi pi-map-marker"></i>
                            </div>
                            <div class="info-content">
                                <span class="info-label">Adresse</span>
                                <span class="info-value">
                                    {{ selectedCustomerObj.address || '—' }}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Pied de dialog -->
                <div class="dialog-footer">
                    <button class="close-dialog-btn" @click="showClientDialog = false">
                        Fermer
                    </button>
                </div>
            </div>
        </Dialog>

        <!-- Article Info Dialog -->
        <div v-if="showInfoDialog" class="info-dialog-overlay" @click.self="showInfoDialog = false">
            <div class="info-dialog-container">
                <!-- Header -->
                <div class="info-dialog-header">
                    <div class="info-dialog-header-title">
                        Informations Article • {{ selectedInfoItem?.no || selectedInfoItem?.articleNumber }} • {{
                            selectedInfoItem?.descriptionStructured || selectedInfoItem?.manufacturerName || selectedInfoItem?.fabricant
                        }}
                    </div>
                    <div class="info-dialog-header-right">
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
                                <div class="info-section-header cursor-pointer"
                                    @click="isOemSectionExpanded = !isOemSectionExpanded">
                                    <div class="flex items-center gap-2 flex-1">
                                        <i class="pi pi-list"></i>
                                        <span>Numéros OEM</span>
                                    </div>
                                    <i class="pi"
                                        :class="isOemSectionExpanded ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                                </div>
                                <div class="info-section-content" v-if="isOemSectionExpanded">
                                    <div class="vehicles-list-container">
                                        <div v-for="(group, index) in groupedOemNumbers" :key="index"
                                            class="brand-group">
                                            <div class="brand-toggle-row" @click="toggleOemBrand(group.brand)">
                                                <i class="pi"
                                                    :class="expandedOemBrands.has(group.brand) ? 'pi-minus' : 'pi-plus'"></i>
                                                <span class="brand-name">{{ group.brand }}</span>
                                            </div>
                                            <div v-if="expandedOemBrands.has(group.brand)" class="oe-numbers-list"
                                                style="padding: 10px 10px 10px 30px;">
                                                <div v-for="(oem, oIndex) in group.numbers" :key="oIndex"
                                                    class="oe-number-item">
                                                    {{ oem.articleNumber }}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- PDFs Section -->
                            <div class="info-section" v-if="selectedInfoItem?.pdfs?.length > 0">
                                <div class="info-section-header cursor-pointer"
                                    @click="isPdfSectionExpanded = !isPdfSectionExpanded">
                                    <div class="flex items-center gap-2 flex-1">
                                        <i class="pi pi-file-pdf"></i>
                                        <span>Documents PDF</span>
                                    </div>
                                    <i class="pi"
                                        :class="isPdfSectionExpanded ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                                </div>
                                <div class="info-section-content" v-if="isPdfSectionExpanded">
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

                            <!-- Vehicles Section -->
                            <div class="info-section" v-if="selectedInfoItem?.vehicles?.length > 0">
                                <div class="info-section-header cursor-pointer"
                                    @click="isVehiclesSectionExpanded = !isVehiclesSectionExpanded">
                                    <div class="flex items-center gap-2 flex-1">
                                        <i class="pi pi-car"></i>
                                        <span>Véhicules concernés</span>
                                    </div>
                                    <i class="pi"
                                        :class="isVehiclesSectionExpanded ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                                </div>
                                <div class="info-section-content" v-if="isVehiclesSectionExpanded">
                                    <div class="vehicles-list-container">
                                        <div v-if="selectedInfoItem?.vehicles && selectedInfoItem.vehicles.length > 0">
                                            <div v-for="(brandGroup, bIndex) in selectedInfoItem.vehicles" :key="bIndex"
                                                class="brand-group">
                                                <div class="brand-toggle-row" @click="toggleBrand(brandGroup)">
                                                    <i class="pi"
                                                        :class="expandedBrands.has(brandGroup.brand) ? 'pi-minus' : 'pi-plus'"></i>
                                                    <span class="brand-name">{{ brandGroup.brand }}</span>
                                                </div>
                                                <div v-if="expandedBrands.has(brandGroup.brand)" class="models-list">
                                                    <div v-if="brandGroup.isLoading" class="loading-models"
                                                        style="padding: 10px; color: #64748b; font-style: italic;">
                                                        <i class="pi pi-spin pi-spinner" style="margin-right: 8px;"></i>
                                                        Chargement des modèles...
                                                    </div>
                                                    <div v-else-if="brandGroup.models.length === 0" class="no-models"
                                                        style="padding: 10px; color: #94a3b8; font-style: italic;">
                                                        Aucun modèle trouvé.
                                                    </div>
                                                    <div v-else v-for="(model, mIndex) in brandGroup.models"
                                                        :key="mIndex" class="model-item">
                                                        <i class="pi pi-angle-right model-plus-icon"></i>
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

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TheNavbar from '../components/TheNavbar.vue'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import apiClient from '../api/axios'
import { useCompareQuoteStore } from '../stores/compareQuote'
import { useAuthStore } from '../stores/auth'

const isRightExpanded    = ref(false)
const customers          = ref([])
const selectedClient     = ref(null)
const isLoadingCustomers = ref(false)
const showClientDialog   = ref(false)
const searchQuery        = ref('')

const searchResults      = ref([])
const isLoadingSearch    = ref(false)
const isLoadingMore      = ref(false)
const currentPage        = ref(0)
const hasMore            = ref(true)

// Variables pour les équivalences
const selectedItemNo = ref(null)
const equivalences = ref([])
const isLoadingEquivalences = ref(false)

const compareStore = useCompareQuoteStore()
const authStore = useAuthStore()

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
        groups.value = await compareStore.fetchCategories(1, 'PR')
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
        subGroups.value = await compareStore.fetchCategories(2, groupCode)
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
const isOemSectionExpanded = ref(true)
const isPdfSectionExpanded = ref(true)
const isVehiclesSectionExpanded = ref(true)

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
                gtins: article.gtins || []
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

const addToCart = (item) => {
    console.log('Ajouter au panier :', item.no, 'Quantité :', item.orderQty)
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

// Fonction de recherche temporaire pour observer la réponse réseau
// Fonction de recherche temporaire pour observer la réponse réseau
const handleSearch = async () => {
    const hasActiveFilters = searchQuery.value.trim() || selectedGroup.value || selectedManufacturer.value
    if (!hasActiveFilters) return
    
    // Réinitialiser la sélection et les équivalences
    selectedItemNo.value = null
    equivalences.value = []
    
    isLoadingSearch.value = true
    currentPage.value = 0
    hasMore.value = true
    try {
        let url = `/api/elva-items?page=0&size=20`
        if (searchQuery.value.trim()) {
            url += `&searchTerm=${encodeURIComponent(searchQuery.value.trim())}`
        }
        if (selectedGroup.value) {
            url += `&itemProductCode=${encodeURIComponent(selectedGroup.value)}`
        }
        if (selectedSubGroup.value) {
            url += `&itemSubProductCode=${encodeURIComponent(selectedSubGroup.value)}`
        }
        if (selectedManufacturer.value) {
            url += `&codeFabricant=${encodeURIComponent(selectedManufacturer.value)}`
        }

        console.log(`Lancement de la recherche avec : ${url}`)
        const response = await apiClient.get(url)
        console.log('Résultats de la recherche (Page 0) :', response.data)
        
        if (response.data && response.data.content) {
            searchResults.value = response.data.content.map(item => ({
                ...item,
                orderQty: 1
            }))
            
            if (searchResults.value.length > 0) {
                selectItem(searchResults.value[0])
            }
            
            const pageInfo = response.data.page
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

// Charger les équivalences de l'article sélectionné
const selectItem = async (item) => {
    if (selectedItemNo.value === item.no) return
    selectedItemNo.value = item.no
    equivalences.value = []
    
    if (!item.referenceOrigineLie) {
        return // pas de référence liée, la liste reste vide
    }

    isLoadingEquivalences.value = true
    try {
        const response = await apiClient.get(`/api/elva-items/equivalences?no=${encodeURIComponent(item.no)}&referenceOrigineLie=${encodeURIComponent(item.referenceOrigineLie)}`)
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

const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target
    // Si on arrive à moins de 30px du bas du défilement
    if (scrollHeight - scrollTop - clientHeight < 30) {
        loadMore()
    }
}

const loadMore = async () => {
    if (isLoadingSearch.value || isLoadingMore.value || !hasMore.value) return
    
    isLoadingMore.value = true
    try {
        const nextPage = currentPage.value + 1
        let url = `/api/elva-items?page=${nextPage}&size=20`
        if (searchQuery.value.trim()) {
            url += `&searchTerm=${encodeURIComponent(searchQuery.value.trim())}`
        }
        if (selectedGroup.value) {
            url += `&itemProductCode=${encodeURIComponent(selectedGroup.value)}`
        }
        if (selectedSubGroup.value) {
            url += `&itemSubProductCode=${encodeURIComponent(selectedSubGroup.value)}`
        }
        if (selectedManufacturer.value) {
            url += `&codeFabricant=${encodeURIComponent(selectedManufacturer.value)}`
        }

        console.log(`Lancement du chargement de la page : ${nextPage}`)
        const response = await apiClient.get(url)
        
        if (response.data && response.data.content) {
            const newItems = response.data.content.map(item => ({
                ...item,
                orderQty: 1
            }))
            searchResults.value.push(...newItems)
            currentPage.value = nextPage
            
            const pageInfo = response.data.page
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

onMounted(fetchCustomers)
</script>

<!-- ── SCOPED : trigger + layout ──────────────────────────────────── -->
<style scoped>
.page-layout { min-height: 100vh; background-color: #f8fafc; }
.main-content { width: 100%; padding: 0.5rem 2rem; }

/* Header */
.header-bar {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    margin-bottom: 1rem;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.header-main-row {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 1.5rem; /* same gap as body-layout */
    padding: 0.75rem 0; /* horizontal padding moved to children */
}
.header-left {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex: 2;
    padding-left: 1.5rem;
}
.header-right {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
    padding-right: 1.5rem;
    padding-left: 1rem;
}
.header-bar h1 {
    font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0; white-space: nowrap;
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
.search-input:hover  { border-color: #cbd5e1; }
.search-input:focus  {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
}
.search-wrapper:focus-within .search-input-icon { color: #3b82f6; }

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
    display: flex; align-items: center; justify-content: center; gap: 1rem;
    width: 100%;
}

/* ── Chip KPI ───────────────────────────────────────── */
.kpi-chip {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    flex: 1; /* uniform width, fills space */
    padding: 0.5rem 0.5rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: default;
    transition: background 0.15s, box-shadow 0.15s;
    white-space: nowrap;
}
.kpi-chip:hover {
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}
.kpi-chip-dot {
    width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.kpi-chip-body {
    display: flex; flex-direction: column; gap: 1px;
}
.kpi-chip-label {
    font-size: 0.65rem; font-weight: 600; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.05em; line-height: 1;
}
.kpi-chip-value {
    font-size: 0.82rem; font-weight: 700; line-height: 1.2;
}
.kpi-chip-value em {
    font-style: normal; font-size: 0.65rem; font-weight: 600;
    color: #94a3b8; margin-left: 1px;
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
    letter-spacing: 0.04em; font-family: 'Courier New', monospace;
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
.body-layout { display: flex; gap: 1.5rem; height: calc(100vh - 130px); overflow: hidden; }
.left-panel { flex: 2; transition: flex 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto; overflow-x: hidden; }
.left-panel--expanded { flex: 1; }
.right-panel { position: relative; flex: 1; transition: flex 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
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
    letter-spacing: 0.05em; font-family: 'Courier New', monospace;
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

.info-content { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.info-label { font-size: 0.72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
.info-value {
    font-size: 0.875rem; font-weight: 600; color: #1e293b;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.info-value.mono { font-family: 'Courier New', monospace; color: #2563eb; font-size: 0.85rem; }

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
    flex-shrink: 0;
}

.table-header-row {
    background-color: #f8fafc;
    padding: 12px 15px;
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
    max-height: 400px;
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
.modern-table tbody tr.selected-row-highlight:hover {
    background-color: #dbeafe !important;
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
    font-family: 'Inter', sans-serif;
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
.adv-search-btn:hover {
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

/* Advanced Filters Panel */
.advanced-filters-panel {
    border-top: 1px solid #f1f5f9;
    background: #f8fafc;
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all 0.3s ease;
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

.filter-btn-search {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    height: 40px;
    padding: 0 1.25rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.filter-btn-search:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
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

.filter-btn-reset:hover {
    background: #f1f5f9;
    color: #1e293b;
    border-color: #cbd5e1;
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

/* Transition expand */
.expand-enter-active,
.expand-leave-active {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    max-height: 200px;
    opacity: 1;
    overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
    overflow: hidden;
}
</style>












