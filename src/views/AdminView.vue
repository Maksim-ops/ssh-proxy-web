<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../components/AppShell.vue'
import AuditPanel from '../components/AuditPanel.vue'
import AuthSessionsPanel from '../components/AuthSessionsPanel.vue'
import CrudPanel from '../components/CrudPanel.vue'
import RunningCommands from '../components/RunningCommands.vue'
import ServerOverview from '../components/ServerOverview.vue'
import SessionHistory from '../components/SessionHistory.vue'
import { authStore } from '../stores/auth'

const router = useRouter()
const currentSection = ref('overview')

const sections = [
  { id: 'overview', label: 'Overview', hint: 'Все серверы и SSH состояние' },
  { id: 'stream', label: 'Stream', hint: 'Запуск команд и live terminals' },
  { id: 'history', label: 'History', hint: 'Все command sessions и логи' },
  { id: 'teams', label: 'Teams', hint: 'Команды и ownership' },
  { id: 'projects', label: 'Projects', hint: 'Проекты и связь с командами' },
  { id: 'users', label: 'Users', hint: 'Роли и локальные пароли' },
  { id: 'servers', label: 'Servers', hint: 'Инвентарь серверов' },
  { id: 'auth-sessions', label: 'Auth Sessions', hint: 'Login sessions и revoke' },
  { id: 'audit', label: 'Audit', hint: 'Auth и exec события' },
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

const teamSource = [{ name: 'teams', endpoint: '/api/v1/teams' }]
const projectSources = [{ name: 'teams', endpoint: '/api/v1/teams' }]
const serverSources = [
  { name: 'teams', endpoint: '/api/v1/teams' },
  { name: 'proxies', endpoint: '/api/v1/proxies' },
]

const crudConfigs = {
  teams: {
    title: 'Teams',
    description: 'Команда объединяет пользователей и проекты. Список справа показывает, что уже прикреплено к каждой команде.',
    endpoint: '/api/v1/teams',
    itemLabel: 'team',
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'slug', label: 'Slug' },
      { name: 'user_count', label: 'Users', optional: true, form: false },
      { name: 'project_count', label: 'Projects', optional: true, form: false },
      { name: 'user_names', label: 'Attached users', optional: true, form: false },
      { name: 'project_names', label: 'Attached projects', optional: true, form: false },
      { name: 'created_at', label: 'Created', optional: true, list: false, form: false },
    ],
  },
  projects: {
    title: 'Projects',
    description: 'Каждый проект принадлежит одной команде и потом может использоваться в серверном инвентаре.',
    endpoint: '/api/v1/projects',
    itemLabel: 'project',
    sources: projectSources,
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'slug', label: 'Slug' },
      {
        name: 'team_id',
        label: 'Team',
        type: 'select',
        optionsSource: 'teams',
        optionValue: 'id',
        optionLabel: 'name',
        valueType: 'number',
      },
      { name: 'team_name', label: 'Team name', optional: true, form: false },
      { name: 'created_at', label: 'Created', optional: true, list: false, form: false },
    ],
  },
  users: {
    title: 'User directory',
    description: 'Локальные пользователи, роли и пароли для dev/staging запуска.',
    endpoint: '/api/v1/users',
    itemLabel: 'user',
    sources: teamSource,
    fields: [
      { name: 'username', label: 'Username' },
      { name: 'email', label: 'Email', type: 'email' },
      {
        name: 'role',
        label: 'Role',
        type: 'select',
        default: 'engineer',
        options: [
          { value: 'engineer', label: 'engineer' },
          { value: 'tl', label: 'tl' },
          { value: 'pm', label: 'pm' },
          { value: 'superadmin', label: 'superadmin' },
        ],
      },
      {
        name: 'team_id',
        label: 'Team',
        type: 'select',
        optionsSource: 'teams',
        optionValue: 'id',
        optionLabel: 'name',
        valueType: 'number',
        optional: true,
        list: false,
      },
      { name: 'team_name', label: 'Team', optional: true, form: false },
      { name: 'password', label: 'Password', type: 'password', optional: true, list: false },
      { name: 'is_active', label: 'Enabled', type: 'checkbox', default: true, checkboxLabel: 'User active' },
      { name: 'public_key', label: 'Public key', type: 'textarea', optional: true, list: false },
      { name: 'last_login', label: 'Last login', optional: true, list: false, form: false },
    ],
  },
  servers: {
    title: 'Server inventory',
    description: 'Каждый сервер закреплён за командой и может быть привязан к SSH proxy из базы.',
    endpoint: '/api/v1/admin/servers',
    itemLabel: 'server',
    sources: serverSources,
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'host', label: 'Host' },
      { name: 'ip', label: 'IP', optional: true },
      {
        name: 'team_id',
        label: 'Team',
        type: 'select',
        optionsSource: 'teams',
        optionValue: 'id',
        optionLabel: 'name',
        valueType: 'number',
        optional: true,
        list: false,
      },
      {
        name: 'proxy_id',
        label: 'Proxy',
        type: 'select',
        optionsSource: 'proxies',
        optionValue: 'id',
        optionLabel: 'proxy',
        valueType: 'number',
        optional: true,
        list: false,
      },
      { name: 'team_name', label: 'Team', optional: true, form: false },
      { name: 'proxy_name', label: 'Proxy', optional: true, form: false },
      { name: 'project_name', label: 'Project', optional: true, form: false },
      { name: 'port', label: 'Port', type: 'number', default: 22 },
      { name: 'environment', label: 'Environment', default: 'dev' },
      { name: 'enabled', label: 'Enabled', type: 'checkbox', default: true, checkboxLabel: 'Server enabled' },
    ],
  },
}
</script>

<template>
  <AppShell
    title="Superadmin console"
    subtitle="Все команды, проекты, серверы, command sessions, auth sessions и аудит в одном интерфейсе."
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
            <p>Открывает отдельный workspace для запуска команд и live websocket stream.</p>
          </div>
          <button class="button" @click="openWorkspace">Open stream workspace</button>
        </div>
      </section>
      <RunningCommands @watch="openRunning" />
    </div>
    <SessionHistory v-else-if="currentSection === 'history'" />
    <CrudPanel v-else-if="currentSection === 'teams'" v-bind="crudConfigs.teams" />
    <CrudPanel v-else-if="currentSection === 'projects'" v-bind="crudConfigs.projects" />
    <CrudPanel v-else-if="currentSection === 'users'" v-bind="crudConfigs.users" />
    <CrudPanel v-else-if="currentSection === 'servers'" v-bind="crudConfigs.servers" />
    <AuthSessionsPanel v-else-if="currentSection === 'auth-sessions'" />
    <AuditPanel v-else-if="currentSection === 'audit'" />
  </AppShell>
</template>
