<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import StreamTerminal from '../components/StreamTerminal.vue'

const route = useRoute()
const streamId = computed(() => route.query.stream_id || '')
const requestId = computed(() => route.query.request_id || '')
const server = computed(() => route.query.server || '')
const shareToken = computed(() => route.query.share_token || '')
</script>

<template>
  <div class="stream-page">
    <div class="stream-page__toolbar">
      <div>
        <h1>Shared stream</h1>
        <p>This view opens a websocket using the share token embedded in the link.</p>
      </div>
    </div>

    <StreamTerminal
      v-if="streamId && shareToken"
      :stream-id="streamId"
      :request-id="requestId"
      :server="server"
      :share-token="shareToken"
      title="Shared stream"
    />
    <div v-else class="notice notice--error">Missing stream_id or share_token in share link.</div>
  </div>
</template>
