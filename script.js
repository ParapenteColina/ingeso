// Espera a que todo el HTML (el DOM) esté cargado
document.addEventListener('DOMContentLoaded', () => {

    
    // --- PASO 1: SELECCIONAR EL CONTENEDOR ---
    // Buscamos el div que dejamos vacío en el HTML 
    const productGrid = document.querySelector('.product-grid-inventory');

    // --- PASO 2: CARGAR LOS PRODUCTOS DINÁMICAMENTE ---
    function cargarProductos(productos) {
        // Limpiamos el contenedor por si acaso
        productGrid.innerHTML = ''; 

        // Recorremos la lista de productos (el mock)
        productos.forEach(producto => {
            // Creamos el HTML para CADA producto
            const cardHTML = `
                <div class="product-card">
            
                    <a href="producto.html?id=${producto.id}">
                        <img src="${producto.imagen}" alt="${producto.alt}">
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
      
            // Añadimos el HTML de la nueva tarjeta dentro del contenedor
            productGrid.innerHTML += cardHTML;
        });
    }

    // --- INICIAMOS LA CARGA DE PRODUCTOS ---
    cargarProductos(mockProductos);
});