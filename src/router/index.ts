// Composables
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "/",
        name: "Home",
        component: () => import("@/views/Home.vue"),
      },
      {
        path: "main",
        name: "Main",
        component: () => import("@/views/Main.vue"),
      },
      {
        path: "result",
        name: "Result",
        component: () => import("@/views/Results.vue"),
        props: (route) => ({ result: route.query.result }),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
