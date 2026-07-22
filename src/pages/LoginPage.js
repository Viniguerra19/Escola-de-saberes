// ============================================
// LOGIN PAGE
// Simple email-based login
// ============================================

import { login } from '../auth.js';
import { router } from '../router.js';
import { showToast } from '../components/Toast.js';

export function renderLoginPage() {
  const container = document.createElement('div');
  container.className = 'login-page';

  container.innerHTML = `
    <style>
      .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background-color: #121826;
        font-family: 'Inter', sans-serif;
      }
      .login-card {
        background-color: #1a2235;
        border-radius: 20px;
        padding: 40px 48px;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        border: 1px solid rgba(255,255,255,0.05);
        box-sizing: border-box;
      }
      .login-header {
        text-align: center;
        margin-bottom: 32px;
      }
      .login-logo-img {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        margin-bottom: 24px;
        object-fit: cover;
      }
      .login-subtitle {
        color: #ffffff;
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 4px;
        margin-top: 0;
      }
      .login-title {
        font-family: 'Outfit', sans-serif;
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(90deg, #ff4b72, #00b4d8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 12px;
        margin-top: 0;
        letter-spacing: -1px;
      }
      .login-desc {
        color: #94a3b8;
        font-size: 0.9rem;
        margin: 0;
      }
      .login-form .input-group {
        margin-bottom: 24px;
      }
      .login-form .input-group label {
        color: #64748b;
        font-size: 0.70rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
        display: block;
        text-align: left;
      }
      .login-input {
        background-color: #0f172a;
        border: 1px solid #334155;
        color: white;
        padding: 16px 18px;
        border-radius: 8px;
        width: 100%;
        font-size: 1rem;
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
        transition: border-color 0.2s;
      }
      .login-input:focus {
        border-color: #00b4d8;
        outline: none;
      }
      .login-submit {
        width: 100%;
        background: #0ea5e9;
        color: white;
        font-weight: 600;
        padding: 16px;
        border-radius: 8px;
        font-size: 1rem;
        font-family: 'Inter', sans-serif;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
      }
      .login-submit:hover {
        background: #0284c7;
      }
      .login-submit:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    </style>
    
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <img src="https://drive.google.com/thumbnail?id=11qgY4xOAjaGacix86kEHE1O3x0DYfxN1&sz=w400" alt="Terreiro Umbanda Iansã Guerreira" class="login-logo-img" />
          <h2 class="login-subtitle">Bem-vindo a</h2>
          <h1 class="login-title">Escola de Saberes</h1>
          <p class="login-desc">Onde a fé encontra o conhecimento.</p>
        </div>

        <form id="login-form" class="login-form">
          <div class="input-group">
            <label for="email">E-mail de acesso</label>
            <input 
              type="email" 
              id="email" 
              class="login-input" 
              placeholder="seu@email.com" 
              required 
              autocomplete="email"
            />
            <div class="error-text hidden" id="login-error" style="color:#ff4b72; font-size: 0.8rem; margin-top: 8px;"></div>
          </div>

          <button type="submit" class="login-submit" id="login-btn">
            Entrar na Plataforma &rarr;
          </button>
        </form>
      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const emailInput = container.querySelector('#email');
  const submitBtn = container.querySelector('#login-btn');
  const errorText = container.querySelector('#login-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    if (!email) return;

    // Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Entrando...';
    errorText.classList.add('hidden');
    emailInput.classList.remove('input-error');

    try {
      await login(email);
      showToast('Bem-vindo(a) de volta!', 'success');
      router.navigate('dashboard');
    } catch (error) {
      console.error('Login error:', error);
      errorText.textContent = error.message || 'Erro ao fazer login. Verifique seu e-mail.';
      errorText.classList.remove('hidden');
      emailInput.classList.add('input-error');
      
      // Reset button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar na Plataforma';
    }
  });

  return container;
}
