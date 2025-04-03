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
            ionElement.innerHTML = `
                <div>${ion.symbol}</div>
                <div>${ion.name}</div>
                <div class="charge">${type === 'cation' ? '+' : '-'}${ion.charge}</div>
            `;
            
            ionElement.addEventListener('click', () => {
                puzzle.addIon(type, ion.symbol, ion.name, ion.charge, ion.color);
            });
            
            listElement.appendChild(ionElement);
        });
    }
});