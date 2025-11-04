// Espera a que todo el HTML (el DOM) esté cargado
document.addEventListener('DOMContentLoaded', () => {


    // --- PASO 1: OBTENER EL ID DE LA URL ---
    
    // 1. Obtenemos los parámetros de la URL
    const params = new URLSearchParams(window.location.search);
    
    // 2. Sacamos el valor del parámetro "id"
    // Usamos parseInt para convertir el "id" de texto (string) a número
    const productoId = parseInt(params.get('id')); 

    // --- PASO 3: ENCONTRAR EL PRODUCTO ---
    
    // Usamos .find() para buscar en el mock el primer producto que coincida con el ID
    const productoEncontrado = mockProductos.find(producto => producto.id === productoId);

    // --- PASO 4: MOSTRAR EL PRODUCTO EN EL HTML ---
    
    // Seleccionamos el contenedor que dejamos vacío en el HTML
    const container = document.getElementById('producto-detalle-container');

    if (productoEncontrado) {
        // Si encontramos el producto, creamos su HTML
        
        // Cambiamos el título de la pestaña del navegador
        document.title = `${productoEncontrado.nombre} - FigurasPRO`; 
        
        const productoHTML = `
            <div class="product-detail-image">
                <img src="${productoEncontrado.imagen.replace('300x300', '400x400')}" alt="${productoEncontrado.alt}">
            </div>
            <div class="product-detail-info">
                <h1>${productoEncontrado.nombre}</h1>
                <p class="product-price-detail">$${productoEncontrado.precio.toLocaleString('es-CL')}</p>
                
                <p class="product-description">
                    ${productoEncontrado.descripcion}
                </p>

                <p class="product-stock">Stock: <span>0</span></p>

                <button class="add-to-cart-btn" data-id="${productoEncontrado.id}">
                    <i class="fa-solid fa-cart-shopping"></i> Añadir al Carrito
                </button>
            </div>
        `;
        
        // Insertamos el HTML en el contenedor
        container.innerHTML = productoHTML;

    } else {
        // Si no se encuentra el producto (ej. id=99)
        container.innerHTML = '<h1>Producto no encontrado</h1><p>El producto que buscas no existe o fue removido.</p>';
        document.title = "Producto no encontrado - FigurasPRO";
    }
});