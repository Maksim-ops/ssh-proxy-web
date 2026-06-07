<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { apiRequest } from '../lib/api'

const emit = defineEmits(['watch'])

const loading = ref(true)
const error = ref('')
const items = ref([])
let timer = null

async function load() {
  loading.value = true
  error.value = ''
  try {
    const payload = await apiRequest('/api/v1/running')
    items.value = payload.running || []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  timer = window.setInterval(load, 4000)
})

onUnmounted(() => {
  if (timer) {
    window.clearInterval(timer)
  }
})
</script>

<template>
  <section class="panel">
    <div class="panel__header">
      <div>
        <h2>Running commands</h2>
        <p>Live list of active command streams. Open any stream in the terminal view.</p>
      </div>
      <button class="button button--ghost" @click="load">Refresh</button>
    </div>

    <div v-if="error" class="notice notice--error">{{ error }}</div>
    <div v-else-if="loading" class="notice">Loading running commands...</div>
    <div v-else-if="items.length === 0" class="notice">No active command streams.</div>
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Request</th>
            <th>Server</th>
            <th>Stream</th>
            <th>Command</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.request_id">
            <td>{{ item.request_id }}</td>
            <td>{{ item.server }}</td>
            <td>#{{ item.stream_id }}</td>
            <td><code>{{ (item.argv || []).join(' ') }}</code></td>
            <td>
              <button class="button button--tiny" @click="emit('watch', item)">Watch</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
