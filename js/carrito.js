// Archivo: js/carrito.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Cargando carrito.js...");
    cargarCarrito();
    inicializarBotonCompra();
});

function cargarCarrito() {
    const carritoContainer = document.getElementById('carrito-container');
    const subtotalPrecioEl = document.getElementById('subtotal-precio');
    const totalPrecioEl = document.getElementById('total-precio');
    
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    // Limpiar contenedor
    if (carritoContainer) carritoContainer.innerHTML = ''; 

    // Validar elementos del DOM
    if (!carritoContainer) return;

    if (carrito.length === 0) {
        carritoContainer.innerHTML = "<p class='carrito-vacio'>Tu carrito está vacío.</p>";
        if(subtotalPrecioEl) subtotalPrecioEl.textContent = "$0";
        if(totalPrecioEl) totalPrecioEl.textContent = "$0";
        return;
    }

    let subtotalGeneral = 0;

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

    if(subtotalPrecioEl) subtotalPrecioEl.textContent = `$${subtotalGeneral.toLocaleString('es-CL')}`;
    if(totalPrecioEl) totalPrecioEl.textContent = `$${subtotalGeneral.toLocaleString('es-CL')}`;

    agregarEventosEliminar();
    agregarEventosCantidad();
}

function agregarEventosEliminar() {
    const botonesEliminar = document.querySelectorAll('.btn-eliminar');
    botonesEliminar.forEach(boton => {
        boton.addEventListener('click', (e) => {
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

            if (nuevaCantidad > stock) {
                nuevaCantidad = stock;
                e.currentTarget.value = stock;
                if(typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion(`Stock máximo alcanzado: ${stock}`, 'error');
                } else {
                    alert(`Stock máximo: ${stock}`);
                }
            }

            if (nuevaCantidad >= 1) {
                actualizarCantidadEnCarrito(id, nuevaCantidad, stock);
            }
        });
    });
}

function eliminarDelCarrito(idProducto) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito = carrito.filter(producto => producto.id != idProducto);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    cargarCarrito(); 
    if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
}

function actualizarCantidadEnCarrito(idProducto, cantidad, stock) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const productoEnCarrito = carrito.find(item => item.id == idProducto);
    if (productoEnCarrito) {
        productoEnCarrito.cantidad = cantidad;
        productoEnCarrito.stock = stock;
        localStorage.setItem('carrito', JSON.stringify(carrito));
        cargarCarrito();
        if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
    }
}

// =========================================================
// 💰 LÓGICA DE CHECKOUT (CORREGIDA Y UNIFICADA)
// =========================================================

function inicializarBotonCompra() {
    // Buscamos el botón por ID, es más seguro
    const btnComprar = document.getElementById('btn-comprar-final');
    
    if (btnComprar) {
        console.log("Botón de compra encontrado y activado.");
        
        btnComprar.addEventListener('click', async () => {
            console.log("Click en comprar realizado.");
            await procesarCompraUnica();
        });
    } else {
        console.error("ERROR: No se encontró el botón con id 'btn-comprar-final'");
    }
}

async function procesarCompraUnica() {
    const btn = document.getElementById('btn-comprar-final');
    
    // 1. Validar Carrito Vacío
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length === 0) {
        mostrarNotificacion("Tu carrito está vacío.", "error");
        return;
    }

    // 2. Validar Usuario Logueado (Supabase)
    // Si no está logueado, lo mandamos al login
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        mostrarNotificacion("Debes iniciar sesión para completar la compra.", "error");
        // Esperamos 2 segundos y redirigimos al login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // 3. Pedir Dirección
    const direccion = prompt("Por favor, ingresa tu dirección de envío:", "Calle Falsa 123, Santiago");
    if (!direccion) return; // Usuario canceló el prompt

    // --- INICIO PROCESO DE PAGO ---
    try {
        // Deshabilitar botón para evitar doble compra
        if(btn) {
            btn.textContent = "Procesando...";
            btn.disabled = true;
        }

        const totalCompra = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

        // A. Insertar en tabla 'pedidos'
        const { data: ordenData, error: ordenError } = await supabase
            .from('pedidos')
            .insert({
                cliente_id: user.id,
                fecha_pedido: new Date().toISOString(),
                estado: 'Completado',
                total: totalCompra,
                direccion_envio: direccion
            })
            .select()
            .single();

        if (ordenError) throw ordenError;
        const pedidoId = ordenData.id;

        // B. Insertar detalles en 'pedido_items'
        const itemsParaInsertar = carrito.map(item => ({
            pedido_id: pedidoId,
            producto_id: item.id,
            cantidad: item.cantidad,
            precio_al_comprar: item.precio
        }));

        const { error: itemsError } = await supabase
            .from('pedido_items')
            .insert(itemsParaInsertar);

        if (itemsError) throw itemsError;

        // C. Descontar Stock en 'productos'
        for (const item of carrito) {
            const nuevoStock = item.stock - item.cantidad;
            if (nuevoStock >= 0) {
                await supabase
                    .from('productos')
                    .update({ stock: nuevoStock })
                    .eq('id', item.id);
            }
        }

        // D. Finalización Exitosa
        if(typeof mostrarNotificacion === 'function') {
            mostrarNotificacion(`¡Compra exitosa! Pedido #${pedidoId} creado.`, "success");
        } else {
            alert("Compra exitosa");
        }
        
        localStorage.removeItem('carrito');
        if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();

        // Redirigir a órdenes
        setTimeout(() => {
            window.location.href = 'orders.html';
        }, 2000);

    } catch (error) {
        console.error("Error CRÍTICO en la compra:", error);
        if(typeof mostrarNotificacion === 'function') {
            mostrarNotificacion("Hubo un error al procesar el pedido.", "error");
        } else {
            alert("Error al procesar el pedido.");
        }
        
        // Reactivar botón si falló
        if(btn) {
            btn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Comprar Ahora';
            btn.disabled = false;
        }
    }
}