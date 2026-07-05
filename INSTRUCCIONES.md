# ArdyMarket — Instrucciones de despliegue

## 1. Estructura del repo

Copia el contenido de este paquete a la raíz del repo `ecosystem-ardy`:

```
/ (raíz del repo)
├── CNAME                          ← ya incluido, contiene "ardymarket.com"
├── index.html                     ← landing + login
├── hub.html                       ← el "Commons"
├── supabase-config.js             ← compartido por todo el sitio
├── bet-midrash.html               ← TU archivo actual, déjalo donde está
├── hardyglot/
│   ├── index.html
│   └── lingolab/
│       ├── index.html
│       ├── eris-lab.html          ← el antiguo language-lab.html
│       ├── babys-lab.html
│       ├── toddlers-lab.html
│       ├── childrens-lab.html
│       ├── parents-lab.html
│       ├── frases.json
│       ├── js/
│       │   ├── engine-v2.js
│       │   ├── gender-system.js
│       │   └── spaced-repetition.js
│       └── audios/                ← ⚠️ CREA esta carpeta y copia ahí tus 3 mp3:
│           ├── en_milo_rvcr_P1_v1.mp3
│           ├── sp_Bautista-rvcr_p1_v1.mp3
│           └── he_Atlas_rvcr_p1_v1.mp3
├── scholar/
│   └── index.html
└── store/
    └── index.html
```

⚠️ Puedes borrar del repo: `dashboard.html`, `language-lab.html` y las copias
viejas de los .js en su ubicación anterior (después de verificar que todo funciona).

## 2. GitHub Pages — dominio personalizado

1. Repo → Settings → Pages → Custom domain → escribe `ardymarket.com` → Save.
   (El archivo CNAME incluido hace lo mismo; GitHub lo detecta al hacer push.)
2. Marca "Enforce HTTPS" cuando esté disponible (puede tardar unos minutos).

## 3. Cloudflare — DNS y redirect

**Para ardymarket.com** (DNS → Records):
- 4 registros `A` apuntando a las IPs de GitHub Pages:
  `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- 1 registro `CNAME` con nombre `www` apuntando a `TU-USUARIO.github.io`
- Proxy: puede quedar activado (nube naranja).

**Para hardyglot.com** (Rules → Redirect Rules → Create rule):
- Nombre: `hardyglot → ardymarket`
- When incoming requests match: Hostname `equals` `hardyglot.com`
  (agrega otra condición OR para `www.hardyglot.com`)
- Then: Static redirect → URL: `https://ardymarket.com/hardyglot/` → 301
- ⚠️ hardyglot.com necesita al menos un registro DNS *proxied* (nube naranja)
  para que la regla se dispare. Si no tiene ninguno, crea un registro `A`
  con nombre `@` apuntando a `192.0.2.1` (IP dummy) con proxy ACTIVADO.

## 4. Supabase — SQL y Redirect URLs

**SQL** (SQL Editor → New query):
```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bet_midrash_access boolean DEFAULT false;
```

Para activar Bet Midrash a un usuario validado manualmente:
```sql
UPDATE profiles SET bet_midrash_access = true WHERE id = 'UUID-DEL-USUARIO';
```
(O desde Table Editor → profiles → editar la fila.)

**Auth** (Authentication → URL Configuration):
- Site URL: `https://ardymarket.com`
- Redirect URLs, agregar:
  - `https://ardymarket.com/index.html`
  - `https://ardymarket.com/**`

## 5. Verificación (en este orden)

1. Abre `https://ardymarket.com` → debe salir el login de ArdyMarket.
2. Haz login → debe llevarte a `hub.html` con 3 tarjetas (Bet Midrash oculta).
3. Activa `bet_midrash_access` a tu usuario → recarga el hub → aparece la 4ª tarjeta.
4. Hub → Hardyglot → Lingo Lab → Eri's Lab → debe cargar frases y audio.
5. Escribe `hardyglot.com` en el navegador → debe llegar a `ardymarket.com/hardyglot/`.
6. Cierra sesión → intenta abrir `hub.html` directo → debe rebotarte al login.

## Notas

- Todas las rutas del sitio son RELATIVAS: funciona igual en el dominio final
  y en `usuario.github.io/repo/` mientras pruebas.
- La sesión de Supabase se comparte automáticamente en todas las páginas
  porque todo vive bajo un solo origen (ardymarket.com).
- `bet-midrash.html` no se tocó: sigue siendo tu archivo actual en la raíz.
