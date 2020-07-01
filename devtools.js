const TwineHacker = {
    interval: 500,
    automatic: true,
    detect: {
        "SugarCube1": "SugarCube.state.active.variables",
        "SugarCube2": "SugarCube.State.active.variables",
        "wetgame": "wetgame.state.story.variablesState._globalVariables"
    },
    expr: null,
    win: null,
    data: {},
    error: (msg, ex) => alert(`Error: ${msg} ${ex ? JSON.stringify(ex) : ''}`),
    destroy: () => {
        TwineHacker.win.document.getElementById("content").innerHTML = "";
        TwineHacker.data = {};
        TwineHacker.expr = null;
        TwineHacker.win = null;
    },
    init: win => {
        TwineHacker.win = win;
        const automatic = TwineHacker.win.document.getElementById("automatic");
        const interval = TwineHacker.win.document.getElementById("interval");
        automatic.checked = TwineHacker.automatic;
        automatic.addEventListener("click", () => {
            TwineHacker.automatic = automatic.checked;
            if (TwineHacker.automatic) TwineHacker.schedule();
        });
        interval.value = TwineHacker.interval;
        interval.addEventListener("change", () => {
            TwineHacker.interval = interval.value;
        });
        const content = TwineHacker.win.document.getElementById("content");
        content.innerHTML = "";
        for (const key in TwineHacker.detect) {
            const expression = TwineHacker.detect[key];
            TwineHacker.eval(expression, vars => {
                if (vars && !TwineHacker.expr) {
                    TwineHacker.expr = expression;
                    TwineHacker.inspected(vars);
                }
            });
        }
    },
    inspected: vars => {
        const content = TwineHacker.win.document.getElementById("content");
        TwineHacker.createNodeForAny(vars, "", content);
        TwineHacker.schedule();
    },
    deep: (array, path) => {
        let cur = array;
        for (const pe in path) {
            if (path.hasOwnProperty(pe)) {
                cur = cur[path[pe]];
                if (typeof cur === "undefined") return null;
                if (cur === null) return null;
            }
        }
        return cur;
    },
    renewAll: () =>
        TwineHacker.eval(TwineHacker.expr, vars => {
                for (const path in TwineHacker.data) {
                    try {
                        const newValue = TwineHacker.deep(vars, path.substring(1).split('.'));
                        TwineHacker.renewSingleAfter(path, newValue);
                    } catch (e) {
                        TwineHacker.error(`error evaluating single vars.${path}`);
                    }
                }
                if (TwineHacker.automatic)
                    TwineHacker.schedule();
            },
            ex => TwineHacker.error(`Cannot evaluate expr ${TwineHacker.expr}: ${ex.description}`, ex)),
    renewSingle: path => {
        let expression = `${TwineHacker.expr}`;
        const array = path.substring(1).split('.');
        for (const item of array) {
            expression += `['${item}']`;
        }
        TwineHacker.eval(expression, newValue => TwineHacker.renewSingleAfter(path, newValue),
            ex => TwineHacker.error(`Cannot evaluate ${expression}: ${ex.description}`, ex));
    },
    renewSingleAfter: (path, newValue) => {
        const item = TwineHacker.data[path];
        if (item.value !== newValue) {
            item.value = newValue;
            item.editor.value = newValue;
            TwineHacker.stylize(path, true);
        }
    },
    schedule: () =>
        setTimeout(TwineHacker.renewAll, TwineHacker.interval),
    createTableForObject: (object, path, parent) => {
        const table = TwineHacker.element("table", {"class": "object"}, parent);
        for (const objectName in object) {
            if (object.hasOwnProperty(objectName)) {
                const tr = TwineHacker.element("tr", {"class": "row"}, table);
                TwineHacker.text(objectName
                    /*.split("_")
                    .map(x => x.charAt(0).toUpperCase() + x.substring(1).split(/(?=[A-Z])/).join(" "))
                    .join(" ")*/,
                    TwineHacker.element("th", {"class": "label"}, tr));
                TwineHacker.createNodeForAny(object[objectName], `${path}.${objectName}`,
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
                "class": "single-span"/*,
                "title": TwineHacker.toTitle(path)*/
            }, parent);
            const editor = TwineHacker.element("input", {
                "type": type === "number" ? "number" : "text",
                "value": object,
                /*"class": `editor ${path}`,*/
                // "data-path": path,
                // "data-type": type
            }, span);
            TwineHacker.data[path] = {
                path,
                type,
                editor,
                "value": object
            };
            editor.addEventListener("change", e => TwineHacker.onEdit(path, e.target.value));
            editor.addEventListener("focus", () => {
                TwineHacker.renewSingle(path);
                TwineHacker.stylize(path, false);
            });
            editor.addEventListener("blur", e => TwineHacker.onEdit(path, e.target.value));
            return span;
        }
    },
    toTitle: path =>
        path.substring(1).split('.')
            .map(x => x.charAt(0).toUpperCase() + x.substring(1).split(/(?=[A-Z])/).join(" "))
            .join(": ")
            .split("_").join(" "),
    onEdit: (path, value) => {
        if (TwineHacker.data[path].value !== value) {
            TwineHacker.stylize(path, false);
            let expression = `${TwineHacker.expr}`;
            const array = path.substring(1).split('.');
            for (const item of array) {
                expression += `['${item}']`;
            }
            let expression2 = `'${value}'`;
            switch (TwineHacker.data[path].type) {
                case "number":
                    expression2 = `${parseFloat(value)}`;
                    break;
                case "string":
                    expression2 = `'${value.replace("'", "\\'")}'`;
                    break;
                case "boolean":
                    expression2 = `${value}`;
                    break;
                default:
                    break;
            }
            expression += `=${expression2};`;
            TwineHacker.eval(expression, () => {
                TwineHacker.data[path].value = value;
            }, ex => TwineHacker.error(`Cannot set value for ${path} as ${expression}: ${ex.description}`, ex));
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




