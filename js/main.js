document.addEventListener('DOMContentLoaded', () => {
    cargarOfertas();

    
    fetch('components/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;

            
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

            
            updateAuthUI(); 

            
            actualizarContadorCarrito();

        })
        .catch(error => console.error('Error al cargar el header:', error));

    
    fetch('components/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error al cargar el footer:', error));
    
    
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Cambio en estado de autenticación:', event);
        updateAuthUI(); 
        actualizarContadorCarrito();
    });
});



async function updateAuthUI() {
    const { data: { user } } = await supabase.auth.getUser();
    
    
    const userNameDisplay = document.getElementById('user-name-display'); 
    const { es_admin, nombre } = await getClienteProfile(user); 

    const dropdownProfile = document.getElementById('dropdown-profile');
    const dropdownOrders = document.getElementById('dropdown-orders');
    const dropdownAdmin = document.getElementById('dropdown-admin');
    const dropdownStats = document.getElementById('dropdown-stats');
    const dropdownLogout = document.getElementById('dropdown-logout');

    
    if (!dropdownProfile || !userNameDisplay) {
        return; 
    }

    if (user) {
        
        if (nombre) {
            
            userNameDisplay.textContent = `Hola, ${nombre.split(' ')[0]}`;
            userNameDisplay.classList.add('show');
        } else {
            
            userNameDisplay.textContent = `Hola`;
            userNameDisplay.classList.add('show');
        }
        
        
        dropdownProfile.href = 'profile.html';
        dropdownOrders.href = 'orders.html';
        dropdownLogout.classList.remove('hidden');

        
        if (es_admin) {
            dropdownAdmin.classList.remove('hidden');
            dropdownStats.classList.remove('hidden'); 
        } else {
            dropdownAdmin.classList.add('hidden');
            dropdownStats.classList.add('hidden');
        }

    } else {
        
        userNameDisplay.textContent = '';
        userNameDisplay.classList.remove('show');
        
        
        dropdownProfile.href = 'login.html';
        dropdownOrders.href = 'login.html';
        
        
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
    if (!user) return { es_admin: false, nombre: null }; 
    
    try {
        const { data, error } = await supabase
            .from('clientes')
            .select('es_admin, nombre_completo') 
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; 
        
        if (data) {
            return { es_admin: data.es_admin, nombre: data.nombre_completo };
        } else {
            
            return { es_admin: false, nombre: null };
        }
    } catch (error) {
        console.error('Error al obtener perfil del cliente:', error.message);
        return { es_admin: false, nombre: null };
    }
}


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



async function cargarOfertas() {
    const ofertasGrid = document.getElementById('ofertas-grid');
    
    if (!ofertasGrid) {
        console.warn("AVISO: No se encontró el div con id='ofertas-grid'. Si estás en el catálogo, ignora esto.");
        return; 
    }

    console.log("Cargando ofertas..."); 

    try {
        ofertasGrid.innerHTML = '<p style="text-align:center; width:100%;">Cargando ofertas...</p>';
        
        const { data: productosOferta, error } = await supabase
            .from('productos')
            .select('*')
            .eq('activo', true)
            .gt('descuento', 0) 
            .limit(4);

        if (error) {
            console.error('ERROR SQL:', error.message);
            ofertasGrid.innerHTML = '<p>Error al cargar ofertas.</p>';
            return;
        }

        console.log("Productos encontrados:", productosOferta); 

        if (!productosOferta || productosOferta.length === 0) {
            ofertasGrid.innerHTML = '<p>No hay ofertas disponibles en este momento.</p>';
            return;
        }

        let ofertasHTML = '';
        
        productosOferta.forEach(producto => {
            const precioOriginal = producto.precio;
            const porcentajeDescuento = producto.descuento;
            const precioFinal = precioOriginal * (1 - porcentajeDescuento / 100);

            const precioOrigStr = Math.round(precioOriginal).toLocaleString('es-CL');
            const precioFinalStr = Math.round(precioFinal).toLocaleString('es-CL');

            const precioDisplay = `
                <div class="price-container">
                    <span style="text-decoration: line-through; color: #999; font-size: 0.9em; margin-right: 10px;">
                        $${precioOrigStr}
                    </span> 
                    <span style="color: #e74c3c; font-weight: bold; font-size: 1.1em;">
                        $${precioFinalStr}
                    </span>
                </div>
            `;

            ofertasHTML += `
                <div class="product-card">
                    <a href="producto.html?id=${producto.id}">
                        <img src="${producto.imagen}" alt="${producto.nombre}">
                    </a>
                    <div class="product-info">
                        <a href="producto.html?id=${producto.id}" class="product-title-link">
                            <h3>${producto.nombre}</h3>
                        </a>
                        ${precioDisplay}
                        <button class="add-to-cart-btn" data-id="${producto.id}">
                            Añadir al Carrito
                        </button>
                    </div>
                </div>
            `;
        });

        ofertasGrid.innerHTML = ofertasHTML;
        
        const botones = ofertasGrid.querySelectorAll('.add-to-cart-btn');
        botones.forEach(boton => {
            boton.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const productoSeleccionado = productosOferta.find(p => p.id == id);
                
                if (productoSeleccionado) {
                    const precioConDescuento = productoSeleccionado.precio * (1 - productoSeleccionado.descuento / 100);
                    
                    const productoParaCarrito = {
                        ...productoSeleccionado,
                        precio: precioConDescuento 
                    };
                    
                    agregarAlCarrito(productoParaCarrito);
                }
            });
        });

    } catch (error) {
        console.error('Error CRÍTICO en cargarOfertas:', error);
        ofertasGrid.innerHTML = '<p>Error inesperado.</p>';
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