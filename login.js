document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const usuario = document.getElementById('usuario').value;
        const password = document.getElementById('password').value;

        if (usuario === "admin" && password === "12345") {
            // Guardamos un "pase temporal" en el navegador
            localStorage.setItem('staffLogueado', 'true');
            localStorage.setItem('nombreStaff', usuario);
            
            // Redirigimos al panel
            window.location.href = "staff.html";
        } else {
            alert("Usuario o contraseña incorrectos.");
            loginForm.reset();
        }
    });
});