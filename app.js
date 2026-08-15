import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://vlpjhlelnmirtlhgcmzh.supabase.co";
const supabasePublishableKey = "sb_publishable_eCLVsdRZwoByzq9-rmJdVA_FIcyy9DB";
const supabase = createClient(supabaseUrl, supabasePublishableKey);

const dialog = document.querySelector("#auth-dialog");
const authButton = document.querySelector("#auth-button");
const closeButton = document.querySelector("#close-auth");
const form = document.querySelector("#auth-form");
const message = document.querySelector("#auth-message");

function showDialog() {
  message.textContent = "";
  dialog.showModal();
  document.querySelector("#email").focus();
}

async function updateAuthButton() {
  const { data: { session } } = await supabase.auth.getSession();
  authButton.textContent = session ? "МОЙ КАБИНЕТ" : "Войти";
}

authButton.addEventListener("click", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    alert("Вы уже вошли. Личный кабинет с прогрессом появится следующим шагом.");
    return;
  }
  showDialog();
});

closeButton.addEventListener("click", () => dialog.close());

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = new FormData(form).get("email");
  const submit = form.querySelector("button[type=submit]");
  submit.disabled = true;
  message.textContent = "Отправляю ссылку…";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });

  submit.disabled = false;
  if (error) {
    message.textContent = `Не получилось: ${error.message}`;
    return;
  }
  message.textContent = "Готово. Проверьте почту и откройте ссылку из письма.";
});

supabase.auth.onAuthStateChange(() => updateAuthButton());
updateAuthButton();
