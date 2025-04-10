// Store the cation and anion name and count
let cation = { name : '', count : 0 };
let anion = { name: '', count: 0 };

/**
 * Creates a balanced chemical formula between a cation and an anion
 * @param {string} cationName - The name of the cation
 * @param {string} anionName - The name of the anion
 * @returns {string} - The balanced chemical formula as a string
 */
function bilancio(cationName, anionName) {
    // Find the cation and anion in the elements array
    const cationData = elements.find(element => element.name === cationName && element.type === 'cation');
    const anionData = elements.find(element => element.name === anionName && element.type === 'anion');
    
    if (!cationData || !anionData) {
        return "Error: Invalid cation or anion name";
    }
    
    // Get the absolute values of the charges
    const cationCharge = Math.abs(cationData.charge);
    const anionCharge = Math.abs(anionData.charge);
    
    // Find the greatest common divisor (GCD) of the charges
    const gcd = findGCD(cationCharge, anionCharge);
    
    // Calculate the subscripts needed to balance the charges
    const cationSubscript = anionCharge / gcd;
    const anionSubscript = cationCharge / gcd;
    
    // Format the subscripts (don't show 1)
    const formatSubscript = (subscript) => subscript === 1 ? '' : subscript;
    
    // Create the balanced formula
    let formula = '';
    
    // Cation part
    formula += cationData.element;
    if (cationSubscript > 1) {
        formula += formatSubscript(cationSubscript);
    }
    
    // Anion part
    // Check if anion element has parentheses already
    const anionElement = anionData.element;
    
    // If the anion has a subscript > 1 and the anion element contains multiple elements
    // (like SO4, CO3, PO4), add parentheses
    const needsParentheses = anionSubscript > 1 && 
                            (anionElement.match(/[0-9]/) || // Contains numbers
                             anionElement.length > 2);      // Or has multiple characters
    
    if (needsParentheses) {
        formula += `(${anionElement})${formatSubscript(anionSubscript)}`;
    } else {
        formula += anionElement + formatSubscript(anionSubscript);
    }
    
    return formula;
    
}

/**
 * Find the Greatest Common Divisor (GCD) of two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} - The GCD of the two numbers
 */
function findGCD(a, b) {
    return b === 0 ? a : findGCD(b, a % b);
}

function resizeCanvas() {
    const main = document.querySelector('main');
    const canvas = document.querySelector('#canvas');
    const rect = main.getBoundingClientRect();
    canvas.height = rect.height;
}

function initElements() {
    const elementDivs = document.querySelectorAll('#sidebarElements > div');
    
    // Make elements draggable to the canvas
    elementDivs.forEach(element => {
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
        e.preventDefault();
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
        updateFormulaDisplay();
    });
}

function renderCanvas() {
    const canvas = document.querySelector('#canvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    const imgScale = 0.1

    // Render cations
    if (cation.name) {
        const img = new Image();
        img.src = `assets/${cation.name}.png`;

        const imgPos = calcElementPos('cation', imgScale, canvas);

        img.onload = () => {
            context.drawImage(img, imgPos.x, imgPos.y, img.naturalWidth * imgScale, img.naturalHeight * imgScale);
        };
    }

    // Render anions
    if (anion.name) {
        const img = new Image();
        img.src = `assets/${anion.name}.png`;

        const imgPos = calcElementPos('anion', imgScale, canvas);

        img.onload = () => {
            context.drawImage(img, imgPos.x, imgPos.y, img.naturalWidth * imgScale, img.naturalHeight * imgScale);
        };
    }
}

function calcElementPos(type, imgScale, canvas) {
    const cationWidth = 1771 * imgScale;
    const anionWidth = 1980 * imgScale;
    const baseHeight = 625 * imgScale; // Base image height (*2 if +2, *3 if +3, etc.)

    let posX = 0;
    let posY = 0;

    if (type === 'cation') {
        let elementData = elements.find(e => e.name === cation.name);
        posX = canvas.width / 2 - cationWidth + 11;
        posY = canvas.height / 2 - (baseHeight / 2 * Math.abs(elementData.charge));
    } else {
        let elementData = elements.find(e => e.name === anion.name);

        posX = canvas.width / 2 - 11;

        posY = canvas.height / 2 - (baseHeight / 2 * Math.abs(elementData.charge));
    }

    return { x: posX, y: posY };
}

    if (cation.name && anion.name) {
        const formula = balanceReaction(cation.name, anion.name);
        formulaDisplay.textContent = `Balanced Formula: ${formula}`;
    }
function resetCanvas() {
    cation = { name: '', count: 0 };
    anion = { name: '', count: 0 };
    renderCanvas();
    updateFormulaDisplay();
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