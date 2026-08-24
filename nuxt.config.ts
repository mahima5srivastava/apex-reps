// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    'nuxt-charts'
  ],

  devtools: {
    enabled: true
  },

  ssr: false,

  nitro: {
    prerender: { routes: ['/'] }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      supabaseUrl: import.meta.env.SUPABASE_URL,
      supabaseKey: import.meta.env.SUPABASE_KEY
    }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
