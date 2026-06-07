<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '../stores/auth'

const router = useRouter()
const email = ref('maksim.nikitin@flant.com')
const error = computed(() => authStore.state.error)

async function submit() {
  try {
    const user = await authStore.login(email.value)
    router.push(user.role === 'admin' ? '/admin' : '/app')
  } catch {
    // handled by store
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-page__panel">
      <div class="login-page__eyebrow">Vue SPA</div>
      <h1>Core API Console</h1>
      <p>
        Sign in with the email known to `core-api`. The backend issues a Bearer token that the UI uses for API and websocket access.
      </p>

      <label>
        <span>Email</span>
        <input v-model="email" class="input input--hero" type="email" placeholder="name@example.com" @keyup.enter="submit" />
      </label>

      <button class="button button--wide" :disabled="authStore.state.loading" @click="submit">
        {{ authStore.state.loading ? 'Issuing token...' : 'Get access token' }}
      </button>

      <div v-if="error" class="notice notice--error">{{ error }}</div>
    </div>
  </div>
</template>
