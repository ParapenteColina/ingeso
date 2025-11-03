// Espera a que todo el HTML (el DOM) esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- PASO 1: EL MOCK (temporalmente copiado aquí) ---
    // A futuro, podemos mover esto a un archivo "shared-data.js"
    const mockProductos = [
        {
            id: 1,
            nombre: "Iron Man Mark 50",
            precio: 89990,
            imagen: "images/ironman_cuadrado.jpg",
            alt: "Figura de Iron Man",
            descripcion: "Impresionante figura de Iron Man Mark 50 de la película Avengers: Infinity War. Incluye múltiples accesorios y puntos de articulación."
        },
        {
            id: 2,
            nombre: "Spider-Man (Advanced Suit)",
            precio: 79990,
            imagen: "images/Spider_Man.jpg",
            alt: "Figura de Spider-Man",
            descripcion: "Figura detallada de Spider-Man con el traje avanzado del aclamado videojuego. Perfecta para fans de Marvel."
        },
        {
            id: 3,
            nombre: "Batman (The Dark Knight)",
            precio: 95990,
            imagen: "https://via.placeholder.com/400x400.png?text=Batman",
            alt: "Figura de Batman",
            descripcion: "Figura de Batman basada en la trilogía 'The Dark Knight'. Incluye capa de tela y varios gadgets."
        },
        {
            id: 4,
            nombre: "Son Goku Super Saiyan",
            precio: 75000,
            imagen: "https://via.placeholder.com/400x400.png?text=Goku+SSJ",
            alt: "Figura de Goku",
            descripcion: "Clásica figura de Son Goku en modo Super Saiyan, listo para la batalla. Un esencial para cualquier coleccionista de Dragon Ball."
        },
        {
            id: 5,
            nombre: "Wonder Woman (1984)",
            precio: 84990,
            imagen: "https://via.placeholder.com/400x400.png?text=Wonder+Woman",
            alt: "Figura de Wonder Woman",
            descripcion: "Figura de Wonder Woman con su armadura dorada de la película WW84. Incluye alas desplegables."
        },
        {
            id: 6,
            nombre: "Darth Vader",
            precio: 99990,
            imagen: "https://via.placeholder.com/400x400.png?text=Darth+Vader",
            alt: "Figura de Darth Vader",
            descripcion: "El Lord Sith en su máximo esplendor. Esta figura de Darth Vader incluye efectos de sonido y luz en su sable."
        }
    ];

    // --- PASO 2: OBTENER EL ID DE LA URL ---
    
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

                <button class="add-to-cart-btn" data-id="${productoEncontrado.id}">
                    Añadir al Carrito
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