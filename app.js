document.addEventListener('DOMContentLoaded', function() {
    // Initialize the puzzle canvas
    const puzzle = new ChemistryPuzzle('puzzle-canvas');
    
    // Populate the ion lists
    populateIonList('cation-list', IONS.cations, 'cation', puzzle);
    populateIonList('anion-list', IONS.anions, 'anion', puzzle);
    
    // Function to populate ion lists
    function populateIonList(listId, ions, type, puzzle) {
        const listElement = document.getElementById(listId);
        
        ions.forEach(ion => {
            const ionElement = document.createElement('div');
            ionElement.className = `ion-item ${type}`;
            
            // Create image element for the sidebar preview
            const img = document.createElement('img');
            img.src = ion.image;
            img.alt = ion.symbol;
            img.className = 'ion-preview';
            
            ionElement.appendChild(img);
            
            // Add text information
            const infoDiv = document.createElement('div');
            infoDiv.innerHTML = `
                <div>${ion.symbol}</div>
                <div class="ion-name">${ion.name}</div>
                <div class="charge">${type === 'cation' ? '+' : '-'}${ion.charge}</div>
            `;
            ionElement.appendChild(infoDiv);
            
            ionElement.addEventListener('click', () => {
                puzzle.addIon(type, ion.symbol, ion.name, ion.charge, ion.image);
            });
            
            listElement.appendChild(ionElement);
        });
    }
});