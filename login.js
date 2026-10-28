document.addEventListener('DOMContentLoaded', function() {
    console.log("Login.js cargado correctamente ✅");

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

    const infoUsuarios = {
        "SP-001": { nombre: "Johan Sebastián", rol: "Gerente General" },
        "SP-002": { nombre: "Brayan Alexander", rol: "Gerente de Marketing" },
        "SP-003": { nombre: "Beatriz", rol: "Jefa de Producción" },
        "SP-004": { nombre: "Jair", rol: "Jefe de Finanzas" },
        "SP-005": { nombre: "Ximena", rol: "Jefa de Recursos Humanos" },
        "SP-006": { nombre: "Maria Fernanda", rol: "Rol De Fernanda" }
    };

    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault(); 

        const usuarioInput = document.getElementById('usuario').value.toUpperCase().trim();
        const passwordInput = document.getElementById('password').value;

        if (infoUsuarios[usuarioInput]) {
            const emailFalso = usuarioInput.toLowerCase() + "@spotlight.com";

            auth.signInWithEmailAndPassword(emailFalso, passwordInput)
                .then((userCredential) => {
                    localStorage.setItem('staffLogueado', 'true');
                    localStorage.setItem('nombreStaff', infoUsuarios[usuarioInput].nombre);
                    localStorage.setItem('rolStaff', infoUsuarios[usuarioInput].rol);
                    window.location.href = "staff.html";
                })
                .catch((error) => {
                    // AQUÍ MOSTRAMOS EL ERROR REAL DE FIREBASE
                    console.error("Error de Firebase:", error.code, error.message);
                    alert("Error de Firebase:\n\n" + error.message);
                });
        } else {
            alert("El ID de empleado no existe.");
        }
    });
});