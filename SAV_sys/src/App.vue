<script setup>
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
</script>

<template>
  <RouterView />
  <Toast />
  <ConfirmDialog style="width: 50vw; max-width: 600px;" :breakpoints="{'960px': '75vw', '640px': '90vw'}" />
</template>

<style>
/* Global styles can go here or in assets/main.css */
body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', sans-serif;
}
</style>
