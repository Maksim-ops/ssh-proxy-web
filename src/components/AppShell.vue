<script setup>
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  user: { type: Object, required: true },
  sections: { type: Array, required: true },
  currentSection: { type: String, required: true },
})

const emit = defineEmits(['select', 'logout'])
</script>

<template>
  <div class="shell">
    <aside class="shell__sidebar">
      <div class="brand-card">
        <div class="brand-card__eyebrow">core-api console</div>
        <div class="brand-card__title">{{ title }}</div>
        <div class="brand-card__meta">{{ subtitle }}</div>
      </div>

      <nav class="nav-list">
        <button
          v-for="section in sections"
          :key="section.id"
          class="nav-list__item"
          :class="{ 'nav-list__item--active': currentSection === section.id }"
          @click="emit('select', section.id)"
        >
          <span>{{ section.label }}</span>
          <small>{{ section.hint }}</small>
        </button>
      </nav>
    </aside>

    <div class="shell__content">
      <header class="topbar">
        <div>
          <div class="topbar__title">{{ title }}</div>
          <div class="topbar__subtitle">{{ subtitle }}</div>
        </div>
        <div class="topbar__user">
          <div>
            <strong>{{ user.username }}</strong>
            <span>{{ user.email }} · {{ user.role }}</span>
          </div>
          <button class="button button--ghost" @click="emit('logout')">Logout</button>
        </div>
      </header>

      <main class="shell__body">
        <slot />
      </main>
    </div>
  </div>
</template>
