document.addEventListener('DOMContentLoaded', function() {
    
    // 1. INICIALIZAMOS FIREBASE (Para que el login sea real y seguro)
    const firebaseConfig = {
        apiKey: "AIzaSyD0b-S3Qo28sJzuJr-Sb-90_OqDzeJ0o1Q",
        authDomain: "spotlight-produccion.firebaseapp.com",
        projectId: "spotlight-produccion",
        storageBucket: "spotlight-produccion.firebasestorage.app",
        messagingSenderId: "354006255162",
        appId: "1:354006255162:web:4241b9eca93f953c0e1703"
    };
    if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
    const auth = firebase.auth();

    // Nuestra base de datos local solo para saber el Nombre y Rol (ya no guardamos contraseñas aquí)
    const infoUsuarios = {
        "SP-001": { nombre: "Johan Sebastián", rol: "Gerente General" },
        "SP-002": { nombre: "Brayan Alexander", rol: "Gerente de Marketing" },
        "SP-003": { nombre: "Beatriz", rol: "Jefa de Producción" },
        "SP-004": { nombre: "Jair", rol: "Jefe de Finanzas" },
        "SP-005": { nombre: "Ximena", rol: "Jefa de Recursos Humanos" },
        "SP-006": { nombre: "Maria Fernanda", rol: "Rol De Fernanda" }
    };

    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const usuarioInput = document.getElementById('usuario').value.toUpperCase().trim();
        const passwordInput = document.getElementById('password').value;

        // Verificamos que el ID exista en nuestra lista
        if (infoUsuarios[usuarioInput]) {
            
            // Convertimos "SP-001" a "sp-001@spotlight.com" para que Firebase lo acepte
            const emailFalso = usuarioInput.toLowerCase() + "@spotlight.com";

            // Iniciamos sesión REAL en Firebase
            auth.signInWithEmailAndPassword(emailFalso, passwordInput)
                .then((userCredential) => {
                    // Si la contraseña es correcta, guardamos los datos y entramos
                    localStorage.setItem('staffLogueado', 'true');
                    localStorage.setItem('nombreStaff', infoUsuarios[usuarioInput].nombre);
                    localStorage.setItem('rolStaff', infoUsuarios[usuarioInput].rol);
                    
                    window.location.href = "staff.html";
                })
                .catch((error) => {
                    // Si Firebase dice que la contraseña está mal
                    console.error("Error de login:", error);
                    alert("Contraseña incorrecta o usuario no registrado en Firebase.");
                    loginForm.reset();
                });

        } else {
            alert("El ID de empleado no existe.");
            loginForm.reset();
        }
    });
});