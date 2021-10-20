/**
 * @param {(function())} func
 * @return {(function())|*}
 */
function createCash(func) {
    const cash = new Map();
    return function(...args) {
        const key = JSON.stringify(args)
        if (!cash.has(key)) {
            cash.set(key, func.apply(this, args))
        }
        return cash.get(key)
    }
}

class Input {
    constructor(value = '') {
        this.state = Input.STATE.none
        this.value = value
        this.history = []
        this.cursorPosition = 0

        this.defineCursorByClick = createCash(this.defineCursorByClick)
        this.calculateCursorPosition = createCash(this.calculateCursorPosition)

        this.createEl()
        this.createVirtual()
        this.setAllData(value)
    }

    static STATE = {
        addChar: 0,
        deleteChar: 1,
        moveToL: 2,
        moveToR: 3,
        backHistory: 4,
        none: 5,
    }

    static HISTORY_LENGTH = 10

    static template() {
        const wrapper = document.createElement('div')
        wrapper.classList.add('input')
        wrapper.setAttribute('tabindex', '0')
        wrapper.innerHTML = `
            <div class="cursor"></div>
            <div class="content"></div>
        `
        return wrapper
    }

    /**
     * @param {string} value
     */
    setAllData(value) {
        this.content.innerHTML = value
        this.virContent.innerHTML = value
        this.setCursorPosition(value.length, value)
    }

    /**
     * @returns {void}
     */
    createVirtual() {
        this.virEl = Input.template()
        this.virContent = this.virEl.querySelector('.content')
        this.virEl.classList.add('hidden')
        document.body.appendChild(this.virEl)
    }

    /**
     * @param {number} clickX
     * @param {string} value
     * @param {number} cursorWidth
     * @param {number} left
     * @returns {number}
     */
    defineCursorByClick(clickX, value, cursorWidth, left) {
        const custX = clickX + left
        const chars = value.split('')
        let index = chars.length
        if (custX > cursorWidth) {
            return index
        }
        this.virContent.textContent = ''
        let str = ''
        for (const [i, char] of chars.entries()) {
            str += char
            this.virContent.textContent = str
            const width = this.virContent.clientWidth
            if ((width - 4) >= custX) {
                index = i
                break
            }
        }
        this.virContent.textContent = this.value
        return index
    }


    /**
     * @param {number} l
     * @return {void}
     */
    switchTextContent(l) {
        if (l > this.el.clientWidth) {
            this.el.scrollLeft = (l - this.el.clientWidth) + 20
        }else {
            this.el.scrollLeft = 0
        }
    }

    /**
     * @param {number} index
     * @param {string} value
     * @return {number}
     */
    calculateCursorPosition(index, value) {
        this.virContent.textContent = value.slice(0, this.cursorPosition);
        return this.virContent.clientWidth
    }

    /**
     * @param {number} index
     * @param {string} value
     */
    setCursorPosition(index, value) {
        this.cursorPosition = (index || 0)
        // read
        const cursorWidth = this.calculateCursorPosition(index, value)
        this.switchTextContent(cursorWidth)
        //write
        this.virContent.textContent = this.value
        this.cursor.style.left = `${(cursorWidth || 0) - 4}px`
    }

    /**
     * @return {string}
     */
    historyBack() {
        return this.history.pop() || ''
    }

    historyAdd(value) {
        this.history.push(value)
        this.history = this.history.slice(-Input.HISTORY_LENGTH);
    }

    /**
     * @returns {void}
     */
    createEl() {
        this.el = Input.template()
        this.cursor = this.el.querySelector('.cursor')
        this.content = this.el.querySelector('.content')

        this.el.addEventListener('keydown', this.handleKeyboard.bind(this))
        this.el.addEventListener('mousedown', this.handleMouseDown.bind(this))
        this.el.addEventListener('dblclick', this.handleDbClick.bind(this))
        this.el.addEventListener('blur', this.blur.bind(this))
    }

    handleDbClick() {
        // this.state = STATE.
        this.el.classList.remove('cursor_set')
    }

    /**
     * @param {KeyboardEvent} event
     * @returns {void}
     */
    handleKeyboard(event) {
        event.preventDefault()
        const code = event.key
        const cacheValue = this.value
        const metaKey = event.metaKey
        const cacheCursorPosition = this.cursorPosition
        let prefix = this.value.slice(0, this.cursorPosition);
        let postfix = this.value.slice(this.cursorPosition);

        let state = Input.STATE.addChar
        let char = event.key

        this.value = prefix
        switch (code) {
            case "Space":
                char = ' ';
                break
            case "Shift":
            case "Meta":
            case "Tab":
            case "CapsLock":
            case "Control":
            case "Alt":
            case "Escape":
                state = Input.STATE.none
                break
            case "Backspace":
                state = Input.STATE.deleteChar
                break
            case 'ArrowLeft':
                state = Input.STATE.moveToL
                break
            case 'a':
                if (metaKey) {}
                break
            case 'v':
                if (metaKey) {}
                break
            case 'c':
                if (metaKey) {}
                break
            case 'z':
                if (metaKey) state = Input.STATE.backHistory
                break
            case 'ArrowRight':
                state = Input.STATE.moveToR
                break
            default:
                state = Input.STATE.addChar
                break
        }

        switch (state) {
            case Input.STATE.addChar:
                this.value += char
                this.cursorPosition++
                break
            case Input.STATE.deleteChar:
                this.value = prefix.slice(0, -1);
                this.cursorPosition = Math.max(this.cursorPosition - 1, 0)
                break
            case Input.STATE.moveToL:
                const switchCountL = metaKey ? 0 : this.cursorPosition - 1
                this.cursorPosition = Math.max(switchCountL, 0)
                break
            case Input.STATE.moveToR:
                const switchCountR = metaKey ? cacheValue.length : this.cursorPosition + 1
                this.cursorPosition = Math.min(switchCountR, cacheValue.length)
                break
            case Input.STATE.backHistory:
                this.value = this.historyBack()
                postfix = ''
                this.cursorPosition = this.value.length
                break
            case Input.STATE.none:
                this.value = prefix
                break
        }
        this.value += postfix
        if (cacheValue !== this.value) {
            this.content.innerHTML = this.value
            this.virContent.innerHTML = this.value
        }
        if (cacheCursorPosition !== this.cursorPosition) {
            this.setCursorPosition(this.cursorPosition, this.value)
        }
        this.state = state
    }

    /**
     * @param {MouseEvent} event
     * @returns {void}
     */
    handleMouseDown(event) {
        const index = this.defineCursorByClick(event.layerX, this.value, this.virContent.clientWidth, this.el.scrollLeft)
        this.setCursorPosition(index, this.value)
        this.focus()
    }

    /**
     * @returns {void}
     */
    focus() {
        this.el.classList.add('focus')
        this.el.classList.add('cursor_set')
    }

    /**
     * @returns {void}
     */
    blur() {
        this.el.classList.remove('focus')
        this.el.classList.remove('cursor_set')
        this.historyAdd(this.value)
    }

    // change, input, cut, copy, paste.
    /**
     * @returns {void}
     */
    static mount() {
        try {
            const inputs = [...document.querySelectorAll('CustomInput')]
            inputs.forEach(input => {
                const inValue = input.getAttribute('value')
                const parent = input.parentNode
                const inputInstance = new Input(inValue)
                parent.replaceChild(inputInstance.el, input)
            })
        }catch (e) {
            console.log(e)
        }
    }
}


document.addEventListener('DOMContentLoaded', Input.mount)
