// script.js (Versión simplificada sin filtro local)

document.addEventListener('DOMContentLoaded', () => {

    const productGrid = document.querySelector('.product-grid-inventory');

    // --- 1. LEER EL TÉRMINO DE BÚSQUEDA DE LA URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearchTerm = urlParams.get('q'); //

    async function cargarProductos(searchTerm) {
        
        productGrid.innerHTML = '<h2>Cargando productos...</h2>';
        
        let query = supabase
            .from('productos')
            .select('*')
            .eq('activo', true);

        // 2. Si hay un término de búsqueda, añadimos el filtro
        if (searchTerm) {
            // Preparamos el string para la búsqueda
            const searchString = `%${searchTerm}%`;
            
            // --- ¡AQUÍ ESTÁ EL ARREGLO DEL BUG! ---
            // Esta es la sintaxis correcta para .or() con 
            // valores que pueden tener espacios o paréntesis.
            // (nombre.ilike."%valor%" O descripcion.ilike."%valor%")
            query = query.or(`nombre.ilike."${searchString}",descripcion.ilike."${searchString}"`);
        }

        // 3. Ejecutamos la consulta final
        const { data: productos, error } = await query;

        if (error) {
            console.error('Error al cargar productos:', error);
            productGrid.innerHTML = '<p>Error al cargar productos. Intente más tarde.</p>';
            return;
        }
        
        // El resto de la función (pasos 4 y 5) es idéntica
        if (productos.length === 0) {
            if (searchTerm) {
                productGrid.innerHTML = `<h2>No se encontraron resultados para "${searchTerm}"</h2>`;
            } else {
                productGrid.innerHTML = `<h2>No hay productos para mostrar.</h2>`;
            }
            return;
        }

        productGrid.innerHTML = ''; 
        productos.forEach(producto => {
            const cardHTML = `
                <div class="product-card">
                    <a href="producto.html?id=${producto.id}">
                        <img src="${producto.imagen}" alt="${producto.nombre}">
                    </a>
                    <a href="producto.html?id=${producto.id}" class="product-title-link">
                        <h3>${producto.nombre}</h3>
                    </a>
                    <p class="product-price">$${producto.precio.toLocaleString('es-CL')}</p>
                    <button class="add-to-cart-btn" data-id="${producto.id}">
                        Añadir al Carrito
                    </button>
                </div>
            `;
            productGrid.innerHTML += cardHTML;
        });
    }

    // --- 3. CARGA INICIAL ---
    // Al cargar la página, usamos el término que vino de la URL
    cargarProductos(urlSearchTerm); //
});