<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header"><h2>Wiki-Chat</h2></div>
      <nav class="sidebar-nav">
        <router-link to="/chat" class="nav-item">💬 Chat</router-link>
        <router-link to="/wiki" class="nav-item">📖 Wiki</router-link>
        <router-link to="/workspaces" class="nav-item"
          >📁 Workspaces</router-link
        >
        <router-link to="/admin" class="nav-item active" v-if="auth.isAdmin"
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
    <main class="main-content">
      <div class="header"><h3>⚙️ Admin</h3></div>
      <div class="content">
        <div class="admin-section">
          <h4>Model-Provider</h4>
          <p>Verwaltung der LLM- und Embedding-Provider wird implementiert.</p>
        </div>
        <div class="admin-section">
          <h4>Benutzer</h4>
          <p>Benutzerverwaltung wird implementiert.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
const auth = useAuthStore();
const router = useRouter();
onMounted(() => {
  if (!auth.isAuthenticated) router.push("/login");
});
</script>

<style scoped>
.layout {
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
.main-content {
  flex: 1;
}
.header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}
.content {
  padding: 2rem 1.5rem;
}
.admin-section {
  margin-bottom: 2rem;
}
.admin-section h4 {
  margin-bottom: 0.5rem;
}
</style>
