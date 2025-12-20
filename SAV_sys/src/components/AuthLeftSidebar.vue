<template>
    <div class="auth-left">
        <div class="brand-content">
            <div class="logo-circle">
                <i class="pi pi-bolt" style="font-size: 2.5rem; color: white;"></i>
            </div>
            <h1>Midone Vue</h1>
            <p>Modèle de tableau de bord d'administration premium</p>
        </div>
        <!-- Decorative shapes/background -->
        <div class="shape-1"></div>
        <div class="shape-2"></div>
    </div>
</template>

<style scoped>
/* Left Side Styling */
.auth-left {
    flex: 1;
    background-color: #1e3a8a;
    /* Dark Blue */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    color: white;
    padding: 2rem;
}

.brand-content {
    z-index: 10;
    text-align: center;
}

.logo-circle {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
}

.auth-left h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.auth-left p {
    font-size: 1.1rem;
    opacity: 0.8;
}

/* Decorative Shapes */
.shape-1 {
    position: absolute;
    top: -10%;
    left: -10%;
    width: 50%;
    height: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
    border-radius: 50%;
}

.shape-2 {
    position: absolute;
    bottom: -10%;
    right: -10%;
    width: 60%;
    height: 60%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 70%);
    border-radius: 50%;
}

/* Responsive Design */
@media (max-width: 768px) {
    .auth-left {
        display: none;
    }
}
</style>
