# IRONLOG · Registro de pesos

Página para anotar tus entrenamientos del gimnasio, organizados por rutina:
**Pecho, Espalda, Piernas, Mix 1 y Mix 2**.

## Qué podés hacer

- Elegir la fecha en que entrenaste.
- Anotar cada serie (kg + repeticiones).
- Elegir si el peso es **total** o **por lado** (ej: prensa con discos a cada lado).
- Agregar, quitar y reordenar ejercicios de cada rutina.
- Ver el registro semanal y el historial de cada día.

## Cómo usarla

Abrí `index.html` en el navegador. No necesita instalar nada.

Sin cuenta, los datos se guardan solo en el navegador (localStorage).

## Cuentas (inicio de sesión con Google)

Para guardar los datos en la nube se usa **Firebase** (gratis para uso personal).

1. Entrá a <https://console.firebase.google.com> → **Agregar proyecto**.
2. **Authentication** → Comenzar → **Google** → Habilitar → Guardar.
3. **Authentication → Configuración → Dominios autorizados** → agregar `exegaite7.github.io`.
4. **Firestore Database** → Crear base de datos → modo producción.
5. En **Firestore → Reglas**, pegar el contenido de `firestore.rules` → Publicar.
6. **Configuración del proyecto** (⚙) → Tus apps → ícono `</>` (web) → registrar app.
   Copiar el objeto `firebaseConfig` y pegarlo en `firebase-config.js`.

> Importante: abrí la página desde GitHub Pages o un servidor local
> (`python -m http.server`). Con doble clic sobre `index.html` el login no funciona.

## Archivos

| Archivo | Qué hace |
|---|---|
| `index.html` | La página completa (diseño + lógica) |
| `cloud.js` | Inicio de sesión y guardado en Firebase |
| `firebase-config.js` | Datos de conexión a tu proyecto de Firebase |
| `firestore.rules` | Reglas de seguridad: cada usuario solo ve lo suyo |
