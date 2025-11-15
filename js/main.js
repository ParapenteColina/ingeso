// main.js (Versión final con Nombre de Usuario en Header)

document.addEventListener('DOMContentLoaded', () => {

    // Carga el Header
    fetch('components/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;

            // --- LÓGICA DE BÚSQUEDA ---
            const headerSearchInput = document.getElementById('header-search-input');
            const headerSearchButton = document.querySelector('.search-bar button');
            const suggestionsBox = document.getElementById('header-suggestions-box');
            
            let typingTimer; 
            const ejecutarBusqueda = (query) => {
                const searchTerm = query || headerSearchInput.value.trim();
                if (searchTerm) {
                    window.location.href = `catalogo.html?q=${searchTerm}`;
                }
            };
            const buscarSugerencias = async () => {
                const searchTerm = headerSearchInput.value.trim();
                if (searchTerm.length < 2) {
                    suggestionsBox.innerHTML = '';
                    suggestionsBox.style.display = 'none';
                    return;
                }
                const { data: sugerencias, error } = await supabase
                    .from('productos')
                    .select('id, nombre, imagen') 
                    .ilike('nombre', `%${searchTerm}%`)
                    .limit(5);
                if (error || !sugerencias.length) {
                    suggestionsBox.innerHTML = '';
                    suggestionsBox.style.display = 'none';
                    return;
                }
                suggestionsBox.innerHTML = '';
                sugerencias.forEach(item => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'suggestion-item';
                    suggestionItem.innerHTML = `
                        <img src="${item.imagen}" alt="${item.nombre}">
                        <span>${item.nombre}</span>
                    `;
                    suggestionItem.addEventListener('click', () => {
                        window.location.href = `producto.html?id=${item.id}`;
                    });
                    suggestionsBox.appendChild(suggestionItem);
                });
                suggestionsBox.style.display = 'block';
            };
            if(headerSearchButton) {
                headerSearchButton.addEventListener('click', () => ejecutarBusqueda());
            }
            if(headerSearchInput) {
                headerSearchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        clearTimeout(typingTimer); 
                        suggestionsBox.style.display = 'none';
                        ejecutarBusqueda();
                    }
                });
                headerSearchInput.addEventListener('input', () => {
                    clearTimeout(typingTimer); 
                    typingTimer = setTimeout(buscarSugerencias, 300);
                });
            }
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-bar') && suggestionsBox) {
                    suggestionsBox.style.display = 'none';
                }
            });
            // --- FIN LÓGICA DE BÚSQUEDA ---
            

            // ===============================================
            // INICIO: LÓGICA DE MENÚ DE USUARIO
            // ===============================================
            
            const userMenuToggle = document.getElementById('user-menu-toggle');
            const userDropdown = document.getElementById('user-dropdown');
            const dropdownLogout = document.getElementById('dropdown-logout');

            if (userMenuToggle) {
                userMenuToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userDropdown.classList.toggle('show');
                });
            }

            document.addEventListener('click', (e) => {
                if (userDropdown && userMenuToggle && 
                    !userMenuToggle.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('show');
                }
            });

            if(dropdownLogout) {
                dropdownLogout.addEventListener('click', async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) {
                        console.error('Error al cerrar sesión:', error.message);
                    } else {
                        window.location.href = 'index.html';
                    }
                });
            }

            // Llamada Inicial para configurar el menú
            updateAuthUI(); 

            // ===============================================
            // FIN: LÓGICA DE MENÚ DE USUARIO
            // ===============================================


            // --- Llamada a tu función de carrito ---
            actualizarContadorCarrito();

        })
        .catch(error => console.error('Error al cargar el header:', error));

    // Carga el Footer (código sin cambios)
    fetch('components/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error al cargar el footer:', error));
    
    // --- Listener de Supabase ---
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Cambio en estado de autenticación:', event);
        updateAuthUI(); 
        actualizarContadorCarrito();
    });
});


// ==================================================================
// FUNCIONES GLOBALES (Fuera de DOMContentLoaded)
// ==================================================================

// ===============================================
// INICIO: FUNCIONES DE AUTENTICACIÓN (MODIFICADAS)
// ===============================================

/**
 * Actualiza la UI del header (nombre, enlaces y botones)
 * según si el usuario está logueado o no.
 */
async function updateAuthUI() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // --- NUEVO: Elemento para el nombre ---
    const userNameDisplay = document.getElementById('user-name-display'); 
    
    // --- NUEVO: Trae el perfil (nombre + admin) ---
    const { es_admin, nombre } = await getClienteProfile(user); 

    const dropdownProfile = document.getElementById('dropdown-profile');
    const dropdownOrders = document.getElementById('dropdown-orders');
    const dropdownAdmin = document.getElementById('dropdown-admin');
    const dropdownStats = document.getElementById('dropdown-stats');
    const dropdownLogout = document.getElementById('dropdown-logout');

    // Si los elementos no existen (header no ha cargado), no hagas nada
    if (!dropdownProfile || !userNameDisplay) {
        return; 
    }

    if (user) {
        // --- CASO 1: USUARIO ESTÁ LOGUEADO ---
        
        // --- NUEVO: Muestra el nombre ---
        if (nombre) {
            // Muestra solo el primer nombre
            userNameDisplay.textContent = `Hola, ${nombre.split(' ')[0]}`;
            userNameDisplay.classList.add('show');
        } else {
            // Fallback si el perfil no tiene nombre
            userNameDisplay.textContent = `Hola`;
            userNameDisplay.classList.add('show');
        }
        
        // Actualiza enlaces
        dropdownProfile.href = 'profile.html';
        dropdownOrders.href = 'orders.html';
        dropdownLogout.classList.remove('hidden');

        // Muestra/oculta enlaces de admin
        if (es_admin) {
            dropdownAdmin.classList.remove('hidden');
            dropdownStats.classList.remove('hidden'); 
        } else {
            dropdownAdmin.classList.add('hidden');
            dropdownStats.classList.add('hidden');
        }

    } else {
        // --- CASO 2: USUARIO NO ESTÁ LOGUEADO ---
        
        // --- NUEVO: Oculta el nombre ---
        userNameDisplay.textContent = '';
        userNameDisplay.classList.remove('show');
        
        // Actualiza enlaces
        dropdownProfile.href = 'login.html';
        dropdownOrders.href = 'login.html';
        
        // Oculta enlaces
        dropdownAdmin.classList.add('hidden');
        dropdownStats.classList.add('hidden'); 
        dropdownLogout.classList.add('hidden');
    }
}

/**
 * Función MÁS EFICIENTE: Trae el perfil completo (admin y nombre)
 * en una sola consulta.
 * @param {object} user - El objeto 'user' de Supabase
 * @returns {object} - { es_admin: boolean, nombre: string | null }
 */
async function getClienteProfile(user) {
    if (!user) return { es_admin: false, nombre: null }; // Default
    
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('es_admin, nombre_completo') // Trae ambos campos
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; 
        
        if (data) {
            return { es_admin: data.es_admin, nombre: data.nombre_completo };
        } else {
            // El usuario está en auth, pero no en 'clientes'
            return { es_admin: false, nombre: null };
        }
    } catch (error) {
        console.error('Error al obtener perfil del cliente:', error.message);
        return { es_admin: false, nombre: null };
    }
}

// ===============================================
// FIN: FUNCIONES DE AUTENTICACIÓN
// ===============================================


// --- FUNCIONES DEL CARRITO (Tu código original) ---
let notificationTimer; 

function agregarAlCarrito(producto) {
    console.log("Añadiendo al carrito:", producto.nombre, "Stock:", producto.stock);
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const productoEnCarrito = carrito.find(item => item.id === producto.id);
    const stockDisponible = producto.stock;

    if (productoEnCarrito) {
        if (productoEnCarrito.cantidad < stockDisponible) {
            productoEnCarrito.cantidad++;
            productoEnCarrito.stock = stockDisponible; 
            localStorage.setItem('carrito', JSON.stringify(carrito));
            mostrarNotificacion("¡Producto añadido!", "success");
            actualizarContadorCarrito();
        } else {
            mostrarNotificacion("No puedes agregar más, stock máximo alcanzado.", "error");
        }
    } else {
        if (stockDisponible > 0) {
            carrito.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                imagen: producto.imagen,
                cantidad: 1,
                stock: stockDisponible 
            });
            localStorage.setItem('carrito', JSON.stringify(carrito));
            mostrarNotificacion("¡Producto añadido!", "success");
            actualizarContadorCarrito();
        } else {
            mostrarNotificacion("Este producto está agotado.", "error");
        }
    }
}

function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const contadorEl = document.getElementById('cart-counter'); 

    if (contadorEl) {
        const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
        contadorEl.textContent = totalItems;
        if (totalItems > 0) {
            contadorEl.style.display = 'flex';
        } else {
            contadorEl.style.display = 'none';
        }
    }
}

function mostrarNotificacion(mensaje, tipo = "success") {
    const notification = document.getElementById('cart-notification');
    const iconEl = document.getElementById('notification-icon');
    const messageEl = document.getElementById('notification-message');

    if (notification && iconEl && messageEl) {
        clearTimeout(notificationTimer);
        
        messageEl.textContent = mensaje;
        if (tipo === "success") {
            iconEl.innerHTML = '<i class="fa-solid fa-check"></i>';
            notification.classList.remove('error');
            notification.classList.add('success');
        } else {
            iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            notification.classList.remove('success');
            notification.classList.add('error');
        }
        
        notification.classList.add('show');

        notificationTimer = setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}