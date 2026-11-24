// =========================================================
// CLOUD.JS — Inicio de sesión con Google + guardado en la nube
//
// Por qué está en un archivo aparte:
//  - Firebase se carga como "módulo" (import ... from ...).
//  - El resto de la página es un script común con onclick="..." en el HTML.
//  Separarlos evita mezclar los dos estilos. Se comunican así:
//    index.html  → expone window.app   (datos y pantalla)
//    cloud.js    → expone window.cloud (login, logout, guardar)
//
// Cómo se guardan los datos en Firestore (la base de datos de Firebase):
//    colección "users" → un documento por usuario (su id) → { routines, sessions }
//  Es como un fichero: un cajón (users) con una carpeta por persona.
// =========================================================
import { firebaseConfig } from './firebase-config.js';

const app = window.app;

// Si todavía no pegaste tu configuración, seguimos en modo local.
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'PEGAR_ACA') {
  app.setAuth({ status: 'off' });
} else {
  start().catch(err => {
    // Por ejemplo: sin internet y no se pudo descargar Firebase
    console.error('No se pudo iniciar Firebase', err);
    app.setAuth({ status: 'off', error: 'No se pudo conectar con el servidor de cuentas.' });
  });
}

async function start() {
  // Importamos Firebase desde su CDN (no hace falta instalar nada)
  const V = '10.12.2';
  const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
  const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } =
    await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
  const { getFirestore, doc, getDoc, setDoc, serverTimestamp } =
    await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);

  const fb = initializeApp(firebaseConfig);
  const auth = getAuth(fb);
  const store = getFirestore(fb);
  let uid = null;
  let timer = null;

  window.cloud = {
    async login() {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' }); // deja elegir cuenta
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        // Algunos celulares bloquean las ventanas emergentes: probamos redirigiendo
        if (e.code === 'auth/popup-blocked') return signInWithRedirect(auth, provider);
        if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
          app.toast('No se pudo iniciar sesión: ' + e.code);
        }
      }
    },
    logout: () => signOut(auth),

    // Guardar en la nube. Usamos un "debounce": si guardás 5 veces seguidas
    // en 1 segundo, solo mandamos la última. Ahorra escrituras (Firebase
    // gratis tiene un límite diario) y evita que se pisen entre sí.
    push(data) {
      if (!uid) return;
      clearTimeout(timer);
      app.setAuth({ sync: 'saving' });
      timer = setTimeout(async () => {
        try {
          await setDoc(doc(store, 'users', uid), { routines: data.routines, sessions: data.sessions, updatedAt: serverTimestamp() });
          app.setAuth({ sync: 'ok' });
        } catch (e) {
          console.error(e);
          app.setAuth({ sync: 'error' });
        }
      }, 800);
    },
  };

  // Firebase nos avisa cada vez que alguien entra o sale (también al recargar la página)
  onAuthStateChanged(auth, async user => {
    if (!user) {
      uid = null;
      app.signedOut();
      return;
    }
    uid = user.uid;
    app.setAuth({ status: 'loading' });
    try {
      const ref = doc(store, 'users', uid);
      const snap = await getDoc(ref);
      let data;
      if (snap.exists()) {
        // Ya tenía cuenta: traemos sus datos de la nube
        data = snap.data();
      } else {
        // Primera vez: subimos lo que tenía anotado sin cuenta en este navegador
        // (así no pierde lo que cargó antes de registrarse)
        data = app.guestData();
        await setDoc(ref, { routines: data.routines, sessions: data.sessions, updatedAt: serverTimestamp() });
        app.toast('¡Cuenta creada! Subimos tus datos de este navegador.');
      }
      app.signedIn({ uid, name: user.displayName || user.email, photo: user.photoURL }, data);
    } catch (e) {
      console.error(e);
      app.setAuth({ status: 'off', error: 'Entraste, pero no se pudieron leer tus datos (' + (e.code || e.message) + '). Revisá las reglas de Firestore.' });
    }
  });
}
