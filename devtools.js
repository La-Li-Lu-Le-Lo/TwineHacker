'use strict';
// noinspection SpellCheckingInspection
const TwineHacker = {
    engines: {
        "SugarCube1": "SugarCube.state.active.variables",
        "SugarCube2": "SugarCube.State.active.variables",
        "wetgame": "wetgame.state.story.variablesState._globalVariables"
    },
    Options: {
        interval: 500,
        automatic: true,
        construct: (automatic, interval) => {
            TwineHacker.Options.automatic = automatic;
            TwineHacker.Options.interval = interval;
            const elementAutomatic = TwineHacker.DOM.getElement("automatic");
            elementAutomatic.checked = TwineHacker.Options.automatic;
            elementAutomatic.addEventListener("click", () => {
                TwineHacker.Options.automatic = elementAutomatic.checked;
                TwineHacker.Options.save();
                if (TwineHacker.Options.automatic) TwineHacker.scheduleUpdate();
            });
            const elementInterval = TwineHacker.DOM.getElement("interval");
            elementInterval.value = TwineHacker.Options.interval;
            elementInterval.addEventListener("change", () => {
                TwineHacker.Options.interval = elementInterval.value;
                TwineHacker.Options.save();
            });
            TwineHacker.Options.load(options => {
                if (options.automatic) TwineHacker.Options.automatic = options.automatic;
                elementAutomatic.checked = TwineHacker.Options.automatic;
                if (options.interval) TwineHacker.Options.interval = options.interval;
                elementInterval.value = TwineHacker.Options.interval;
                if (options.automatic) TwineHacker.scheduleUpdate();
            });
        },
        save: () => {
            const storageOptions = {
                automatic: TwineHacker.Options.automatic,
                interval: TwineHacker.Options.interval,
            };
            // noinspection JSUnresolvedVariable
            if (typeof chrome === "undefined") {
                // noinspection JSUnresolvedVariable,ES6ModulesDependencies
                browser.storage.sync.set(storageOptions)
                    .catch(reason => TwineHacker.Util.showError(`Cannot save options`, reason));
            } else { // noinspection JSUnresolvedVariable
                chrome.storage.sync.set(storageOptions, () => {
                });
            }
        },
        load: onOptions => {
            // noinspection JSUnresolvedVariable
            if (typeof chrome === "undefined") {
                // noinspection JSUnresolvedVariable,ES6ModulesDependencies,JSUnresolvedFunction
                browser.storage.sync.get()
                    .then(options => onOptions(options))
                    .catch(reason => TwineHacker.Util.showError(`Cannot load options`, reason));
            } else {
                // noinspection JSUnresolvedVariable
                chrome.storage.sync.get(options => onOptions(options));
            }
        }
    },
    rootExpression: null,
    data: {},
    construct: () =>
        TwineHacker.Util.createPanel("TwineHacker", "icons/16.png", "panel.html",
            TwineHacker.init, TwineHacker.destroy),
    destroy: () => {
        TwineHacker.DOM.clearElement("content");
        TwineHacker.rootExpression = null;
        TwineHacker.data = {};
        TwineHacker.DOM.window = null;
    },
    init: window => {
        TwineHacker.DOM.construct(window);
        // noinspection MagicNumberJS
        TwineHacker.Options.construct(true, 500);
        TwineHacker.DOM.clearElement("content");
        let tries = 0;
        TwineHacker.Util.forEach(TwineHacker.engines, () => {
            // count
            tries++;
        });
        TwineHacker.Util.forEach(TwineHacker.engines, (key, expression) =>
            TwineHacker.Util.eval(expression, vars => {
                if (vars && !TwineHacker.rootExpression) {
                    TwineHacker.messageUi(`Detected ${key}`, TwineHacker.DOM.getElement("content"), "success");
                    TwineHacker.inspected(expression, vars);
                }
            }, () => {
                tries--;
                if (!tries)
                    TwineHacker.messageUi("No engines detected", TwineHacker.DOM.getElement("content"), "error");
            }));
    },
    inspected: (expression, vars) => {
        TwineHacker.rootExpression = expression;
        TwineHacker.data = {};
        TwineHacker.createData(vars, "", TwineHacker.data);
        TwineHacker.createUi(vars, "", TwineHacker.DOM.getElement("content"));
        TwineHacker.scheduleUpdate();
    },
    getInPath: (array, path) => {
        let cur = array;
        for (const pe in path) {
            if (path.hasOwnProperty(pe)) {
                cur = cur[path[pe]];
                if (typeof cur === "undefined" || cur === null) return null;
            }
        }
        return cur;
    },
    updateAllFields: () => {
        if (TwineHacker.DOM.window && TwineHacker.rootExpression)
            TwineHacker.Util.eval(TwineHacker.rootExpression, vars => {
                TwineHacker.Util.forEach(TwineHacker.data, path =>
                    TwineHacker.updateFieldValue(path, TwineHacker.getInPath(vars, path.substring(1).split('.'))));
                if (TwineHacker.Options.automatic)
                    TwineHacker.scheduleUpdate();
            }, ex =>
                TwineHacker.Util.showError(`Cannot evaluate expr ${TwineHacker.rootExpression}: ${ex.description}`,
                    ex));
    },
    updateField: path => {
        let expression = `${TwineHacker.rootExpression}`;
        const array = path.substring(1).split('.');
        for (const item of array) {
            expression += `['${item}']`;
        }
        TwineHacker.Util.eval(expression, newValue => TwineHacker.updateFieldValue(path, newValue),
            ex => TwineHacker.Util.showError(`Cannot evaluate ${expression}: ${ex.description}`, ex));
    },
    updateFieldValue: (path, newValue) => {
        const item = TwineHacker.data[path];
        const typeBoolean = item.type === "boolean";
        const valueChanged = item.value !== newValue;
        if (typeBoolean && valueChanged) {
            item.value = newValue;
            item.editor.checked = newValue;
            TwineHacker.updateFieldStyle(path, true);
        }
        if (!typeBoolean && valueChanged) {
            item.value = newValue;
            item.editor.value = newValue;
            TwineHacker.updateFieldStyle(path, true);
        }
    },
    scheduleUpdate: () =>
        setTimeout(TwineHacker.updateAllFields, TwineHacker.Options.interval),
    messageUi: (message, parent, type) =>
        TwineHacker.DOM.createText(message, TwineHacker.DOM.createElement("div", {
            "class": `message ${type ? `message-${type}` : ""}`,
        }, parent)),
    createUi: (object, path, parent) => {
        const type = typeof object;
        if (type === "object") {
            parent.setAttribute("class", `${parent.getAttribute("class")} multiple`);
            const table = TwineHacker.DOM.createElement("table", {"class": "grid object"}, parent);
            TwineHacker.Util.forEach(object, (objectName, objectValue) => {
                const tr = TwineHacker.DOM.createElement("tr", {"class": "row"}, table);
                TwineHacker.DOM.createText(objectName.split("_")
                        .map(x => x.charAt(0).toUpperCase() + x.substring(1).split(/(?=[A-Z])/).join(" "))
                        .join(" "),
                    TwineHacker.DOM.createElement("label", {"class": "label"},
                        TwineHacker.DOM.createElement("th", {"class": "cell cell-label"}, tr)));
                TwineHacker.createUi(objectValue, `${path}.${objectName}`,
                    TwineHacker.DOM.createElement("td", {"class": "cell cell-data"}, tr));
            });
            return table;
        } else {
            parent.setAttribute("class", `${parent.getAttribute("class")} single`);
            const typeBoolean = type === "boolean";
            const tooltip = path.substring(1).split('.')
                .map(x =>
                    x.charAt(0).toUpperCase()
                    + x.substring(1).split(/(?=[A-Z])/).join(" ").split("_").join(" "))
                .join(": ");
            const tooltipSuffix = typeBoolean ? "?" : ":";
            const editor = TwineHacker.DOM.createElement("input", {
                    "type": typeBoolean ? "checkbox" : (type === "number" ? "number" : "text"),
                    "value": typeBoolean ? "true" : object,
                    "class": `editor editor-${type}`,
                    "title": tooltip + tooltipSuffix
                },
                parent);
            TwineHacker.data[path].editor = editor;
            editor.addEventListener("change", e =>
                TwineHacker.onEdit(path, typeBoolean ? e.target.checked : e.target.value));
            editor.addEventListener("focus", e => {
                e.target.select();
                TwineHacker.updateField(path);
                TwineHacker.updateFieldStyle(path, false);
            });
            if (typeBoolean)
                editor.addEventListener("click", e =>
                    TwineHacker.onEdit(path, typeBoolean ? e.target.checked : e.target.value));
            editor.addEventListener("blur", e =>
                TwineHacker.onEdit(path, typeBoolean ? e.target.checked : e.target.value));
            return editor;
        }
    },
    createData: (object, path, data) => {
        const type = typeof object;
        if (type === "object")
            TwineHacker.Util.forEach(object, (objectName, objectValue) =>
                TwineHacker.createData(objectValue, `${path}.${objectName}`, data));
        else
            data[path] = {path, type, editor: null, "value": object};
    },
    onEdit: (path, value) => {
        const data = TwineHacker.data[path];
        if (data.value === value) return;
        TwineHacker.updateFieldStyle(path, false);
        let expression = `${TwineHacker.rootExpression}`;
        const array = path.substring(1).split('.');
        for (const item of array) {
            expression += `['${item}']`;
        }
        let expressionValue = `'${value}'`;
        switch (data.type) {
            case "number":
                expressionValue = `${parseFloat(value)}`;
                break;
            case "string":
                expressionValue = `'${value.replace("'", "\\'")}'`;
                break;
            case "boolean":
                expressionValue = `${value}`;
                break;
            default:
                break;
        }
        expression += `=${expressionValue};`;
        TwineHacker.Util.eval(expression, () => {
            data.value = value;
        }, ex => TwineHacker.Util.showError(`Cannot set value for ${path} as ${expression}: ${ex.description}`, ex));
    },
    updateFieldStyle: (path, changed) => {
        TwineHacker.data[path].editor.className = changed;
        return changed ? "changed" : "";
    },
    DOM: {
        window: null,
        construct: window => {
            TwineHacker.DOM.window = window;
        },
        createElement: (tag, attrs, parent) => {
            const element = TwineHacker.DOM.window.document.createElement(tag);
            TwineHacker.Util.forEach(attrs, (key, attrValue) => element.setAttribute(key, attrValue));
            if (parent) parent.appendChild(element);
            return element;
        },
        createText: (text, parent) => {
            const element = TwineHacker.DOM.window.document.createTextNode(`${text}`);
            if (parent) parent.appendChild(element);
            return element;
        },
        getElement: id => TwineHacker.DOM.window.document.getElementById(id),
        clearElement: id => {
            // noinspection InnerHTMLJS
            TwineHacker.DOM.getElement(id).innerHTML = "";
        }
    },
    Util: {
        forEach: (array, iterator) => {
            if (array)
                for (const key in array)
                    if (array.hasOwnProperty(key))
                        iterator(key, array[key]);
            return array;
        },
        showError: (message, info) => alert(`Error: ${message} ${info ? JSON.stringify(info) : ''}`),
        eval: (expression, onSuccess, onError) => {
            // noinspection JSUnresolvedVariable
            if (typeof chrome === "undefined") {
                // noinspection JSUnresolvedVariable,ES6ModulesDependencies
                browser.devtools.inspectedWindow.eval(expression)
                    .then(result => {
                        if (onSuccess) onSuccess(result);
                    })
                    .catch(exception => {
                        if (onError) onError(exception);
                    });
            } else {
                // noinspection JSUnresolvedVariable
                chrome.devtools.inspectedWindow.eval(expression, (result, exception) => {
                    if (exception) {
                        if (onError) onError(exception);
                    } else {
                        if (onSuccess) onSuccess(result);
                    }
                });
            }
        },
        createPanel: (title, icon, page, onShown, onHidden) => {
            // noinspection JSUnresolvedVariable
            if (typeof chrome === "undefined") {
                // noinspection JSUnresolvedVariable,ES6ModulesDependencies
                browser.devtools.panels.create(title, icon, page)
                    .then(panel => {
                        // noinspection JSUnresolvedVariable,JSDeprecatedSymbols
                        panel.onShown.addListener(onShown);
                        // noinspection JSUnresolvedVariable,JSDeprecatedSymbols
                        panel.onHidden.addListener(onHidden);
                    });
            } else {
                // noinspection JSUnresolvedVariable
                chrome.devtools.panels.create(title, icon, page,
                    panel => {
                        // noinspection JSUnresolvedVariable,JSDeprecatedSymbols
                        panel.onShown.addListener(onShown);
                        // noinspection JSUnresolvedVariable,JSDeprecatedSymbols
                        panel.onHidden.addListener(onHidden);
                    });
            }
        }
    }
};
window.document.addEventListener('DOMContentLoaded', () => TwineHacker.construct());




