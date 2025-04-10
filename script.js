// Store the cation and anion name and count
let cation = { name : '', count : 0 };
let anion = { name: '', count: 0 };

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
            canvas.classList.add('canvas-dragstart');
        });
        element.addEventListener('dragend', () => {
            canvas.classList.remove('canvas-dragstart');
        });
    });
}

function initCanvas() {
    const canvas = document.querySelector('#canvas');

    canvas.addEventListener('dragenter', (e) => {
        canvas.classList.add('canvas-dragenter');
    });

    canvas.addEventListener('dragleave', () => {
        canvas.classList.remove('canvas-dragenter');
    });
    
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault(); // Allow dropping
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();

        canvas.classList.remove('canvas-dragenter');

        // The element name
        const element = e.dataTransfer.getData('text/plain');
        const elementData = elements.find(e => e.name === element);

        if (elementData.type === 'cation') {
            // Check if a cation has already been selected
            if (cation.name !== '' && cation.name !== element) {
                alert('Per cambiare catione di partenza, resetta la pagina.');
                return;
            }
            cation.name = element;
            cation.count += 1;
        } else {
            // Check if an anion has already been selected
            if (anion.name !== '' && anion.name !== element) {
                alert('Per cambiare anione di partenza, resetta la pagina.');
                return;
            }
            anion.name = element;
            anion.count += 1;
        }
        
        renderCanvas();
    });
}

function renderCanvas() {
    const canvas = document.querySelector('#canvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    const imgScale = 0.1;

    // Render cations
    if (cation.name) {
        const imgsPos = calcElementsPos('cation', imgScale, canvas);

        imgsPos.forEach((imgPos) => {
            const img = new Image();
            img.src = `assets/${cation.name}.png`;
    
            img.onload = () => {
                context.drawImage(img, imgPos.x, imgPos.y, img.naturalWidth * imgScale, img.naturalHeight * imgScale);
            };
        });
    }

    // Render anions
    if (anion.name) {
        const imgsPos = calcElementsPos('anion', imgScale, canvas);

        imgsPos.forEach((imgPos) => {
            const img = new Image();
            img.src = `assets/${anion.name}.png`;
    
            img.onload = () => {
                context.drawImage(img, imgPos.x, imgPos.y, img.naturalWidth * imgScale, img.naturalHeight * imgScale);
            };
        });
    }
}

function calcElementsPos(type, imgScale, canvas) {
    const cationWidth = 1771 * imgScale;
    const anionWidth = 1980 * imgScale;
    const baseHeight = 625 * imgScale; // Base image height (*2 if +2, *3 if +3, etc.)

    let positions = [];

    if (type === 'cation') {
        let elementData = elements.find(e => e.name === cation.name);

        const height = baseHeight * Math.abs(elementData.charge);

        for (let i = 0; i < cation.count; i++) {
            // Calculate x pos, putting the img in the left half of the canvas
            let posX = canvas.width / 2 - cationWidth + 11;

            // Calculate y pos, considering the number of elements that have been added
            let posY = height * i;

            positions.push({ x: posX, y: posY });
        }
    } else {
        let elementData = elements.find(e => e.name === anion.name);

        const height = baseHeight * Math.abs(elementData.charge);

        for (let i = 0; i < anion.count; i++) {
            let posX = canvas.width / 2 - 11;
            let posY = height * i;

            positions.push({ x: posX, y: posY });
        }
    }

    return positions;
}

function resetCanvas() {
    cation = { name: '', count: 0 };
    anion = { name: '', count: 0 };
    renderCanvas();
}

function revealFormula() {
    document.querySelector('#formula').textContent = `Formula bilanciata: ${calcFormula()}`;
}

document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    document.querySelector('#resetButton').addEventListener('click', () => {
        resetCanvas();
    });

    document.querySelector('#revealButton').addEventListener('click', () => {
        revealFormula();
    });

    initElements();

    initCanvas();
});
