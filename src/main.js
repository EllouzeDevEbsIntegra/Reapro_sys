import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import App from './App.vue'
import router from './router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Paginator from 'primevue/paginator'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dropdown from 'primevue/dropdown'

import './assets/styles/main.css'
import './assets/styles/pagination-fix.css'
import './assets/styles/custom-pagination.css'
import 'primeicons/primeicons.css'

const app = createApp(App)

app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Paginator', Paginator)
app.component('InputText', InputText)
app.component('Button', Button)
app.component('IconField', IconField)
app.component('InputIcon', InputIcon)
app.component('Dropdown', Dropdown)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.my-app-dark',
            cssLayer: {
                name: 'primevue',
                order: 'tailwind-base, primevue, tailwind-utilities'
            }
        }
    },
    pt: {
        global: {
            css: `
                :root {
                    --p-primary-50: #eff6ff;
                    --p-primary-100: #dbeafe;
                    --p-primary-200: #bfdbfe;
                    --p-primary-300: #93c5fd;
                    --p-primary-400: #60a5fa;
                    --p-primary-500: #3b82f6;
                    --p-primary-600: #2563eb;
                    --p-primary-700: #1d4ed8;
                    --p-primary-800: #1e40af;
                    --p-primary-900: #1e3a8a;
                    --p-primary-950: #172554;
                }
            `
        }
    }
})
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
