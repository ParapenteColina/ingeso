document.addEventListener('DOMContentLoaded', () => {
    
    const productGrid = document.querySelector('.product-grid-inventory');

    // ¡Convertimos la función en "async" para poder "await"!
    async function cargarProductos() {
        
        // --- 1. LLAMADA A SUPABASE ---
        // 'supabase' es la variable global que creamos en supabase-client.js
        const { data: productos, error } = await supabase
            .from('productos') // El nombre de tu tabla
            .select('*')       // Selecciona todas las columnas
            .eq('activo', true); // Filtra solo los productos activos

        if (error) {
            console.error('Error al cargar productos:', error);
            productGrid.innerHTML = '<p>Error al cargar productos. Intente más tarde.</p>';
            return;
        }

        // --- 2. EL RESTO ES IGUAL ---
        productGrid.innerHTML = ''; 
        productos.forEach(producto => {
            // ¡OJO! Asegúrate que los nombres de tus columnas
            // (ej. producto.imagen_url) coincidan con el HTML
            const cardHTML = `
                <div class="product-card">
                    <a href="producto.html?id=${producto.id}">
                        <img src="${producto.imagen}" alt="${producto.nombre}"> 
                    </a>
                    <a href="producto.html?id=${producto.id}" class="product-title-link">
                        <h3>${producto.nombre}</h3>
                    </a>
                    <p class="product-price">$${producto.precio.toLocaleString('es-CL')}</p>
                    <button class...>...</button>
                </div>
            `;
            productGrid.innerHTML += cardHTML;
        });
    }

    // --- INICIAMOS LA CARGA DE PRODUCTOS ---
    cargarProductos(); // <--- Ya no necesita el mock
});