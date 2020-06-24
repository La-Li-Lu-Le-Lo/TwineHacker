const TwineHacker = {
    detect: {
        "SugarCube1": "SugarCube.state.active.variables",
        "SugarCube2": "SugarCube.State.active.variables",
        "wetgame": "wetgame.state.story.variablesState._globalVariables"
    },
    expr: null,
    win: null,
    data: {},
    error: msg => alert(`Error: ${msg}`),
    destroy: () => {
        TwineHacker.win.document.getElementById("content").innerHTML = "";
        TwineHacker.data = {};
        TwineHacker.expr = null;
        TwineHacker.win = null;
    },
    init: win => {
        TwineHacker.win = win;
        for (const key in TwineHacker.detect) {
            const expression = TwineHacker.detect[key];
            TwineHacker.eval(expression, vars => {
                if (vars) {
                    TwineHacker.expr = expression;
                    TwineHacker.inspected(vars);
                }
            });
        }
    },
    inspected: vars => {
        const content = TwineHacker.win.document.getElementById("content");
        content.innerHTML = "";
        TwineHacker.createNodeForAny(vars, TwineHacker.expr, content);
        TwineHacker.schedule();
    },
    renew: () => {
        for (const path in TwineHacker.data) {
            const item = TwineHacker.data[path];
            TwineHacker.eval(path, newValue => {
                if (item.value !== newValue) {
                    item.value = newValue;
                    item.editor.value = newValue;
                    TwineHacker.stylize(path, true);
                }
            }, ex => TwineHacker.error(`Cannot evaluate ${path}: ${ex.description}`));
        }
        TwineHacker.schedule();
    },
    schedule: () =>
        setTimeout(TwineHacker.renew, 500),
    createTableForObject: (object, path, parent) => {
        const table = TwineHacker.element("table", {"class": "object"}, parent);
        for (const objectName in object) {
            if (object.hasOwnProperty(objectName)) {
                const tr = TwineHacker.element("tr", {"class": "row"}, table);
                TwineHacker.text(objectName
                        .split("_")
                        .map(x => x.charAt(0).toUpperCase() + x.substring(1).split(/(?=[A-Z])/).join(" "))
                        .join(" "),
                    TwineHacker.element("th", {"class": "label"}, tr));
                TwineHacker.createNodeForAny(object[objectName], `${path}['${objectName}']`,
                    TwineHacker.element("td", {"class": "cell"}, tr));
            }
        }
        return table;
    },
    createNodeForAny: (object, path, parent) => {
        const type = typeof object;
        if (type === "object") {
            parent.setAttribute("class", `${parent.getAttribute("class")} multiple`);
            return TwineHacker.createTableForObject(object, path, parent);
        } else {
            parent.setAttribute("class", `${parent.getAttribute("class")} single`);
            const span = TwineHacker.element("span", {
                "class": "single-span",
                "title": path
                    .split(".")
                    .slice(4)
                    .map(x => x.charAt(0).toUpperCase() + x.substring(1).split(/(?=[A-Z])/).join(" "))
                    .join(": ")
                    .split("_").join(" ")
            }, parent);
            const editor = TwineHacker.element("input", {
                "type": type === "number" ? "number" : "text",
                "value": object,
                "class": `editor ${path}`,
                "data-path": path,
                "data-type": type
            }, span);
            TwineHacker.data[path] = {
                path,
                type,
                editor,
                "value": object
            };
            editor.addEventListener("change", e => TwineHacker.onEdit(e.target.dataset.path, e.target.value));
            editor.addEventListener("focus", e => TwineHacker.stylize(e.target.dataset.path, false));
            editor.addEventListener("blur", e => TwineHacker.onEdit(e.target.dataset.path, e.target.value));
            return span;
        }
    },
    onEdit: (path, value) => {
        if (TwineHacker.data[path].value !== value) {
            TwineHacker.stylize(path, false);
            let expression = `${path}='${value}';`;
            switch (TwineHacker.data[path].type) {
                case "number":
                    expression = `${path}=parseFloat(${value});`;
                    break;
                case "string":
                    expression = `${path}='${(value.replace("'", "\\'"))}';`;
                    break;
                case "boolean":
                    expression = `${path}='${(value.toLowerCase() === "true")}';`;
                    break;
                default:
                    break;
            }
            TwineHacker.eval(expression, () => {
                TwineHacker.data[path].value = value;
            }, ex => TwineHacker.error(`Cannot set value for ${path}: ${ex.description}`));
        }
    },
    stylize: (path, changed) =>
        TwineHacker.data[path].editor.className = changed ? "changed" : "",
    element: (name, attrs, parent) => {
        const element = TwineHacker.win.document.createElement(name);
        if (attrs)
            for (const key in attrs)
                if (attrs.hasOwnProperty(key))
                    element.setAttribute(key, attrs[key]);
        if (parent) parent.appendChild(element);
        return element;
    },
    text: (value, parent) => {
        const element = TwineHacker.win.document.createTextNode(`${value}`);
        if (parent) parent.appendChild(element);
        return element;
    },
    eval: (expression, onSuccess, onError) => {
        if (typeof chrome !== "undefined")
            chrome.devtools.inspectedWindow.eval(expression, (result, exception) => {
                if (exception) {
                    if (onError) onError(exception);
                } else {
                    if (onSuccess) onSuccess(result);
                }
            });
        else
            // noinspection JSUnresolvedVariable,ES6ModulesDependencies
            browser.devtools.inspectedWindow.eval(expression).then(onSuccess).catch(onError);
    },
    construct: () => {
        if (typeof chrome !== "undefined")
            chrome.devtools.panels.create("TwineHacker", "icons/16.png", "panel.html",
                panel => {
                    panel.onShown.addListener(win => TwineHacker.init(win));
                    panel.onHidden.addListener(TwineHacker.destroy);
                });
        else
            // noinspection JSUnresolvedVariable,ES6ModulesDependencies
            browser.devtools.panels.create("TwineHacker", "icons/16.png", "panel.html")
                .then(panel => {
                    panel.onShown.addListener(win => TwineHacker.init(win));
                    panel.onHidden.addListener(TwineHacker.destroy);
                });
    }
};

TwineHacker.construct();




