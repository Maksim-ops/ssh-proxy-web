<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authStore } from '../stores/auth'
import { apiRequest } from '../lib/api'
import ExecPanel from '../components/ExecPanel.vue'
import RunningCommands from '../components/RunningCommands.vue'
import StreamTerminal from '../components/StreamTerminal.vue'

const router = useRouter()
const route = useRoute()
const user = computed(() => authStore.state.user || {})
const servers = ref([])
const session = ref(null)
const loading = ref(false)
const error = ref('')

const streamId = computed(() => route.query.stream_id || '')
const requestId = computed(() => route.query.request_id || '')
const server = computed(() => route.query.server || session.value?.server_name || '')
const shareToken = computed(() => route.query.share_token || session.value?.stream?.share_token || '')

apiRequest('/api/v1/servers').then((payload) => {
  servers.value = Array.isArray(payload) ? payload : payload.servers || []
}).catch(() => {
  servers.value = []
})

async function loadSession() {
  if (!requestId.value) {
    session.value = null
    return
  }
  loading.value = true
  error.value = ''
  try {
    const payload = await apiRequest(`/api/v1/sessions/${requestId.value}`)
    session.value = payload.session
  } catch (err) {
    error.value = err.message
    session.value = null
  } finally {
    loading.value = false
  }
}

watch(requestId, () => {
  loadSession()
}, { immediate: true })

function back() {
  router.push(authStore.isSuperadmin(user.value) ? '/admin' : '/app')
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

function openExecStream(payload) {
  router.push({
    path: '/stream',
    query: {
      stream_id: payload.stream_id,
      request_id: payload.request_id,
      server: payload.server,
      share_token: payload.share_token,
    },
  })
}
</script>

<template>
  <div class="stream-page">
    <div class="stream-page__toolbar">
      <button class="button button--ghost" @click="back">Back</button>
      <div>
        <h1>Stream workspace</h1>
        <p>Queue commands, follow live websocket output и рядом держите сохранённый лог выбранной сессии.</p>
      </div>
    </div>

    <div class="stack-layout">
      <ExecPanel :servers="servers" title="Run inside stream workspace" description="Queue only оставляет страницу стабильной, Open in stream переключает терминал на новый запуск." @started="openExecStream" />
      <RunningCommands @watch="openRunning" />
      <div v-if="error" class="notice notice--error">{{ error }}</div>
      <div v-else-if="loading" class="notice">Loading session logs...</div>
      <StreamTerminal
        :stream-id="streamId"
        :request-id="requestId"
        :server="server"
        :share-token="shareToken"
        :history-stdout="session?.stdout || ''"
        :history-stderr="session?.stderr || ''"
        title="Command terminal"
      />
    </div>
  </div>
</template>
