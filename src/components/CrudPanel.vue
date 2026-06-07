<script setup>
import { computed, onMounted, ref } from 'vue'
import { apiRequest } from '../lib/api'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  endpoint: { type: String, required: true },
  fields: { type: Array, required: true },
  itemLabel: { type: String, required: true },
})

const items = ref([])
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const editingId = ref(null)
const form = ref({})

const columns = computed(() => props.fields.filter((field) => field.list !== false))

function emptyForm() {
  const data = {}
  for (const field of props.fields) {
    if (field.type === 'checkbox') {
      data[field.name] = field.default ?? false
    } else {
      data[field.name] = field.default ?? ''
    }
  }
  return data
}

function resetForm() {
  form.value = emptyForm()
  editingId.value = null
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const payload = await apiRequest(props.endpoint)
    items.value = Array.isArray(payload) ? payload : payload.items || []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function startEdit(item) {
  editingId.value = item.id
  form.value = emptyForm()
  for (const field of props.fields) {
    if (field.name in item) {
      form.value[field.name] = item[field.name] ?? (field.type === 'checkbox' ? false : '')
    }
  }
}

function sanitizePayload() {
  const payload = {}
  for (const field of props.fields) {
    const value = form.value[field.name]
    if (field.type === 'checkbox') {
      payload[field.name] = Boolean(value)
      continue
    }
    if (value === '' || value === null || value === undefined) {
      if (field.optional) {
        continue
      }
      payload[field.name] = ''
      continue
    }
    payload[field.name] = field.type === 'number' ? Number(value) : value
  }
  return payload
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    const payload = sanitizePayload()
    if (editingId.value) {
      await apiRequest(`${props.endpoint}/${editingId.value}`, { method: 'PATCH', body: payload })
    } else {
      await apiRequest(props.endpoint, { method: 'POST', body: payload })
    }
    resetForm()
    await load()
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function remove(id) {
  if (!window.confirm(`Delete this ${props.itemLabel}?`)) {
    return
  }
  try {
    await apiRequest(`${props.endpoint}/${id}`, { method: 'DELETE' })
    await load()
    if (editingId.value === id) {
      resetForm()
    }
  } catch (err) {
    error.value = err.message
  }
}

onMounted(() => {
  resetForm()
  load()
})
</script>

<template>
  <section class="panel panel--crud">
    <div class="panel__header">
      <div>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>
      <button class="button button--ghost" @click="resetForm">New {{ itemLabel }}</button>
    </div>

    <div v-if="error" class="notice notice--error">{{ error }}</div>

    <div class="crud-layout">
      <div class="crud-form">
        <label v-for="field in fields" :key="field.name">
          <span>{{ field.label }}</span>
          <textarea
            v-if="field.type === 'textarea'"
            v-model="form[field.name]"
            class="input input--textarea"
            :placeholder="field.placeholder || ''"
          />
          <input
            v-else-if="field.type !== 'checkbox'"
            v-model="form[field.name]"
            class="input"
            :type="field.type || 'text'"
            :placeholder="field.placeholder || ''"
          />
          <label v-else class="checkbox-row">
            <input v-model="form[field.name]" type="checkbox" />
            <span>{{ field.checkboxLabel || field.label }}</span>
          </label>
        </label>

        <div class="button-row">
          <button class="button" :disabled="saving" @click="save">{{ saving ? 'Saving...' : editingId ? 'Save changes' : `Create ${itemLabel}` }}</button>
          <button class="button button--ghost" @click="resetForm">Reset</button>
        </div>
      </div>

      <div class="crud-table">
        <div v-if="loading" class="notice">Loading {{ itemLabel }} list...</div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th v-for="column in columns" :key="column.name">{{ column.label }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td v-for="column in columns" :key="column.name">{{ item[column.name] }}</td>
                <td class="table-actions">
                  <button class="button button--tiny" @click="startEdit(item)">Edit</button>
                  <button class="button button--tiny button--danger" @click="remove(item.id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
