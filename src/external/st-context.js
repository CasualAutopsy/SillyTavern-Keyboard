import { is_send_press, sendTextareaMessage } from '/script.js';
import { SlashCommandClosure } from '/scripts/slash-commands/SlashCommandClosure.js';
import { SlashCommandScope } from '/scripts/slash-commands/SlashCommandScope.js';
import { isTrueBoolean, getSortableDelay } from '/scripts/utils.js';
import { quickReplyApi } from '/scripts/extensions/quick-reply/index.js';

const {
    extensionSettings, saveSettingsDebounced,
    SlashCommandParser, SlashCommand,
    Popup, POPUP_TYPE,
    accountStorage
} = SillyTavern.getContext();

/**
 * @import {} from '../../global'
 */

const STContext = {
    is_send_press, saveSettingsDebounced, sendTextareaMessage,
    extension_settings: extensionSettings,
    Popup, POPUP_TYPE,
    SlashCommand,
    SlashCommandClosure,
    SlashCommandParser,
    SlashCommandScope,
    accountStorage,
    isTrueBoolean, getSortableDelay,
    quickReplyApi
};

export { STContext };
