import { STContext as ctx } from './external/st-context.js';

import { settings, saveSettings } from './core/settings.js';

import { Callback } from './core/Callback.js';
import { KeyCombo } from './core/KeyCombo.js';


// restore combo list
KeyCombo.list.push(...settings.keyComboList);

const block = [];

/**
 * @param {KeyboardEvent} evt
 */
const handleShortcut = async(evt)=>{
    if (ctx.Popup.util.isPopupOpen()) return;
    for (const combo of KeyCombo.list) {
        if (!combo.test(evt)) continue;
        console.log('[STKC]', `${combo}`, combo);
        block.push(combo.key);
        const stop = await combo.execute(evt);
        if (stop) break;
    }
};

/**
 * @param {KeyboardEvent} evt
 */
const handleKeyup = async(evt)=>{
    if (block.includes(evt.key)) {
        console.log('[STKC]', 'blocking keyup', evt.key);
        evt.preventDefault();
        evt.stopPropagation();
        evt.stopImmediatePropagation();
        block.splice(block.indexOf(evt.key), 1);
    }
};




const init = async()=>{
    Callback.add({ id: 'send',
        label: 'Send chat message',
        check: ()=>document.activeElement.id == 'send_textarea',
        callback: async(evt)=>{
            evt.preventDefault();
            ctx.sendTextareaMessage();
        },
    });
    Callback.add({ id: 'context_line',
        label: 'Scroll to context line',
        check: ()=>true,
        callback: async(evt)=>{
            evt.preventDefault();
            const line = document.querySelector('.lastInContext');
            if (line) {
                line.scrollIntoView({ behavior:'smooth', block:'center' });
            } else {
                toastr.warning('Context line not found, send a message first!');
            }
        },
    });
    Callback.add({ id: 'scroll_bottom',
        label: 'Scroll to bottom of chat',
        check: ()=>true,
        callback: async(evt)=>{
            const chat = document.querySelector('#chat');
            chat.scrollTo({
                behavior: 'smooth',
                top: chat.scrollHeight,
            });
        },
    });
    Callback.add({ id: 'continue',
        label: 'Continue',
        check: ()=>true,
        callback: async(evt)=>{
            /**@type {HTMLElement}*/(document.querySelector('#option_continue')).click();
        },
    });
    Callback.add({ id: 'regenerate',
        label: 'Regenerate last response',
        check: ()=>!document.querySelector('#curEditTextarea') && !ctx.is_send_press,
        callback: async(evt)=>{
            const skipConfirmKey = 'RegenerateWithCtrlEnter';
            const skipConfirm = ctx.accountStorage.getItem(skipConfirmKey) === 'true';
            function doRegenerate() {
                console.debug('Regenerating with Ctrl+Enter');
                $('#option_regenerate').trigger('click');
                $('#options').hide();
            }
            if (skipConfirm) {
                doRegenerate();
            } else {
                let regenerateWithCtrlEnter = false;
                const result = await ctx.Popup.show.confirm('Regenerate Message', 'Are you sure you want to regenerate the latest message?', {
                    customInputs: [{ id: 'regenerateWithCtrlEnter', label: 'Don\'t ask again' }],
                    onClose: (popup) => {
                        regenerateWithCtrlEnter = popup.inputResults.get('regenerateWithCtrlEnter') ?? false;
                    },
                });
                if (!result) {
                    return;
                }

                ctx.accountStorage.setItem(skipConfirmKey, String(regenerateWithCtrlEnter));
                doRegenerate();
            }
        },
    });
    Callback.add(({ id: 'accept_edit',
        label: 'Accept message edit',
        check: ()=>document.activeElement.id == 'curEditTextarea',
        callback: async(evt)=>{
            document.activeElement.closest('.mes_block').querySelector('.mes_edit_done').click();
        },
    }));

    document.body.addEventListener('keydown', async(evt)=>handleShortcut(evt));
    document.body.addEventListener('keyup', async(evt)=>handleKeyup(evt));

    ctx.SlashCommandParser.addCommandObject(ctx.SlashCommand.fromProps({ name: 'keyboard',
        callback: async(args, value)=>{
            const dom = document.createElement('div'); {
                dom.classList.add('stkc--settings');
                const h3 = document.createElement('h3'); {
                    h3.textContent = 'Keyboard Shortcuts';
                    dom.append(h3);
                }
                const hint = document.createElement('small'); {
                    hint.textContent = 'Shortcuts are evaluated from top to bottom. Evaluation stops after the first shortcut triggers (in case of QRs only if the QR sets stop to true).';
                    dom.append(hint);
                }
                const list = document.createElement('div'); {
                    list.classList.add('stkc--list');
                    $(list).sortable({
                        handle: '.stkc--dragHandle',
                        delay: ctx.getSortableDelay(),
                        stop: ()=>{
                            const items = [...list.children];
                            KeyCombo.list.sort((a, b)=>items.indexOf(a.dom.root) - items.indexOf(b.dom.root));
                            saveSettings();
                        },
                    });
                    for (const combo of KeyCombo.list) {
                        list.append(combo.render());
                    }
                    dom.append(list);
                }
                const actions = document.createElement('div'); {
                    actions.classList.add('stkc--actions');
                    const add = document.createElement('div'); {
                        add.classList.add('stkc--add');
                        add.classList.add('menu_button');
                        add.classList.add('fa-solid', 'fa-fw', 'fa-plus');
                        add.title = 'Create new keyboard shortcut';
                        add.addEventListener('click', ()=>{
                            const combo = new KeyCombo();
                            KeyCombo.list.push(combo);
                            list.append(combo.render());
                        });
                        actions.append(add);
                    }
                    dom.append(actions);
                }
            }
            const dlg = new ctx.Popup(dom, ctx.POPUP_TYPE.TEXT, null, {
                wider: true,
                allowVerticalScrolling: true,
            });
            await dlg.show();
            return '';
        },
    }));
};
init();

globalThis.Keyboard = {
    Callback
};
