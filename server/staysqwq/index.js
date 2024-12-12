const socket = io('http://localhost:3000');

let selectedUser;
const peer = createPeerConnection();
const callButton = document.querySelector('#call');

// Update user list
const onUpdateUserList = ({ userIds }) => {
  const usersList = document.querySelector('#usersList');
  const usersToDisplay = userIds.filter((id) => id !== socket.id);
  usersList.innerHTML = '';

  usersToDisplay.forEach((user) => {
    const userItem = document.createElement('div');
    userItem.textContent = user;
    userItem.className = 'user-item';

    userItem.addEventListener('click', () => {
      selectedUser = user;
      alert(`Selected user: ${user}`);
    });

    usersList.appendChild(userItem);
  });
};

socket.on('update-user-list', onUpdateUserList);

// Create peer connection
function createPeerConnection() {
  return new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.stunprotocol.org' }],
  });
}

// Handle connection
const onSocketConnect = async () => {
  document.querySelector('#userId').textContent = `My user ID is ${socket.id}`;

  const constraints = { audio: true, video: true };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  document.querySelector('#localVideo').srcObject = stream;
  stream.getTracks().forEach((track) => peer.addTrack(track, stream));

  callButton.disabled = false;
};

socket.on('connect', onSocketConnect);

// Call button functionality
const call = async () => {
  if (!selectedUser) {
    alert('No user selected!');
    return;
  }

  callButton.disabled = true;
  const localPeerOffer = await peer.createOffer();
  await peer.setLocalDescription(new RTCSessionDescription(localPeerOffer));

  socket.emit('mediaOffer', {
    offer: localPeerOffer,
    from: socket.id,
    to: selectedUser,
  });
};

callButton.addEventListener('click', call);

// Handle media offer
const onMediaOffer = async (data) => {
  console.log('Received mediaOffer:', data);

  await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
  const peerAnswer = await peer.createAnswer();
  await peer.setLocalDescription(new RTCSessionDescription(peerAnswer));

  socket.emit('mediaAnswer', {
    answer: peerAnswer,
    from: socket.id,
    to: data.from,
  });
};

socket.on('mediaOffer', onMediaOffer);

// Handle media answer
const onMediaAnswer = async (data) => {
  console.log('Received mediaAnswer:', data);
  await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
};

socket.on('mediaAnswer', onMediaAnswer);

// Handle ICE candidates
peer.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('iceCandidate', {
      to: selectedUser,
      candidate: event.candidate,
    });
  }
};

socket.on('remotePeerIceCandidate', async (data) => {
  console.log('Received remote ICE candidate:', data);
  const candidate = new RTCIceCandidate(data.candidate);
  await peer.addIceCandidate(candidate);
});

// Handle remote stream
peer.addEventListener('track', (event) => {
  const [stream] = event.streams;
  document.querySelector('#remoteVideo').srcObject = stream;
});
