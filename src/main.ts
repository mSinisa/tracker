import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createAuth, createServices } from './compositionRoot'
import { createSession, provideSession } from './session'

const app = createApp(App)

app.use(router)
provideSession(app, createSession(createAuth(), createServices))

app.mount('#app')
