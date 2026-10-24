document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    // =========================================================
    // BASE DE DATOS DEL STAFF DE SPOTLIGHT
    // =========================================================
        const usuariosDB = {
        "SP-001": { pass: "J0h4n#Kp7z", nombre: "Johan Sebastián", rol: "Gerente General" },
        "SP-002": { pass: "Br4y@Nq2x", nombre: "Brayan Alexander", rol: "Gerente de Marketing" },
        "SP-003": { pass: "Be4tr1z$Wm", nombre: "Beatriz", rol: "Jefa de Producción" },
        "SP-004": { pass: "J41r%Lc9v", nombre: "Jair", rol: "Jefe de Finanzas" },
        "SP-005": { pass: "X1m3n@Rt5", nombre: "Ximena", rol: "Jefa de Recursos Humanos" },
        // NUEVA INTEGRANTE
        "SP-006": { pass: "M4r14@F3rn", nombre: "Maria Fernanda", rol: "Rol De Fernanda" }
    };

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Convertimos a mayúsculas el usuario por si escriben "sp-001"
        const usuarioInput = document.getElementById('usuario').value.toUpperCase().trim();
        const passwordInput = document.getElementById('password').value;

        // Verificamos si el ID existe y si la contraseña es correcta
        if (usuariosDB[usuarioInput] && usuariosDB[usuarioInput].pass === passwordInput) {
            
            // Guardamos la sesión en el navegador
            localStorage.setItem('staffLogueado', 'true');
            localStorage.setItem('nombreStaff', usuariosDB[usuarioInput].nombre);
            localStorage.setItem('rolStaff', usuariosDB[usuarioInput].rol); // Guardamos el rol
            
            // Lo mandamos al panel de control
            window.location.href = "staff.html";
            
        } else {
            alert("ID o contraseña incorrectos. Verifica tus datos.");
            loginForm.reset();
        }
    });
});