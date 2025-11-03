// --- Lógica para el Perfil de Administrador ---

// Cambia esta variable a 'true' para simular que ha iniciado sesión un admin
// Cámbiala a 'false' para simular un usuario normal.
const esUsuarioAdmin = true; 

// Buscamos en el HTML el contenedor donde irá el enlace de "Estadísticas"
const adminLinkContainer = document.getElementById('admin-link-container');

// Verificamos si el usuario es administrador
if (esUsuarioAdmin) {
    // Si es admin, creamos el enlace
    const adminLink = document.createElement('a');
    adminLink.href = 'admin.html'; // Enlace a la nueva página de admin// Aquí iría el enlace a la página de estadísticas
    adminLink.textContent = 'Estadísticas';
    
    // Lo añadimos al contenedor en el menú desplegable
    adminLinkContainer.appendChild(adminLink);
}


// Espera a que todo el HTML (el DOM) esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- PASO 1: TU "MOCK" (EL CATÁLOGO DE FOTOS) ---
    // Usamos los mismos datos que tenías en tu HTML
    const mockProductos = [
        {
            id: 1,
            nombre: "Iron Man Mark 50",
            precio: 89990,
            imagen: "images/ironman_cuadrado.jpg",
            alt: "Figura de Iron Man"
        },
        {
            id: 2,
            nombre: "Spider-Man (Advanced Suit)",
            precio: 79990,
            imagen: "images/Spider_Man.jpg",
            alt: "Figura de Spider-Man"
        },
        {
            id: 3,
            nombre: "Batman (The Dark Knight)",
            precio: 95990,
            imagen: "https://via.placeholder.com/300x300.png?text=Batman",
            alt: "Figura de Batman"
        },
        {
            id: 4,
            nombre: "Son Goku Super Saiyan",
            precio: 75000,
            imagen: "https://via.placeholder.com/300x300.png?text=Goku+SSJ",
            alt: "Figura de Goku"
        },
        {
            id: 5,
            nombre: "Wonder Woman (1984)",
            precio: 84990,
            imagen: "https://via.placeholder.com/300x300.png?text=Wonder+Woman",
            alt: "Figura de Wonder Woman"
        },
        {
            id: 6,
            nombre: "Darth Vader",
            precio: 99990,
            imagen: "https://via.placeholder.com/300x300.png?text=Darth+Vader",
            alt: "Figura de Darth Vader"
        }
    ];

    // --- PASO 2: SELECCIONAR EL CONTENEDOR ---
    // Buscamos el div que dejamos vacío en el HTML 
    const productGrid = document.querySelector('.product-grid-inventory');

    // --- PASO 3: CARGAR LOS PRODUCTOS DINÁMICAMENTE ---
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