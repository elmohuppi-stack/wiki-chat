import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/chat",
    },
    {
      path: "/login",
      name: "Login",
      component: () => import("../views/auth/Login.vue"),
    },
    {
      path: "/chat",
      name: "Chat",
      component: () => import("../views/chat/ChatView.vue"),
    },
    {
      path: "/wiki/:workspaceId?",
      name: "Wiki",
      component: () => import("../views/wiki/WikiBrowser.vue"),
    },
    {
      path: "/wiki/:workspaceId/:slug",
      name: "WikiPage",
      component: () => import("../views/wiki/WikiPage.vue"),
    },
    {
      path: "/workspaces",
      name: "Workspaces",
      component: () => import("../views/workspace/WorkspaceList.vue"),
    },
    {
      path: "/workspaces/:id",
      name: "WorkspaceDetail",
      component: () => import("../views/workspace/WorkspaceDetail.vue"),
    },
    {
      path: "/documents/:workspaceId",
      name: "Documents",
      component: () => import("../views/documents/DocumentList.vue"),
    },
    {
      path: "/admin",
      name: "Admin",
      component: () => import("../views/admin/AdminPanel.vue"),
    },
  ],
});

export default router;
