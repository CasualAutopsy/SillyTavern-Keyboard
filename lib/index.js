// src/external/st-context.js
import { is_send_press, sendTextareaMessage } from "/script.js";
import { SlashCommandClosure } from "/scripts/slash-commands/SlashCommandClosure.js";
import { SlashCommandScope } from "/scripts/slash-commands/SlashCommandScope.js";
import { isTrueBoolean, getSortableDelay } from "/scripts/utils.js";
import { quickReplyApi } from "/scripts/extensions/quick-reply/index.js";
var {
  extensionSettings,
  saveSettingsDebounced,
  SlashCommandParser,
  SlashCommand,
  Popup,
  POPUP_TYPE,
  accountStorage
} = SillyTavern.getContext();
var STContext = {
  is_send_press,
  saveSettingsDebounced,
  sendTextareaMessage,
  extension_settings: extensionSettings,
  Popup,
  POPUP_TYPE,
  SlashCommand,
  SlashCommandClosure,
  SlashCommandParser,
  SlashCommandScope,
  accountStorage,
  isTrueBoolean,
  getSortableDelay,
  quickReplyApi
};

// src/core/Callback.js
var Callback = class {
  /**@type {{[id:string]:Callback}} */
  static index = {};
  /**
   *
   * @param {object} props
   * @param {string} props.id Unique ID for the callback.
   * @param {string} props.label Label displayed in the UI.
   * @param {(evt:KeyboardEvent)=>boolean} [props.check] Function that must return true when the shortcut should be triggered, false when not. If no function is provided the shortcut will always trigger (equivalent to ()=>true). Example: "Accept message edit" should only trigger if a message is currently being edited.
   * @param {(evt:KeyboardEvent)=>Promise} props.callback Function to execute when the shortcut is triggered.
   */
  static add(props) {
    const instance = new this();
    instance.id = props.id;
    instance.label = props.label;
    instance.check = props.check ?? (() => true);
    instance.callback = props.callback;
    this.index[instance.id] = instance;
  }
  /**@type {string} */
  id;
  /**@type {string} */
  label;
  /**@type {(evt:KeyboardEvent)=>boolean} */
  check;
  /**@type {(evt:KeyboardEvent)=>Promise} */
  callback;
};

// src/core/KeyCombo.js
var COMBO_ACTION = {
  DEFAULT: "default",
  NOTHING: "nothing",
  SCRIPT: "script",
  CALLBACK: "callback"
};
var KeyCombo = class _KeyCombo {
  /**@type {KeyCombo[]} */
  static list = [];
  /**
   * @param {object} props
   * @returns {KeyCombo}
   */
  static from(props) {
    const instance = Object.assign(new this(), props);
    return instance;
  }
  /**@type {boolean} */
  ctrlKey = false;
  /**@type {boolean} */
  shiftKey = false;
  /**@type {boolean} */
  altKey = false;
  /**@type {string} */
  key;
  /**@type {boolean} */
  stop = true;
  /**@type {COMBO_ACTION} */
  action = COMBO_ACTION.NOTHING;
  /**@type {string} */
  scriptSet;
  /**@type {string} */
  scriptQr;
  /**@type {string} */
  scriptLabel;
  /**@type {string} */
  #script;
  /**@type {string} */
  callbackId;
  dom = {
    /**@type {HTMLElement} */
    root: void 0,
    /**@type {HTMLElement} */
    keys: void 0
  };
  get script() {
    return this.#script;
  }
  set script(value) {
    this.#script = value;
    if (value) {
    } else {
      this.closure = null;
    }
  }
  /**@type {SlashCommandClosure} */
  closure;
  get callback() {
    if (!this.callbackId) return null;
    return Callback.index[this.callbackId];
  }
  toString() {
    return [
      this.ctrlKey ? "[Ctrl]" : false,
      this.shiftKey ? "[Shift]" : false,
      this.altKey ? "[Alt]" : false,
      `[${this.key}]`
    ].filter((it) => it).join("+");
  }
  toJSON() {
    return {
      ctrlKey: this.ctrlKey,
      shiftKey: this.shiftKey,
      altKey: this.altKey,
      key: this.key,
      stop: this.stop,
      action: this.action,
      scriptSet: this.scriptSet,
      scriptQr: this.scriptQr,
      scriptLabel: this.scriptLabel,
      script: this.script,
      callbackId: this.callbackId
    };
  }
  render() {
    if (!this.dom.root) {
      const root = document.createElement("div");
      {
        this.dom.root = root;
        root.classList.add("stkc--item");
        const dragHandle = document.createElement("div");
        {
          dragHandle.classList.add("stkc--dragHandle");
          dragHandle.textContent = "\u2261";
          root.append(dragHandle);
        }
        const keys = document.createElement("div");
        {
          this.dom.keys = keys;
          keys.classList.add("stkc--combo");
          keys.classList.add("text_pole");
          keys.title = "Click to change keyboard shortcut";
          this.renderKeys();
          let isEditing = false;
          keys.addEventListener("click", () => {
            if (isEditing) {
              return;
            }
            isEditing = true;
            keys.classList.add("stkc--isEditing");
            keys.innerHTML = "";
            const combo = { ctrlKey: false, shiftKey: false, altKey: false, key: "" };
            const keyDownListener = (evt) => {
              if (evt.key == "Meta") return;
              if (evt.altKey && evt.key == "Tab") return;
              evt.stopPropagation();
              evt.stopImmediatePropagation();
              evt.preventDefault();
              switch (evt.key) {
                case "Control": {
                  combo.ctrlKey = true;
                  break;
                }
                case "Shift": {
                  combo.shiftKey = true;
                  break;
                }
                case "AltGraph":
                case "Alt": {
                  combo.altKey = true;
                  break;
                }
                default: {
                  combo.key = evt.key;
                  break;
                }
              }
              this.renderKeys(combo);
            };
            const keyUpListener = (evt) => {
              if (evt.key == "Meta") return;
              if (evt.altKey && evt.key == "Tab") return;
              evt.stopPropagation();
              evt.stopImmediatePropagation();
              evt.preventDefault();
              switch (evt.key) {
                case "Control": {
                  combo.ctrlKey = false;
                  break;
                }
                case "Shift": {
                  combo.shiftKey = false;
                  break;
                }
                case "AltGraph":
                case "Alt": {
                  combo.altKey = false;
                  break;
                }
                default: {
                  combo.key = evt.key;
                  isEditing = false;
                  Object.assign(this, combo);
                  saveSettings();
                  keys.classList.remove("stkc--isEditing");
                  document.body.removeEventListener("keydown", keyDownListener);
                  document.body.removeEventListener("keyup", keyUpListener);
                  break;
                }
              }
              this.renderKeys(combo);
            };
            document.body.addEventListener("keydown", keyDownListener);
            document.body.addEventListener("keyup", keyUpListener);
          });
          root.append(keys);
        }
        const action = document.createElement("select");
        {
          action.classList.add("stkc--action");
          const opts = [
            { key: COMBO_ACTION.DEFAULT, label: "System default", description: "Perform default system action (block default SillyTavern keyboard shortcut)" },
            { key: COMBO_ACTION.NOTHING, label: "Nothing", description: "Block default system action and default SillyTavern keyboard shortcut" },
            { key: COMBO_ACTION.SCRIPT, label: "STscript", description: 'Execute STscript, set "/var stop true" to block further keyboard shortcuts (block default system action and default SillyTavern keyboard shortcut)' },
            { key: COMBO_ACTION.CALLBACK, label: "ST Action", description: "Perform a SillyTavern function (block default system action and default SillyTavern keyboard shortcut)" }
          ];
          action.title = `Type of action to perform
---
${opts.map((it) => `${it.label} - ${it.description}`).join("\n")}`;
          action.addEventListener("change", () => {
            this.action = action.value;
            saveSettings();
          });
          for (const o of opts) {
            const opt = document.createElement("option");
            {
              opt.value = o.key;
              opt.textContent = o.label;
              action.append(opt);
            }
          }
          action.value = this.action;
          root.append(action);
        }
        const script = document.createElement("div");
        {
          script.classList.add("stkc--script");
          const set = document.createElement("select");
          {
            set.addEventListener("change", () => {
              this.scriptSet = set.value;
              saveSettings();
              updateQrOptions();
            });
            const blank = document.createElement("option");
            {
              blank.value = "";
              blank.textContent = "-- Select QR Set --";
              set.append(blank);
            }
            for (const s of STContext.quickReplyApi.listSets()) {
              const opt = document.createElement("option");
              {
                opt.value = s;
                opt.textContent = s;
                set.append(opt);
              }
            }
            set.value = this.scriptSet;
            script.append(set);
          }
          const updateQrOptions = () => {
            qr.innerHTML = "";
            const blank = document.createElement("option");
            {
              blank.value = "";
              blank.textContent = "-- Select QR --";
              qr.append(blank);
            }
            if (set.value) {
              for (const s of STContext.quickReplyApi.listQuickReplies(set.value)) {
                const opt = document.createElement("option");
                {
                  opt.value = s;
                  opt.textContent = s;
                  qr.append(opt);
                }
              }
              qr.value = this.scriptQr;
              qr.dispatchEvent(new Event("change"));
            }
          };
          const qr = document.createElement("select");
          {
            qr.addEventListener("change", () => {
              this.scriptQr = qr.value;
              this.script = STContext.quickReplyApi.getQrByLabel(this.scriptSet, this.scriptQr)?.message;
              saveSettings();
            });
            updateQrOptions();
            script.append(qr);
          }
          const edit = document.createElement("div");
          {
            edit.classList.add("stkc--edit");
            edit.classList.add("menu_button");
            edit.classList.add("fa-solid", "fa-fw", "fa-code");
            edit.addEventListener("click", () => {
              STContext.quickReplyApi.getQrByLabel(this.scriptSet, this.scriptQr)?.showEditor();
            });
            script.append(edit);
          }
          root.append(script);
        }
        const callbackId = document.createElement("select");
        {
          callbackId.classList.add("stkc--callback");
          callbackId.addEventListener("change", () => {
            this.callbackId = callbackId.value;
            saveSettings();
          });
          for (const c of Object.values(Callback.index)) {
            const opt = document.createElement("option");
            {
              opt.value = c.id;
              opt.textContent = c.label;
              callbackId.append(opt);
            }
          }
          callbackId.value = this.callbackId;
          root.append(callbackId);
        }
        const spacer = document.createElement("div");
        {
          spacer.classList.add("stkc--spacer");
          root.append(spacer);
        }
        const actions = document.createElement("div");
        {
          actions.classList.add("actions");
          const remove = document.createElement("div");
          {
            remove.classList.add("stkc--remove");
            remove.classList.add("menu_button");
            remove.classList.add("fa-solid", "fa-fw", "fa-trash-can");
            remove.title = "Remove keyboard shortcut";
            remove.addEventListener("click", () => {
              _KeyCombo.list.splice(_KeyCombo.list.indexOf(this), 1);
              saveSettings();
              this.dom.root.remove();
            });
            actions.append(remove);
          }
          root.append(actions);
        }
      }
    }
    return this.dom.root;
  }
  renderKeys(combo) {
    combo = combo ?? this;
    this.dom.keys.innerHTML = "";
    if (combo.ctrlKey) {
      const key = document.createElement("kbd");
      {
        key.classList.add("stkc--key");
        key.textContent = "Ctrl";
        this.dom.keys.append(key);
      }
    }
    if (combo.shiftKey) {
      const key = document.createElement("kbd");
      {
        key.classList.add("stkc--key");
        key.textContent = "Shift";
        this.dom.keys.append(key);
      }
    }
    if (combo.altKey) {
      const key = document.createElement("kbd");
      {
        key.classList.add("stkc--key");
        key.textContent = "Alt";
        this.dom.keys.append(key);
      }
    }
    if (combo.key?.length) {
      const map = {
        "ArrowRight": "\u2192",
        "ArrowLeft": "\u2190",
        "ArrowDown": "\u2193",
        "ArrowUp": "\u2191",
        " ": "Space"
      };
      const key = document.createElement("kbd");
      {
        key.classList.add("stkc--key");
        key.textContent = map[combo.key] ?? combo.key;
        this.dom.keys.append(key);
      }
    }
  }
  /**
   *
   * @param {KeyboardEvent} evt
   */
  test(evt) {
    return evt.ctrlKey == this.ctrlKey && evt.shiftKey == this.shiftKey && evt.altKey == this.altKey && evt.key == this.key;
  }
  /**
   * @param {KeyboardEvent} evt
   */
  async execute(evt) {
    switch (this.action) {
      case COMBO_ACTION.DEFAULT: {
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        return true;
      }
      case COMBO_ACTION.NOTHING: {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        return true;
      }
      case COMBO_ACTION.CALLBACK: {
        const check = this.callback?.check(evt);
        if (!check) return false;
        evt.preventDefault();
        evt.stopImmediatePropagation();
        evt.stopPropagation();
        await this.callback?.callback(evt);
        return true;
      }
      case COMBO_ACTION.SCRIPT: {
        const msg = STContext.quickReplyApi.getQrByLabel(this.scriptSet, this.scriptQr)?.message;
        if (msg) {
          evt.preventDefault();
          evt.stopImmediatePropagation();
          evt.stopPropagation();
          const parser = new STContext.SlashCommandParser();
          const scope = new STContext.SlashCommandScope();
          scope.letVariable("stop", "false");
          this.closure = parser.parse(msg);
          this.closure.scope.parent = scope;
          await this.closure.execute();
          return STContext.isTrueBoolean(this.closure.scope.getVariable("stop"));
        }
        return false;
      }
      default: {
        throw new Error("What?");
      }
    }
  }
};

// src/core/settings.js
var settings = Object.assign({
  keyComboList: []
}, STContext.extension_settings.keyboard);
settings.keyComboList = settings.keyComboList.map((it) => KeyCombo.from(it));
var saveSettings = () => {
  settings.keyComboList = KeyCombo.list;
  STContext.extension_settings.keyboard = settings;
  STContext.saveSettingsDebounced();
};

// src/index.js
KeyCombo.list.push(...settings.keyComboList);
var block = [];
var handleShortcut = async (evt) => {
  if (STContext.Popup.util.isPopupOpen()) return;
  for (const combo of KeyCombo.list) {
    if (!combo.test(evt)) continue;
    console.log("[STKC]", `${combo}`, combo);
    block.push(combo.key);
    const stop = await combo.execute(evt);
    if (stop) break;
  }
};
var handleKeyup = async (evt) => {
  if (block.includes(evt.key)) {
    console.log("[STKC]", "blocking keyup", evt.key);
    evt.preventDefault();
    evt.stopPropagation();
    evt.stopImmediatePropagation();
    block.splice(block.indexOf(evt.key), 1);
  }
};
var init = async () => {
  Callback.add({
    id: "send",
    label: "Send chat message",
    check: () => document.activeElement.id == "send_textarea",
    callback: async (evt) => {
      evt.preventDefault();
      STContext.sendTextareaMessage();
    }
  });
  Callback.add({
    id: "context_line",
    label: "Scroll to context line",
    check: () => true,
    callback: async (evt) => {
      evt.preventDefault();
      const line = document.querySelector(".lastInContext");
      if (line) {
        line.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        toastr.warning("Context line not found, send a message first!");
      }
    }
  });
  Callback.add({
    id: "scroll_bottom",
    label: "Scroll to bottom of chat",
    check: () => true,
    callback: async (evt) => {
      const chat = document.querySelector("#chat");
      chat.scrollTo({
        behavior: "smooth",
        top: chat.scrollHeight
      });
    }
  });
  Callback.add({
    id: "continue",
    label: "Continue",
    check: () => true,
    callback: async (evt) => {
      document.querySelector("#option_continue").click();
    }
  });
  Callback.add({
    id: "regenerate",
    label: "Regenerate last response",
    check: () => !document.querySelector("#curEditTextarea") && !STContext.is_send_press,
    callback: async (evt) => {
      const skipConfirmKey = "RegenerateWithCtrlEnter";
      const skipConfirm = STContext.accountStorage.getItem(skipConfirmKey) === "true";
      function doRegenerate() {
        console.debug("Regenerating with Ctrl+Enter");
        $("#option_regenerate").trigger("click");
        $("#options").hide();
      }
      if (skipConfirm) {
        doRegenerate();
      } else {
        let regenerateWithCtrlEnter = false;
        const result = await STContext.Popup.show.confirm("Regenerate Message", "Are you sure you want to regenerate the latest message?", {
          customInputs: [{ id: "regenerateWithCtrlEnter", label: "Don't ask again" }],
          onClose: (popup) => {
            regenerateWithCtrlEnter = popup.inputResults.get("regenerateWithCtrlEnter") ?? false;
          }
        });
        if (!result) {
          return;
        }
        STContext.accountStorage.setItem(skipConfirmKey, String(regenerateWithCtrlEnter));
        doRegenerate();
      }
    }
  });
  Callback.add({
    id: "accept_edit",
    label: "Accept message edit",
    check: () => document.activeElement.id == "curEditTextarea",
    callback: async (evt) => {
      document.activeElement.closest(".mes_block").querySelector(".mes_edit_done").click();
    }
  });
  document.body.addEventListener("keydown", async (evt) => handleShortcut(evt));
  document.body.addEventListener("keyup", async (evt) => handleKeyup(evt));
  STContext.SlashCommandParser.addCommandObject(STContext.SlashCommand.fromProps({
    name: "keyboard",
    callback: async (args, value) => {
      const dom = document.createElement("div");
      {
        dom.classList.add("stkc--settings");
        const h3 = document.createElement("h3");
        {
          h3.textContent = "Keyboard Shortcuts";
          dom.append(h3);
        }
        const hint = document.createElement("small");
        {
          hint.textContent = "Shortcuts are evaluated from top to bottom. Evaluation stops after the first shortcut triggers (in case of QRs only if the QR sets stop to true).";
          dom.append(hint);
        }
        const list = document.createElement("div");
        {
          list.classList.add("stkc--list");
          $(list).sortable({
            handle: ".stkc--dragHandle",
            delay: STContext.getSortableDelay(),
            stop: () => {
              const items = [...list.children];
              KeyCombo.list.sort((a, b) => items.indexOf(a.dom.root) - items.indexOf(b.dom.root));
              saveSettings();
            }
          });
          for (const combo of KeyCombo.list) {
            list.append(combo.render());
          }
          dom.append(list);
        }
        const actions = document.createElement("div");
        {
          actions.classList.add("stkc--actions");
          const add = document.createElement("div");
          {
            add.classList.add("stkc--add");
            add.classList.add("menu_button");
            add.classList.add("fa-solid", "fa-fw", "fa-plus");
            add.title = "Create new keyboard shortcut";
            add.addEventListener("click", () => {
              const combo = new KeyCombo();
              KeyCombo.list.push(combo);
              list.append(combo.render());
            });
            actions.append(add);
          }
          dom.append(actions);
        }
      }
      const dlg = new STContext.Popup(dom, STContext.POPUP_TYPE.TEXT, null, {
        wider: true,
        allowVerticalScrolling: true
      });
      await dlg.show();
      return "";
    }
  }));
};
init();
globalThis.Keyboard = {
  Callback
};
