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
                    <input type="number" class="input-cantidad" value="${producto.cantidad}" min="1" data-id="${producto.id}">
                </div>
                
                <div class="item-subtotal">
                    $${subtotalProducto.toLocaleString('es-CL')}
                </div>
            </div>
        `;
        carritoContainer.innerHTML += productoHTML;
    });

    // 3. Mostrar el total
    subtotalPrecioEl.textContent = `$${subtotalGeneral.toLocaleString('es-CL')}`;
    totalPrecioEl.textContent = `$${subtotalGeneral.toLocaleString('es-CL')}`; // (Asumiendo envío gratis)

    // 4. Añadir lógica a los botones de "Eliminar" y a los inputs de "Cantidad"
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
        input.addEventListener('input', (e) => { // 'input' se dispara en cada cambio
            const id = e.currentTarget.getAttribute('data-id');
            const nuevaCantidad = parseInt(e.currentTarget.value);

            if (nuevaCantidad >= 1) {
                actualizarCantidadEnCarrito(id, nuevaCantidad);
            }
        });
    });
}

function eliminarDelCarrito(idProducto) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito = carrito.filter(producto => producto.id != idProducto);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    // Volver a cargar la vista del carrito y el contador del header
    cargarCarrito(); 
    actualizarContadorCarrito(); // (Esta función está en main.js)
}

function actualizarCantidadEnCarrito(idProducto, cantidad) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const productoEnCarrito = carrito.find(item => item.id == idProducto);

    if (productoEnCarrito) {
        productoEnCarrito.cantidad = cantidad;
        localStorage.setItem('carrito', JSON.stringify(carrito));
        
        // Volver a cargar la vista del carrito (para recalcular subtotales)
        cargarCarrito();
        actualizarContadorCarrito(); // (Esta función está en main.js)
    }
}