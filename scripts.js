document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const formulaDisplay = document.getElementById('formula');
    const resetBtn = document.getElementById('resetBtn');
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Store elements on canvas
    let canvasElements = [];
    let isDragging = false;
    let draggedElement = null;
    let draggedGroup = []; // For moving multiple elements together
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    // Element data - define properties for each element
    const elementData = {
        'Al': { symbol: 'Al', charge: 3, type: 'cation', subscript: '', superscript: '3+' },
        'Ba': { symbol: 'Ba', charge: 2, type: 'cation', subscript: '', superscript: '2+' },
        'Na': { symbol: 'Na', charge: 1, type: 'cation', subscript: '', superscript: '+' },
        'Cl': { symbol: 'Cl', charge: 1, type: 'anion', subscript: '', superscript: '-' },
        'SO4': { symbol: 'SO₄', charge: 2, type: 'anion', subscript: '', superscript: '2-' },
        'PO4': { symbol: 'PO₄', charge: 3, type: 'anion', subscript: '', superscript: '3-' },
        'CO3': { symbol: 'CO₃', charge: 2, type: 'anion', subscript: '', superscript: '2-' }
    };
    
    // Load images for elements
    const elementImages = {};
    Object.keys(elementData).forEach(key => {
        const img = new Image();
        
        // Map element keys to file names
        let fileName;
        switch(key) {
            case 'SO4': fileName = 'SO.png'; break;
            case 'PO4': fileName = 'PO.png'; break;
            case 'CO3': fileName = 'CO.png'; break;
            default: fileName = `${key}.png`;
        }
        
        img.src = `assets/${fileName}`;
        elementImages[key] = img;
    });
    
    // Add element to canvas
    function addElementToCanvas(elementKey, x, y) {
        const element = elementData[elementKey];
        
        // Create a new element object
        const newElement = {
            id: Date.now() + Math.random(), // Unique ID
            elementKey: elementKey,
            x: x,
            y: y,
            width: 60,
            height: 60,
            charge: element.charge,
            type: element.type,
            connectedTo: [], // IDs of connected elements
            group: null, // Group ID this element belongs to
            symbol: element.symbol
        };
        
        canvasElements.push(newElement);
        updateFormula();
        
        return newElement;
    }
    
    // Draw elements on canvas
    function drawElements() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Get all unique groups
        const groups = new Set();
        canvasElements.forEach(element => {
            if (element.group) groups.add(element.group);
        });
        
        // Draw group backgrounds first
        groups.forEach(groupId => {
            const groupElements = canvasElements.filter(e => e.group === groupId);
            if (groupElements.length < 2) return;
            
            // Find bounding box for the group
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            groupElements.forEach(element => {
                minX = Math.min(minX, element.x);
                minY = Math.min(minY, element.y);
                maxX = Math.max(maxX, element.x + element.width);
                maxY = Math.max(maxY, element.y + element.height);
            });
            
            // Draw group highlight
            ctx.save();
            ctx.fillStyle = 'rgba(200, 230, 255, 0.3)';
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            
            const padding = 10;
            ctx.beginPath();
            ctx.roundRect(
                minX - padding, 
                minY - padding, 
                maxX - minX + padding * 2, 
                maxY - minY + padding * 2, 
                12
            );
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });
        
        // Draw connections between groups
        drawGroupConnections();
        
        // Then draw elements
        canvasElements.forEach(element => {
            ctx.save();
            
            // Draw element background
            ctx.fillStyle = element.type === 'cation' ? '#ebf5ff' : '#fff5f5';
            ctx.strokeStyle = element.type === 'cation' ? '#3498db' : '#e74c3c';
            ctx.lineWidth = 2;
            
            if (element.connectedTo.length > 0) {
                ctx.setLineDash([5, 3]); // Dashed line for connected elements
                ctx.strokeStyle = '#27ae60';
            }
            
            ctx.beginPath();
            ctx.roundRect(element.x, element.y, element.width, element.height, 8);
            ctx.fill();
            ctx.stroke();
            
            // Draw element image
            const img = elementImages[element.elementKey];
            if (img.complete) {
                ctx.drawImage(
                    img, 
                    element.x + element.width * 0.1, 
                    element.y + element.height * 0.1, 
                    element.width * 0.8, 
                    element.height * 0.8
                );
            }
            
            // Draw charge
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            const chargeText = element.type === 'cation' ? `${element.charge}+` : `${element.charge}-`;
            ctx.fillText(chargeText, element.x + element.width - 20, element.y + 15);
            
            ctx.restore();
        });
    }
    
    // Draw connections between groups
    function drawGroupConnections() {
        const groups = {};
        const singleElements = [];
        
        // Identify groups and single elements
        canvasElements.forEach(element => {
            if (element.group) {
                if (!groups[element.group]) {
                    groups[element.group] = {
                        elements: [],
                        type: element.type,
                        elementKey: element.elementKey,
                        charge: element.charge,
                        connected: new Set()
                    };
                }
                groups[element.group].elements.push(element);
            } else {
                singleElements.push(element);
            }
        });
        
        // Calculate center point for each group
        Object.keys(groups).forEach(groupId => {
            const group = groups[groupId];
            let totalX = 0, totalY = 0;
            group.elements.forEach(element => {
                totalX += element.x + element.width/2;
                totalY += element.y + element.height/2;
            });
            group.centerX = totalX / group.elements.length;
            group.centerY = totalY / group.elements.length;
        });
        
        // Find connections between groups
        Object.keys(groups).forEach(groupId1 => {
            const group1 = groups[groupId1];
            
            // Connect to other groups
            Object.keys(groups).forEach(groupId2 => {
                if (groupId1 === groupId2) return;
                const group2 = groups[groupId2];
                
                // Only connect between cations and anions
                if (group1.type === group2.type) return;
                
                // Calculate distance between group centers
                const dx = Math.abs(group1.centerX - group2.centerX);
                const dy = Math.abs(group1.centerY - group2.centerY);
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                // Connect if they're close enough
                if (distance < 150) {
                    // Check if charges can be balanced
                    const totalGroup1Charge = group1.elements.length * group1.charge;
                    const totalGroup2Charge = group2.elements.length * group2.charge;
                    
                    if ((group1.type === 'cation' && totalGroup1Charge >= totalGroup2Charge) ||
                        (group1.type === 'anion' && totalGroup1Charge <= totalGroup2Charge)) {
                        
                        group1.connected.add(groupId2);
                        group2.connected.add(groupId1);
                        
                        // Draw connection line
                        ctx.save();
                        ctx.strokeStyle = '#27ae60';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 3]);
                        ctx.beginPath();
                        ctx.moveTo(group1.centerX, group1.centerY);
                        ctx.lineTo(group2.centerX, group2.centerY);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            });
            
            // Connect to single elements
            singleElements.forEach(element => {
                // Only connect between cations and anions
                if (group1.type === element.type) return;
                
                const elementCenterX = element.x + element.width/2;
                const elementCenterY = element.y + element.height/2;
                
                // Calculate distance
                const dx = Math.abs(group1.centerX - elementCenterX);
                const dy = Math.abs(group1.centerY - elementCenterY);
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                // Connect if they're close enough
                if (distance < 150) {
                    // Draw connection line
                    ctx.save();
                    ctx.strokeStyle = '#27ae60';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 3]);
                    ctx.beginPath();
                    ctx.moveTo(group1.centerX, group1.centerY);
                    ctx.lineTo(elementCenterX, elementCenterY);
                    ctx.stroke();
                    ctx.restore();
                    
                    // Store connection
                    group1.elements.forEach(groupElement => {
                        if (!groupElement.connectedTo.includes(element.id)) {
                            groupElement.connectedTo.push(element.id);
                        }
                        if (!element.connectedTo.includes(groupElement.id)) {
                            element.connectedTo.push(groupElement.id);
                        }
                    });
                }
            });
        });
        
        // Connect single elements to each other
        for (let i = 0; i < singleElements.length; i++) {
            const element1 = singleElements[i];
            for (let j = i+1; j < singleElements.length; j++) {
                const element2 = singleElements[j];
                
                // Only connect between cations and anions
                if (element1.type === element2.type) continue;
                
                const e1CenterX = element1.x + element1.width/2;
                const e1CenterY = element1.y + element1.height/2;
                const e2CenterX = element2.x + element2.width/2;
                const e2CenterY = element2.y + element2.height/2;
                
                // Calculate distance
                const dx = Math.abs(e1CenterX - e2CenterX);
                const dy = Math.abs(e1CenterY - e2CenterY);
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                // Connect if they're close enough
                if (distance < 80) {
                    // Draw connection line
                    ctx.save();
                    ctx.strokeStyle = '#27ae60';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 3]);
                    ctx.beginPath();
                    ctx.moveTo(e1CenterX, e1CenterY);
                    ctx.lineTo(e2CenterX, e2CenterY);
                    ctx.stroke();
                    ctx.restore();
                    
                    // Store connection
                    if (!element1.connectedTo.includes(element2.id)) {
                        element1.connectedTo.push(element2.id);
                    }
                    if (!element2.connectedTo.includes(element1.id)) {
                        element2.connectedTo.push(element1.id);
                    }
                }
            }
        }
    }
    
    // Group similar elements that are close to each other
    function groupSimilarElements() {
        // Reset all groups
        canvasElements.forEach(element => {
            element.group = null;
        });
        
        // Create a new group ID
        let nextGroupId = 1;
        
        // Group elements by type and key
        const elementTypes = {};
        canvasElements.forEach(element => {
            const key = `${element.type}-${element.elementKey}`;
            if (!elementTypes[key]) {
                elementTypes[key] = [];
            }
            elementTypes[key].push(element);
        });
        
        // Process each element type
        Object.values(elementTypes).forEach(elements => {
            if (elements.length < 2) return; // Need at least 2 to form a group
            
            // Find groups of elements that are close to each other
            const processed = new Set();
            
            elements.forEach(element => {
                if (processed.has(element.id)) return;
                
                // Start a new potential group
                const groupElements = [element];
                processed.add(element.id);
                
                // Find all elements close to this one
                let foundNew = true;
                while (foundNew) {
                    foundNew = false;
                    
                    elements.forEach(otherElement => {
                        if (processed.has(otherElement.id)) return;
                        
                        // Check if it's close to any element in our current group
                        for (const groupElement of groupElements) {
                            const dx = Math.abs((groupElement.x + groupElement.width/2) - 
                                              (otherElement.x + otherElement.width/2));
                            const dy = Math.abs((groupElement.y + groupElement.height/2) - 
                                              (otherElement.y + otherElement.height/2));
                            
                            if (dx < 100 && dy < 100) {
                                groupElements.push(otherElement);
                                processed.add(otherElement.id);
                                foundNew = true;
                                break;
                            }
                        }
                    });
                }
                
                // If we found multiple elements, make them a group
                if (groupElements.length > 1) {
                    const groupId = `group-${nextGroupId++}`;
                    groupElements.forEach(element => {
                        element.group = groupId;
                    });
                }
            });
        });
    }
    
    // Calculate and display chemical formula
    function updateFormula() {
        // First group similar elements
        groupSimilarElements();
        
        // Gather all compounds
        const compounds = findCompounds();
        
        // Generate formula for each compound
        const formulas = compounds.map(compound => {
            return calculateCompoundFormula(compound);
        }).filter(Boolean); // Remove null/undefined
        
        // Display formulas
        formulaDisplay.innerHTML = formulas.join(' + ') || 'Drag elements to the canvas';
        
        // Redraw with updated connections
        drawElements();
    }
    
    // Find all compounds on the canvas
    function findCompounds() {
        // Reset connections
        canvasElements.forEach(element => {
            element.connectedTo = [];
        });
        
        // First, identify all groups and single elements
        const groups = {};
        const singles = [];
        
        canvasElements.forEach(element => {
            if (element.group) {
                if (!groups[element.group]) {
                    groups[element.group] = {
                        id: element.group,
                        elements: [],
                        type: element.type,
                        elementKey: element.elementKey,
                        charge: element.charge,
                        totalCharge: 0,
                        connectedTo: new Set()
                    };
                }
                groups[element.group].elements.push(element);
                groups[element.group].totalCharge += element.charge;
            } else {
                singles.push({
                    id: element.id,
                    element: element,
                    connectedTo: new Set()
                });
            }
        });
        
        // Calculate centers for groups
        Object.values(groups).forEach(group => {
            let totalX = 0, totalY = 0;
            group.elements.forEach(element => {
                totalX += element.x + element.width/2;
                totalY += element.y + element.height/2;
            });
            group.centerX = totalX / group.elements.length;
            group.centerY = totalY / group.elements.length;
        });
        
        // Find connections between groups
        Object.values(groups).forEach(group1 => {
            Object.values(groups).forEach(group2 => {
                if (group1.id === group2.id) return;
                if (group1.type === group2.type) return; // Only connect opposite types
                
                const dx = Math.abs(group1.centerX - group2.centerX);
                const dy = Math.abs(group1.centerY - group2.centerY);
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < 150) {
                    group1.connectedTo.add(group2.id);
                    group2.connectedTo.add(group1.id);
                    
                    // Connect individual elements
                    group1.elements.forEach(e1 => {
                        group2.elements.forEach(e2 => {
                            e1.connectedTo.push(e2.id);
                            e2.connectedTo.push(e1.id);
                        });
                    });
                }
            });
            
            // Connect groups to singles
            singles.forEach(single => {
                if (group1.type === single.element.type) return;
                
                const singleCenterX = single.element.x + single.element.width/2;
                const singleCenterY = single.element.y + single.element.height/2;
                
                const dx = Math.abs(group1.centerX - singleCenterX);
                const dy = Math.abs(group1.centerY - singleCenterY);
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < 150) {
                    group1.connectedTo.add(single.id);
                    single.connectedTo.add(group1.id);
                    
                    // Connect individual elements
                    group1.elements.forEach(e => {
                        e.connectedTo.push(single.element.id);
                        single.element.connectedTo.push(e.id);
                    });
                }
            });
        });
        
        // Connect singles to singles
        for (let i = 0; i < singles.length; i++) {
            for (let j = i+1; j < singles.length; j++) {
                const single1 = singles[i];
                const single2 = singles[j];
                
                if (single1.element.type === single2.element.type) continue;
                
                const s1CenterX = single1.element.x + single1.element.width/2;
                const s1CenterY = single1.element.y + single1.element.height/2;
                const s2CenterX = single2.element.x + single2.element.width/2;
                const s2CenterY = single2.element.y + single2.element.height/2;
                
                const dx = Math.abs(s1CenterX - s2CenterX);
                const dy = Math.abs(s1CenterY - s2CenterY);
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < 80) {
                    single1.connectedTo.add(single2.id);
                    single2.connectedTo.add(single1.id);
                    
                    single1.element.connectedTo.push(single2.element.id);
                    single2.element.connectedTo.push(single1.element.id);
                }
            }
        }
        
        // Find all connected components (compounds)
        const visited = new Set();
        const compounds = [];
        
        // Start with groups
        Object.values(groups).forEach(group => {
            if (visited.has(group.id)) return;
            
            // Start a new compound
            const compound = {
                cationGroups: [],
                anionGroups: [],
                singleCations: [],
                singleAnions: []
            };
            
            // DFS to find all connected elements
            const dfs = (nodeId, isGroup) => {
                if (visited.has(nodeId)) return;
                visited.add(nodeId);
                
                if (isGroup) {
                    const group = groups[nodeId];
                    if (group.type === 'cation') {
                        compound.cationGroups.push(group);
                    } else {
                        compound.anionGroups.push(group);
                    }
                    
                    // Visit connected nodes
                    group.connectedTo.forEach(connectedId => {
                        if (groups[connectedId]) {
                            dfs(connectedId, true);
                        } else {
                            dfs(connectedId, false);
                        }
                    });
                } else {
                    // It's a single element
                    const single = singles.find(s => s.id === nodeId);
                    if (!single) return;
                    
                    if (single.element.type === 'cation') {
                        compound.singleCations.push(single);
                    } else {
                        compound.singleAnions.push(single);
                    }
                    
                    // Visit connected nodes
                    single.connectedTo.forEach(connectedId => {
                        if (groups[connectedId]) {
                            dfs(connectedId, true);
                        } else {
                            dfs(connectedId, false);
                        }
                    });
                }
            };
            
            dfs(group.id, true);
            
            // Only add if there's at least one cation and one anion
            if ((compound.cationGroups.length > 0 || compound.singleCations.length > 0) &&
                (compound.anionGroups.length > 0 || compound.singleAnions.length > 0)) {
                compounds.push(compound);
            }
        });
        
        // Check for compounds among singles that haven't been visited
        for (const single of singles) {
            if (visited.has(single.id)) continue;
            
            // Start a new compound
            const compound = {
                cationGroups: [],
                anionGroups: [],
                singleCations: [],
                singleAnions: []
            };
            
            // DFS to find all connected elements
            const dfs = (nodeId) => {
                if (visited.has(nodeId)) return;
                visited.add(nodeId);
                
                const single = singles.find(s => s.id === nodeId);
                if (!single) return;
                
                if (single.element.type === 'cation') {
                    compound.singleCations.push(single);
                } else {
                    compound.singleAnions.push(single);
                }
                
                // Visit connected singles
                single.connectedTo.forEach(connectedId => {
                    dfs(connectedId);
                });
            };
            
            dfs(single.id);
            
            // Only add if there's at least one cation and one anion
            if (compound.singleCations.length > 0 && compound.singleAnions.length > 0) {
                compounds.push(compound);
            }
        }
        
        return compounds;
    }
    
    // Calculate formula for a compound
    function calculateCompoundFormula(compound) {
        // Calculate total charges
        let totalCationCharge = 0;
        let totalAnionCharge = 0;
        
        // Add up group charges
        compound.cationGroups.forEach(group => {
            totalCationCharge += group.elements.length * group.charge;
        });
        
        compound.anionGroups.forEach(group => {
            totalAnionCharge += group.elements.length * group.charge;
        });
        
        // Add up single element charges
        compound.singleCations.forEach(single => {
            totalCationCharge += single.element.charge;
        });
        
        compound.singleAnions.forEach(single => {
            totalAnionCharge += single.element.charge;
        });
        
        // Create element counts
        const cationCounts = {};
        const anionCounts = {};
        
        // Count cations from groups
        compound.cationGroups.forEach(group => {
            const key = group.elementKey;
            cationCounts[key] = (cationCounts[key] || 0) + group.elements.length;
        });
        
        // Count anions from groups
        compound.anionGroups.forEach(group => {
            const key = group.elementKey;
            anionCounts[key] = (anionCounts[key] || 0) + group.elements.length;
        });
        
        // Count single cations
        compound.singleCations.forEach(single => {
            const key = single.element.elementKey;
            cationCounts[key] = (cationCounts[key] || 0) + 1;
        });
        
        // Count single anions
        compound.singleAnions.forEach(single => {
            const key = single.element.elementKey;
            anionCounts[key] = (anionCounts[key] || 0) + 1;
        });
        
        // Check if charges balance
        if (totalCationCharge === totalAnionCharge) {
            // Build formula string
            let formula = '';
            
            // Add cations
            Object.entries(cationCounts).forEach(([key, count]) => {
                formula += elementData[key].symbol;
                if (count > 1) formula += count;
            });
            
            // Add anions
            Object.entries(anionCounts).forEach(([key, count]) => {
                // If anion is polyatomic and we have multiple, wrap in parentheses
                if (key !== 'Cl' && count > 1) {
                    formula += `(${elementData[key].symbol})`;
                    formula += count;
                } else {
                    formula += elementData[key].symbol;
                    if (count > 1) formula += count;
                }
            });
            
            return formula;
        }
        
        // If charges don't balance, return null or a partial formula
        return null;
    }
    
    // Event listeners for canvas interactions
    canvas.addEventListener('mousedown', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if we clicked on an existing element
        for (let i = canvasElements.length - 1; i >= 0; i--) {
            const element = canvasElements[i];
            if (
                x >= element.x && 
                x <= element.x + element.width && 
                y >= element.y && 
                y <= element.y + element.height
            ) {
                isDragging = true;
                draggedElement = element;
                dragOffsetX = x - element.x;
                dragOffsetY = y - element.y;
                
                // If this element is part of a group, we'll move the whole group
                if (element.group) {
                    draggedGroup = canvasElements.filter(e => e.group === element.group);
                } else {
                    draggedGroup = [];
                }
                
                break;
            }
        }
    });
    
    canvas.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (draggedGroup.length > 0) {
                // Move all elements in the group
                const dx = x - dragOffsetX - draggedElement.x;
                const dy = y - dragOffsetY - draggedElement.y;
                
                draggedGroup.forEach(groupElement => {
                    groupElement.x += dx;
                    groupElement.y += dy;
                    
                    // Keep elements within canvas bounds
                    groupElement.x = Math.max(0, Math.min(canvas.width - groupElement.width, groupElement.x));
                    groupElement.y = Math.max(0, Math.min(canvas.height - groupElement.height, groupElement.y));
                });
            } else if (draggedElement) {
                // Update element position
                draggedElement.x = x - dragOffsetX;
                draggedElement.y = y - dragOffsetY;
                
                // Keep element within canvas bounds
                draggedElement.x = Math.max(0, Math.min(canvas.width - draggedElement.width, draggedElement.x));
                draggedElement.y = Math.max(0, Math.min(canvas.height - draggedElement.height, draggedElement.y));
            }
            
            // Update connections and formula
            updateFormula();
        }
    });
    
    canvas.addEventListener('mouseup', function() {
        isDragging = false;
        draggedElement = null;
        draggedGroup = [];
        updateFormula();
    });
    
    canvas.addEventListener('mouseleave', function() {
        if (isDragging) {
            isDragging = false;
            draggedElement = null;
            draggedGroup = [];
            updateFormula();
        }
    });
    
    // Event listeners for elements in the sidebar
    document.querySelectorAll('.element').forEach(element => {
        element.addEventListener('click', function() {
            const elementKey = this.getAttribute('data-element');
            
            // Add element to the center of the canvas
            const centerX = (canvas.width / 2) - 30;
            const centerY = (canvas.height / 2) - 30;
            
            // Add some randomness to avoid perfect overlap
            const offsetX = Math.random() * 60 - 30;
            const offsetY = Math.random() * 60 - 30;
            
            addElementToCanvas(elementKey, centerX + offsetX, centerY + offsetY);
            drawElements();
        });
    });
    
    // Reset button
    resetBtn.addEventListener('click', function() {
        canvasElements = [];
        drawElements();
        updateFormula();
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        drawElements();
    });
    
    // Initial draw
    drawElements();
});