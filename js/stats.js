document.addEventListener('DOMContentLoaded', async () => {

    // 🔒 1. SEGURIDAD (Igual que en admin.js)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }

    const { data: cliente } = await supabase.from('clientes').select('es_admin').eq('id', user.id).single();
    if (!cliente || !cliente.es_admin) {
        alert("Acceso denegado.");
        window.location.href = 'index.html';
        return;
    }

    // 🚀 2. CARGAR ESTADÍSTICAS
    cargarMetricas();
    cargarStockBajo();
});

async function cargarMetricas() {
    // A. Total de Clientes
    const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

    document.getElementById('total-clientes').textContent = totalClientes || 0;

    // B. Total de Pedidos y Ventas
    // (Traemos solo la columna 'total' de la tabla 'pedidos')
    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('total');

    if (!error && pedidos) {
        // Cantidad de pedidos
        document.getElementById('total-pedidos').textContent = pedidos.length;

        // Suma total del dinero (reduce suma todos los totales)
        const sumaVentas = pedidos.reduce((acc, pedido) => acc + Number(pedido.total), 0);
        document.getElementById('total-ventas').textContent = `$${sumaVentas.toLocaleString('es-CL')}`;
    }
}

async function cargarStockBajo() {
    const tbody = document.getElementById('low-stock-body');
    tbody.innerHTML = '<tr><td colspan="4">Buscando productos...</td></tr>';

    // Buscamos productos con stock menor a 5
    const { data: productos, error } = await supabase
        .from('productos')
        .select('*')
        .lt('stock', 5) // lt = less than (menor que)
        .order('stock', { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    tbody.innerHTML = '';

    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">¡Todo bien! No hay productos con stock crítico.</td></tr>';
        return;
    }

    productos.forEach(p => {
        const row = `
            <tr>
                <td>${p.nombre}</td>
                <td>$${p.precio.toLocaleString('es-CL')}</td>
                <td style="font-weight:bold; color: #e74c3c; font-size: 1.2rem;">${p.stock}</td>
                <td><a href="admin.html" style="color: blue; text-decoration: underline;">Reponer</a></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}