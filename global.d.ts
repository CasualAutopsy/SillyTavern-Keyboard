import '../../../../global';

import { Callback } from './src/core/Callback.js';

declare global {
    var Keyboard: {
        Callback: typeof Callback;
    };
}

export {};
