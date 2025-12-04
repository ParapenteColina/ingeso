// js/admin.js

document.addEventListener('DOMContentLoaded', async () => {

    // Verificar que Supabase existe
    if (!window.supabase) {
        alert("Error: No se pudo conectar con Supabase. Revisa la consola.");
        return;
    }

    // =========================================================
    // 🔒 1. SEGURIDAD (Login y Permisos)
    // =========================================================
    const { data: { user } } = await window.supabase.auth.getUser();
    
    // Si no hay usuario logueado, mandar al login
    if (!user) { 
        window.location.href = 'login.html'; 
        return; 
    }

    // Verificar si es admin en la tabla 'clientes'
    const { data: cliente } = await window.supabase
        .from('clientes')
        .select('es_admin')
        .eq('id', user.id)
        .single();

    if (!cliente || !cliente.es_admin) {
        alert("Acceso denegado: No tienes permisos de administrador.");
        window.location.href = 'index.html';
        return;
    }

    // =========================================================
    // 📌 2. REFERENCIAS DOM
    // =========================================================
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
    // ☁️ FUNCIÓN: SUBIR IMAGEN A STORAGE
    // =========================================================
    async function subirImagenASupabase(archivo) {
        try {
            const nombreLimpio = archivo.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const nombreArchivo = `${Date.now()}_${nombreLimpio}`;

            const { data, error } = await window.supabase.storage
                .from('imagenes-productos') 
                .upload(nombreArchivo, archivo);

            if (error) throw error;

            const { data: urlData } = window.supabase.storage
                .from('imagenes-productos')
                .getPublicUrl(nombreArchivo);

            return urlData.publicUrl;

        } catch (error) {
            console.error("Error subiendo imagen:", error);
            throw new Error("No se pudo subir la imagen al servidor.");
        }
    }

    // =========================================================
    // 🚀 CARGAR PRODUCTOS (READ) - MODIFICADO PARA OFERTAS
    // =========================================================
    async function cargarProductos() {
        try {
            const { data, error } = await window.supabase
                .from('productos')
                .select('*')
                .order('id', { ascending: true }); // Ordenar por ID para que no salten al editar

            if (error) throw error;

            productosCache = data;
            listaProductosBody.innerHTML = '';

            if (data.length === 0) {
                listaProductosBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Sin productos.</td></tr>';
                return;
            }

            data.forEach(producto => {
                const imgUrl = producto.imagen || 'https://via.placeholder.com/50';

                // --- CAMBIO IMPORTANTE AQUÍ ---
                // En lugar de texto plano, ponemos un input y un botón de guardar
                const fila = `
                    <tr>
                        <td><img src="${imgUrl}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td>
                        <td>${producto.nombre}</td>
                        <td><span style="background:#eee; padding:2px 6px; border-radius:4px; font-size:0.9em;">${producto.categoria || '-'}</span></td>
                        
                        <td>
                            <div style="display:flex; align-items:center; gap:5px;">
                                <span style="font-size:0.8rem;">$</span>
                                <input type="number" 
                                       class="input-precio-rapido" 
                                       data-id="${producto.id}" 
                                       value="${producto.precio}"
                                       style="width: 80px; padding: 4px; border: 1px solid #ccc; border-radius: 4px;">
                                <button class="btn-guardar-precio" data-id="${producto.id}" title="Guardar Precio" 
                                        style="background: #28a745; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer;">
                                    <i class="fa-solid fa-check"></i>
                                </button>
                            </div>
                        </td>

                        <td>${producto.stock}</td>
                        <td>
                            <button class="btn-action btn-edit" data-id="${producto.id}" style="margin-right:5px;"><i class="fa-solid fa-pen pointer-events-none"></i></button>
                            <button class="btn-action btn-delete" data-id="${producto.id}"><i class="fa-solid fa-trash pointer-events-none"></i></button>
                        </td>
                    </tr>
                `;
                listaProductosBody.innerHTML += fila;
            });
        } catch (error) {
            console.error(error);
            listaProductosBody.innerHTML = `<tr><td colspan="6">Error cargando productos.</td></tr>`;
        }
    }

    // ===============================================
    // ➕ AÑADIR PRODUCTO (CREATE)
    // ===============================================
    formNuevoProducto.addEventListener('submit', async (event) => {
        event.preventDefault();

        const btnSubmit = document.getElementById('btn-add-submit');
        const archivoInput = document.getElementById('imagen-archivo');
        const archivo = archivoInput.files[0];

        if (!archivo) {
            return alert("⚠️ Por favor selecciona una imagen para el producto.");
        }

        const textoOriginal = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';
        btnSubmit.disabled = true;

        try {
            const urlImagenSubida = await subirImagenASupabase(archivo);

            const nuevoProducto = {
                nombre: document.getElementById('nombre').value,
                descripcion: document.getElementById('descripcion').value,
                precio: parseFloat(document.getElementById('precio').value),
                stock: parseInt(document.getElementById('stock').value),
                categoria: document.getElementById('categoria').value,
                descuento: parseInt(document.getElementById('descuento').value) || 0,
                imagen: urlImagenSubida,
                activo: true
            };

            const { error } = await window.supabase.from('productos').insert([nuevoProducto]);
            
            if (error) throw error;

            mostrarFeedback('¡Producto guardado exitosamente!', 'success', feedbackMessageAdd);
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

    // ===============================================================
    // ⚙️ BOTONES DE LA TABLA (Delegación: Edit, Delete y PRECIO)
    // ===============================================================
    listaProductosBody.addEventListener('click', async (event) => {
        const btnDelete = event.target.closest('.btn-delete');
        const btnEdit = event.target.closest('.btn-edit');
        const btnGuardarPrecio = event.target.closest('.btn-guardar-precio'); // NUEVO BOTÓN

        // --- 1. GUARDAR PRECIO RÁPIDO ---
        if (btnGuardarPrecio) {
            const id = btnGuardarPrecio.dataset.id;
            // Buscamos el input que está en el mismo contenedor
            const input = btnGuardarPrecio.parentElement.querySelector('.input-precio-rapido');
            const nuevoPrecio = parseFloat(input.value);

            if (!nuevoPrecio || nuevoPrecio < 0) {
                alert("Precio inválido");
                return;
            }

            // Cambiar icono a cargando
            const originalIcon = btnGuardarPrecio.innerHTML;
            btnGuardarPrecio.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btnGuardarPrecio.disabled = true;

            try {
                const { error } = await window.supabase
                    .from('productos')
                    .update({ precio: nuevoPrecio })
                    .eq('id', id);

                if (error) throw error;

                // Feedback visual de éxito
                btnGuardarPrecio.innerHTML = '<i class="fa-solid fa-check-double"></i>';
                btnGuardarPrecio.style.background = '#155724'; // Verde oscuro
                
                setTimeout(() => {
                    btnGuardarPrecio.innerHTML = originalIcon;
                    btnGuardarPrecio.style.background = '#28a745';
                    btnGuardarPrecio.disabled = false;
                }, 1500);

            } catch (error) {
                alert("Error al actualizar precio");
                console.error(error);
                btnGuardarPrecio.innerHTML = originalIcon;
                btnGuardarPrecio.disabled = false;
            }
        }

        // --- 2. BORRAR ---
        if (btnDelete && confirm('¿Estás seguro de borrar este producto?')) {
            const id = btnDelete.dataset.id;
            try {
                const { error } = await window.supabase.from('productos').delete().eq('id', id);
                if(error) throw error;
                await cargarProductos();
            } catch(e) {
                alert("Error al borrar: " + e.message);
            }
        }

        // --- 3. EDITAR COMPLETO (MODAL) ---
        if (btnEdit) {
            abrirModalEdicion(btnEdit.dataset.id);
        }
    });

    // ===============================================
    // 📝 MODAL EDICIÓN (UPDATE)
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
        
        previewImg.src = p.imagen; 
        document.getElementById('edit-imagen-archivo').value = ""; 

        modalOverlay.classList.remove('hidden');
    }

    function cerrarModalEdicion() {
        modalOverlay.classList.add('hidden');
    }
    
    btnCancelarEdicion.addEventListener('click', cerrarModalEdicion);
    btnCerrarModalX.addEventListener('click', cerrarModalEdicion);

    modalForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const btnEditSubmit = document.getElementById('btn-edit-submit');
        const id = document.getElementById('edit-id').value;
        const archivoInput = document.getElementById('edit-imagen-archivo');
        const archivoNuevo = archivoInput.files[0];

        btnEditSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
        btnEditSubmit.disabled = true;

        try {
            let urlFinal = previewImg.src;

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
                imagen: urlFinal
            };

            const { error } = await window.supabase.from('productos').update(actualizaciones).eq('id', id);
            
            if (error) throw error;

            mostrarFeedback('¡Producto actualizado!', 'success', feedbackMessageEdit);
            
            setTimeout(() => { 
                cerrarModalEdicion(); 
                cargarProductos(); 
            }, 1000);

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