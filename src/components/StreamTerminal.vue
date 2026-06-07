<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { authStore } from '../stores/auth'

const props = defineProps({
  streamId: { type: [String, Number], default: '' },
  shareToken: { type: String, default: '' },
  requestId: { type: String, default: '' },
  server: { type: String, default: '' },
  title: { type: String, default: 'Live stream' },
  historyStdout: { type: String, default: '' },
  historyStderr: { type: String, default: '' },
})

const entries = ref([])
const connectionState = ref('idle')
const meta = ref({ status: 'idle', exitCode: null })
const terminalBody = ref(null)
let socket = null

const shareLink = computed(() => {
  if (!props.streamId || !props.shareToken) {
    return ''
  }
  const url = new URL(window.location.origin + '/share')
  url.searchParams.set('stream_id', props.streamId)
  url.searchParams.set('share_token', props.shareToken)
  if (props.requestId) {
    url.searchParams.set('request_id', props.requestId)
  }
  if (props.server) {
    url.searchParams.set('server', props.server)
  }
  return url.toString()
})

function scrollToEnd() {
  nextTick(() => {
    if (terminalBody.value) {
      terminalBody.value.scrollTop = terminalBody.value.scrollHeight
    }
  })
}

function setBaseHistory() {
  const base = []
  if (props.historyStdout) {
    base.push({ type: 'meta', text: '# stored stdout', ts: Date.now() + 0.1 })
    base.push({ type: 'stdout', text: props.historyStdout, ts: Date.now() + 0.2 })
  }
  if (props.historyStderr) {
    base.push({ type: 'meta', text: '# stored stderr', ts: Date.now() + 0.3 })
    base.push({ type: 'stderr', text: props.historyStderr, ts: Date.now() + 0.4 })
  }
  entries.value = base
  if (!props.streamId) {
    connectionState.value = 'history'
  }
  scrollToEnd()
}

function pushEntry(type, text) {
  entries.value.push({ type, text, ts: Date.now() + Math.random() })
  scrollToEnd()
}

function closeSocket() {
  if (socket) {
    socket.close()
    socket = null
  }
}

function connect() {
  closeSocket()
  setBaseHistory()

  if (!props.streamId) {
    return
  }

  connectionState.value = 'connecting'
  const params = new URLSearchParams({
    stream_id: String(props.streamId),
    history_lines: '500',
  })

  if (props.shareToken) {
    params.set('share_token', props.shareToken)
  } else if (authStore.state.token) {
    params.set('token', authStore.state.token)
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  socket = new WebSocket(`${protocol}://${window.location.host}/ws?${params.toString()}`)

  socket.onopen = () => {
    connectionState.value = 'open'
  }

  socket.onmessage = (event) => {
    const payload = JSON.parse(event.data)
    if (payload.type === 'stdout') {
      pushEntry('stdout', payload.line || '')
      return
    }
    if (payload.type === 'stderr') {
      pushEntry('stderr', payload.line || '')
      return
    }
    if (payload.type === 'started') {
      pushEntry('meta', `# started ${payload.command || ''}`)
      return
    }
    if (payload.type === 'finished' || payload.type === 'cancelled' || payload.type === 'error') {
      meta.value = { status: payload.status || payload.type, exitCode: payload.exit_code }
      pushEntry('meta', `# ${payload.type} status=${payload.status || payload.type} exit=${payload.exit_code ?? 'n/a'}`)
    }
  }

  socket.onerror = () => {
    connectionState.value = 'error'
    pushEntry('meta', '# websocket connection error')
  }

  socket.onclose = () => {
    if (connectionState.value !== 'error') {
      connectionState.value = props.streamId ? 'closed' : 'history'
    }
  }
}

async function copyShareLink() {
  if (!shareLink.value) {
    return
  }
  await navigator.clipboard.writeText(shareLink.value)
  pushEntry('meta', '# share link copied to clipboard')
}

watch(
  () => [props.streamId, props.shareToken, props.historyStdout, props.historyStderr],
  () => {
    connect()
  },
  { immediate: true },
)

onMounted(() => {
  connect()
})

onUnmounted(() => {
  closeSocket()
})
</script>

<template>
  <section class="panel panel--terminal">
    <div class="panel__header">
      <div>
        <h2>{{ title }}</h2>
        <p>
          Request {{ requestId || 'n/a' }} · Stream #{{ streamId || 'n/a' }} · {{ server || 'unknown server' }}
        </p>
      </div>
      <div class="button-row">
        <span class="badge" :class="connectionState === 'open' ? 'badge--success' : 'badge--muted'">{{ connectionState }}</span>
        <button class="button button--ghost" @click="connect">Reconnect</button>
        <button class="button" :disabled="!shareLink" @click="copyShareLink">Share</button>
      </div>
    </div>

    <div class="terminal-meta">
      <span>Status: <strong>{{ meta.status }}</strong></span>
      <span>Exit: <strong>{{ meta.exitCode ?? 'n/a' }}</strong></span>
      <span v-if="shareLink">Share route ready</span>
    </div>

    <div ref="terminalBody" class="terminal-body">
      <div v-for="entry in entries" :key="entry.ts" class="terminal-line" :class="`terminal-line--${entry.type}`">
        {{ entry.text }}
      </div>
    </div>
  </section>
</template>
