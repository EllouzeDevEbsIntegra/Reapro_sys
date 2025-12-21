<template>
  <div class="dashboard-layout">
    <TheNavbar />

    <div class="page-container animate-fade-in">
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Bienvenue sur votre tableau de bord Reapro Achat</p>
      </div>

      <!-- KPI Cards -->
      <div class="grid-4 mb-6">
        <div class="kpi-card animate-scale-in" style="animation-delay: 0.1s">
          <div class="flex-between mb-2">
            <span class="kpi-label">Total Commandes</span>
            <i class="pi pi-shopping-cart" style="color: var(--primary-color); font-size: 1.5rem;"></i>
          </div>
          <div class="kpi-value">124</div>
          <div style="font-size: 0.875rem; color: var(--success);">
            <i class="pi pi-arrow-up"></i> +12% ce mois
          </div>
        </div>

        <div class="kpi-card animate-scale-in" style="animation-delay: 0.2s; border-left-color: #10b981;">
          <div class="flex-between mb-2">
            <span class="kpi-label">Commandes Validées</span>
            <i class="pi pi-check-circle" style="color: #10b981; font-size: 1.5rem;"></i>
          </div>
          <div class="kpi-value" style="color: #10b981;">85</div>
          <div style="font-size: 0.875rem; color: var(--text-muted);">
            68% du total
          </div>
        </div>

        <div class="kpi-card animate-scale-in" style="animation-delay: 0.3s; border-left-color: #f59e0b;">
          <div class="flex-between mb-2">
            <span class="kpi-label">En Attente</span>
            <i class="pi pi-clock" style="color: #f59e0b; font-size: 1.5rem;"></i>
          </div>
          <div class="kpi-value" style="color: #f59e0b;">39</div>
          <div style="font-size: 0.875rem; color: var(--text-muted);">
            31% du total
          </div>
        </div>

        <div class="kpi-card animate-scale-in" style="animation-delay: 0.4s; border-left-color: #3b82f6;">
          <div class="flex-between mb-2">
            <span class="kpi-label">Montant Total</span>
            <i class="pi pi-euro" style="color: #3b82f6; font-size: 1.5rem;"></i>
          </div>
          <div class="kpi-value" style="color: #3b82f6;">€245K</div>
          <div style="font-size: 0.875rem; color: var(--success);">
            <i class="pi pi-arrow-up"></i> +8% ce mois
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid-2 mb-6">
        <div class="card-professional animate-slide-in" style="animation-delay: 0.5s">
          <div class="card-header">
            <h3 class="card-title">Actions Rapides</h3>
          </div>
          <div class="flex-col gap-4">
            <Button @click="$router.push('/comparateur')" class="w-full" severity="primary">
              <i class="pi pi-plus mr-2"></i>
              Nouvelle Comparaison
            </Button>
            <Button class="w-full" severity="secondary" outlined>
              <i class="pi pi-search mr-2"></i>
              Rechercher une Commande
            </Button>
            <Button class="w-full" severity="secondary" outlined>
              <i class="pi pi-file-pdf mr-2"></i>
              Générer un Rapport
            </Button>
          </div>
        </div>

        <div class="card-professional animate-slide-in" style="animation-delay: 0.6s">
          <div class="card-header">
            <h3 class="card-title">Activité Récente</h3>
          </div>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon" style="background-color: #dbeafe;">
                <i class="pi pi-shopping-cart" style="color: #1e40af;"></i>
              </div>
              <div class="activity-content">
                <p class="activity-title">Nouvelle commande créée</p>
                <p class="activity-time">Il y a 2 heures</p>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon" style="background-color: #d1fae5;">
                <i class="pi pi-check" style="color: #065f46;"></i>
              </div>
              <div class="activity-content">
                <p class="activity-title">Commande CMD-2024-001 validée</p>
                <p class="activity-time">Il y a 5 heures</p>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-icon" style="background-color: #fef3c7;">
                <i class="pi pi-exclamation-triangle" style="color: #92400e;"></i>
              </div>
              <div class="activity-content">
                <p class="activity-title">Comparaison en attente de révision</p>
                <p class="activity-time">Il y a 1 jour</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics Chart Placeholder -->
      <div class="card-professional animate-slide-in" style="animation-delay: 0.7s">
        <div class="card-header">
          <h3 class="card-title">Tendances Mensuelles</h3>
          <span class="badge badge-info">2024</span>
        </div>
        <div class="chart-placeholder">
          <i class="pi pi-chart-line" style="font-size: 3rem; color: var(--text-muted);"></i>
          <p style="color: var(--text-muted); margin-top: 1rem;">Graphique des tendances à venir</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import TheNavbar from '../components/TheNavbar.vue'
import Button from 'primevue/button'
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background-color: #f8fafc;
}

.mr-2 {
  margin-right: 0.5rem;
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.activity-item:hover {
  background-color: #f8fafc;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 500;
  color: var(--text-main);
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Chart Placeholder */
.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background-color: #f8fafc;
  border-radius: 8px;
}
</style>
