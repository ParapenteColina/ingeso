document.addEventListener('DOMContentLoaded', () => {

    const container = document.getElementById('producto-detalle-container');

    async function cargarProductoDetalle() {
        try {
            const params = new URLSearchParams(window.location.search);
            const productoId = params.get('id'); 

            if (!productoId) {
                throw new Error('No se especificó un ID de producto');
            }

            const { data: productoEncontrado, error } = await supabase
                .from('productos')
                .select('*')
                .eq('id', productoId)
                .single();

            if (error) {
                throw error;
            }

            if (productoEncontrado) {
                document.title = `${productoEncontrado.nombre} - FigurasPRO`; 
                
                const productoHTML = `
                    <div class="product-detail-image">
                        <img src="${productoEncontrado.imagen}" alt="${productoEncontrado.nombre}">
                    </div>
                    <div class="product-detail-info">
                        <h1>${productoEncontrado.nombre}</h1>
                        <p class="product-price-detail">$${productoEncontrado.precio.toLocaleString('es-CL')}</p>
                        
                        <p class="product-description">
                            ${productoEncontrado.descripcion}
                        </p>

                        <p class="product-stock">Stock: <span>${productoEncontrado.stock}</span></p>

                        <button class="add-to-cart-btn" data-id="${productoEncontrado.id}">
                            <i class="fa-solid fa-cart-shopping"></i> Añadir al Carrito
                        </button>
                    </div>
                `;
                
                container.innerHTML = productoHTML;

                // --- ¡AQUÍ ESTÁ LA PARTE QUE FALTABA! ---
                // 1. Encontrar el botón que ACABAMOS de crear
                const btnAgregar = container.querySelector('.add-to-cart-btn');

                // 2. Añadirle el "oyente" de clic
                btnAgregar.addEventListener('click', () => {
                    // 3. Llamar a la función GLOBAL (de main.js)
                    agregarAlCarrito(productoEncontrado);
                });
                // --- FIN DE LAS LÍNEAS AÑADIDAS ---

            } else {
                container.innerHTML = '<h1>Producto no encontrado</h1><p>El producto que buscas no existe.</p>';
            }
        
        } catch (error) {
            console.error('Error al cargar el producto:', error);
            container.innerHTML = '<h1>Error al cargar</h1><p>No se pudo encontrar el producto. Revisa la consola para más detalles.</p>';
        }
    }

    cargarProductoDetalle();
});