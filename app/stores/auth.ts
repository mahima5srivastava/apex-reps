import { defineStore } from "pinia";
import { getSupabase } from "@/utils/supabase";
import { navigateTo } from "#app";

interface User {
  id: string;
  email: string;
  user_metadata: {
    email: string;
    email_verified: boolean;
    phone_verified: boolean;
    role: string;
    sub: string;
    name?: string;
  };
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    isAuthenticated: false,
    userId: "",
    user: null as User | null,
    accessToken: "",
  }),
  getters: {
    isLoggedIn: (state) => state.isAuthenticated,
  },
  actions: {
    async fetchSession() {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      this.isAuthenticated = !!user;
      this.userId = user?.id ?? "";
      this.user = user as User | null;
      this.accessToken = session?.access_token ?? "";
      return user;
    },
    async login(email: string, password: string) {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      await this.fetchSession();
      const role = this.user?.user_metadata?.role;
      return navigateTo(role === "coach" ? "/coach" : "/");
    },
    async logout() {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      this.isAuthenticated = false;
      this.userId = "";
      this.user = null;
      this.accessToken = "";
      return navigateTo("/login");
    },
  },
});
