document.addEventListener('DOMContentLoaded', () => {

    // --- Referencias a elementos del DOM ---
    const formNuevoProducto = document.getElementById('form-nuevo-producto');
    const feedbackMessageAdd = document.getElementById('feedback-message-add');
    const listaProductosBody = document.getElementById('lista-productos-body');

    // Referencias al MODAL de EDICIÓN
    const modalOverlay = document.getElementById('modal-editar-overlay');
    const modalForm = document.getElementById('form-editar-producto');
    const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
    const btnCerrarModalX = document.getElementById('btn-cerrar-modal-x');
    const feedbackMessageEdit = document.getElementById('feedback-message-edit');

    // --- Almacén temporal de productos (para no pedirlos a Supabase a cada rato) ---
    let productosCache = [];

    // ===============================================
    // 1. Cargar y Mostrar Productos en la Tabla
    // ===============================================
    async function cargarProductos() {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .order('created_at', { ascending: false }); // Mostrar los más nuevos primero

            if (error) throw error;

            // Guardar en caché
            productosCache = data;

            // Limpiar la tabla antes de dibujar
            listaProductosBody.innerHTML = '';

            if (data.length === 0) {
                listaProductosBody.innerHTML = '<tr><td colspan="5">Aún no hay productos. ¡Añade uno!</td></tr>';
                return;
            }

            // Dibujar cada producto en la tabla
            data.forEach(producto => {
                const fila = `
                    <tr>
                        <td><img src="${producto.imagen}" alt="${producto.nombre}" width="50"></td>
                        <td>${producto.nombre}</td>
                        <td>$${producto.precio.toLocaleString('es-CL')}</td>
                        <td>${producto.stock}</td>
                        <td>
                            <button class="btn-edit" data-id="${producto.id}">
                                <i class="fa-solid fa-pencil" data-id="${producto.id}"></i>
                            </button>
                            <button class="btn-delete" data-id="${producto.id}">
                                <i class="fa-solid fa-trash" data-id="${producto.id}"></i>
                            </button>
                        </td>
                    </tr>
                `;
                listaProductosBody.innerHTML += fila;
            });

        } catch (error) {
            console.error('Error al cargar productos:', error.message);
            listaProductosBody.innerHTML = `<tr><td colspan="5">Error al cargar productos: ${error.message}</td></tr>`;
        }
    }

    // ===============================================
    // 2. Lógica para AÑADIR un producto (Tu código original)
    // ===============================================
    formNuevoProducto.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nuevoProducto = {
            nombre: document.getElementById('nombre').value,
            descripcion: document.getElementById('descripcion').value,
            precio: parseFloat(document.getElementById('precio').value),
            stock: parseInt(document.getElementById('stock').value),
            imagen: document.getElementById('imagen').value
        };

        try {
            const { error } = await supabase.from('productos').insert([nuevoProducto]);
            if (error) throw error;

            mostrarFeedback('¡Producto añadido con éxito!', 'success', feedbackMessageAdd);
            formNuevoProducto.reset(); // Limpia el formulario
            await cargarProductos(); // Recarga la tabla

        } catch (error) {
            console.error('Error al añadir producto:', error.message);
            mostrarFeedback(`Error: ${error.message}`, 'error', feedbackMessageAdd);
        }
    });

    // ===============================================
    // 3. Lógica para BORRAR y EDITAR (Usando delegación de eventos)
    // ===============================================
    listaProductosBody.addEventListener('click', async (event) => {
        const id = event.target.dataset.id;
        if (!id) return; // Se hizo clic en otro lugar

        // --- BORRAR ---
        if (event.target.classList.contains('btn-delete') || event.target.parentElement.classList.contains('btn-delete')) {
            // Pedir confirmación
            if (confirm('¿Estás seguro de que quieres borrar este producto? Esta acción no se puede deshacer.')) {
                try {
                    const { error } = await supabase
                        .from('productos')
                        .delete()
                        .eq('id', id);
                    
                    if (error) throw error;

                    await cargarProductos(); // Recarga la tabla
                } catch (error) {
                    console.error('Error al borrar producto:', error.message);
                    alert(`Error al borrar: ${error.message}`);
                }
            }
        }

        // --- EDITAR (Abrir Modal) ---
        if (event.target.classList.contains('btn-edit') || event.target.parentElement.classList.contains('btn-edit')) {
            abrirModalEdicion(id);
        }
    });

    // ===============================================
    // 4. Lógica del MODAL DE EDICIÓN
    // ===============================================

    function abrirModalEdicion(id) {
        // Buscar el producto en nuestro caché
        const producto = productosCache.find(p => p.id == id);
        if (!producto) {
            alert('Error: No se encontró el producto.');
            return;
        }

        // Rellenar el formulario del modal con los datos del producto
        document.getElementById('edit-id').value = producto.id;
        document.getElementById('edit-nombre').value = producto.nombre;
        document.getElementById('edit-descripcion').value = producto.descripcion;
        document.getElementById('edit-precio').value = producto.precio;
        document.getElementById('edit-stock').value = producto.stock;
        document.getElementById('edit-imagen').value = producto.imagen;

        // Mostrar el modal
        modalOverlay.classList.remove('hidden');
    }

    function cerrarModalEdicion() {
        modalOverlay.classList.add('hidden');
        feedbackMessageEdit.textContent = '';
        feedbackMessageEdit.className = '';
    }

    // --- Eventos para cerrar el modal ---
    btnCancelarEdicion.addEventListener('click', cerrarModalEdicion);
    btnCerrarModalX.addEventListener('click', cerrarModalEdicion);
    modalOverlay.addEventListener('click', (event) => {
        // Cierra solo si se hace clic en el fondo oscuro, no en el contenido
        if (event.target === modalOverlay) {
            cerrarModalEdicion();
        }
    });

    // --- Guardar los cambios del modal (UPDATE) ---
    modalForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Obtener los datos actualizados del formulario del modal
        const id = document.getElementById('edit-id').value;
        const productoActualizado = {
            nombre: document.getElementById('edit-nombre').value,
            descripcion: document.getElementById('edit-descripcion').value,
            precio: parseFloat(document.getElementById('edit-precio').value),
            stock: parseInt(document.getElementById('edit-stock').value),
            imagen: document.getElementById('edit-imagen').value
        };

        try {
            const { error } = await supabase
                .from('productos')
                .update(productoActualizado) // UPDATE en lugar de INSERT
                .eq('id', id);               // Donde el ID coincida

            if (error) throw error;

            mostrarFeedback('¡Producto actualizado!', 'success', feedbackMessageEdit);
            
            // Esperar 1 segundo para que el usuario vea el mensaje y luego cerrar
            setTimeout(async () => {
                cerrarModalEdicion();
                await cargarProductos(); // Recargar la tabla con los nuevos datos
            }, 1000);

        } catch (error) {
            console.error('Error al actualizar:', error.message);
            mostrarFeedback(`Error: ${error.message}`, 'error', feedbackMessageEdit);
        }
    });

    // ===============================================
    // 5. Función de Utilidad (para mostrar mensajes)
    // ===============================================
    function mostrarFeedback(mensaje, tipo, elemento) {
        elemento.textContent = mensaje;
        elemento.className = tipo; // 'success' o 'error'
        
        setTimeout(() => {
            elemento.textContent = '';
            elemento.className = '';
        }, 4000);
    }

    // --- Carga inicial al abrir la página ---
    cargarProductos();

});