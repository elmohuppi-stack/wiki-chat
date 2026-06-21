<template>
  <div class="chat-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Wiki-Chat</h2>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/chat" class="nav-item active">💬 Chat</router-link>
        <router-link to="/wiki" class="nav-item">📖 Wiki</router-link>
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

    <main class="chat-main">
      <div class="chat-header">
        <h3>Chat</h3>
      </div>

      <div class="messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="empty-state">
          <p>Starte eine Unterhaltung mit deinem Wiki-Wissen.</p>
        </div>
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['message', msg.role]"
        >
          <div class="avatar">{{ msg.role === "user" ? "👤" : "🤖" }}</div>
          <div class="bubble">
            <div v-html="renderMarkdown(msg.content)"></div>
            <div v-if="msg.knowledge_refs?.length" class="refs">
              <small>Quellen: {{ msg.knowledge_refs.length }} Chunks</small>
            </div>
          </div>
        </div>
        <div v-if="isStreaming" class="message assistant">
          <div class="avatar">🤖</div>
          <div class="bubble streaming">
            <span class="cursor-blink">▊</span>
          </div>
        </div>
      </div>

      <div class="input-bar">
        <select v-model="workspaceId" class="ws-select">
          <option value="">— Alle Workspaces —</option>
          <option v-for="ws in workspaces" :key="ws.id" :value="ws.id">
            {{ ws.name }}
          </option>
        </select>
        <input
          v-model="input"
          @keydown.enter="sendMessage"
          placeholder="Nachricht eingeben..."
          class="msg-input"
          :disabled="isStreaming"
        />
        <button
          @click="sendMessage"
          :disabled="!input.trim() || isStreaming"
          class="send-btn"
        >
          Senden
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { marked } from "marked";
import DOMPurify from "dompurify";
import axios from "axios";

const auth = useAuthStore();
const router = useRouter();
const messages = ref<any[]>([]);
const input = ref("");
const workspaceId = ref("");
const workspaces = ref<any[]>([]);
const isStreaming = ref(false);
const messagesRef = ref<HTMLDivElement>();

onMounted(() => {
  if (!auth.isAuthenticated) {
    router.push("/login");
    return;
  }
  loadWorkspaces();
});

async function loadWorkspaces() {
  try {
    const res = await axios.get("/api/v1/workspaces");
    workspaces.value = res.data.workspaces;
  } catch {}
}

function renderMarkdown(text: string) {
  const html = marked.parse(text, { async: false }) as string;
  return DOMPurify.sanitize(html);
}

async function sendMessage() {
  if (!input.value.trim() || isStreaming.value) return;

  const userMsg = {
    id: crypto.randomUUID(),
    role: "user",
    content: input.value,
    knowledge_refs: [],
  };
  messages.value.push(userMsg);
  const query = input.value;
  input.value = "";
  isStreaming.value = true;

  try {
    const res = await axios.post("/api/v1/chat", {
      workspace_id: workspaceId.value || undefined,
      message: query,
    });
    messages.value.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content: res.data.content,
      knowledge_refs: res.data.knowledge_refs || [],
    });
  } catch (e: any) {
    messages.value.push({
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "❌ Fehler bei der Anfrage: " + (e.response?.data?.error || e.message),
      knowledge_refs: [],
    });
  } finally {
    isStreaming.value = false;
  }

  setTimeout(() => {
    messagesRef.value?.scrollTo({
      top: messagesRef.value.scrollHeight,
      behavior: "smooth",
    });
  }, 50);
}
</script>

<style scoped>
.chat-layout {
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

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-secondary);
}

.message {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.avatar {
  font-size: 1.5rem;
  line-height: 1;
}

.bubble {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: var(--color-bg-secondary);
  line-height: 1.5;
}

.message.user {
  flex-direction: row-reverse;
}

.message.user .bubble {
  background: var(--color-primary);
  color: white;
}

.refs {
  margin-top: 0.5rem;
  opacity: 0.6;
}

.streaming .cursor-blink {
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.input-bar {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  align-items: center;
}

.ws-select {
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
}

.msg-input {
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 1rem;
}

.msg-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.send-btn {
  padding: 0.625rem 1.25rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
