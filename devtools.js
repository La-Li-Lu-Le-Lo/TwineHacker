"use strict";
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

            const elementFilter = TwineHacker.DOM.getElement("filter");
            elementFilter.addEventListener("keyup", () => TwineHacker.filterSome(elementFilter.value));
            elementFilter.addEventListener("focus", e => e.target.select());
            const elementNoFilter = TwineHacker.DOM.getElement("nofilter");
            elementNoFilter.addEventListener("click", () => {
                elementFilter.value = "";
                TwineHacker.filterSome("");
                elementFilter.focus();
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
        TwineHacker.Util.eval("document.title", title => {
            TwineHacker.DOM.createText(title, "title");
            return TwineHacker.Util.forEach(TwineHacker.engines, (key, expression) =>
                TwineHacker.Util.eval(expression, vars => {
                    if (vars && !TwineHacker.rootExpression) {
                        TwineHacker.messageUi(`Detected ${key}`, "content", "success");
                        TwineHacker.inspected(expression, vars);
                    }
                }, () => {
                    tries--;
                    if (!tries)
                        TwineHacker.messageUi(`No engines detected`, "content", "error");
                }));
        }, ex => TwineHacker.Util.showError(`Cannot access document: ${ex.description}`, ex));

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
                TwineHacker.Util.forEach(TwineHacker.data, path => {
                    TwineHacker.updateFieldValue(path, TwineHacker.getInPath(vars, path.substring(1).split(".")))
                });
                if (TwineHacker.Options.automatic)
                    TwineHacker.scheduleUpdate();
            }, ex =>
                TwineHacker.Util.showError(`Cannot evaluate expr ${TwineHacker.rootExpression}: ${ex.description}`,
                    ex));
    },
    updateField: path => {
        let expression = `${TwineHacker.rootExpression}`;
        const array = path.substring(1).split(".");
        for (const item of array) {
            expression += `['${item}']`;
        }
        TwineHacker.Util.eval(expression, newValue => TwineHacker.updateFieldValue(path, newValue),
            ex => TwineHacker.Util.showError(`Cannot evaluate ${expression}: ${ex.description}`, ex));
    },
    updateFieldValue: (path, newValue) => {
        const item = TwineHacker.data[path];
        const editorValue = TwineHacker.Conv.toEditor(item.type, newValue);
        // noinspection EqualityComparisonWithCoercionJS
        if (item.value != editorValue) {
            if (item.type === "boolean") {
            item.editor.checked = TwineHacker.Conv.toBoolean(item.type, newValue);
            } else {
            item.editor.value = newValue;
            }
            item.value = editorValue;
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
        const id = TwineHacker.getIdForPath(path);
        const type = typeof object;
        switch (type) {
            case "object":
                TwineHacker.DOM.addClass(parent, "multiple");
                const table = TwineHacker.DOM.createElement("table", {
                    "class": "grid object"
                }, parent);
                TwineHacker.Util.forEachSorted(object, (objectName, objectValue) => {
                    const objectPath = `${path}.${objectName}`;
                    const objectId = TwineHacker.getIdForPath(objectPath);
                    const tr = TwineHacker.DOM.createElement("tr", {
                        "id": objectId,
                        "class": "row"
                    }, table);
                    TwineHacker.DOM.createText(objectName.split("_")
                            .map(x => x.charAt(0).toUpperCase() + x.substring(1).split(/(?=[A-Z])/).join(" "))
                            .join(" "),
                        TwineHacker.DOM.createElement("label", {
                                "title": objectPath,
                                "class": /*"label"*/`label ${objectName}`
                            },
                            TwineHacker.DOM.createElement("th", {"class": "cell cell-label"}, tr)));
                    TwineHacker.createUi(objectValue, objectPath,
                        TwineHacker.DOM.createElement("td", {"class": "cell cell-data"}, tr));
                });
                return table;
            case "bigint":
            case "boolean":
            case "number":
            case "string":
                TwineHacker.DOM.addClass(parent, "single");
                const typeBoolean = type === "boolean";
                const tooltipSuffix = typeBoolean ? "?" : ":";
                const tooltip = path.substring(1).split(".")
                    .map(x =>
                        x.charAt(0).toUpperCase()
                        + x.substring(1).split(/(?=[A-Z])/).join(" ").split("_").join(" "))
                    .join(": ") + tooltipSuffix;
                const editor = TwineHacker.DOM.createElement("input", {
                        "type": typeBoolean ? "checkbox" : (type === "number" ? "number" : "text"),
                        "value": typeBoolean ? "true" : object,
                        "class": `editor editor-${type}`,
                        "title": tooltip
                    },
                    parent);
                if (typeBoolean) editor.checked = object;
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
            default:
                return TwineHacker.DOM.createText(`(${type})`,
                    TwineHacker.DOM.createElement("span", {"class": "object-empty"}, parent));
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
        const fromEditorValue = TwineHacker.Conv.fromEditor(data.type, value);
        if (data.value === fromEditorValue) return;
        TwineHacker.updateFieldStyle(path, false);
        let expression = `${TwineHacker.rootExpression}`;
        const array = path.substring(1).split(".");
        for (const item of array) {
            expression += `['${item}']`;
        }
        const expressionValue = TwineHacker.Conv.toExpression(data.type, value);
        expression += `=${expressionValue};`;
        TwineHacker.Util.eval(expression, () => {
            data.value = fromEditorValue;
        }, ex => TwineHacker.Util.showError(`Cannot set value for ${path} as ${expression}: ${ex.description}`, ex));
    },
    updateFieldStyle: (path, changed) => {
        const editor = TwineHacker.data[path].editor;
        if (changed) {
            TwineHacker.DOM.addClass(editor, "changed");
        } else {
            TwineHacker.DOM.removeClass(editor, "changed");
        }
        return editor;
    },
    getIdFor: path => `${path.replace(".", "-").toLowerCase()}`,
    getIdForPath: path => `path-${path.replace(".", "-").toLowerCase()}`,
    filterSome: pattern => {
        TwineHacker.Util.forEach(TwineHacker.data, path => {
            const item = TwineHacker.data[path];
            const id = TwineHacker.getIdForPath(path);
            const element = TwineHacker.DOM.getElement(id);
            if (pattern && element && !id.includes(pattern.toLowerCase())) TwineHacker.DOM.addClass(element, "hidden");
            else {
                TwineHacker.DOM.removeClass(element, "hidden");
            }
        });
        TwineHacker.DOM.applyWithClassOrNot("label", pattern,
            el => TwineHacker.DOM.addClass(el, "highlight"),
            el => TwineHacker.DOM.removeClass(el, "highlight"));
    },
    Conv: {
        fromEditor: (type, value) => {
            switch (type) {
                case "bigint":
                    return parseInt(value);
                case "number":
                    return parseFloat(value);
                case "boolean":
                    return value === "true";
                case "string":
                default:
                    return `${value}`;
            }
        },
        toEditor: (type, value) => {
            switch (type) {
                case "bigint":
                    return `${value}`;
                case "number":
                    return `${value}`;
                case "boolean":
                    return value ? "true" : "false";
                case "string":
                default:
                    return `${value}`;
            }
        },
        toExpression: (type, value) => {
            switch (type) {
                case "bigint":
                    return `${parseInt(value)}`;
                case "number":
                    return `${parseFloat(value)}`;
                case "string":
                    return `'${value.replace("'", "\\'")}'`;
                case "boolean":
                    return value ? "true" : "false";
                default:
                    return `'${value}'`;
            }
        },
        toBoolean: (type, value) => {
            switch (type) {
                case "bigint":
                    return value === 0;
                case "number":
                    return value === 0;
                case "boolean":
                    return !!value;
                case "string":
                    return value === "true" || value === "1";
                default:
                    return `${value}`;
            }
        }
    },
    DOM: {
        window: null,
        construct: window => {
            TwineHacker.DOM.window = window;
        },
        createElement: (tag, attrs, parent) => {
            const element = TwineHacker.DOM.window.document.createElement(tag);
            TwineHacker.Util.forEach(attrs, (key, attrValue) => element.setAttribute(key, attrValue));
            if (parent) TwineHacker.DOM.getElement(parent).appendChild(element);
            return element;
        },
        createText: (text, parent) => {
            const element = TwineHacker.DOM.window.document.createTextNode(`${text}`);
            if (parent) TwineHacker.DOM.getElement(parent).appendChild(element);
            return element;
        },
        getElement: id => typeof id === "string" ? TwineHacker.DOM.window.document.getElementById(id) : id,
        clearElement: element => {
            const e = TwineHacker.DOM.getElement(element);
            // noinspection InnerHTMLJS
            e.innerHTML = "";
            return e;
        },
        addClass: (element, className) => {
            const e = TwineHacker.DOM.getElement(element);
            e.classList.add(className);
            return e;
        },
        removeClass: (element, className) => {
            const e = TwineHacker.DOM.getElement(element);
            e.classList.remove(className);
            return e;
        },
        toggleClass: (element, className) => {
            const e = TwineHacker.DOM.getElement(element);
            e.classList.toggle(className);
            return e;
        },
        applyWithClassOrNot: (element, className, posF, negF) => {
            const els = TwineHacker.DOM.window.document.getElementsByTagName(element);
            for (let i = 0; i < els.length; i++) {
                const el = els.item(i);
                let found = false;
                if(className) {
                    for (const classListElement of el.classList) {
                        found = classListElement.includes(className);
                        if (found) {
                            break;
                        }
                    }
                }
                if (found) {
                    posF(el);
                } else {
                    negF(el);
                }
            }
            return els;
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
        forEachSorted: (array, iterator) => {
            if (array) {
                const keys = [];
                for (const key in array)
                    if (array.hasOwnProperty(key))
                        keys.push(key);
                keys.sort();
                for (const key of keys)
                    iterator(key, array[key]);
            }
            return array;
        },
        showError: (message, info) => alert(`Error: ${message} ${info ? JSON.stringify(info) : ""}`),
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
window.document.addEventListener("DOMContentLoaded", () => TwineHacker.construct());




