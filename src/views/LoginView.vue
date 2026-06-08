<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '../stores/auth'

const router = useRouter()
const email = ref('superadmin@local')
const password = ref('superadmin-change-me')
const error = computed(() => authStore.state.error)

async function submit() {
  try {
    const user = await authStore.login(email.value, password.value)
    router.push(authStore.isSuperadmin(user) ? '/admin' : '/app')
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
        Локальный вход теперь работает по email и password. В production сюда позже подключат OIDC/OTP, а сейчас используются серверные password-based sessions с TTL и revoke.
      </p>

      <label>
        <span>Email</span>
        <input v-model="email" class="input input--hero" type="email" placeholder="name@example.com" @keyup.enter="submit" />
      </label>

      <label>
        <span>Password</span>
        <input v-model="password" class="input input--hero" type="password" placeholder="Local password" @keyup.enter="submit" />
      </label>

      <button class="button button--wide" :disabled="authStore.state.loading" @click="submit">
        {{ authStore.state.loading ? 'Signing in...' : 'Sign in' }}
      </button>

      <div v-if="error" class="notice notice--error">{{ error }}</div>
    </div>
  </div>
</template>
