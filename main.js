// main.js (Versión actualizada con Autocompletar)

document.addEventListener('DOMContentLoaded', () => {

    // Carga el Header
    fetch('header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-placeholder').innerHTML = data;

            // --- LÓGICA DE BÚSQUEDA ---
            
            // 1. Seleccionamos los elementos por sus nuevos IDs
            const headerSearchInput = document.getElementById('header-search-input');
            const headerSearchButton = document.querySelector('.search-bar button');
            const suggestionsBox = document.getElementById('header-suggestions-box');
            
            let typingTimer; // Un temporizador para esperar que el usuario termine de escribir

            // 2. Función que redirige
            const ejecutarBusqueda = (query) => {
                const searchTerm = query || headerSearchInput.value.trim();
                if (searchTerm) {
                    window.location.href = `inventario.html?q=${searchTerm}`;
                }
            };

            // 3. Función que busca sugerencias en Supabase
            const buscarSugerencias = async () => {
                const searchTerm = headerSearchInput.value.trim();

                if (searchTerm.length < 2) { // No busques si es muy corto
                    suggestionsBox.innerHTML = '';
                    suggestionsBox.style.display = 'none';
                    return;
                }

                // Hacemos una consulta ligera: solo 5 items, solo nombre e imagen
                const { data: sugerencias, error } = await supabase
                    .from('productos')
                    .select('id, nombre, imagen') // Pedimos solo lo necesario
                    .ilike('nombre', `%${searchTerm}%`) // ilike = no sensible a mayúsculas
                    .limit(5);

                if (error || !sugerencias.length) {
                    suggestionsBox.innerHTML = '';
                    suggestionsBox.style.display = 'none';
                    return;
                }

                // 4. Mostramos las sugerencias
                suggestionsBox.innerHTML = '';
                sugerencias.forEach(item => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'suggestion-item';
                    suggestionItem.innerHTML = `
                        <img src="${item.imagen}" alt="${item.nombre}">
                        <span>${item.nombre}</span>
                    `;
                    // Al hacer clic en una sugerencia:
                    suggestionItem.addEventListener('click', () => {
                        headerSearchInput.value = item.nombre; // Rellena el input
                        ejecutarBusqueda(item.nombre); // Ejecuta la búsqueda
                    });
                    suggestionsBox.appendChild(suggestionItem);
                });
                suggestionsBox.style.display = 'block';
            };

            // 5. Añadimos los "listeners"
            headerSearchButton.addEventListener('click', () => ejecutarBusqueda());
            
            headerSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(typingTimer); // Cancela el timer de sugerencias
                    suggestionsBox.style.display = 'none'; // Oculta sugerencias
                    ejecutarBusqueda();
                }
            });

            // EL LISTENER "INPUT" (mientras escribes)
            headerSearchInput.addEventListener('input', () => {
                clearTimeout(typingTimer); // Reinicia el timer
                // Espera 300ms después de la última tecla antes de buscar
                typingTimer = setTimeout(buscarSugerencias, 300);
            });

            // Oculta las sugerencias si se hace clic fuera
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-bar')) {
                    suggestionsBox.style.display = 'none';
                }
            });
            // --- FIN LÓGICA DE BÚSQUEDA ---
            
            gestionarLinkAdmin(); 
        })
        .catch(error => console.error('Error al cargar el header:', error));

    // Carga el Footer
    fetch('footer.html') // (Tendrías que crear footer.html también)
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-placeholder').innerHTML = data;
        })
        .catch(error => console.error('Error al cargar el footer:', error));
});


// Mueve tu lógica del link de admin a una función
function gestionarLinkAdmin() {
    // Cambia esta variable a 'true' para simular que ha iniciado sesión un admin
    const esUsuarioAdmin = true; 

    const adminLinkContainer = document.getElementById('admin-link-container');
    
    // Verificamos si existe el contenedor (puede no cargarse al instante)
    if (adminLinkContainer) {
        if (esUsuarioAdmin) {
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            adminLink.textContent = 'Estadísticas';
            adminLinkContainer.appendChild(adminLink);
        }
    } else {
        console.warn('El contenedor del link de admin no se encontró.');
    }
}