export class KeyboardInput {
    constructor(engine) {
        this.engine = engine;
        this.handler = this.handleKeyDown.bind(this);
        window.addEventListener('keydown', this.handler);
    }

    handleKeyDown(e) {
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.engine.move('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.engine.move('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.engine.move('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.engine.move('right');
                break;
        }
    }

    destroy() {
        window.removeEventListener('keydown', this.handler);
    }
}
