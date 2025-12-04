document.addEventListener('DOMContentLoaded', async () => {

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }

    const { data: cliente } = await supabase.from('clientes').select('es_admin').eq('id', user.id).single();
    if (!cliente || !cliente.es_admin) {
        alert("Acceso denegado.");
        window.location.href = 'index.html';
        return;
    }

    cargarMetricas();
    cargarStockBajo();
});

async function cargarMetricas() {
    const { count: totalClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

    document.getElementById('total-clientes').textContent = totalClientes || 0;

    const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('total');

    if (!error && pedidos) {
        document.getElementById('total-pedidos').textContent = pedidos.length;

        const sumaVentas = pedidos.reduce((acc, pedido) => acc + Number(pedido.total), 0);
        document.getElementById('total-ventas').textContent = `$${Math.round(sumaVentas).toLocaleString('es-CL')}`;
    }
}

async function cargarStockBajo() {
    const tbody = document.getElementById('low-stock-body');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Buscando productos...</td></tr>';

    
    const { data: productos, error } = await supabase
        .from('productos')
        .select('*')
        .lt('stock', 5) 
        .order('stock', { ascending: true });

    if (error) {
        console.error("Error al cargar stock:", error);
        tbody.innerHTML = '<tr><td colspan="4" style="color:red; text-align:center;">Error al cargar datos.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    if (!productos || productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: green;">¡Excelente! No hay alertas de stock bajo.</td></tr>';
        return;
    }

    productos.forEach(p => {
        
        const inputId = `stock-input-${p.id}`;

        const row = `
            <tr>
                <td style="font-weight:500;">
                    <img src="${p.imagen}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; vertical-align:middle; margin-right:10px;">
                    ${p.nombre}
                </td>
                <td>$${Math.round(p.precio).toLocaleString('es-CL')}</td>
                
                <td style="color: #e74c3c; font-weight: bold; font-size: 1.1em; text-align:center;">
                    ${p.stock}
                </td>

                <td>
                    <div style="display:flex; align-items:center;">
                        <input type="number" id="${inputId}" class="stock-input" value="${p.stock}" min="0">
                        <button onclick="actualizarStockRapido('${p.id}', '${inputId}')" class="btn-save-stock" title="Guardar nuevo stock">
                            <i class="fa-solid fa-floppy-disk"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}


async function actualizarStockRapido(productoId, inputId) {
    const inputEl = document.getElementById(inputId);
    const nuevoStock = parseInt(inputEl.value);

    
    if (isNaN(nuevoStock) || nuevoStock < 0) {
        alert("Por favor ingresa un número de stock válido.");
        return;
    }

    
    const btn = inputEl.nextElementSibling; 
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; 
    btn.disabled = true;

    try {
        
        const { error } = await supabase
            .from('productos')
            .update({ stock: nuevoStock })
            .eq('id', productoId);

        if (error) throw error;

        
        setTimeout(() => {
            alert(`Stock actualizado a: ${nuevoStock}`);
            cargarStockBajo(); 
            cargarMetricas();  
        }, 500);

    } catch (error) {
        console.error("Error al actualizar:", error);
        alert("Error al actualizar el stock. Revisa la consola.");
        btn.innerHTML = originalIcon;
        btn.disabled = false;
    }
}