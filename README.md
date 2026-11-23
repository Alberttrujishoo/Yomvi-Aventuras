# Yomvi Aventuras

Beat ’em up arcade en Canvas y JavaScript. Yomvi recorre el Galerías Mall, el Hospital General y la calle de la Burger Room en Maracaibo.

## Jugar en local

Con Node.js 22 o posterior, ejecuta `npm run dev` y abre [http://127.0.0.1:8080](http://127.0.0.1:8080). En Windows también puedes ejecutar `start.bat`: usa Node si está instalado y, si no, Python como servidor estático de respaldo. El servidor Node admite peticiones parciales del video y el audio. Abre el juego por HTTP para que el navegador pueda cargar los módulos y leer los sprites.

- **Ordenador**. Enter inicia y también permite saltar la guía. Muévete con WASD o flechas. Z golpea, X salta, C activa el especial y P o Esc pausa.
- **Móvil**. Gira el teléfono a horizontal. Toca el juego para iniciar y usa el joystick y los botones. Si giras a vertical con una partida activa, se pausa.
- **Pruebas rápidas**. En el título, pulsa 1, 2 o 3 para entrar directamente al nivel correspondiente.

## Trabajar en el juego

| Quiero cambiar… | Dónde empezar |
| --- | --- |
| El arranque, la partida o el paso entre niveles | [src/main.js](src/main.js) y [src/game/game.js](src/game/game.js) |
| Las oleadas, los jefes y los escenarios | [src/levels/](src/levels/) y [registro de niveles](src/levels/index.js) |
| El movimiento, los ataques y la IA compartida | [src/game/player.js](src/game/player.js) y [src/game/enemy.js](src/game/enemy.js) |
| El teclado, el joystick o los botones táctiles | [src/input/](src/input/) |
| Sprites, música y efectos | [src/media/](src/media/) y [assets/](assets/) |
| Las pantallas, el HUD y la interfaz HTML | [src/ui/](src/ui/), [index.html](index.html) y [styles/](styles/) |

`Game.beginStage()` es la entrada común de los tres niveles. Recibe la configuración del registro de niveles, reinicia el estado transitorio y define si conserva el progreso del jugador. Cada nivel guarda sus oleadas en `encounters.js`, su jefe en `boss.js` y sus fondos en `scenery.js`. [Diseño y mecánicas](docs/game-design.md)

```sh
npm ci
npm test
npm run build
npx playwright install chromium webkit
npm run test:browser
```

`npm run build` copia el sitio a `dist/`. Las pruebas de navegador generan un build nuevo y lo sirven en su propio servidor. Para probar una vista previa existente, indica su URL con `YOMVI_BASE_URL`.

## Cloudflare

Si el proyecto existente usa **Cloudflare Pages con Git**, conserva el proyecto y su dominio. En la configuración de compilación usa la raíz del repositorio, Framework **None**, el comando `npm run build` y el directorio de salida `dist`. Para verificar una compilación local, ejecuta `npm run build` y luego `npm run dev -- --dist`. [Integración con Git de Cloudflare Pages](https://developers.cloudflare.com/pages/get-started/git-integration/)

Cloudflare Pages puede servir el MP4 completo cuando el navegador pide un rango. El intro tiene un respaldo para WebKit y se puede omitir mientras se reproduce el video. [Cómo Cloudflare sirve los archivos de Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/)

Si en el panel figura como **Worker**, usa `dist` como directorio de archivos estáticos en la configuración del Worker existente. El juego se sirve como sitio estático. [Configuración de archivos estáticos de Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/binding/)
