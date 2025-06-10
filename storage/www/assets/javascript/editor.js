

/*
              _                             _               _     __   __
         /\  | |                           | |             (_)    \ \ / /
        /  \ | |_ _ __ ___   ___  ___ _ __ | |__   ___ _ __ _  ___ \ V / 
       / /\ \| __| '_ ` _ \ / _ \/ __| '_ \| '_ \ / _ \ '__| |/ __| > <  
      / ____ \ |_| | | | | | (_) \__ \ |_) | | | |  __/ |  | | (__ / . \ 
     /_/    \_\__|_| |_| |_|\___/|___/ .__/|_| |_|\___|_|  |_|\___/_/ \_\
                                     | |                                 
                                     |_|                                                                                                                
    Written by: k3yomi@GitHub
    Version: v7.0.0                              
*/


class CfgEditor {
    letructor(library) {
        this.library = library;
        this.storage = this.library.storage;
        this.name = `CfgEditor`;
        this.library.createOutput(`${this.name} Initialization`, `Successfully initialized ${this.name} module`);
        this.currentConfig = null;
        this.originalConfig = null;
        this.codeEl = null;
        this.errorEl = null;
    };

    /** 
      * @function openEditor
      * @description Opens the configuration editor in the specified container with the provided configurations.
      * 
      * @param {HTMLElement} container - The HTML element where the editor will be rendered.
      * @param {Object} configurations - The initial configurations to be displayed in the editor.
      */

    openEditor = function(container, configurations) {
        this.originalConfig = JSON.parse(JSON.stringify(configurations));
        this.renderEditor(container, configurations);
    };

    /**
      * @function renderEditor
      * @description Renders the configuration editor in the specified container with the provided configurations.
      * 
      * @param {HTMLElement} container - The HTML element where the editor will be rendered.
      * @param {Object} configurations - The initial configurations to be displayed in the editor.
      */

    renderEditor = function(container, configurations) {
        container.innerHTML = this.getEditorHTML();
        this.codeEl = document.getElementById("config-json-editor");
        this.errorEl = document.getElementById("config-json-error");
        this.updateEditor(configurations);
        this.codeEl.addEventListener("keydown", (e) => this.handleKeyDown(e));
        document.getElementById("config-json-lines").addEventListener("scroll", () => {
            this.codeEl.scrollTop = document.getElementById("config-json-lines").scrollTop;
        });
        this.codeEl.addEventListener("scroll", () => {
            document.getElementById("config-json-lines").scrollTop = this.codeEl.scrollTop;
        });
        document.getElementById("config-json-save").onclick = () => this.handleSave();
        document.getElementById("config-json-restore").onclick = () => this.handleRestore();
    };

    /**
      * @function getEditorHTML
      * @description Returns the HTML structure for the configuration editor.
      * 
      * @return {string} - The HTML string for the configuration editor.
      */

    getEditorHTML = function() {
        return `<div class="editor-container"><div id="config-json-editor-container"><div id="config-json-easy-configurations"></div><pre><div id="config-json-lines"></div><code id="config-json-editor" contenteditable="true" spellcheck="false"></code></pre></div><div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;"><button id="config-json-save" class="button-ok">Save</button><button id="config-json-restore" class="button-danger">Restore</button></div><div id="config-json-error"></div></div>`;
    };
    /**
      * @function syntaxHighlight
      * @description Applies syntax highlighting to JSON strings for better readability.
      *
      * @param {string} json - The JSON string to be highlighted.
      */

    syntaxHighlight = function(json) {
        json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return json.replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+\-]?\d+)?)/g, (match) => {
            let cls = "";
            if (/^".*":$/.test(match)) cls = "color:#82b1ff;";
            else if (/^"/.test(match)) cls = "color:#c3e88d;";
            else if (/true|false/.test(match)) cls = "color:#ffcb6b;";
            else if (/null/.test(match)) cls = "color:#f07178;";
            else cls = "color:#f78c6c;";
            return `<span style="${cls}">${match}</span>`;
        });
    };

    /**
      * @function updateLineNumbers
      * @description Updates the line numbers in the editor based on the current content.
      */

    updateLineNumbers = function() {
        if (!this.codeEl) return;
        let text = this.getEditorText();
        let lines = text.split("\n").length;
        let linesEl = document.getElementById("config-json-lines");
        let html = "";
        for (let i = 1; i <= lines; i++) html += `${i}<br>`;
        linesEl.innerHTML = html;
    };

    /**
      * @function getCaretCharacterOffsetWithin
      * @description Gets the current caret position within a contenteditable element.
      * 
      * @param {HTMLElement} element - The contenteditable element to get the caret position from.
      */

    getCaretCharacterOffsetWithin = function(element) {
        let caretOffset = 0;
        let sel = window.getSelection();
        if (sel.rangeCount > 0) {
            let range = sel.getRangeAt(0);
            let preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
        return caretOffset;
    };

    /**
      * @function setCaretPosition
      * @description Sets the caret position within a contenteditable element.
      * 
      * @param {HTMLElement} element - The contenteditable element to set the caret position in.
      * @param {number} offset - The character offset where the caret should be placed.
      */

    setCaretPosition = function(element, offset) {
        let nodeStack = [element], node, found = false, charIndex = 0;
        let range = document.createRange();
        range.setStart(element, 0);
        range.collapse(true);
        while (!found && nodeStack.length) {
            node = nodeStack.pop();
            if (node.nodeType === 3) {
                let nextCharIndex = charIndex + node.length;
                if (offset <= nextCharIndex) {
                    range.setStart(node, offset - charIndex);
                    range.collapse(true);
                    found = true;
                }
                charIndex = nextCharIndex;
            } else {
                let i = node.childNodes.length;
                while (i--) nodeStack.push(node.childNodes[i]);
            }
        }
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    };

    /**
      * @function getEditorText
      * @description Retrieves the text content from the editor, converting HTML line breaks to newlines.
      */ 

    getEditorText = function() {
        if (!this.codeEl) return "";
        let cloned = this.codeEl.cloneNode(true);
        let html = cloned.innerHTML.replace(/<br\s*\/?>/gi, "\n");
        let div = document.createElement("div");
        div.innerHTML = html;
        return div.textContent;
    };

    /**
      * @function updateEditor
      * @description Updates the editor with a new object, applying syntax highlighting and setting the caret position.
      * 
      * @param {Object} obj - The object to be displayed in the editor.
      * @param {number} [caretOffset] - Optional caret position to set after updating the editor.
      */

    updateEditor = function(obj, caretOffset) {
        if (!obj) return;
        if (typeof caretOffset !== "number" && this.codeEl && document.activeElement === this.codeEl) {
            caretOffset = this.getCaretCharacterOffsetWithin(this.codeEl);
        }
        let jsonStr = JSON.stringify(obj, null, 10);
        let highlighted = this.syntaxHighlight(jsonStr);
        this.codeEl.innerHTML = highlighted;
        if (typeof caretOffset === "number") setTimeout(() => this.setCaretPosition(this.codeEl, caretOffset), 0);
        this.currentConfig = obj;
        this.updateLineNumbers();
    };

    /**
      * @function handleKeyDown
      * @description Handles keydown events in the editor, specifically for the Tab key to insert spaces.
      * 
      * @param {KeyboardEvent} e - The keydown event object.
      */

    handleKeyDown = function(e) {
        if (e.key === "Tab") {
            e.preventDefault();
            let sel = window.getSelection();
            if (!sel.rangeCount) return;
            let range = sel.getRangeAt(0);
            let tabNode = document.createTextNode("  ");
            range.insertNode(tabNode);
            range.setStartAfter(tabNode);
            range.setEndAfter(tabNode);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };

    /**
      * @function handleSave
      * @description Handles the save action, validating the JSON and updating the current configuration.
      */

    handleSave = function() {
        let raw = this.getEditorText();
        try {
            let parsed = JSON.parse(raw);
            this.updateEditor(parsed);
            this.placeCaretAtEnd(this.codeEl);
            this.errorEl.style.display = "none";
            this.errorEl.textContent = `Configuration saved successfully.`;
            this.errorEl.style.display = "block";
            this.currentConfig = parsed;
            this.updateLineNumbers();
            fetch(`/set-configurations`, { method: `POST`, headers: { 'Content-Type': `application/json` }, body: JSON.stringify(parsed)})
        } catch (e) {
            this.errorEl.textContent = `Invalid JSON: ${e.message}`;
            this.errorEl.style.display = "block";
        }
    };

    /**
      * @function handleRestore
      * @description Handles the restore action, resetting the editor to the original configuration.
      */

    handleRestore = function() {
        this.updateEditor(this.originalConfig);
        this.placeCaretAtEnd(this.codeEl);
        this.errorEl.style.display = "block";
        this.errorEl.textContent = `Configuration restored to original state.`;
        this.currentConfig = JSON.parse(JSON.stringify(this.originalConfig));
        this.updateLineNumbers();
    };

    /**
      * @function placeCaretAtEnd
      * @description Places the caret at the end of a contenteditable element.
      * 
      * @param {HTMLElement} el - The contenteditable element where the caret should be placed.
      */

    placeCaretAtEnd = function(el) {
        el.focus();
        if (window.getSelection && document.createRange) {
            let range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            let sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    };
}
