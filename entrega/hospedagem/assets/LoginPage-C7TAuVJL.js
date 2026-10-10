import{_ as e,p as t,r as n,u as r,w as i}from"./index-BmfUXXYw.js";import{t as a}from"./Toast-DemLLCQG.js";function o(){let o=document.createElement(`main`);o.className=`login-page`,o.innerHTML=`
    <section class="login-card" aria-labelledby="login-title">
      <div class="login-header">
        ${n().logo?`<img src="${r(t(n().logo))}" alt="" class="login-logo-img" width="88" height="88" />`:``}
        <p class="login-eyebrow">Bem-vindo à</p>
        <h1 class="login-title" id="login-title">${r(n().name)}</h1>
        <p class="login-desc">${r(n().subtitle)}</p>
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
  `;let s=o.querySelector(`#login-form`),c=o.querySelector(`#email`),l=o.querySelector(`#login-btn`),u=o.querySelector(`#login-error`);return s.addEventListener(`submit`,async t=>{if(t.preventDefault(),!(l.disabled||!c.value.trim())){l.disabled=!0,l.textContent=`Entrando…`,u.textContent=``,u.classList.add(`hidden`),c.removeAttribute(`aria-invalid`);try{await e(c.value.trim()),a(`Bem-vindo(a) de volta!`,`success`),i.navigate(`dashboard`)}catch(e){u.textContent=e.message||`Não foi possível entrar. Tente novamente.`,u.classList.remove(`hidden`),c.setAttribute(`aria-invalid`,`true`),c.focus()}finally{l.disabled=!1,l.innerHTML=`Entrar na plataforma <span aria-hidden="true">→</span>`}}}),o}export{o as renderLoginPage};