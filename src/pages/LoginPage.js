import {getSettings} from '../settings.js';
import {h,safeUrl} from '../utils/ui.js';
import { login } from '../auth.js';
import { router } from '../router.js';
import { showToast } from '../components/Toast.js';

export function renderLoginPage() {
  const container = document.createElement('main');
  container.className = 'login-page';
  container.innerHTML = `
    <section class="login-card" aria-labelledby="login-title">
      <div class="login-header">
        ${getSettings().logo ? `<img src="${h(safeUrl(getSettings().logo))}" alt="" class="login-logo-img" width="88" height="88" />` : ''}
        <p class="login-eyebrow">Bem-vindo à</p>
        <h1 class="login-title" id="login-title">${h(getSettings().name)}</h1>
        <p class="login-desc">${h(getSettings().subtitle)}</p>
      </div>
      <form id="login-form" class="login-form">
        <div class="input-group">
          <label for="email">E-mail de acesso</label>
          <input type="email" id="email" class="login-input" placeholder="seu@email.com"
            required autocomplete="email" inputmode="email" aria-describedby="login-error" />
          <p class="login-error hidden" id="login-error" role="alert"></p>
        </div>
        <button type="submit" class="login-submit" id="login-btn">Entrar na plataforma <span aria-hidden="true">→</span></button>
      </form>
    </section>
  `;

  const form = container.querySelector('#login-form');
  const emailInput = container.querySelector('#email');
  const submitBtn = container.querySelector('#login-btn');
  const errorText = container.querySelector('#login-error');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitBtn.disabled || !emailInput.value.trim()) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando…';
    errorText.textContent = '';
    errorText.classList.add('hidden');
    emailInput.removeAttribute('aria-invalid');

    try {
      await login(emailInput.value.trim());
      showToast('Bem-vindo(a) de volta!', 'success');
      router.navigate('dashboard');
    } catch (error) {
      errorText.textContent = error.message || 'Não foi possível entrar. Tente novamente.';
      errorText.classList.remove('hidden');
      emailInput.setAttribute('aria-invalid', 'true');
      emailInput.focus();
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Entrar na plataforma <span aria-hidden="true">→</span>';
    }
  });

  return container;
}
