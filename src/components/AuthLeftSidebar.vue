<template>
  <div class="auth-left">
    <div class="branding">
      <div class="logo-container">
        <i class="pi pi-shopping-cart logo-icon"></i>
      </div>
      <h1 class="app-name">Reapro Achat</h1>
      <p class="app-tagline">Optimisez vos processus d'approvisionnement avec une solution moderne et intuitive.</p>
    </div>
    
    <div class="illustration">
      <!-- You can add an SVG or image here -->
      <div class="abstract-shape"></div>
    </div>

    <div class="footer-info">
      <p>© 2025 Reapro Sys. Tous droits réservés.</p>
    </div>
  </div>
</template>

<style scoped>
.auth-left {
  flex: 1;
  background-color: #1e3a8a;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4rem;
  position: relative;
  overflow: hidden;
}

.branding {
  z-index: 2;
}

.logo-container {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.logo-icon {
  font-size: 2rem;
}

.app-name {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.app-tagline {
  font-size: 1.125rem;
  opacity: 0.8;
  max-width: 400px;
  line-height: 1.6;
}

.illustration {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.abstract-shape {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  animation: morph 10s linear infinite alternate;
}

@keyframes morph {
  0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
  100% { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; }
}

.footer-info {
  z-index: 2;
  font-size: 0.875rem;
  opacity: 0.6;
}

@media (max-width: 1024px) {
  .auth-left {
    padding: 2rem;
  }
  .app-name {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .auth-left {
    display: none;
  }
}
</style>
