let canvasElements = [];

function resizeCanvas() {
    const main = document.querySelector('main');
    const canvas = document.querySelector('#canvas');
    const rect = main.getBoundingClientRect();
    canvas.height = rect.height;
}

function initElements() {
    const elements = document.querySelectorAll('#sidebarElements > div');
    
    // Make elements draggable to the canvas
    elements.forEach(element => {
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', element.dataset.element);
            canvas.classList.add('canvas-dragover');
        });
        element.addEventListener('dragend', () => {
            canvas.classList.remove('canvas-dragover');
        });
    });
}

function initCanvas() {
    const canvas = document.querySelector('#canvas');
    
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();

        // This contains the element name
        const data = e.dataTransfer.getData('text/plain');
        canvasElements.push(data);
        renderCanvas();
    });
}

function renderCanvas() {

}

function resetCanvas() {
    canvasElements = [];
    renderCanvas();
}

document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    document.querySelector('#resetButton').addEventListener('click', () => {
        resetCanvas();
    });

    initElements();

    initCanvas();
});
