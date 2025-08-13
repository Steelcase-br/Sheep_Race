// firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyDapPU15NDHsuWxFhPELeqQBA3sYpey6LI",
  authDomain: "steelcase-juego.firebaseapp.com",
  databaseURL: "https://steelcase-juego-default-rtdb.firebaseio.com",
  projectId: "steelcase-juego",
  storageBucket: "steelcase-juego.appspot.com",
  messagingSenderId: "397340237973",
  appId: "1:397340237973:web:909ec0ffb18725f86e3b9c"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Base de datos
const db = firebase.database();
