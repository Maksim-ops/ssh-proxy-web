<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../components/AppShell.vue'
import ServerOverview from '../components/ServerOverview.vue'
import RunningCommands from '../components/RunningCommands.vue'
import SessionHistory from '../components/SessionHistory.vue'
import { authStore } from '../stores/auth'
import { apiRequest } from '../lib/api'

const router = useRouter()
const currentSection = ref('servers')
const servers = ref([])

const sections = [
  { id: 'servers', label: 'My servers', hint: 'Enabled targets and SSH state' },
  { id: 'stream', label: 'Stream', hint: 'Run commands and watch terminals' },
  { id: 'history', label: 'History', hint: 'Older session logs' },
]

const user = computed(() => authStore.state.user || {})

apiRequest('/api/v1/servers').then((payload) => {
  servers.value = Array.isArray(payload) ? payload : payload.servers || []
}).catch(() => {
  servers.value = []
})

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

function openSession(item) {
  router.push({
    path: '/stream',
    query: {
      stream_id: item.stream_id,
      request_id: item.request_id,
      server: item.server,
      share_token: item.share_token,
    },
  })
}

function openWorkspace() {
  router.push('/stream')
}
</script>

<template>
  <AppShell
    title="User console"
    subtitle="Run commands, watch streams in real time and inspect older session logs."
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
            <p>Open the terminal workspace to run commands, connect to a live websocket stream and share it.</p>
          </div>
          <button class="button" @click="openWorkspace">Open stream workspace</button>
        </div>
      </section>
      <RunningCommands @watch="openRunning" />
    </div>
    <SessionHistory v-else-if="currentSection === 'history'" @open="openSession" />
  </AppShell>
</template>
