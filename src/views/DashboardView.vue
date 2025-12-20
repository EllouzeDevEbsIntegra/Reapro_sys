<template>
  <div class="dashboard-layout">
    <TheNavbar />
    
    <div class="dashboard-content animate-fade-in">
      <div class="page-header">
        <h1>Dashboard</h1>
        <p class="text-muted">Bienvenue sur votre tableau de bord Reapro Achat.</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="pi pi-shopping-cart"></i></div>
          <div class="stat-info">
            <span class="label">Commandes</span>
            <span class="value">124</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="pi pi-check-circle"></i></div>
          <div class="stat-info">
            <span class="label">Validées</span>
            <span class="value">85</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange"><i class="pi pi-clock"></i></div>
          <div class="stat-info">
            <span class="label">En attente</span>
            <span class="value">39</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import TheNavbar from '../components/TheNavbar.vue'
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background-color: #f8fafc;
}

.dashboard-content {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
}

.text-muted {
  color: #64748b;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.stat-icon.blue { background-color: #3b82f6; }
.stat-icon.green { background-color: #10b981; }
.stat-icon.orange { background-color: #f59e0b; }

.stat-info .label {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.stat-info .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}
</style>
