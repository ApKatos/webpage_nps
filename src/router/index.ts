// Composables
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "", // No base needed for the root path
        name: "Home",
        component: () => import("@/views/Home.vue"),
      },
      {
        path: "main", // No base needed for this path
        name: "Main",
        component: () => import("@/views/Main.vue"),
      },
      {
        path: "result", // No base needed for this path
        name: "Result",
        component: () => import("@/views/Results.vue"),
        props: (route: any) => ({ result: route.query.result }),
      },
    ],
  },
  // default redirect to home page
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

// const base = import.meta.env.BASE_URL.endsWith("/")
//   ? import.meta.env.BASE_URL
//   : import.meta.env.BASE_URL + "/";

// routes.forEach((route) => {
//   route.path = import.meta.env.BASE_URL + route.path;
// });

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // history: createWebHashHistory(),
  routes,
});

export default router;
