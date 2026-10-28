// Importa los scripts de Firebase (versión compat para Service Worker)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Configuración de Firebase (la misma que usas en staff.js)
const firebaseConfig = {
    apiKey: "AIzaSyD0b-S3Qo28sJzuJr-Sb-90_OqDzeJ0o1Q",
    authDomain: "spotlight-produccion.firebaseapp.com",
    projectId: "spotlight-produccion",
    storageBucket: "spotlight-produccion.firebasestorage.app",
    messagingSenderId: "354006255162",
    appId: "1:354006255162:web:4241b9eca93f953c0e1703"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Maneja los mensajes que llegan en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje en segundo plano recibido: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-blanco.jpg' // Asegúrate de que esta ruta sea correcta
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});