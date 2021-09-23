class Input {
    constructor() {
        this.isFocus = false
        this.value = ''
        this.history = []
        this.cursorPosition = 0

        this.createEl()
        this.createVirtual()
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
     * @returns {void}
     */
    createVirtual() {
        this.virEl = Input.template()
        this.virContent = this.virEl.querySelector('.content')
        this.virEl.classList.add('hidden')
        document.body.appendChild(this.virEl)
    }

    /**
     * @returns {void}
     */
    defineCursor() {
        this.virContent.textContent = this.value
        const width = this.virContent.clientWidth || 0
    }

    /**
     * @param {number} clickX
     * @returns {number} param
     */
    defineCursorByClick(clickX) {
        const chars = this.value.split('')
        let cursorWidth = this.virContent.clientWidth
        let index = chars.length
        if (clickX > cursorWidth) {
            return index
        }
        this.virContent.textContent = ''
        let str = ''
        for (const [i, char] of chars.entries()) {
            str += char
            this.virContent.textContent = str
            const width = this.virContent.clientWidth
            if ((width + 4) >= clickX) {
                index = i
                break
            }
        }
        this.virContent.textContent = this.value
        return index
    }

    /**
     * @param {number} index
     */
    setCursorPosition(index) {
        this.cursorPosition = (index || 0)
        this.virContent.textContent = this.value.slice(0, this.cursorPosition);
        //read
        const cursorWidth = this.virContent.clientWidth
        //write
        this.virContent.textContent = this.value

        this.cursor.style.left = `${(cursorWidth || 0) + 4}px`
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
        this.el.addEventListener('blur', this.blur.bind(this))
    }


    /**
     * @param {KeyboardEvent} event
     * @returns {void}
     */
    handleKeyboard(event) {
        const code = event.code
        const cacheValue = this.value
        const cacheCursorPosition = this.cursorPosition
        let prefix = this.value.slice(0, this.cursorPosition);
        let postfix = this.value.slice(this.cursorPosition);
        this.value = prefix
        // Shift
        switch (code) {
            case "Space":
                this.value += ' ';
                this.cursorPosition++
                break
            case "Backspace":
                this.value = prefix.slice(0, -1);
                this.cursorPosition = Math.max(this.cursorPosition - 1, 0)
                break
            case 'ArrowLeft':
                this.cursorPosition = Math.max(this.cursorPosition - 1, 0)
                break
            case 'ArrowRight':
                this.cursorPosition = Math.min(this.cursorPosition + 1, cacheValue.length)
                break
            default:
                this.value += event.key
                this.cursorPosition++
        }
        this.value += postfix
        if (cacheValue !== this.value) {
            this.content.innerHTML = this.value
            this.virContent.innerHTML = this.value
        }
        if (cacheCursorPosition !== this.cursorPosition) {
            this.setCursorPosition(this.cursorPosition)
        }
    }

    /**
     * @param {MouseEvent} event
     * @returns {void}
     */
    handleMouseDown(event) {
        const index = this.defineCursorByClick(event.layerX)
        this.setCursorPosition(index)
        this.focus()
    }

    /**
     * @returns {void}
     */
    focus() {
        this.isFocus = true
        this.el.classList.add('focus')
    }

    /**
     * @returns {void}
     */
    blur() {
        this.isFocus = false
        this.el.classList.remove('focus')
    }

    // change, input, cut, copy, paste.
    /**
     * @returns {void}
     */
    mount(selector) {
        try {
            const parent = document.querySelector(selector).parentNode
            parent.replaceChild(this.el, document.querySelector(selector));
        }catch (e) {
            console.log(e)
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const input = new Input()
    input.mount('#app')
})
