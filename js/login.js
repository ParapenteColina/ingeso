
document.addEventListener('DOMContentLoaded', () => {

    
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginFeedback = document.getElementById('login-feedback');
    const registerFeedback = document.getElementById('register-feedback');

    const flipper = document.querySelector('.form-flipper');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        flipper.classList.add('is-flipped');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        flipper.classList.remove('is-flipped');
    });


    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
    
    
        const nombre = document.getElementById('register-name').value; 
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        registerFeedback.textContent = '';
        registerFeedback.className = 'feedback-message';

        try {
            
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (authError) throw authError; 

            const userId = authData.user.id;

            
            const { error: profileError } = await supabase
                .from('clientes')
                .insert({
                    id: userId,
                
                    nombre_completo: nombre, 
                    es_admin: false 
                });

            if (profileError) throw profileError; 

            
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

    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        loginFeedback.textContent = '';
        loginFeedback.className = 'feedback-message';

        try {
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error; 

            
            console.log('Inicio de sesión exitoso:', data.user);
            
            
            window.location.href = 'index.html'; 

        } catch (error) {
            console.error('Error en inicio de sesión:', error.message);
            loginFeedback.textContent = 'Email o contraseña incorrectos.';
            loginFeedback.classList.add('error');
        }
    });
});