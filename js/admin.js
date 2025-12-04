document.addEventListener('DOMContentLoaded', async () => {

    // 🔒 1. SEGURIDAD
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }

    const { data: cliente } = await supabase.from('clientes').select('es_admin').eq('id', user.id).single();
    if (!cliente || !cliente.es_admin) {
        alert("Acceso denegado.");
        window.location.href = 'index.html';
        return;
    }

    // 📌 2. REFERENCIAS DOM
    const listaProductosBody = document.getElementById('lista-productos-body');
    const formNuevoProducto = document.getElementById('form-nuevo-producto');
    
    // Feedback
    const feedbackMessageAdd = document.getElementById('feedback-message-add');
    const feedbackMessageEdit = document.getElementById('feedback-message-edit');

    // Modal
    const modalOverlay = document.getElementById('modal-editar-overlay');
    const modalForm = document.getElementById('form-editar-producto');
    const btnCerrarModalX = document.getElementById('btn-cerrar-modal-x');
    const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
    const previewImg = document.getElementById('edit-preview-img');

    let productosCache = [];

    // =========================================================
    // ☁️ FUNCIÓN ESPECIAL: SUBIR IMAGEN A STORAGE
    // =========================================================
    async function subirImagenASupabase(archivo) {
        try {
            // 1. Crear un nombre único para el archivo (evita que se sobrescriban)
            // Ejemplo: 1715629_batman.jpg
            const nombreArchivo = `${Date.now()}_${archivo.name.replace(/\s/g, '_')}`;

            // 2. Subir al Bucket 'imagenes-productos'
            const { data, error } = await supabase.storage
                .from('imagenes-productos') // <--- NOMBRE DE TU BUCKET
                .upload(nombreArchivo, archivo);

            if (error) throw error;

            // 3. Obtener la URL Pública
            const { data: { publicUrl } } = supabase.storage
                .from('imagenes-productos')
                .getPublicUrl(nombreArchivo);

            return publicUrl;

        } catch (error) {
            console.error("Error subiendo imagen:", error);
            throw new Error("No se pudo subir la imagen. Verifica tu bucket.");
        }
    }

    // =========================================================
    // 🚀 CARGAR PRODUCTOS
    // =========================================================
    async function cargarProductos() {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            productosCache = data;
            listaProductosBody.innerHTML = '';

            if (data.length === 0) {
                listaProductosBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Sin productos.</td></tr>';
                return;
            }

            data.forEach(producto => {
                const precio = Math.round(producto.precio).toLocaleString('es-CL');
                const fila = `
                    <tr>
                        <td><img src="${producto.imagen}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td>
                        <td>${producto.nombre}</td>
                        <td><span style="background:#eee; padding:2px 6px; border-radius:4px; font-size:0.9em;">${producto.categoria || '-'}</span></td>
                        <td>$${precio}</td>
                        <td>${producto.stock}</td>
                        <td>
                            <button class="btn-action btn-edit" data-id="${producto.id}"><i class="fa-solid fa-pen pointer-events-none"></i></button>
                            <button class="btn-action btn-delete" data-id="${producto.id}"><i class="fa-solid fa-trash pointer-events-none"></i></button>
                        </td>
                    </tr>
                `;
                listaProductosBody.innerHTML += fila;
            });
        } catch (error) {
            listaProductosBody.innerHTML = `<tr><td colspan="6">Error: ${error.message}</td></tr>`;
        }
    }

    // ===============================================
    // ➕ AÑADIR PRODUCTO (CON FILE UPLOAD)
    // ===============================================
    formNuevoProducto.addEventListener('submit', async (event) => {
        event.preventDefault();

        const btnSubmit = document.getElementById('btn-add-submit');
        const archivoInput = document.getElementById('imagen-archivo');
        const archivo = archivoInput.files[0]; // El archivo real

        if (!archivo) {
            return alert("Por favor selecciona una imagen.");
        }

        // Feedback visual de "Cargando..."
        const textoOriginal = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';
        btnSubmit.disabled = true;

        try {
            // 1. Primero subimos la imagen
            const urlImagenSubida = await subirImagenASupabase(archivo);

            // 2. Luego guardamos el producto con esa URL
            const nuevoProducto = {
                nombre: document.getElementById('nombre').value,
                descripcion: document.getElementById('descripcion').value,
                precio: parseFloat(document.getElementById('precio').value),
                stock: parseInt(document.getElementById('stock').value),
                categoria: document.getElementById('categoria').value,
                descuento: parseInt(document.getElementById('descuento').value) || 0,
                imagen: urlImagenSubida, // <--- LA URL QUE OBTUVIMOS
                activo: true
            };

            const { error } = await supabase.from('productos').insert([nuevoProducto]);
            if (error) throw error;

            mostrarFeedback('¡Producto e Imagen guardados!', 'success', feedbackMessageAdd);
            formNuevoProducto.reset();
            await cargarProductos();

        } catch (error) {
            console.error(error);
            mostrarFeedback(`Error: ${error.message}`, 'error', feedbackMessageAdd);
        } finally {
            btnSubmit.innerHTML = textoOriginal;
            btnSubmit.disabled = false;
        }
    });

    // ===============================================
    // ⚙️ BOTONES (EDITAR/BORRAR)
    // ===============================================
    listaProductosBody.addEventListener('click', async (event) => {
        const btnDelete = event.target.closest('.btn-delete');
        const btnEdit = event.target.closest('.btn-edit');

        if (btnDelete && confirm('¿Borrar producto?')) {
            const id = btnDelete.dataset.id;
            await supabase.from('productos').delete().eq('id', id);
            await cargarProductos();
        }

        if (btnEdit) {
            abrirModalEdicion(btnEdit.dataset.id);
        }
    });

    // ===============================================
    // 📝 MODAL EDICIÓN
    // ===============================================
    function abrirModalEdicion(id) {
        const p = productosCache.find(prod => prod.id == id);
        if (!p) return;

        document.getElementById('edit-id').value = p.id;
        document.getElementById('edit-nombre').value = p.nombre;
        document.getElementById('edit-descripcion').value = p.descripcion;
        document.getElementById('edit-precio').value = p.precio;
        document.getElementById('edit-stock').value = p.stock;
        document.getElementById('edit-descuento').value = p.descuento || 0;
        document.getElementById('edit-categoria').value = p.categoria || '';
        
        // Mostrar vista previa y limpiar input de archivo
        previewImg.src = p.imagen; 
        document.getElementById('edit-imagen-archivo').value = ""; 

        modalOverlay.classList.remove('hidden');
    }

    function cerrarModalEdicion() {
        modalOverlay.classList.add('hidden');
    }
    
    btnCancelarEdicion.addEventListener('click', cerrarModalEdicion);
    btnCerrarModalX.addEventListener('click', cerrarModalEdicion);

    // GUARDAR EDICIÓN
    modalForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const btnEditSubmit = document.getElementById('btn-edit-submit');
        const id = document.getElementById('edit-id').value;
        const archivoInput = document.getElementById('edit-imagen-archivo');
        const archivoNuevo = archivoInput.files[0];

        btnEditSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
        btnEditSubmit.disabled = true;

        try {
            let urlFinal = previewImg.src; // Por defecto, mantenemos la vieja

            // Si el usuario seleccionó una imagen nueva, la subimos
            if (archivoNuevo) {
                urlFinal = await subirImagenASupabase(archivoNuevo);
            }

            const actualizaciones = {
                nombre: document.getElementById('edit-nombre').value,
                descripcion: document.getElementById('edit-descripcion').value,
                precio: parseFloat(document.getElementById('edit-precio').value),
                stock: parseInt(document.getElementById('edit-stock').value),
                categoria: document.getElementById('edit-categoria').value,
                descuento: parseInt(document.getElementById('edit-descuento').value) || 0,
                imagen: urlFinal // Guardamos la URL (nueva o vieja)
            };

            const { error } = await supabase.from('productos').update(actualizaciones).eq('id', id);
            if (error) throw error;

            mostrarFeedback('¡Actualizado!', 'success', feedbackMessageEdit);
            setTimeout(() => { cerrarModalEdicion(); cargarProductos(); }, 1000);

        } catch (error) {
            mostrarFeedback(`Error: ${error.message}`, 'error', feedbackMessageEdit);
        } finally {
            btnEditSubmit.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Cambios';
            btnEditSubmit.disabled = false;
        }
    });

    function mostrarFeedback(mensaje, tipo, elemento) {
        elemento.textContent = mensaje;
        elemento.style.color = tipo === 'success' ? 'green' : 'red';
        setTimeout(() => elemento.textContent = '', 3000);
    }

    cargarProductos();
});