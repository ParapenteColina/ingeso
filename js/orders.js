// Archivo: js/orders.js

document.addEventListener('DOMContentLoaded', async () => {
    await cargarOrdenes();
});

async function cargarOrdenes() {
    const ordersListBody = document.getElementById('orders-list-body');
    
    // 1. Verificar usuario
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        ordersListBody.innerHTML = `
            <tr><td colspan="5" style="text-align:center;">Debes iniciar sesión para ver tus órdenes.</td></tr>`;
        return;
    }

    // 2. Obtener Pedidos de Supabase
    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('cliente_id', user.id)
        .order('fecha_pedido', { ascending: false }); // Más recientes primero

    if (error) {
        console.error('Error al cargar pedidos:', error);
        ordersListBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error al cargar las órdenes.</td></tr>`;
        return;
    }

    if (!pedidos || pedidos.length === 0) {
        ordersListBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No tienes órdenes registradas aún.</td></tr>`;
        return;
    }

    // 3. Renderizar Tabla
    ordersListBody.innerHTML = '';
    
    pedidos.forEach(pedido => {
        // Formatear fecha
        const fecha = new Date(pedido.fecha_pedido).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Determinar clase de estado
        let estadoClass = 'status-pending'; // por defecto
        if (pedido.estado === 'Completado') estadoClass = 'status-completed';

        const fila = `
            <tr>
                <td>#${pedido.id}</td>
                <td>${fecha}</td>
                <td>$${pedido.total.toLocaleString('es-CL')}</td>
                <td><span class="status-badge ${estadoClass}">${pedido.estado}</span></td>
                <td>
                     <button onclick="alert('Detalles del pedido #${pedido.id}')" style="cursor:pointer; background:none; border:none; color:#007bff;">
                        <i class="fa-regular fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `;
        ordersListBody.innerHTML += fila;
    });
}