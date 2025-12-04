document.addEventListener('DOMContentLoaded', () => {
    cargarCarrito();
    inicializarEventosCompra();
});

function cargarCarrito() {
    const carritoContainer = document.getElementById('carrito-container');
    const subtotalPrecioEl = document.getElementById('subtotal-precio');
    const totalPrecioEl = document.getElementById('total-precio');
    
    
    const opcionesPrecio = { maximumFractionDigits: 0 }; 

    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    if (!carritoContainer) return;
    carritoContainer.innerHTML = ''; 

    if (carrito.length === 0) {
        carritoContainer.innerHTML = "<p class='carrito-vacio'>Tu carrito está vacío.</p>";
        if(subtotalPrecioEl) subtotalPrecioEl.textContent = "$0";
        if(totalPrecioEl) totalPrecioEl.textContent = "$0";
        const btn = document.getElementById('btn-comprar-final');
        if(btn) { btn.disabled = true; btn.style.opacity = "0.5"; }
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
                        <p>Precio: $${producto.precio.toLocaleString('es-CL', opcionesPrecio)}</p>
                        <button class="btn-eliminar" data-id="${producto.id}">
                            <i class="fa-solid fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
                <div class="item-cantidad">
                    <input type="number" class="input-cantidad" 
                           value="${producto.cantidad}" min="1" max="${producto.stock}" 
                           data-id="${producto.id}" data-stock="${producto.stock}">
                    <span class="stock-info">Disp: ${producto.stock}</span>
                </div>
                <div class="item-subtotal">
                    $${subtotalProducto.toLocaleString('es-CL', opcionesPrecio)}
                </div>
            </div>
        `;
        carritoContainer.innerHTML += productoHTML;
    });

    
    if(subtotalPrecioEl) subtotalPrecioEl.textContent = `$${subtotalGeneral.toLocaleString('es-CL', opcionesPrecio)}`;
    if(totalPrecioEl) totalPrecioEl.textContent = `$${subtotalGeneral.toLocaleString('es-CL', opcionesPrecio)}`;
    
    const btn = document.getElementById('btn-comprar-final');
    if(btn) { btn.disabled = false; btn.style.opacity = "1"; }

    agregarEventosEliminar();
    agregarEventosCantidad();
}

function agregarEventosEliminar() {
    document.querySelectorAll('.btn-eliminar').forEach(boton => {
        boton.addEventListener('click', (e) => {
            eliminarDelCarrito(e.currentTarget.getAttribute('data-id'));
        });
    });
}

function agregarEventosCantidad() {
    document.querySelectorAll('.input-cantidad').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const stockMax = parseInt(e.currentTarget.getAttribute('data-stock'));
            let val = parseInt(e.currentTarget.value);

            
            if (val > stockMax) {
                val = stockMax;
                e.currentTarget.value = stockMax;
                mostrarToast(`¡Ups! Solo quedan ${stockMax} unidades disponibles.`, 'error');
            }
            if (val < 1) val = 1;
            
            actualizarCantidadEnCarrito(id, val, stockMax);
        });
    });
}

function eliminarDelCarrito(id) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito = carrito.filter(p => p.id != id);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    cargarCarrito();
    if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();
}

function actualizarCantidadEnCarrito(id, cant, stock) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const p = carrito.find(i => i.id == id);
    if (p) {
        p.cantidad = cant;
        localStorage.setItem('carrito', JSON.stringify(carrito));
        cargarCarrito();
    }
}

function inicializarEventosCompra() {
    const btnComprar = document.getElementById('btn-comprar-final');
    const btnConfirmar = document.getElementById('btn-confirmar-compra');
    const btnCancelar = document.getElementById('btn-cancelar-dir');

    
    if (btnComprar) {
        btnComprar.addEventListener('click', async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                mostrarToast("Debes iniciar sesión para comprar.", "error");
                setTimeout(() => window.location.href = 'login.html', 1500);
                return;
            }
            
            document.getElementById('modal-direccion').classList.add('active');
        });
    }

    
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', () => {
            const direccion = document.getElementById('input-direccion-texto').value;
            if (!direccion.trim()) {
                mostrarToast("Por favor ingresa una dirección.", "error");
                return;
            }
            procesarTransaccionFinal(direccion);
        });
    }

    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            document.getElementById('modal-direccion').classList.remove('active');
        });
    }
}


async function procesarTransaccionFinal(direccion) {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const btnConfirmar = document.getElementById('btn-confirmar-compra');
    
    try {
        btnConfirmar.textContent = "Procesando...";
        btnConfirmar.disabled = true;
        
        const { data: { user } } = await supabase.auth.getUser();

        
        const total = carrito.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
        const { data: orden, error: errOrden } = await supabase
            .from('pedidos')
            .insert({
                cliente_id: user.id,
                fecha_pedido: new Date().toISOString(),
                estado: 'Completado',
                total: total,
                direccion_envio: direccion
            })
            .select().single();

        if (errOrden) throw errOrden;

        
        const itemsInsert = carrito.map(i => ({
            pedido_id: orden.id, producto_id: i.id,
            cantidad: i.cantidad, precio_al_comprar: i.precio
        }));
        const { error: errItems } = await supabase.from('pedido_items').insert(itemsInsert);
        if (errItems) throw errItems;

        
        for (const item of carrito) {
            
            const { data: productoReal } = await supabase
                .from('productos')
                .select('stock')
                .eq('id', item.id)
                .single();

            if (productoReal) {
                
                const nuevoStock = Math.max(0, productoReal.stock - item.cantidad);
                
                
                await supabase
                    .from('productos')
                    .update({ stock: nuevoStock })
                    .eq('id', item.id);
            }
        }
        

        
        document.getElementById('modal-direccion').classList.remove('active');
        mostrarModalExito(orden.id);

        localStorage.removeItem('carrito');
        if (typeof actualizarContadorCarrito === 'function') actualizarContadorCarrito();

    } catch (error) {
        console.error(error);
        mostrarToast("Error al procesar la compra.", "error");
        btnConfirmar.textContent = "Confirmar Compra";
        btnConfirmar.disabled = false;
    }
}

function mostrarModalExito(orderId) {
    const modal = document.getElementById('modal-exito');
    const orderText = document.getElementById('modal-order-id');
    const btnContinuar = document.getElementById('btn-modal-continuar');

    if(modal) {
        orderText.textContent = `Orden #${orderId}`;
        modal.classList.add('active');
        btnContinuar.onclick = () => window.location.href = 'orders.html';
    }
}


function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    const icon = tipo === 'error' ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-info-circle"></i>';
    
    toast.innerHTML = `${icon} <span>${mensaje}</span>`;
    container.appendChild(toast);

    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}