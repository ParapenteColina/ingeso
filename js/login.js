// Esperar a que todo el HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- Referencias a los Formularios ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginFeedback = document.getElementById('login-feedback');
    const registerFeedback = document.getElementById('register-feedback');

    // --- Referencias para dar la vuelta ---
    const flipper = document.querySelector('.form-flipper');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    // --- Lógica para dar la vuelta ---
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        flipper.classList.add('is-flipped');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        flipper.classList.remove('is-flipped');
    });

    // ===================================
    //  LÓGICA DE REGISTRO
    // ===================================
    // ===================================
//  LÓGICA DE REGISTRO (CORREGIDA)
// ===================================
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
    
        // 1. Obtener los datos del formulario
    // --- CORREGIDO: El ID era 'register-name' ---
        const nombre = document.getElementById('register-name').value; 
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        registerFeedback.textContent = '';
        registerFeedback.className = 'feedback-message';

        try {
            // 2. Crear el usuario en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (authError) throw authError; 

            const userId = authData.user.id;

            // 3. Insertar en la tabla 'clientes'
            const { error: profileError } = await supabase
                .from('clientes')
                .insert({
                    id: userId,
                // --- CORREGIDO: La columna se llama 'nombre_completo' ---
                    nombre_completo: nombre, 
                    es_admin: false 
                });

            if (profileError) throw profileError; 

            // 4. ¡Todo salió bien!
            registerFeedback.textContent = '¡Cuenta creada! Revisa tu email para confirmar y luego inicia sesión.';
            registerFeedback.classList.add('success');
        
            setTimeout(() => {
                flipper.classList.remove('is-flipped');
                loginForm.reset();
                registerForm.reset();
            }, 2000);

        } catch (error) {
            console.error('Error en el registro:', error.message);
            registerFeedback.textContent = `Error: ${error.message}`;
            registerFeedback.classList.add('error');
    }
    });

    // ===================================
    //  LÓGICA DE INICIO DE SESIÓN (LOGIN)
    // ===================================
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // 1. Obtener datos
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        loginFeedback.textContent = '';
        loginFeedback.className = 'feedback-message';

        try {
            // 2. Iniciar sesión con Supabase Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error; // Si hay error, salta al catch

            // 3. ¡Éxito! Redirigir al usuario
            // (Supabase guarda la sesión automáticamente)
            console.log('Inicio de sesión exitoso:', data.user);
            
            // Redirigir a la página principal
            window.location.href = 'index.html'; 

        } catch (error) {
            console.error('Error en inicio de sesión:', error.message);
            loginFeedback.textContent = 'Email o contraseña incorrectos.';
            loginFeedback.classList.add('error');
        }
    });
});