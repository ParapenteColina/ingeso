// script.js (Versión corregida y limpia)

document.addEventListener('DOMContentLoaded', () => {

    const productGrid = document.querySelector('.product-grid-inventory');

    // --- 1. LEER PARÁMETROS DE LA URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearchTerm = urlParams.get('q');
    const filterByOffer = urlParams.get('ofertas') === 'true';

    // =====================================================================
    // FUNCIÓN PRINCIPAL PARA CARGAR PRODUCTOS
    // =====================================================================
    async function cargarProductos(searchTerm) {

        productGrid.innerHTML = '<h2>Cargando productos...</h2>';

        let query = supabase
            .from('productos')
            .select('*')
            .eq('activo', true);

        // --- FILTRO: SOLO OFERTAS ---
        if (filterByOffer) {
            query = query.gt('descuento', 0);

            const mainHeader = document.querySelector('h1');
            if (mainHeader) {
                mainHeader.textContent = 'Grandes Ofertas de Figuras';
            }
        }

        // --- FILTRO: BÚSQUEDA ---
        if (searchTerm) {
            const searchString = `%${searchTerm}%`;
            query = query.or(`nombre.ilike."${searchString}",descripcion.ilike."${searchString}"`);
        }

        // --- EJECUTAR CONSULTA ---
        const { data: productos, error } = await query;

        if (error) {
            productGrid.innerHTML = '<p>Error al cargar productos.</p>';
            console.error(error);
            return;
        }

        if (!productos || productos.length === 0) {
            productGrid.innerHTML =
                searchTerm ?
                `<h2>No se encontraron resultados para "${searchTerm}"</h2>` :
                `<h2>No hay productos disponibles.</h2>`;
            return;
        }

        // =====================================================================
        // RENDERIZAR PRODUCTOS
        // =====================================================================
        productGrid.innerHTML = '';

        productos.forEach(producto => {
            const precioOriginal = producto.precio;
            const descuento = producto.descuento || 0;
            const tieneDescuento = descuento > 0;

            const precioFinal = tieneDescuento
                ? precioOriginal * (1 - descuento / 100)
                : precioOriginal;

            const precioHTML = tieneDescuento
                ? `
                    <span class="old-price-catalog">
                        $${precioOriginal.toLocaleString('es-CL')}
                    </span>
                    <span class="product-price-catalog">
                        $${precioFinal.toLocaleString('es-CL')}
                    </span>
                `
                : `
                    <p class="product-price">
                        $${precioFinal.toLocaleString('es-CL')}
                    </p>
                `;

            const cardHTML = `
                <div class="product-card">
                    <a href="producto.html?id=${producto.id}">
                        <img src="${producto.imagen}" alt="${producto.nombre}">
                    </a>
                    <a href="producto.html?id=${producto.id}" class="product-title-link">
                        <h3>${producto.nombre}</h3>
                    </a>
                    ${precioHTML}
                    <button class="add-to-cart-btn" data-id="${producto.id}">
                        Añadir al Carrito
                    </button>
                </div>
            `;

            productGrid.innerHTML += cardHTML;
        });

        // =====================================================================
        // AÑADIR EVENTOS PARA BOTONES DE CARRITO
        // =====================================================================
        const botonesCarrito = document.querySelectorAll('.add-to-cart-btn');

        botonesCarrito.forEach(boton => {
            boton.addEventListener('click', () => {
                const id = boton.dataset.id;
                const productoSeleccionado = productos.find(p => p.id == id);

                if (!productoSeleccionado) return;

                // Calcular precio final con oferta
                const descuento = productoSeleccionado.descuento || 0;
                const precioFinal = productoSeleccionado.precio * (1 - descuento / 100);

                const productoFinal = {
                    ...productoSeleccionado,
                    precio: precioFinal
                };

                if (typeof agregarAlCarrito === 'function') {
                    agregarAlCarrito(productoFinal);
                } else {
                    console.error('La función agregarAlCarrito no está cargada.');
                }
            });
        });

    } // fin de cargarProductos()

    // =====================================================================
    // CARGA INICIAL
    // =====================================================================
    cargarProductos(urlSearchTerm);

});
