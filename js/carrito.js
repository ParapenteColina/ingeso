// Archivo: js/carrito.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar los productos visualmente
    cargarCarrito();

    // 2. Inicializar el botón de pago
    inicializarBotonCompra();
});

function cargarCarrito() {
    const carritoContainer = document.getElementById('carrito-container');
    const subtotalPrecioEl = document.getElementById('subtotal-precio');
    const totalPrecioEl = document.getElementById('total-precio');
    
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    carritoContainer.innerHTML = ''; 

    if (carrito.length === 0) {
        carritoContainer.innerHTML = "<p class='carrito-vacio'>Tu carrito está vacío.</p>";
        if(subtotalPrecioEl) subtotalPrecioEl.textContent = "$0";
        if(totalPrecioEl) totalPrecioEl.textContent = "$0";
        return;
    }

    let subtotalGeneral = 0;

    carrito.forEach(producto => {
        // Calculamos subtotal con el precio (que ya puede venir con oferta)
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

// --- EVENTOS DE ELIMINAR Y CANTIDAD (Tu lógica original) ---

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
                alert(`Stock máximo alcanzado: ${stock}`);
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
    if (typeof actualizarContadorCarrito === 'function') {
        actualizarContadorCarrito();
    }
}

function actualizarCantidadEnCarrito(idProducto, cantidad, stock) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const productoEnCarrito = carrito.find(item => item.id == idProducto);

    if (productoEnCarrito) {
        productoEnCarrito.cantidad = cantidad;
        productoEnCarrito.stock = stock;
        localStorage.setItem('carrito', JSON.stringify(carrito));
        cargarCarrito();
        if (typeof actualizarContadorCarrito === 'function') {
            actualizarContadorCarrito();
        }
    }
}

// =========================================================
// 💰 LÓGICA DE CHECKOUT (NUEVO)
// =========================================================

function inicializarBotonCompra() {
    const btnComprarMiembro = document.querySelector('.btn-pagar-miembro');
    const btnComprarInvitado = document.querySelector('.btn-pagar-invitado');

    // Opción 1: Comprar como Miembro (Requiere Login)
    if (btnComprarMiembro) {
        btnComprarMiembro.addEventListener('click', async () => {
            await procesarCompra(true);
        });
    }

    // Opción 2: Comprar como Invitado (Por ahora solo redirige al login o alerta)
    if (btnComprarInvitado) {
        btnComprarInvitado.addEventListener('click', () => {
            alert("Para esta demostración, por favor compra como miembro.");
            window.location.href = 'login.html';
        });
    }
}

async function procesarCompra(requiereLogin) {
    // 1. Verificar Carrito
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    if (carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    // 2. Verificar Usuario Logueado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (requiereLogin && !user) {
        alert("Debes iniciar sesión para continuar.");
        window.location.href = 'login.html';
        return;
    }

    // 3. Pedir Dirección (Simple)
    const direccion = prompt("Por favor, ingresa tu dirección de envío:", "Calle Falsa 123, Santiago");
    if (!direccion) return; // Si cancela, salimos

    // --- INICIO PROCESO DE PAGO ---
    try {
        const btn = document.querySelector('.btn-pagar-miembro');
        if(btn) {
            btn.textContent = "Procesando...";
            btn.disabled = true;
        }

        // A. Calcular Total
        const totalCompra = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

        // B. Crear la Orden en tabla 'pedidos'
        const { data: ordenData, error: ordenError } = await supabase
            .from('pedidos')
            .insert({
                cliente_id: user.id, // ID del usuario logueado
                fecha_pedido: new Date().toISOString(), // Fecha actual
                estado: 'Completado', // Estado inicial
                total: totalCompra,
                direccion_envio: direccion
            })
            .select()
            .single();

        if (ordenError) throw ordenError;
        const pedidoId = ordenData.id;

        // C. Guardar Detalles en 'pedido_items'
        // Preparamos un array con todos los items para insertarlos de una vez
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

        // D. Descontar Stock (Uno por uno)
        // Nota: Para producción esto se hace mejor con una función RPC de SQL,
        // pero para este proyecto lo haremos con un bucle simple.
        for (const item of carrito) {
            const nuevoStock = item.stock - item.cantidad;
            // Solo actualizamos si el stock no baja de 0
            if (nuevoStock >= 0) {
                await supabase
                    .from('productos')
                    .update({ stock: nuevoStock })
                    .eq('id', item.id);
            }
        }

        // 4. FINALIZAR
        alert("¡Compra realizada con éxito! Gracias por tu preferencia.");
        
        // Vaciar carrito
        localStorage.removeItem('carrito');
        
        // Actualizar contador visual
        if (typeof actualizarContadorCarrito === 'function') {
            actualizarContadorCarrito();
        }

        // Redirigir a la página de órdenes
        window.location.href = 'orders.html';

    } catch (error) {
        console.error("Error en la compra:", error);
        alert("Hubo un error al procesar tu pedido. Inténtalo de nuevo.");
        const btn = document.querySelector('.btn-pagar-miembro');
        if(btn) {
            btn.textContent = "Comprar como miembro";
            btn.disabled = false;
        }
    }
}