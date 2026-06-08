<script setup>
import { onMounted, ref } from 'vue'
import { apiRequest } from '../lib/api'

const items = ref([])
const loading = ref(true)
const error = ref('')

function formatStamp(value) {
  if (!value) {
    return 'n/a'
  }
  return new Date(value).toLocaleString()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const payload = await apiRequest('/api/v1/audit?limit=200')
    items.value = payload.audit || []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="panel">
    <div class="panel__header">
      <div>
        <h2>Audit log</h2>
        <p>Auth, revoke, exec и подозрительные попытки собираются в единый аудит.</p>
      </div>
      <button class="button button--ghost" @click="load">Refresh</button>
    </div>

    <div v-if="error" class="notice notice--error">{{ error }}</div>
    <div v-else-if="loading" class="notice">Loading audit log...</div>
    <div v-else class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Resource</th>
            <th>Result</th>
            <th>IP</th>
            <th>Request</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ formatStamp(item.created_at) }}</td>
            <td>{{ item.action || 'n/a' }}</td>
            <td>{{ item.resource }}</td>
            <td>{{ item.result }}</td>
            <td>{{ item.ip_address || 'n/a' }}</td>
            <td>{{ item.request_id || 'n/a' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
