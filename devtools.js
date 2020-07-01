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
        construct: () => {
            const automatic = TwineHacker.DOM.getElement("automatic");
            const interval = TwineHacker.DOM.getElement("interval");
            automatic.checked = TwineHacker.Options.automatic;
            automatic.addEventListener("click", () => {
                TwineHacker.Options.automatic = automatic.checked;
                if (TwineHacker.Options.automatic) TwineHacker.scheduleUpdate();
            });
            interval.value = TwineHacker.Options.interval;
            interval.addEventListener("change", () => {
                TwineHacker.Options.interval = interval.value;
            });
        },
    },
    rootExpression: null,
    data: {},
    construct: () =>
        TwineHacker.Util.createPanel("TwineHacker", "icons/16.png", "panel.html",
            TwineHacker.init, TwineHacker.destroy),
    destroy: () => {
        TwineHacker.DOM.clearElement("content");
        TwineHacker.data = {};
        TwineHacker.rootExpression = null;
        TwineHacker.DOM.window = null;
    },
    init: win => {
        TwineHacker.DOM.window = win;
        TwineHacker.Options.construct();
        TwineHacker.DOM.clearElement("content");
        TwineHacker.Util.forEach(TwineHacker.engines, (key, expression) =>
            TwineHacker.Util.eval(expression, vars => {
                if (vars && !TwineHacker.rootExpression) {
                    TwineHacker.inspected(expression, vars);
                }
            }));
    },
    inspected: (expression, vars) => {
        TwineHacker.rootExpression = expression;
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
    updateAllFields: () =>
        TwineHacker.Util.eval(TwineHacker.rootExpression, vars => {
            TwineHacker.Util.forEach(TwineHacker.data, (path, element) => {
                TwineHacker.updateFieldValue(path, TwineHacker.getInPath(vars, path.substring(1).split('.')));
            });
            if (TwineHacker.Options.automatic)
                TwineHacker.scheduleUpdate();
        }, ex =>
            TwineHacker.Util.showError(`Cannot evaluate expr ${TwineHacker.rootExpression}: ${ex.description}`, ex)),
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
        if (item.value !== newValue) {
            item.value = newValue;
            item.editor.value = newValue;
            TwineHacker.updateFieldStyle(path, true);
        }
    },
    scheduleUpdate: () =>
        setTimeout(TwineHacker.updateAllFields, TwineHacker.Options.interval),
    createUi: (object, path, parent) => {
        if (typeof object === "object") {
            parent.setAttribute("class", `${parent.getAttribute("class")} multiple`);
            const table = TwineHacker.DOM.createElement("table", {"class": "object"}, parent);
            TwineHacker.Util.forEach(object, (objectName, objectValue) => {
                const tr = TwineHacker.DOM.createElement("tr", {"class": "row"}, table);
                TwineHacker.DOM.createText(objectName.split("_")
                        .map(x => x.charAt(0).toUpperCase() + x.substring(1).split(/(?=[A-Z])/).join(" "))
                        .join(" "),
                    TwineHacker.DOM.createElement("th", {"class": "label"}, tr));
                TwineHacker.createUi(objectValue, `${path}.${objectName}`,
                    TwineHacker.DOM.createElement("td", {"class": "cell"}, tr));
            });
            return table;
        } else {
            parent.setAttribute("class", `${parent.getAttribute("class")} single`);
            const span = TwineHacker.DOM.createElement("span", {
                "class": "single-span",
                "title": path.substring(1).split('.')
                    .map(x =>
                        x.charAt(0).toUpperCase()
                        + x.substring(1).split(/(?=[A-Z])/).join(" ").split("_").join(" "))
                    .join(": ")
            }, parent);
            const editor = TwineHacker.DOM.createElement("input", {
                    "type": typeof object === "number" ? "number" : "text",
                    "value": object
                },
                span);
            TwineHacker.data[path].editor = editor;
            editor.addEventListener("change", e => TwineHacker.onEdit(path, e.target.value));
            editor.addEventListener("focus", () => {
                TwineHacker.updateField(path);
                TwineHacker.updateFieldStyle(path, false);
            });
            editor.addEventListener("blur", e => TwineHacker.onEdit(path, e.target.value));
            return span;
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
        createElement: (name, attrs, parent) => {
            const element = TwineHacker.DOM.window.document.createElement(name);
            TwineHacker.Util.forEach(attrs,(key,attrValue)=>{
                element.setAttribute(key, attrValue);
            });
            if (parent) parent.appendChild(element);
            return element;
        },
        createText: (value, parent) => {
            const element = TwineHacker.DOM.window.document.createTextNode(`${value}`);
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
            if (typeof chrome === "undefined") {
                // noinspection JSUnresolvedVariable,ES6ModulesDependencies
                browser.devtools.inspectedWindow.eval(expression)
                    .then(result => {
                        if (onSuccess) onSuccess(result);
                    })
                    .catch(exception => {
                        if (onError) onError(exception);
                    });
            } else chrome.devtools.inspectedWindow.eval(expression, (result, exception) => {
                if (exception) {
                    if (onError) onError(exception);
                } else {
                    if (onSuccess) onSuccess(result);
                }
            });
        },
        createPanel: (title, icon, page, onShown, onHidden) => {
            if (typeof chrome === "undefined") {
                // noinspection JSUnresolvedVariable,ES6ModulesDependencies
                browser.devtools.panels.create(title, icon, page)
                    .then(panel => {
                        panel.onShown.addListener(onShown);
                        panel.onHidden.addListener(onHidden);
                    });
            } else chrome.devtools.panels.create(title, icon, page,
                panel => {
                    panel.onShown.addListener(onShown);
                    panel.onHidden.addListener(onHidden);
                });
        }
    }
};

TwineHacker.construct();




