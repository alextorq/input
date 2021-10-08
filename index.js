const HISTORY_LENGTH = 10

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

//state may be addChar space deleteChar none

const STATE = {
    addChar: 0,
    deleteChar: 1,
    moveToL: 2,
    moveToR: 3,
    none: 4,
}


class Input {
    constructor(value = '') {
        this.state = STATE.none
        this.value = value
        this.history = []
        this.cursorPosition = 0

        this.defineCursorByClick = createCash(this.defineCursorByClick)
        this.calculateCursorPosition = createCash(this.calculateCursorPosition)

        this.createEl()
        this.createVirtual()
        this.setAllData(value)
    }

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
     */
    calculateCursorPosition(index, value) {
        //Change cache on every char width
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

    historyBack(value) {
        const val = this.history.pop()
        if (val !== undefined) {
            this.value = val
            this.cursorPosition = val.length
        }
    }

    historyAdd(value) {
        this.history.push(value)
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
        this.isSelect = true
        this.el.classList.remove('cursor_set')
    }

    /**
     * @param {KeyboardEvent} event
     * @returns {void}
     */
    handleKeyboard(event) {
        event.preventDefault()
        //Change to FSM
        const code = event.key
        const cacheValue = this.value
        const metaKey = event.metaKey
        const cacheCursorPosition = this.cursorPosition
        let prefix = this.value.slice(0, this.cursorPosition);
        let postfix = this.value.slice(this.cursorPosition);
        let addToHistory = false

        let state = STATE.addChar
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
            case "Escape":
                state = STATE.none
                break
            case "Backspace":
                state = STATE.deleteChar
                break
            case 'ArrowLeft':
                state = STATE.moveToL
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
                if (metaKey) {
                    addToHistory = true
                    this.historyBack()
                }
                break
            case 'ArrowRight':
                state = STATE.moveToR
                break
            default:
                state = STATE.addChar
                break
        }

        switch (state) {
            case STATE.addChar:
                this.value += char
                this.cursorPosition++
                break
            case STATE.deleteChar:
                this.value = prefix.slice(0, -1);
                this.cursorPosition = Math.max(this.cursorPosition - 1, 0)
                break
            case STATE.moveToL:
                const switchCountL = metaKey ? 0 : this.cursorPosition - 1
                this.cursorPosition = Math.max(switchCountL, 0)
                break
            case STATE.moveToR:
                const switchCountR = metaKey ? cacheValue.length : this.cursorPosition + 1
                this.cursorPosition = Math.min(switchCountR, cacheValue.length)
                break
            case STATE.none:
                this.value = prefix
                break
        }

        // if (addToHistory) {
        //     postfix = ''
        //     event.preventDefault()
        // }
        this.value += postfix
        if (cacheValue !== this.value) {
            this.content.innerHTML = this.value
            this.virContent.innerHTML = this.value
            // if (addToHistory) this.historyAdd(cacheValue)
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


document.addEventListener('DOMContentLoaded', () => {
    Input.mount()
})
