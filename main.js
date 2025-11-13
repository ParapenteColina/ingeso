// main.js (Versión con clic directo al producto)

document.addEventListener('DOMContentLoaded', () => {

    // Carga el Header
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;

            // --- LÓGICA DE BÚSQUEDA ---
            const headerSearchInput = document.getElementById('header-search-input');
            const headerSearchButton = document.querySelector('.search-bar button');
            const suggestionsBox = document.getElementById('header-suggestions-box');
            
            let typingTimer; 

            // Función que redirige al CATÁLOGO (para búsqueda general)
            const ejecutarBusqueda = (query) => {
                const searchTerm = query || headerSearchInput.value.trim();
                if (searchTerm) {
                    window.location.href = `inventario.html?q=${searchTerm}`;
                }
            };

            // Función que busca sugerencias
            const buscarSugerencias = async () => {
                const searchTerm = headerSearchInput.value.trim();

                if (searchTerm.length < 2) {
                    suggestionsBox.innerHTML = '';
                    suggestionsBox.style.display = 'none';
                    return;
                }

                const { data: sugerencias, error } = await supabase
                    .from('productos')
                    .select('id, nombre, imagen') 
                    .ilike('nombre', `%${searchTerm}%`)
                    .limit(5);

                if (error || !sugerencias.length) {
                    suggestionsBox.innerHTML = '';
                    suggestionsBox.style.display = 'none';
                    return;
                }

                suggestionsBox.innerHTML = '';
                sugerencias.forEach(item => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'suggestion-item';
                    suggestionItem.innerHTML = `
                        <img src="${item.imagen}" alt="${item.nombre}">
                        <span>${item.nombre}</span>
                    `;
                    
                    // --- ¡¡AQUÍ ESTÁ EL GRAN CAMBIO!! ---
                    // Al hacer clic, ya no busca, va directo al producto
                    suggestionItem.addEventListener('click', () => {
                        window.location.href = `producto.html?id=${item.id}`;
                    });
                    
                    suggestionsBox.appendChild(suggestionItem);
                });
                suggestionsBox.style.display = 'block';
            };

            // "Listeners" (sin cambios, excepto que 'ejecutarBusqueda' solo se usa al presionar Enter/Botón)
            headerSearchButton.addEventListener('click', () => ejecutarBusqueda());
            
            headerSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(typingTimer); 
                    suggestionsBox.style.display = 'none';
                    ejecutarBusqueda();
                }
            });

            headerSearchInput.addEventListener('input', () => {
                clearTimeout(typingTimer); 
                typingTimer = setTimeout(buscarSugerencias, 300);
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-bar')) {
                    suggestionsBox.style.display = 'none';
                }
            });
            // --- FIN LÓGICA DE BÚSQUEDA ---
            
            gestionarLinkAdmin();

            actualizarContadorCarrito();
        })
        .catch(error => console.error('Error al cargar el header:', error));

    // Carga el Footer (código sin cambios)
    fetch('footer.html')
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


let notificationTimer; // Variable global para el timer de la notificación

/**
 * Función para AÑADIR un producto al carrito (AHORA VALIDA EL STOCK)
 * @param {object} producto - El objeto del producto que viene de Supabase (debe incluir .stock)
 */
function agregarAlCarrito(producto) {
    console.log("Añadiendo al carrito:", producto.nombre, "Stock:", producto.stock);

    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const productoEnCarrito = carrito.find(item => item.id === producto.id);
    
    const stockDisponible = producto.stock;

    if (productoEnCarrito) {
        if (productoEnCarrito.cantidad < stockDisponible) {
            productoEnCarrito.cantidad++;
            productoEnCarrito.stock = stockDisponible; 
            
            localStorage.setItem('carrito', JSON.stringify(carrito));
            mostrarNotificacion("¡Producto añadido!", "success");
            actualizarContadorCarrito();
        
        } else {
            mostrarNotificacion("No puedes agregar más, stock máximo alcanzado.", "error");
        }
    } else {
        if (stockDisponible > 0) {
            carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen: producto.imagen,
                cantidad: 1,
                stock: stockDisponible 
            });
            localStorage.setItem('carrito', JSON.stringify(carrito));
            mostrarNotificacion("¡Producto añadido!", "success");
            actualizarContadorCarrito();
        } else {
            mostrarNotificacion("Este producto está agotado.", "error");
        }
    }
}


/**
 * 5. Función para ACTUALIZAR el número en el ícono del carrito
 */
function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const contadorEl = document.querySelector('.cart-counter'); 

    if (contadorEl) {
        const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
        contadorEl.textContent = totalItems;
        
        if (totalItems > 0) {
            contadorEl.style.display = 'flex';
        } else {
            contadorEl.style.display = 'none';
        }
    }
}
function mostrarNotificacion(mensaje, tipo = "success") {
    const notification = document.getElementById('cart-notification');
    const iconEl = document.getElementById('notification-icon');
    const messageEl = document.getElementById('notification-message');

    if (notification && iconEl && messageEl) {
        // Limpiar timer anterior si existe
        clearTimeout(notificationTimer);
        
        // Configurar mensaje e ícono
        messageEl.textContent = mensaje;
        if (tipo === "success") {
            iconEl.innerHTML = '<i class="fa-solid fa-check"></i>';
            notification.classList.remove('error');
            notification.classList.add('success');
        } else { // "error"
            iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            notification.classList.remove('success');
            notification.classList.add('error');
        }
        
        // Mostrar notificación
        notification.classList.add('show');

        // Ocultar automáticamente después de 3 segundos
        notificationTimer = setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}