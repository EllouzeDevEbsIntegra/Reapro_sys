<template>
    <div class="line-detail-container">
        <!-- Section 1: Full-width Header -->
        <div class="top-header">
            <div class="header-left">
                <Button icon="pi pi-arrow-left" text rounded @click="$emit('back')" class="back-btn" />
                <div class="item-info">
                    <h1 class="item-no">{{ line.itemNo }}</h1>
                    <div class="page-indicator-wrapper">
                        <span class="status-dot"></span>
                        <div class="page-indicator">
                            {{ line.pageNumber }} / {{ totalElements }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="header-middle">
                <div class="count-badge">
                    Count : 584
                </div>
            </div>

            <div class="header-stocks">
                <div class="stock-column">
                    <div class="stocks-label">Stocks</div>
                </div>
                <div class="stock-column">
                    <div class="stock-part ste">
                        <span class="stock-label-mini">STE</span>
                        <span class="stock-value-main company">COPIM</span>
                    </div>
                    <div class="stock-part stock">
                        <span class="stock-label-mini">Stock</span>
                        <span class="stock-value-main green">1</span>
                    </div>
                    <div class="stock-part purchase">
                        <span class="stock-label-mini">Dernier Achat</span>
                        <span class="stock-value-main date">11/12/2025</span>
                    </div>
                </div>
                <div class="stock-column">
                    <div class="stock-part ste">
                        <span class="stock-label-mini">STE</span>
                        <span class="stock-value-main company">3S</span>
                    </div>
                    <div class="stock-part stock">
                        <span class="stock-label-mini">Stock</span>
                        <span class="stock-value-main red">0</span>
                    </div>
                    <div class="stock-part purchase">
                        <span class="stock-label-mini">Dernier Achat</span>
                        <span class="stock-value-main date">--</span>
                    </div>
                </div>
                <div class="stock-column">
                    <div class="stock-part ste">
                        <span class="stock-label-mini">STE</span>
                        <span class="stock-value-main company">MPAA</span>
                    </div>
                    <div class="stock-part stock">
                        <span class="stock-label-mini">Stock</span>
                        <span class="stock-value-main green">2</span>
                    </div>
                    <div class="stock-part purchase">
                        <span class="stock-label-mini">Dernier Achat</span>
                        <span class="stock-value-main date">30/10/2025</span>
                    </div>
                </div>
            </div>

            <div class="header-right">
                <button class="cart-btn">
                    <i class="pi pi-shopping-cart"></i>
                </button>
            </div>
        </div>

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
                                    <th style="width: 10%">Frs</th>
                                    <th style="width: 25%">Réf / Desig</th>
                                    <th style="width: 8%">stk</th>
                                    <th style="width: 12%">Prix</th>
                                    <th style="width: 12%">Cost</th>
                                    <th style="width: 8%">Délai</th>
                                    <th style="width: 10%">Min</th>
                                    <th style="width: 15%">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="i in 4" :key="i">
                                    <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="table-footer">
                        <div class="pagination-info">Affichage 1-4 sur 5</div>
                        <div class="pagination-controls">
                            <button class="p-btn"><i class="pi pi-angle-double-left"></i></button>
                            <button class="p-btn"><i class="pi pi-angle-left"></i></button>
                            <span class="p-current">1</span>
                            <button class="p-btn"><i class="pi pi-angle-right"></i></button>
                            <button class="p-btn"><i class="pi pi-angle-double-right"></i></button>
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
                                    <th style="width: 10%">Frs</th>
                                    <th style="width: 25%">Réf / Desig</th>
                                    <th style="width: 8%">stk</th>
                                    <th style="width: 12%">Prix</th>
                                    <th style="width: 12%">Cost</th>
                                    <th style="width: 33%">Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="i in 4" :key="i">
                                    <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="table-footer">
                        <div class="pagination-info">Affichage 1-4 sur 5</div>
                        <div class="pagination-controls">
                            <button class="p-btn"><i class="pi pi-angle-double-left"></i></button>
                            <button class="p-btn"><i class="pi pi-angle-left"></i></button>
                            <span class="p-current">1</span>
                            <button class="p-btn"><i class="pi pi-angle-right"></i></button>
                            <button class="p-btn"><i class="pi pi-angle-double-right"></i></button>
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
                                    <th style="width: 15%">Composant</th>
                                    <th style="width: 25%">Désignation</th>
                                    <th style="width: 10%">Qte</th>
                                    <th style="width: 15%">Prix Unitaire</th>
                                    <th style="width: 15%">Total</th>
                                    <th style="width: 20%">Dispo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="i in 4" :key="i">
                                    <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="table-footer">
                        <div class="pagination-info">Affichage 1-4 sur 5</div>
                        <div class="pagination-controls">
                            <button class="p-btn"><i class="pi pi-angle-double-left"></i></button>
                            <button class="p-btn"><i class="pi pi-angle-left"></i></button>
                            <span class="p-current">1</span>
                            <button class="p-btn"><i class="pi pi-angle-right"></i></button>
                            <button class="p-btn"><i class="pi pi-angle-double-right"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section 3: Sidebar (30% or 50% width) -->
            <div class="right-column" :class="{ 'expanded': isSidebarExpanded }">
                <div class="sidebar-header">
                    <div class="header-actions">
                        <Button 
                            :icon="isSidebarExpanded ? 'pi pi-chevron-right' : 'pi pi-chevron-left'" 
                            text 
                            rounded 
                            @click="isSidebarExpanded = !isSidebarExpanded" 
                            class="toggle-sidebar-btn" 
                        />
                        <button class="history-btn">Historique</button>
                        <div class="item-title-inline">
                            21174 • Temoins de freins
                        </div>
                        <div class="year-selector">
                            <span class="arrow">&lt;</span>
                            <span class="year">2025</span>
                            <span class="arrow">&gt;</span>
                        </div>
                    </div>
                </div>

                <div class="stats-bar">
                    <div class="stats-column">Stk : 2</div>
                    <div class="stats-column">Vente : 18</div>
                    <div class="stats-column">Achat : 16</div>
                    <div class="stats-column">Rupt : 1268</div>
                </div>

                <div class="table-container history-container">
                    <div class="table-wrapper">
                        <table class="modern-table history-table">
                            <thead>
                                <tr>
                                    <th style="width: 15%">Date</th>
                                    <th :style="{ width: isSidebarExpanded ? '20%' : '40%' }">Client</th>
                                    <th style="width: 10%">Qte</th>
                                    <template v-if="isSidebarExpanded">
                                        <th style="width: 10%">Prix</th>
                                        <th style="width: 15%">Total</th>
                                        <th style="width: 15%">Statut</th>
                                    </template>
                                    <th style="width: 15%">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="i in 15" :key="i">
                                    <td>&nbsp;</td>
                                    <td></td>
                                    <td></td>
                                    <template v-if="isSidebarExpanded">
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                    </template>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="table-footer">
                        <div class="pagination-controls">
                            <button class="p-btn"><i class="pi pi-angle-left"></i></button>
                            <span class="p-current">1</span>
                            <button class="p-btn"><i class="pi pi-angle-right"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
    line: {
        type: Object,
        required: true
    },
    totalElements: {
        type: Number,
        default: 0
    }
})

defineEmits(['back'])

const isSidebarExpanded = ref(false)
</script>

<style scoped>
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
    padding: 10px 20px;
    gap: 20px;
    width: 100%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.back-btn {
    color: #3b82f6 !important;
}

.item-info {
    display: flex;
    flex-direction: column;
}

.item-no {
    font-size: 1.4rem;
    font-weight: 800;
    margin: 0;
    color: #1e293b;
    line-height: 1.1;
}

.page-indicator-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
    width: 100%;
}

.status-dot {
    width: 10px;
    height: 10px;
    background-color: #22c55e;
    border-radius: 50%;
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.page-indicator {
    background-color: #64748b;
    color: #fff;
    padding: 2px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    min-width: 80px;
    text-align: center;
    margin-left: auto;
}

.header-middle {
    flex-shrink: 0;
}

.count-badge {
    background-color: #fbbf24;
    color: #92400e;
    padding: 0 20px;
    border-radius: 10px;
    font-weight: 800;
    font-size: 1rem;
    box-shadow: 0 2px 4px rgba(251, 191, 36, 0.2);
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-stocks {
    flex-grow: 1;
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

.stock-column:first-child {
    width: 10%;
}

.stock-column:not(:first-child) {
    width: 30%;
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
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stock-part {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 8px;
    position: relative;
}

.stock-part.ste { width: 20%; }
.stock-part.stock { width: 40%; }
.stock-part.purchase { width: 40%; }

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
    font-size: 0.65rem;
    color: #64748b;
    font-weight: 700;
    text-transform: uppercase;
    line-height: 1;
    margin-bottom: 2px;
}

.stock-value-main {
    font-size: 0.9rem;
    font-weight: 800;
    color: #1e293b;
    line-height: 1.1;
}

.stock-value-main.company {
    color: #3b82f6;
    font-size: 0.85rem;
}

.stock-value-main.green { color: #16a34a; }
.stock-value-main.red { color: #dc2626; }

.stock-value-main.date {
    font-size: 0.8rem;
}

.header-right {
    flex-shrink: 0;
}

.cart-btn {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 5px 15px;
    background: #fff;
    cursor: pointer;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.cart-btn:hover {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
}

.cart-btn i {
    font-size: 1.6rem;
    color: #f59e0b;
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
    width: 70%;
    display: flex;
    flex-direction: column;
    gap: 15px;
    overflow-y: auto;
    padding-right: 5px;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.right-column {
    width: 30%;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: white;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.right-column.expanded {
    width: 50%;
}

.right-column.expanded ~ .left-column,
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
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.table-header-row {
    background-color: #f8fafc;
    padding: 10px 15px;
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
}

.modern-table td {
    padding: 10px 15px;
    font-size: 0.9rem;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
    height: 40px;
}

.modern-table tbody tr:nth-child(even) {
    background-color: #f8fafc;
}

.modern-table tbody tr:hover {
    background-color: #f1f5f9;
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
    width: 58%;
    font-weight: 800;
    font-size: 0.9rem;
    color: #1e293b;
    background: #f1f5f9;
    padding: 6px 12px;
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.history-btn {
    width: 17%;
    background-color: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 10px;
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
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    font-weight: 700;
    font-size: 0.85rem;
    background: #f8fafc;
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
</style>
