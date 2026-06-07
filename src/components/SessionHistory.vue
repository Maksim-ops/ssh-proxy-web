<script setup>
import { onMounted, ref, watch } from 'vue'
import { apiRequest } from '../lib/api'

const props = defineProps({
  limit: { type: Number, default: 120 },
})

const emit = defineEmits(['open'])

const loading = ref(true)
const error = ref('')
const sessions = ref([])
const selectedRequestId = ref('')
const detail = ref(null)
const detailLoading = ref(false)

async function loadSessions() {
  loading.value = true
  error.value = ''
  try {
    const payload = await apiRequest(`/api/v1/sessions?limit=${props.limit}`)
    sessions.value = payload.sessions || []
    if (!selectedRequestId.value && sessions.value.length > 0) {
      selectedRequestId.value = sessions.value[0].request_id
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function loadDetail(requestId) {
  if (!requestId) {
    detail.value = null
    return
  }
  detailLoading.value = true
  try {
    const payload = await apiRequest(`/api/v1/sessions/${requestId}`)
    detail.value = payload.session
  } catch (err) {
    error.value = err.message
    detail.value = null
  } finally {
    detailLoading.value = false
  }
}

function openSession(item) {
  emit('open', {
    request_id: item.request_id,
    stream_id: item.stream?.stream_id || '',
    share_token: item.stream?.share_token || '',
    server: item.server_name,
  })
}

watch(selectedRequestId, (value) => {
  loadDetail(value)
})

onMounted(() => {
  loadSessions()
})
</script>

<template>
  <section class="panel panel--history">
    <div class="panel__header">
      <div>
        <h2>Session history</h2>
        <p>Older command sessions for the current user. Select any request to inspect stored stdout/stderr with a long scroll.</p>
      </div>
      <button class="button button--ghost" @click="loadSessions">Refresh</button>
    </div>

    <div v-if="error" class="notice notice--error">{{ error }}</div>

    <div class="history-layout">
      <div class="history-list">
        <div v-if="loading" class="notice">Loading sessions...</div>
        <button
          v-for="item in sessions"
          :key="item.request_id"
          class="history-item"
          :class="{ 'history-item--active': selectedRequestId === item.request_id }"
          @click="selectedRequestId = item.request_id"
        >
          <div class="history-item__meta">
            <strong>{{ item.server_name }}</strong>
            <span>{{ item.status }} · {{ item.exit_code ?? 'n/a' }}</span>
          </div>
          <code>{{ item.command }}</code>
          <small>{{ item.request_id }}</small>
        </button>
      </div>

      <div class="history-detail panel panel--nested">
        <div v-if="detailLoading" class="notice">Loading selected session...</div>
        <template v-else-if="detail">
          <div class="history-detail__header">
            <div>
              <h3>{{ detail.server_name }} · {{ detail.status }}</h3>
              <p>{{ detail.request_id }}</p>
            </div>
            <div class="button-row">
              <button class="button button--ghost" @click="openSession(detail)">Open in stream</button>
            </div>
          </div>

          <div class="history-detail__metrics">
            <span>Started: {{ detail.started_at || 'n/a' }}</span>
            <span>Finished: {{ detail.finished_at || 'n/a' }}</span>
            <span>Exit: {{ detail.exit_code ?? 'n/a' }}</span>
          </div>

          <div class="history-scroll">
            <div class="history-scroll__section">
              <div class="history-scroll__label">stdout</div>
              <pre>{{ detail.stdout || '' }}</pre>
            </div>
            <div class="history-scroll__section history-scroll__section--stderr">
              <div class="history-scroll__label">stderr</div>
              <pre>{{ detail.stderr || '' }}</pre>
            </div>
          </div>
        </template>
        <div v-else class="notice">Choose a session from the list to inspect stored logs.</div>
      </div>
    </div>
  </section>
</template>
