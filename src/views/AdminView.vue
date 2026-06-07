<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../components/AppShell.vue'
import ServerOverview from '../components/ServerOverview.vue'
import RunningCommands from '../components/RunningCommands.vue'
import SessionHistory from '../components/SessionHistory.vue'
import CrudPanel from '../components/CrudPanel.vue'
import { authStore } from '../stores/auth'
import { apiRequest } from '../lib/api'

const router = useRouter()
const currentSection = ref('overview')
const servers = ref([])

const sections = [
  { id: 'overview', label: 'Overview', hint: 'Servers and SSH status' },
  { id: 'stream', label: 'Stream', hint: 'Run commands and watch terminals' },
  { id: 'history', label: 'History', hint: 'Older session logs' },
  { id: 'users', label: 'Users', hint: 'Manage operators' },
  { id: 'proxies', label: 'Proxies', hint: 'Manage jump hosts' },
  { id: 'servers', label: 'Servers', hint: 'Inventory and status' },
  { id: 'actions', label: 'Actions', hint: 'Audit action catalog' },
  { id: 'tokens', label: 'Tokens', hint: 'Static and issued tokens' },
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

const crudConfigs = {
  users: {
    title: 'User directory',
    description: 'Admin users and standard operators. Email doubles as auth identity.',
    endpoint: '/api/v1/users',
    itemLabel: 'user',
    fields: [
      { name: 'username', label: 'Username' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'role', label: 'Role', default: 'user' },
      { name: 'public_key', label: 'Public key', type: 'textarea', optional: true, list: false },
      { name: 'last_login', label: 'Last login', optional: true, list: false },
    ],
  },
  proxies: {
    title: 'Proxy catalog',
    description: 'Named proxy records used by server inventory.',
    endpoint: '/api/v1/proxies',
    itemLabel: 'proxy',
    fields: [
      { name: 'proxy', label: 'Proxy' },
    ],
  },
  servers: {
    title: 'Server inventory',
    description: 'Target hosts, environment labels and enablement flags.',
    endpoint: '/api/v1/servers',
    itemLabel: 'server',
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'host', label: 'Host' },
      { name: 'ip', label: 'IP', optional: true },
      { name: 'proxy_id', label: 'Proxy ID', type: 'number', optional: true },
      { name: 'port', label: 'Port', type: 'number', default: 22 },
      { name: 'environment', label: 'Environment', default: 'dev' },
      { name: 'enabled', label: 'Enabled', type: 'checkbox', default: true, checkboxLabel: 'Server enabled' },
    ],
  },
  actions: {
    title: 'Audit actions',
    description: 'Named actions used by audit and auth events.',
    endpoint: '/api/v1/actions',
    itemLabel: 'action',
    fields: [
      { name: 'name', label: 'Action name' },
    ],
  },
  tokens: {
    title: 'Token inventory',
    description: 'Static bootstrap tokens and issued auth tokens. Raw token is only known at creation time.',
    endpoint: '/api/v1/tokens',
    itemLabel: 'token',
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'token', label: 'Raw token', optional: true, list: false },
      { name: 'enabled', label: 'Enabled', type: 'checkbox', default: true, checkboxLabel: 'Token enabled' },
    ],
  },
}
</script>

<template>
  <AppShell
    title="Admin console"
    subtitle="Operate servers, inspect command flow, inspect older sessions and manage core entities."
    :user="user"
    :sections="sections"
    :current-section="currentSection"
    @select="currentSection = $event"
    @logout="logout"
  >
    <ServerOverview v-if="currentSection === 'overview'" />
    <div v-else-if="currentSection === 'stream'" class="stack-layout">
      <section class="panel">
        <div class="panel__header">
          <div>
            <h2>Stream workspace</h2>
            <p>Open the dedicated stream workspace to run commands, connect to live output and share terminal links.</p>
          </div>
          <button class="button" @click="openWorkspace">Open stream workspace</button>
        </div>
      </section>
      <RunningCommands @watch="openRunning" />
    </div>
    <SessionHistory v-else-if="currentSection === 'history'" @open="openSession" />
    <CrudPanel v-else-if="currentSection === 'users'" v-bind="crudConfigs.users" />
    <CrudPanel v-else-if="currentSection === 'proxies'" v-bind="crudConfigs.proxies" />
    <CrudPanel v-else-if="currentSection === 'servers'" v-bind="crudConfigs.servers" />
    <CrudPanel v-else-if="currentSection === 'actions'" v-bind="crudConfigs.actions" />
    <CrudPanel v-else-if="currentSection === 'tokens'" v-bind="crudConfigs.tokens" />
  </AppShell>
</template>
