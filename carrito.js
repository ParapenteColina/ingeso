// Archivo: carrito.js

document.addEventListener('DOMContentLoaded', () => {
    // Carga los productos en cuanto la página esté lista
    cargarCarrito();
});

function cargarCarrito() {
    const carritoContainer = document.getElementById('carrito-container');
    const subtotalPrecioEl = document.getElementById('subtotal-precio');
    const totalPrecioEl = document.getElementById('total-precio');
    
    // 1. Obtener el carrito de localStorage
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    // Limpiar el contenedor antes de dibujar
    carritoContainer.innerHTML = ''; 

    if (carrito.length === 0) {
        carritoContainer.innerHTML = "<p class='carrito-vacio'>Tu carrito está vacío.</p>";
        subtotalPrecioEl.textContent = "$0";
        totalPrecioEl.textContent = "$0";
        return;
    }

    let subtotalGeneral = 0;

    // 2. Dibujar cada producto en el carrito
    carrito.forEach(producto => {
        const subtotalProducto = producto.precio * producto.cantidad;
        subtotalGeneral += subtotalProducto;

        // --- CAMBIO AQUÍ ---
        // Añadimos 'max="${producto.stock}"' al input de cantidad.
        // También guardamos el stock en un 'data-stock' para referencia.
        const productoHTML = `
            <div class="carrito-item" data-product-id="${producto.id}">
                <div class="item-info">
                    <img src="${producto.imagen}" alt="${producto.nombre}">
                    <div class="item-details">
                        <h4>${producto.nombre}</h4>
                        <p>Precio: $${producto.precio.toLocaleString('es-CL')}</p>
                        <button class="btn-eliminar" data-id="${producto.id}">
                            <i class="fa-solid fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
                
                <div class="item-cantidad">
                    <input type="number" class="input-cantidad" 
                           value="${producto.cantidad}" 
                           min="1" 
                           max="${producto.stock}" 
                           data-id="${producto.id}" 
                           data-stock="${producto.stock}">
                </div>
                
                <div class="item-subtotal">
                    $${subtotalProducto.toLocaleString('es-CL')}
                </div>
            </div>
        `;
        carritoContainer.innerHTML += productoHTML;
    });

    subtotalPrecioEl.textContent = `$${subtotalGeneral.toLocaleString('es-CL')}`;
    totalPrecioEl.textContent = `$${subtotalGeneral.toLocaleString('es-CL')}`;

    agregarEventosEliminar();
    agregarEventosCantidad();
}



function agregarEventosEliminar() {
    const botonesEliminar = document.querySelectorAll('.btn-eliminar');
    botonesEliminar.forEach(boton => {
        boton.addEventListener('click', (e) => {
            // Obtener el ID del producto (buscando el data-id)
            const id = e.currentTarget.getAttribute('data-id');
            eliminarDelCarrito(id);
        });
    });
}

function agregarEventosCantidad() {
    const inputsCantidad = document.querySelectorAll('.input-cantidad');
    inputsCantidad.forEach(input => {
        input.addEventListener('input', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const stock = parseInt(e.currentTarget.getAttribute('data-stock'));
            let nuevaCantidad = parseInt(e.currentTarget.value);

            // --- VALIDACIÓN DE STOCK EN EL CARRITO ---
            if (nuevaCantidad > stock) {
                nuevaCantidad = stock; // Resetea al máximo
                e.currentTarget.value = stock; // Corrige el valor en el input
                
                // Llama a la función global de main.js
                if (typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion("Stock máximo alcanzado: " + stock, "error");
                }
            }
            // --- FIN VALIDACIÓN ---

            if (nuevaCantidad >= 1) {
                actualizarCantidadEnCarrito(id, nuevaCantidad, stock);
            }
        });
    });
}

function eliminarDelCarrito(idProducto) {
    // ... (Esta función no cambia)
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito = carrito.filter(producto => producto.id != idProducto);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    cargarCarrito(); 
    if (typeof actualizarContadorCarrito === 'function') {
        actualizarContadorCarrito();
    }
}

function actualizarCantidadEnCarrito(idProducto, cantidad, stock) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const productoEnCarrito = carrito.find(item => item.id == idProducto);

    if (productoEnCarrito) {
        productoEnCarrito.cantidad = cantidad;
        productoEnCarrito.stock = stock; // Re-sincroniza el stock por si acaso
        localStorage.setItem('carrito', JSON.stringify(carrito));
        
        cargarCarrito(); // Recarga todo para recalcular subtotales
        if (typeof actualizarContadorCarrito === 'function') {
            actualizarContadorCarrito();
        }
    }
}