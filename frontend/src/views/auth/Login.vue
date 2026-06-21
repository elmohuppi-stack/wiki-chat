<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Wiki-Chat</h1>
      <p class="subtitle">Anmelden oder registrieren</p>

      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label for="name" v-if="isRegister">Name</label>
          <input
            v-if="isRegister"
            v-model="name"
            id="name"
            type="text"
            placeholder="Dein Name"
            required
          />
        </div>
        <div class="field">
          <label for="email">E-Mail</label>
          <input
            v-model="email"
            id="email"
            type="email"
            placeholder="deine@email.de"
            required
          />
        </div>
        <div class="field">
          <label for="password">Passwort</label>
          <input
            v-model="password"
            id="password"
            type="password"
            placeholder="Passwort"
            required
          />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="btn-primary">
          {{ isRegister ? "Registrieren" : "Anmelden" }}
        </button>
      </form>

      <p class="switch-mode">
        <button class="link-btn" @click="isRegister = !isRegister">
          {{
            isRegister
              ? "Schon registriert? Anmelden"
              : "Noch kein Konto? Registrieren"
          }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const isRegister = ref(false);
const email = ref("");
const password = ref("");
const name = ref("");
const error = ref("");

async function handleSubmit() {
  error.value = "";
  try {
    if (isRegister.value) {
      await auth.register(email.value, password.value, name.value);
    } else {
      await auth.login(email.value, password.value);
    }
    router.push("/chat");
  } catch (e: any) {
    error.value =
      e.response?.data?.error || e.message || "Fehler bei der Anmeldung";
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  margin-bottom: 0.25rem;
}

.subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: var(--color-text-secondary);
}

.field input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 1rem;
}

.field input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(0, 82, 217, 0.15);
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.btn-primary:hover {
  opacity: 0.9;
}

.error {
  color: #d32f2f;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.switch-mode {
  text-align: center;
  margin-top: 1rem;
}

.link-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 0.875rem;
}
</style>
