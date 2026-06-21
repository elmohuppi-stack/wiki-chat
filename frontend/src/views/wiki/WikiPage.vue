<template>
  <div class="wiki-page-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Wiki-Chat</h2>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/chat" class="nav-item">💬 Chat</router-link>
        <router-link to="/wiki" class="nav-item active">📖 Wiki</router-link>
        <router-link to="/workspaces" class="nav-item"
          >📁 Workspaces</router-link
        >
        <router-link to="/admin" class="nav-item" v-if="auth.isAdmin"
          >⚙️ Admin</router-link
        >
      </nav>
      <div class="sidebar-footer">
        <span>{{ auth.userName }}</span>
        <button
          @click="
            auth.logout();
            $router.push('/login');
          "
          class="logout-btn"
        >
          Abmelden
        </button>
      </div>
    </aside>
    <main class="wiki-content">
      <div class="wiki-header">
        <router-link :to="'/wiki/' + workspaceId" class="back-link"
          >← Zurück zur Übersicht</router-link
        >
      </div>
      <div class="wiki-empty">
        <p>Wiki-Seite wird geladen...</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const workspaceId = route.params.workspaceId as string;

onMounted(() => {
  if (!auth.isAuthenticated) router.push("/login");
});
</script>

<style scoped>
.wiki-page-layout {
  display: flex;
  height: 100vh;
}
.sidebar {
  width: var(--sidebar-width);
  background: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}
.sidebar-nav {
  flex: 1;
  padding: 0.5rem;
}
.nav-item {
  display: block;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  color: var(--color-text);
  margin-bottom: 0.25rem;
}
.nav-item:hover,
.nav-item.active {
  background: var(--color-bg);
  text-decoration: none;
}
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  font-size: 0.875rem;
}
.logout-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  margin-left: 0.5rem;
}
.wiki-content {
  flex: 1;
}
.wiki-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}
.back-link {
  font-size: 0.875rem;
  color: var(--color-primary);
}
.wiki-empty {
  padding: 4rem 1.5rem;
  text-align: center;
  color: var(--color-text-secondary);
}
</style>
