import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n, t } from './i18n'
import { useToastStore } from './stores/toast'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

const toastStore = useToastStore()

// Anything reaching these is by definition unexpected (a bug, not a validation
// failure a view already surfaces inline), so show a generic message rather
// than the raw error/stack.
app.config.errorHandler = () => toastStore.showError(t('common.unexpectedError'))
window.addEventListener('unhandledrejection', () => toastStore.showError(t('common.unexpectedError')))

app.mount('#app')
