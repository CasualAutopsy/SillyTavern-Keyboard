import { STContext as ctx } from '../external/st-context.js';

import { KeyCombo } from '../core/KeyCombo.js';

// load settings
export const settings = Object.assign({
    keyComboList: [],
}, ctx.extension_settings.keyboard);
settings.keyComboList = settings.keyComboList.map(it=>KeyCombo.from(it));

// save settings
export const saveSettings = ()=>{
    settings.keyComboList = KeyCombo.list;
    ctx.extension_settings.keyboard = settings;
    ctx.saveSettingsDebounced();
};
