// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],

  app: {
    // This ensures your JS/CSS files load from the correct subfolder on GH Pages
    baseURL: '/nuxt-webrtc-app/', 
    buildAssetsDir: 'assets', 
  },

  nitro: {
    preset: 'github-pages'
  },

  runtimeConfig: {
    public: {
      // These will be injected by GitHub Actions during the build
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY
    }
  },
})