// Composables
import { createRouter, createWebHistory } from "vue-router";

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
        beforeEnter: () => {
          const rulesAccepted = sessionStorage.getItem("rulesAccepted");
          if (rulesAccepted) {
            return true;
          } else {
            alert("You have to confirm that you understand the usage of the website");
            return { name: "Home" };
          }
        },
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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
