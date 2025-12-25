<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
      <h1 class="text-3xl font-bold text-center mb-8 text-gray-800">WebRTC Video Chat</h1>
      
      <div class="space-y-4">
        <!-- Create Room -->
        <button
          @click="createRoom"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
        >
          {{ loading ? 'Creating...' : 'Create New Room' }}
        </button>

        <!-- Join Room -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Or join existing room</span>
          </div>
        </div>

        <div class="space-y-2">
          <input
            v-model="roomCode"
            type="text"
            placeholder="Enter room code"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="joinRoom"
          />
          <button
            @click="joinRoom"
            :disabled="!roomCode || loading"
            class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            Join Room
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
const { $supabase } = useNuxtApp()
const router = useRouter()

const roomCode = ref('')
const loading = ref(false)
const error = ref('')

const createRoom = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // Generate random room code
    const code = Math.random().toString(36).substring(2, 10)
    
    // Create room in database
    const { data, error: dbError } = await $supabase
      .from('rooms')
      .insert({ room_code: code })
      .select()
      .single()
    
    if (dbError) throw dbError
    
    // Navigate to room
    router.push(`/room/${code}`)
  } catch (e) {
    error.value = 'Failed to create room: ' + e.message
  } finally {
    loading.value = false
  }
}

const joinRoom = async () => {
  if (!roomCode.value) return
  
  loading.value = true
  error.value = ''
  
  try {
    // Check if room exists
    const { data, error: dbError } = await $supabase
      .from('rooms')
      .select()
      .eq('room_code', roomCode.value)
      .single()
    
    if (dbError || !data) {
      throw new Error('Room not found')
    }
    
    // Navigate to room
    router.push(`/room/${roomCode.value}`)
  } catch (e) {
    error.value = 'Room not found or invalid'
  } finally {
    loading.value = false
  }
}
</script>