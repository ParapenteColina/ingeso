// Archivo: js/orders.js

document.addEventListener('DOMContentLoaded', async () => {
    await cargarOrdenes();
});

async function cargarOrdenes() {
    const ordersListBody = document.getElementById('orders-list-body');
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        ordersListBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Inicia sesión para ver tus órdenes.</td></tr>`;
        return;
    }

    // Traer pedidos
    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('cliente_id', user.id)
        .order('fecha_pedido', { ascending: false });

    if (error || !pedidos || pedidos.length === 0) {
        ordersListBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay órdenes registradas.</td></tr>`;
        return;
    }

    ordersListBody.innerHTML = '';
    
    pedidos.forEach(pedido => {
        const fecha = new Date(pedido.fecha_pedido).toLocaleDateString('es-CL');
        let estadoClass = pedido.estado === 'Completado' ? 'status-completed' : 'status-pending';

        const fila = `
            <tr>
                <td>#${pedido.id}</td>
                <td>${fecha}</td>
                <td>$${pedido.total.toLocaleString('es-CL')}</td>
                <td><span class="status-badge ${estadoClass}">${pedido.estado}</span></td>
                <td>
                    <button onclick="abrirModalDetalles(${pedido.id})" style="cursor:pointer; background:none; border:1px solid #007bff; color:#007bff; padding: 5px 10px; border-radius:4px;">
                        <i class="fa-regular fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `;
        ordersListBody.innerHTML += fila;
    });
}

// --- LÓGICA DEL MODAL DE DETALLES ---

// Esta función se llama desde el HTML generado arriba
window.abrirModalDetalles = async (pedidoId) => {
    const modal = document.getElementById('modal-order-details');
    const listContainer = document.getElementById('detail-items-list');
    const addressEl = document.getElementById('detail-address');
    const totalEl = document.getElementById('detail-total-price');
    const idEl = document.getElementById('detail-id');

    // 1. Mostrar modal cargando
    modal.classList.add('active');
    addressEl.textContent = "Cargando datos...";
    listContainer.innerHTML = "<p style='padding:10px; text-align:center'>Cargando productos...</p>";

    try {
        // 2. Obtener Info del Pedido (para la dirección)
        const { data: pedido } = await supabase
            .from('pedidos')
            .select('direccion_envio, total')
            .eq('id', pedidoId)
            .single();

        // 3. Obtener los Items + Info del Producto (nombre, imagen)
        // Nota: Esto requiere que tengas la relación (Foreign Key) bien hecha en Supabase.
        // Si falla, usaremos un método alternativo abajo.
        const { data: items, error } = await supabase
            .from('pedido_items')
            .select(`
                cantidad,
                precio_al_comprar,
                productos ( nombre, imagen )
            `)
            .eq('pedido_id', pedidoId);

        if(error) throw error;

        // 4. Llenar datos
        idEl.textContent = `#${pedidoId}`;
        addressEl.textContent = pedido.direccion_envio || "Dirección no registrada";
        totalEl.textContent = `$${pedido.total.toLocaleString('es-CL')}`;

        // 5. Llenar lista de productos
        listContainer.innerHTML = '';
        items.forEach(item => {
            // Accedemos a los datos del producto relacionado
            const nombreProd = item.productos ? item.productos.nombre : 'Producto eliminado';
            const imgProd = item.productos ? item.productos.imagen : 'img/default.png';

            listContainer.innerHTML += `
                <div class="detail-item">
                    <img src="${imgProd}" alt="img">
                    <div class="detail-info">
                        <div>${nombreProd}</div>
                        <div class="detail-qty">x${item.cantidad} un. ($${item.precio_al_comprar.toLocaleString('es-CL')})</div>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error(error);
        listContainer.innerHTML = "<p style='color:red'>Error al cargar detalles.</p>";
    }
};

window.cerrarModalDetalles = () => {
    document.getElementById('modal-order-details').classList.remove('active');
};