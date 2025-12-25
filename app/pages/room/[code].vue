<template>
  <div class="p-8 bg-gray-900 min-h-screen text-white font-mono">
    <h1 class="text-xl border-b border-gray-700 pb-2 mb-4">WebRTC Learning Lab</h1>
    
    <div class="mb-4 p-3 bg-gray-800 rounded border border-blue-500">
      <p class="text-xs text-blue-400">STATUS:</p>
      <p>{{ status }}</p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="bg-black aspect-video rounded">
        <video ref="localVideo" autoplay muted playsinline class="w-full h-full" />
        <p class="text-center text-xs py-1 bg-gray-700">STEP 1: Local (Me)</p>
      </div>
      <div class="bg-black aspect-video rounded">
        <video ref="remoteVideo" autoplay playsinline class="w-full h-full" />
        <p class="text-center text-xs py-1 bg-gray-700">STEP 3: Remote (Peer)</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const { $supabase } = useNuxtApp()
const route = useRoute()

// --- UI REFS ---
const localVideo = ref(null)
const remoteVideo = ref(null)
const status = ref('Initializing...')

// --- WEBRTC & SIGNALING GLOBALS ---
let localStream = null      // Step 1: The Camera Data
let peerConnection = null   // Step 3: The P2P Engine
let channel = null          // Step 2: The Middleman (Supabase)
let peerId = null           // Our unique ID for this session

onMounted(async () => {
  peerId = Math.random().toString(36).substring(7)
  
  // START STEP 1: Get Hardware
  await initializeMedia()
  
  // START STEP 2: Join the Room
  setupSignaling()
})

// --- STEP 1: CAPTURE HARDWARE ---
const initializeMedia = async () => {
  try {
    
    
    const devices = await navigator.mediaDevices.enumerateDevices()
    const hasVideo = devices.some(d => d.kind === 'videoinput')
    const hasAudio = devices.some(d => d.kind === 'audioinput')
    localStream = await navigator.mediaDevices.getUserMedia({
      video: hasVideo,
      audio: hasAudio
    })
    localVideo.value.srcObject = localStream
    status.value = 'Step 1: Local Camera Ready.'
  } catch (e) {
    status.value = 'Step 1 Error: No Camera Found.'
    localStream = new MediaStream() // Fallback so Step 3 doesn't crash
  }
}

// --- STEP 2: THE MIDDLEMAN (SUPABASE) ---
const setupSignaling = () => {
  channel = $supabase.channel(`room:${route.params.code}`)

  // Listen for the Handshake (Step 3 signals)
  channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
    console.log('Signal Received:', payload.type)
    
    if (payload.type === 'offer') {
      await handleOffer(payload.sdp)
    } else if (payload.type === 'answer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp))
    } else if (payload.type === 'ice-candidate') {
      await peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate))
    }
  })

  // Check if someone is already here to start the call
  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    const others = Object.keys(state).filter(id => id !== peerId)
    
    // Logic: If someone is here and we have a camera, WE start the call (Offer)
    if (others.length > 0 && !peerConnection && localStream.getVideoTracks().length > 0) {
      startCall()
    }
  })

  channel.subscribe((s) => { if (s === 'SUBSCRIBED') channel.track({ id: peerId }) })
}

// --- STEP 3: THE HANDSHAKE (WEBRTC) ---

// This creates the "Engine" (RTCPeerConnection)
const createPeerConnection = () => {
  peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  })

  // A. Plug our camera tracks into the engine
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream))

  // B. When the engine finds a "Network Door" (ICE Candidate), send it to the peer
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      channel.send({ type: 'broadcast', event: 'signal', payload: { type: 'ice-candidate', candidate: event.candidate } })
    }
  }

  // C. When the engine "hears" video data coming from the peer, show it!
  peerConnection.ontrack = (event) => {
    remoteVideo.value.srcObject = event.streams[0]
    status.value = 'Step 3: P2P Connection Success!'
  }
}

// THE CALLER: Create the Offer
const startCall = async () => {
  status.value = 'Step 3: Creating Offer...'
  createPeerConnection()
  const offer = await peerConnection.createOffer()
  await peerConnection.setLocalDescription(offer)
  
  channel.send({ type: 'broadcast', event: 'signal', payload: { type: 'offer', sdp: offer } })
}

// THE RECEIVER: Create the Answer
const handleOffer = async (remoteSdp) => {
  status.value = 'Step 3: Received Offer, Sending Answer...'
  createPeerConnection()
  await peerConnection.setRemoteDescription(new RTCSessionDescription(remoteSdp))
  const answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)
  
  channel.send({ type: 'broadcast', event: 'signal', payload: { type: 'answer', sdp: answer } })
}
</script>