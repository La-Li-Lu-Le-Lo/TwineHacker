const TwineHackerOptions = {
    options: {
        automatic: true,
        interval: 500
    },
    construct: () => {
        const elementAutomatic = window.document.getElementById("automatic");
        elementAutomatic.checked = TwineHackerOptions.options.automatic;
        elementAutomatic.addEventListener("click", () => {
            TwineHackerOptions.options.automatic = elementAutomatic.checked;
            TwineHackerOptions.save();
        });
        const elementInterval = window.document.getElementById("interval");
        elementInterval.value = TwineHackerOptions.options.interval;
        elementInterval.addEventListener("change", () => {
            TwineHackerOptions.options.interval = elementInterval.value;
            TwineHackerOptions.save();
        });
        TwineHackerOptions.load(options => {
            if (options.automatic) TwineHackerOptions.options.automatic = options.automatic;
            elementAutomatic.checked = TwineHackerOptions.options.automatic;
            if (options.interval) TwineHackerOptions.options.interval = options.interval;
            elementInterval.value = TwineHackerOptions.options.interval;
        });
    },
    save: () => {
        if (typeof chrome === "undefined") {
            // noinspection JSUnresolvedVariable,ES6ModulesDependencies
            browser.storage.sync.set(TwineHackerOptions.options)
                .catch(reason => TwineHackerOptions.Util.showError("Cannot save options", reason));
        } else
            chrome.storage.sync.set(TwineHackerOptions.options, () => {
            });

    },
    load: onOptions => {
        if (typeof chrome === "undefined") {
            // noinspection JSUnresolvedVariable,ES6ModulesDependencies,JSUnresolvedFunction
            browser.storage.sync.get()
                .then(value => onOptions(value))
                .catch(reason => TwineHackerOptions.Util.showError("Cannot save options", reason));
        } else
            chrome.storage.sync.get(value => onOptions(value));
    },
    Util: {
        showError: (message, info) => alert(`Error: ${message} ${info ? JSON.stringify(info) : ''}`)
    }
};
window.document.addEventListener('DOMContentLoaded', () => TwineHackerOptions.construct());
