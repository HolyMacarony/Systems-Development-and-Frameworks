import Vue from 'vue'
import App from './app.vue'
import { createProvider } from './vue-apollo'

Vue.config.productionTip = false

new Vue({
  apolloProvider: createProvider(),
  render: h => h(App)
}).$mount('#app')
