<template>
  <div class="min-h-screen bg-gray-900 p-8 text-white">
    <h1 class="text-2xl mb-4">Step 1: Local Media Capture</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-black aspect-video rounded-lg overflow-hidden border-2 border-blue-500">
        <video 
          ref="localVideo"
          autoplay 
          muted 
          playsinline 
          class="w-full h-full object-cover"
        ></video>
        <p class="p-2 bg-blue-500 text-xs uppercase">Your Local Stream</p>
      </div>
    </div>

    <div class="mt-4 p-4 bg-gray-800 rounded">
      <p>Status: <span class="text-green-400">{{ status }}</span></p>
    </div>
  </div>
</template>

<script setup>

// References to the UI
const localVideo = ref(null)
const status = ref('Waiting for permission...')

// This will hold the actual "MediaStream" object
let localStream = null

onMounted(async () => {
  await initializeMedia()
})

const initializeMedia = async () => {
  try {
    // THIS IS THE CORE OF STEP 1
    // We ask the browser to talk to the hardware (Camera & Mic)
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })

    // Once we have the stream, we "plug it in" to our <video> tag
    if (localVideo.value) {
      localVideo.value.srcObject = localStream
    }

    status.value = 'Camera/Mic accessed successfully!'
    
    // Let's look at what we actually got in the console
    console.log('Stream Object:', localStream)
    console.log('Video Tracks:', localStream.getVideoTracks())
    console.log('Audio Tracks:', localStream.getAudioTracks())

  } catch (error) {
    status.value = 'Error: ' + error.name
    console.error('Failed to get media:', error)
  }
}
</script>