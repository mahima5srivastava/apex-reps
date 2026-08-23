import {defineStore} from 'pinia';
import {getSupabase} from '@/utils/supabase';

export const useAuthStore = defineStore('auth', {
    getters: {
        isAuthenticated: (state) => {
            if(import.meta.client) {
                return localStorage.getItem('ar-is-logged-in') === 'true';
            }
            return false;
        }
    },
    actions: {
        async login(email: string, password: string) {
            const supabase = getSupabase();
            try {
                const { data, error } = await supabase.auth.signInWithPassword({email, password});
                if (error) throw error;
                if(import.meta.client) {
                    localStorage.setItem('ar-is-logged-in', 'true');
                }
                return navigateTo('/');
            } catch (error) {
                console.error('Login error:', error);
                throw error;
            }
        },
        async logout() {
            const supabase = getSupabase();
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                if(import.meta.client) {
                    localStorage.removeItem('ar-is-logged-in');
                }
                return navigateTo('/login');
            } catch (error) {
                console.error('Logout error:', error);
                throw error;
            }
        }
    }
})