import { useAuthStore } from '@/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
    if (import.meta.server) {
        return;
    }
    const authStore = useAuthStore();
    if (to.path !== '/login' && !authStore.isAuthenticated) {
        return navigateTo('/login');
    }
})