<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../components/AppShell.vue'
import RunningCommands from '../components/RunningCommands.vue'
import ServerOverview from '../components/ServerOverview.vue'
import SessionHistory from '../components/SessionHistory.vue'
import { authStore } from '../stores/auth'

const router = useRouter()
const currentSection = ref('servers')

const sections = [
  { id: 'servers', label: 'Team servers', hint: 'Серверы внутри моей команды' },
  { id: 'stream', label: 'Stream', hint: 'Запуск команд и live terminals' },
  { id: 'history', label: 'History', hint: 'Сессии команды и их логи' },
]

const user = computed(() => authStore.state.user || {})

function logout() {
  authStore.logout().finally(() => router.push('/login'))
}

function openRunning(item) {
  router.push({
    path: '/stream',
    query: {
      stream_id: item.stream_id,
      request_id: item.request_id,
      server: item.server,
    },
  })
}

function openWorkspace() {
  router.push('/stream')
}
</script>

<template>
  <AppShell
    title="Engineer console"
    subtitle="Серверы и command sessions ограничены текущей командой пользователя."
    :user="user"
    :sections="sections"
    :current-section="currentSection"
    @select="currentSection = $event"
    @logout="logout"
  >
    <ServerOverview v-if="currentSection === 'servers'" compact />
    <div v-else-if="currentSection === 'stream'" class="stack-layout">
      <section class="panel">
        <div class="panel__header">
          <div>
            <h2>Stream workspace</h2>
            <p>Отдельный workspace для запуска команд на серверах своей команды.</p>
          </div>
          <button class="button" @click="openWorkspace">Open stream workspace</button>
        </div>
      </section>
      <RunningCommands @watch="openRunning" />
    </div>
    <SessionHistory v-else-if="currentSection === 'history'" />
  </AppShell>
</template>
