
import './style.css';

import { createCorridor } from './scene/corridor.js';

const container = document.getElementById(
    'scene-container'
);

let cleanup;

if (container) {
    cleanup = createCorridor(container);
}

// Respect reduced-motion preferences by avoiding
// automatic camera animation for now.

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        cleanup?.();
    });
}
