// main.js
document.addEventListener('DOMContentLoaded', () => {

    // Carga el Header
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;
            
            // --- CÓDIGO IMPORTANTE ---
            // El script que maneja el link de Admin
            // debe ejecutarse DESPUÉS de cargar el header
            gestionarLinkAdmin(); 
        })
        .catch(error => console.error('Error al cargar el header:', error));

    // Carga el Footer
    fetch('footer.html') // (Tendrías que crear footer.html también)
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error al cargar el footer:', error));
});


// Mueve tu lógica del link de admin a una función
function gestionarLinkAdmin() {
    // Cambia esta variable a 'true' para simular que ha iniciado sesión un admin
    const esUsuarioAdmin = true; 

    const adminLinkContainer = document.getElementById('admin-link-container');
    
    // Verificamos si existe el contenedor (puede no cargarse al instante)
    if (adminLinkContainer) {
        if (esUsuarioAdmin) {
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            adminLink.textContent = 'Estadísticas';
            adminLinkContainer.appendChild(adminLink);
        }
    } else {
        console.warn('El contenedor del link de admin no se encontró.');
    }
}
// --- FUNCIONES DEL CARRITO ---
// Las ponemos aquí (fuera del DOMContentLoaded) para que sean "globales"
// y se puedan llamar desde producto.js, inventario.js, etc.

/**
 * 4. Función para AÑADIR un producto al carrito en localStorage
 * @param {object} producto - El objeto del producto que viene de Supabase
 */
function agregarAlCarrito(producto) {
    console.log("Añadiendo al carrito:", producto.nombre);

    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const productoEnCarrito = carrito.find(item => item.id === producto.id);

    if (productoEnCarrito) {
        // Si está, solo aumenta la cantidad
        productoEnCarrito.cantidad++;
    } else {
        // Si no está, lo añade con cantidad 1
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: 1
        });
    }

    // Guardar el carrito actualizado
    localStorage.setItem('carrito', JSON.stringify(carrito));

    // Dar feedback al usuario
    alert('¡Producto añadido al carrito!');
    
    // Actualizar el contador en el header INMEDIATAMENTE
    actualizarContadorCarrito();
}


/**
 * 5. Función para ACTUALIZAR el número en el ícono del carrito
 */
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const contadorEl = document.getElementById('carrito-contador'); // ID del <span>

    if (contadorEl) {
        // Suma la 'cantidad' de cada producto en el carrito
        const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
        
        contadorEl.textContent = totalItems;
        
        // Opcional: mostrar/ocultar si es 0
        if (totalItems > 0) {
            contadorEl.style.display = 'flex'; // O 'block'
        } else {
            contadorEl.style.display = 'none';
        }

    } else {
        // Esto puede pasar si el header aún no se carga, 
        // pero main.js se asegura de llamarlo de nuevo después del fetch.
        // console.log("El contador del carrito aún no está en el DOM.");
    }
}