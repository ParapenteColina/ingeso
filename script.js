// --- Lógica para el Perfil de Administrador ---

// Cambia esta variable a 'true' para simular que ha iniciado sesión un admin
// Cámbiala a 'false' para simular un usuario normal.
const esUsuarioAdmin = true; 

// Buscamos en el HTML el contenedor donde irá el enlace de "Estadísticas"
const adminLinkContainer = document.getElementById('admin-link-container');

// Verificamos si el usuario es administrador
if (esUsuarioAdmin) {
    // Si es admin, creamos el enlace
    const adminLink = document.createElement('a');
    adminLink.href = 'admin.html'; // Enlace a la nueva página de admin// Aquí iría el enlace a la página de estadísticas
    adminLink.textContent = 'Estadísticas';
    
    // Lo añadimos al contenedor en el menú desplegable
    adminLinkContainer.appendChild(adminLink);
}

// Puedes añadir más funcionalidades aquí en el futuro,
// como por ejemplo, qué pasa al hacer clic en "Añadir al Carrito".