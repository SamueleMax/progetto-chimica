class ChemistryPuzzle {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ions = []; // Ions placed on the canvas
        this.draggingIon = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.images = {}; // Cache for loaded images

        // Resize and render
        this.resizeCanvas();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Animation frame
        this.setupAnimationLoop();
    }
    
    resizeCanvas() {
        const containerRect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = containerRect.width;
        this.canvas.height = 500; // Fixed height
        this.render();
    }
    
    initEventListeners() {
        // Mouse down event
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Check if we're clicking on an ion
            for (let i = this.ions.length - 1; i >= 0; i--) {
                const ion = this.ions[i];
                if (this.isPointInIon(mouseX, mouseY, ion)) {
                    this.draggingIon = ion;
                    this.offsetX = mouseX - ion.x;
                    this.offsetY = mouseY - ion.y;
                    this.isDragging = true;
                    
                    // Move this ion to the front
                    this.ions.splice(i, 1);
                    this.ions.push(ion);
                    break;
                }
            }
        });
        
        // Mouse move event
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.draggingIon) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            this.draggingIon.x = mouseX - this.offsetX;
            this.draggingIon.y = mouseY - this.offsetY;
            
            // Check for snapping when moving
            this.checkSnapToConnections();
            this.updateFormula();
        });
        
        // Mouse up event
        this.canvas.addEventListener('mouseup', () => {
            if (this.draggingIon) {
                // Final snap check when releasing
                this.finalizeSnapping();
            }
            this.isDragging = false;
            this.draggingIon = null;
        });
        
        // Mouse leave event
        this.canvas.addEventListener('mouseleave', () => {
            if (this.draggingIon) {
                // Final snap check when leaving canvas
                this.finalizeSnapping();
            }
            this.isDragging = false;
            this.draggingIon = null;
        });
        
        // Touch events for mobile support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            for (let i = this.ions.length - 1; i >= 0; i--) {
                const ion = this.ions[i];
                if (this.isPointInIon(touchX, touchY, ion)) {
                    this.draggingIon = ion;
                    this.offsetX = touchX - ion.x;
                    this.offsetY = touchY - ion.y;
                    this.isDragging = true;
                    
                    this.ions.splice(i, 1);
                    this.ions.push(ion);
                    break;
                }
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isDragging || !this.draggingIon) return;
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            this.draggingIon.x = touchX - this.offsetX;
            this.draggingIon.y = touchY - this.offsetY;
            
            this.checkSnapToConnections();
            this.updateFormula();
        });
        
        this.canvas.addEventListener('touchend', () => {
            if (this.draggingIon) {
                this.finalizeSnapping();
            }
            this.isDragging = false;
            this.draggingIon = null;
        });
        
        // Window resize event
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Clear canvas button
        document.getElementById('clear-canvas').addEventListener('click', () => {
            this.clearCanvas();
        });
    }
    
    isPointInIon(x, y, ion) {
        // Check if point is inside rectangular ion
        return (
            x >= ion.x - ion.width / 2 &&
            x <= ion.x + ion.width / 2 &&
            y >= ion.y - ion.height / 2 &&
            y <= ion.y + ion.height / 2
        );
    }
    
    addIon(type, symbol, name, charge, image) {
        // Create ion with image
        const width = 120; // Width of the puzzle piece
        const height = 80; // Height of the puzzle piece
        
        // Load the image if not already cached
        if (!this.images[image]) {
            const img = new Image();
            img.src = image;
            img.onload = () => {
                this.render();
            };
            this.images[image] = img; // Store reference even before loading
        }
        
        const ion = {
            type, // 'cation' or 'anion'
            symbol,
            name,
            charge,
            image,
            x: type === 'cation' ? this.canvas.width * 0.25 : this.canvas.width * 0.75,
            y: this.canvas.height / 2,
            width,
            height,
            connections: [], // Array of ions this one is connected to
            connectedPoints: [], // Track specific connection points
            id: Date.now() + Math.random() // Unique identifier
        };
        
        this.ions.push(ion);
        this.render();
        this.updateFormula();
    }
    
    checkSnapToConnections() {
        if (!this.draggingIon) return;
        
        // Only try to connect opposite types
        const oppositeType = this.draggingIon.type === 'cation' ? 'anion' : 'cation';
        const potentialPartners = this.ions.filter(ion => 
            ion.type === oppositeType && ion !== this.draggingIon);
        
        // Clear existing temporary connections
        this.draggingIon.connections = [];
        this.draggingIon.connectedPoints = [];
        
        for (const partner of potentialPartners) {
            // For each puzzle connector/hole pair
            if (this.draggingIon.type === 'cation') {
                // Cation has holes, anion has connectors
                this.tryToConnect(this.draggingIon, partner);
            } else {
                // Anion has connectors, cation has holes
                this.tryToConnect(partner, this.draggingIon);
            }
        }
    }
    
    tryToConnect(cation, anion) {
        // For each hole in cation
        for (let i = 0; i < cation.charge; i++) {
            const cationPoint = this.getConnectionPoint(cation, i, 'hole');
            
            // For each connector in anion
            for (let j = 0; j < anion.charge; j++) {
                const anionPoint = this.getConnectionPoint(anion, j, 'connector');
                
                // Calculate distance between connection points
                const distance = Math.sqrt(
                    (cationPoint.x - anionPoint.x) ** 2 + 
                    (cationPoint.y - anionPoint.y) ** 2
                );
                
                // If close enough to snap
                if (distance < 30) {
                    // Add to connections if not already connected
                    if (!cation.connections.includes(anion)) {
                        cation.connections.push(anion);
                        anion.connections.push(cation);
                    }
                    
                    // Record the specific connection points
                    cation.connectedPoints.push({
                        partner: anion.id,
                        cationHoleIndex: i,
                        anionConnectorIndex: j
                    });
                    
                    anion.connectedPoints.push({
                        partner: cation.id,
                        cationHoleIndex: i,
                        anionConnectorIndex: j
                    });
                    
                    // If we're dragging one of these ions, snap it into position
                    if (this.draggingIon === cation || this.draggingIon === anion) {
                        this.snapIonsToConnect(cation, anion, i, j);
                    }
                    
                    // Once connected, move to next hole
                    break;
                }
            }
        }
    }
    
    snapIonsToConnect(cation, anion, holeIndex, connectorIndex) {
        if (this.draggingIon === cation) {
            // Move cation to align with anion's connector
            const anionPoint = this.getConnectionPoint(anion, connectorIndex, 'connector');
            const holeOffset = this.getConnectionOffset(holeIndex, cation.charge);
            cation.x = anionPoint.x - holeOffset.dx;
            cation.y = anionPoint.y - holeOffset.dy;
        } else if (this.draggingIon === anion) {
            // Move anion to align with cation's hole
            const cationPoint = this.getConnectionPoint(cation, holeIndex, 'hole');
            const connectorOffset = this.getConnectionOffset(connectorIndex, anion.charge);
            anion.x = cationPoint.x + connectorOffset.dx;
            anion.y = cationPoint.y + connectorOffset.dy;
        }
    }
    
    finalizeSnapping() {
        // When releasing an ion, ensure all connections are properly established
        this.checkSnapToConnections();
        
        // Remove any temporary connections by rebuilding all connections
        for (const ion of this.ions) {
            ion.connections = [];
            ion.connectedPoints = [];
        }
        
        // Re-establish all connections based on proximity
        const cations = this.ions.filter(ion => ion.type === 'cation');
        const anions = this.ions.filter(ion => ion.type === 'anion');
        
        for (const cation of cations) {
            for (const anion of anions) {
                this.tryToConnect(cation, anion);
            }
        }
        
        this.updateFormula();
    }
    
    getConnectionPoint(ion, index, type) {
        // Get the coordinates of a specific connection point
        // For cations: holes are on the right side
        // For anions: connectors are on the left side
        
        const halfWidth = ion.width / 2;
        const halfHeight = ion.height / 2;
        
        if (type === 'hole' && ion.type === 'cation') {
            // Holes are on the right side of cations
            const spacing = ion.height / (ion.charge + 1);
            const y = ion.y - halfHeight + spacing * (index + 1);
            return {
                x: ion.x + halfWidth,
                y: y
            };
        } else if (type === 'connector' && ion.type === 'anion') {
            // Connectors are on the left side of anions
            const spacing = ion.height / (ion.charge + 1);
            const y = ion.y - halfHeight + spacing * (index + 1);
            return {
                x: ion.x - halfWidth,
                y: y
            };
        }
        
        // Fallback
        return { x: ion.x, y: ion.y };
    }
    
    getConnectionOffset(index, totalConnections) {
        // Calculate the offset from the center of the puzzle piece
        // to the connection point
        const spacing = 60 / (totalConnections + 1);
        const dy = -30 + spacing * (index + 1);
        
        return {
            dx: 60, // Half width
            dy: dy
        };
    }
    
    calculateFormula() {
        // Group connected ions
        const connectedGroups = this.findConnectedGroups();
        const formulas = [];
        
        for (const group of connectedGroups) {
            if (group.length > 1) {
                // Count ions of each type
                const ionCounts = {};
                
                for (const ion of group) {
                    if (!ionCounts[ion.symbol]) {
                        ionCounts[ion.symbol] = {
                            count: 1,
                            charge: ion.charge,
                            type: ion.type
                        };
                    } else {
                        ionCounts[ion.symbol].count++;
                    }
                }
                
                // Calculate total charge for cations and anions
                let totalPositiveCharge = 0;
                let totalNegativeCharge = 0;
                
                for (const [symbol, data] of Object.entries(ionCounts)) {
                    if (data.type === 'cation') {
                        totalPositiveCharge += data.charge * data.count;
                    } else {
                        totalNegativeCharge += data.charge * data.count;
                    }
                }
                
                // Check if charges are balanced
                if (totalPositiveCharge === totalNegativeCharge) {
                    // Build formula using ion count
                    let formula = '';
                    
                    // First, add cations
                    for (const [symbol, data] of Object.entries(ionCounts)) {
                        if (data.type === 'cation') {
                            formula += symbol;
                            if (data.count > 1) {
                                formula += data.count;
                            }
                        }
                    }
                    
                    // Then add anions
                    for (const [symbol, data] of Object.entries(ionCounts)) {
                        if (data.type === 'anion') {
                            // If anion is polyatomic and count > 1, wrap in parentheses
                            if (symbol.length > 1 && data.count > 1) {
                                formula += `(${symbol})`;
                            } else {
                                formula += symbol;
                            }
                            
                            if (data.count > 1) {
                                formula += data.count;
                            }
                        }
                    }
                    
                    formulas.push(formula);
                }
            }
        }
        
        // Check if we have a specific valid formula
        const validFormulas = [
            "Al2(PO4)3", 
            "NaCl", 
            "BaCO3", 
            "Al(CO3)3", 
            "Na3PO4",
            "BaCl2",
            "Ba3(PO4)2",
            "AlCl3"
        ];
        
        // Check if any formulas we found are valid
        const validFound = formulas.some(f => validFormulas.includes(f));
        
        if (formulas.length === 0) {
            return { isValid: false, formula: "No compound formed yet" };
        } else if (!validFound) {
            return { isValid: false, formula: "Invalid combination: " + formulas.join(", ") };
        } else {
            return { isValid: true, formula: formulas.join(" + ") };
        }
    }
    
    findConnectedGroups() {
        // Find groups of connected ions using BFS
        const visited = new Set();
        const groups = [];
        
        for (const ion of this.ions) {
            if (!visited.has(ion.id)) {
                const group = this.bfs(ion, visited);
                if (group.length > 0) {
                    groups.push(group);
                }
            }
        }
        
        return groups;
    }
    
    bfs(startIon, visited) {
        const queue = [startIon];
        const group = [];
        visited.add(startIon.id);
        
        while (queue.length > 0) {
            const currentIon = queue.shift();
            group.push(currentIon);
            
            for (const connectedIon of currentIon.connections) {
                if (!visited.has(connectedIon.id)) {
                    visited.add(connectedIon.id);
                    queue.push(connectedIon);
                }
            }
        }
        
        return group;
    }
    
    updateFormula() {
        const result = this.calculateFormula();
        const formulaOutput = document.getElementById('formula-output');
        
        formulaOutput.textContent = result.formula;
        
        // Update the formula display styling based on validity
        if (result.isValid) {
            formulaOutput.classList.add('valid-formula');
            formulaOutput.classList.remove('invalid-formula');
        } else {
            formulaOutput.classList.add('invalid-formula');
            formulaOutput.classList.remove('valid-formula');
        }
    }
    
    clearCanvas() {
        this.ions = [];
        this.render();
        this.updateFormula();
    }
    
    setupAnimationLoop() {
        const animate = () => {
            this.render();
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections between ions
        this.drawConnections();
        
        // Draw ions
        for (const ion of this.ions) {
            this.drawIon(ion);
        }
    }
    
    drawConnections() {
        // Draw lines between connected ions
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#7f8c8d';
        
        // Track drawn connections to avoid duplicates
        const drawnConnections = new Set();
        
        for (const cation of this.ions.filter(ion => ion.type === 'cation')) {
            for (const point of cation.connectedPoints) {
                // Find the connected anion
                const anion = this.ions.find(ion => ion.id === point.partner);
                if (anion) {
                    // Create a unique ID for this connection
                    const connectionId = [cation.id, anion.id, point.cationHoleIndex, point.anionConnectorIndex].join('-');
                    if (!drawnConnections.has(connectionId)) {
                        // Get connection points
                        const cationPoint = this.getConnectionPoint(cation, point.cationHoleIndex, 'hole');
                        const anionPoint = this.getConnectionPoint(anion, point.anionConnectorIndex, 'connector');
                        
                        // Draw connection
                        this.ctx.beginPath();
                        this.ctx.moveTo(cationPoint.x, cationPoint.y);
                        this.ctx.lineTo(anionPoint.x, anionPoint.y);
                        this.ctx.stroke();
                        
                        // Mark as drawn
                        drawnConnections.add(connectionId);
                    }
                }
            }
        }
    }
    
    drawIon(ion) {
        // Draw the ion using its image
        const img = this.images[ion.image];
        if (img && img.complete) {
            const x = ion.x - ion.width / 2;
            const y = ion.y - ion.height / 2;
            this.ctx.drawImage(img, x, y, ion.width, ion.height);
            
            // No need to draw symbol or charge as they should be in the image
        } else {
            // Fallback if image isn't loaded yet
            const width = ion.width;
            const height = ion.height;
            const x = ion.x - width / 2;
            const y = ion.y - height / 2;
            
            // Draw a placeholder rectangle
            this.ctx.beginPath();
            this.ctx.rect(x, y, width, height);
            this.ctx.fillStyle = ion.type === 'cation' ? '#3498db' : '#e74c3c';
            this.ctx.fill();
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw ion symbol as text
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(ion.symbol, ion.x, ion.y);
            
            // Draw charge
            const chargeText = ion.type === 'cation' ? `+${ion.charge}` : `-${ion.charge}`;
            this.ctx.font = '12px Arial';
            this.ctx.fillText(chargeText, ion.x, ion.y + height / 2 - 15);
        }
    }
}