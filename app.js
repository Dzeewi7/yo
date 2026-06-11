/*
   SymptomSage - Modern Application Logic
   Handles: Symptom dataset, categorization, matching algorithm, OTC dosage, Clinic search, and PDF/Text reports.
*/

// ==========================================
// 1. DATASETS DEFINITIONS
// ==========================================

const SYMPTOMS = [
    { id: 'fever', name: 'Fever / Chills', category: 'general', icon: '🌡️' },
    { id: 'fatigue', name: 'Fatigue / Weakness', category: 'general', icon: '🥱' },
    { id: 'dizziness', name: 'Dizziness / Vertigo', category: 'general', icon: '💫' },
    { id: 'dry_mouth', name: 'Dry Mouth / Thirst', category: 'general', icon: '🥤' },
    
    { id: 'headache', name: 'Headache', category: 'head', icon: '🧠' },
    { id: 'sore_throat', name: 'Sore Throat', category: 'head', icon: '🧣' },
    { id: 'itchy_eyes', name: 'Itchy / Watery Eyes', category: 'head', icon: '👁️' },
    { id: 'earache', name: 'Ear Pain / Pressure', category: 'head', icon: '👂' },
    
    { id: 'nausea', name: 'Nausea / Vomiting', category: 'digestive', icon: '🤢' },
    { id: 'diarrhea', name: 'Diarrhea', category: 'digestive', icon: '🚽' },
    { id: 'stomach_ache', name: 'Stomach Pain / Cramps', category: 'digestive', icon: '😣' },
    { id: 'heartburn', name: 'Heartburn / Acid Burn', category: 'digestive', icon: '🔥' },
    
    { id: 'cough', name: 'Cough', category: 'respiratory', icon: '💨' },
    { id: 'runny_nose', name: 'Runny / Stuffy Nose', category: 'respiratory', icon: '💧' },
    { id: 'sneezing', name: 'Sneezing', category: 'respiratory', icon: '🤧' },
    { id: 'congestion', name: 'Chest Congestion', category: 'respiratory', icon: '🫁' },
    
    { id: 'body_aches', name: 'Body / Muscle Aches', category: 'joints', icon: '💪' },
    { id: 'joint_stiffness', name: 'Joint Stiffness', category: 'joints', icon: '🦴' },
    
    { id: 'skin_rash', name: 'Skin Rash / Redness', category: 'skin', icon: '🔴' },
    { id: 'itchy_skin', name: 'Dry / Itchy Skin', category: 'skin', icon: '🌾' }
];

const CONDITIONS = [
    {
        name: 'Common Cold',
        description: 'A minor viral infection of your upper respiratory tract. Usually resolves completely on its own within a week to 10 days.',
        symptoms: ['runny_nose', 'sneezing', 'sore_throat', 'cough', 'fatigue', 'headache'],
        remedies: 'Get plenty of bed rest. Stay hydrated by drinking water, warm broth, or hot tea with honey. Use saline nasal sprays to relieve stuffiness.',
        otc: 'Pain relievers (Acetaminophen/Ibuprofen) for sore throat or headache. Decongestant pills/sprays (Pseudoephedrine), or cough drops.',
        weights: { runny_nose: 3, sneezing: 3, sore_throat: 2, cough: 2, fatigue: 1, headache: 1 }
    },
    {
        name: 'Influenza (Flu)',
        description: 'A common contagious respiratory virus. Flu symptoms come on suddenly and are generally more severe than a standard cold.',
        symptoms: ['fever', 'cough', 'fatigue', 'body_aches', 'headache', 'sore_throat'],
        remedies: 'Strict bed rest is vital. Stay isolated to avoid spreading. Hydrate with electrolyte liquids. Drink warm fluids to soothe throat.',
        otc: 'Fever reducers & pain relievers (Ibuprofen or Acetaminophen) to curb body aches and high fever. Cough suppressants.',
        weights: { fever: 4, body_aches: 4, fatigue: 3, cough: 2, headache: 2, sore_throat: 1 }
    },
    {
        name: 'Seasonal Allergies (Hay Fever)',
        description: 'An allergic response to airborne substances like pollen, mold, or dander. Non-contagious.',
        symptoms: ['sneezing', 'runny_nose', 'itchy_eyes', 'sore_throat'],
        remedies: 'Keep indoor windows closed during high-pollen seasons. Use a HEPA air filter. Rinse sinuses with a saline squeeze bottle.',
        otc: 'Antihistamines (Cetirizine, Loratadine, Diphenhydramine) to stop sneezing and itchy eyes. Fluticasone nasal spray.',
        weights: { itchy_eyes: 4, sneezing: 3, runny_nose: 3, sore_throat: 1 }
    },
    {
        name: 'Dehydration',
        description: 'Occurs when your body loses more fluids than it takes in, leaving insufficient water to carry out normal functions.',
        symptoms: ['dizziness', 'headache', 'dry_mouth', 'fatigue'],
        remedies: 'Rehydrate slowly with electrolyte solutions, sports drinks, or coconut water. Avoid caffeine and alcohol as they dry you out further.',
        otc: 'Oral rehydration powders. Acetaminophen for accompanying headache (use caution: hydrate first).',
        weights: { dry_mouth: 4, dizziness: 3, headache: 2, fatigue: 2 }
    },
    {
        name: 'Gastroenteritis (Stomach Flu)',
        description: 'Inflammation of your stomach and intestines caused by a virus or consuming contaminated food or water.',
        symptoms: ['nausea', 'diarrhea', 'stomach_ache', 'fever', 'headache', 'fatigue'],
        remedies: 'Give your stomach a rest (avoid solid foods for a few hours). Sip water or sports drinks. Slowly introduce bland foods (toast, bananas, white rice).',
        otc: 'Oral rehydration salts. Consult a physician before taking anti-diarrheal agents as they can sometimes delay recovery.',
        weights: { diarrhea: 4, nausea: 4, stomach_ache: 3, fatigue: 1, fever: 1, headache: 1 }
    },
    {
        name: 'Tension Headache',
        description: 'A mild to moderate pressure pain around the forehead or neck. Often brought on by stress, poor posture, or lack of sleep.',
        symptoms: ['headache', 'fatigue', 'joint_stiffness'],
        remedies: 'Apply a warm or cold compress to your forehead or the back of your neck. Take a break in a dark room. Practice slow neck stretches.',
        otc: 'Pain relievers like Acetaminophen or NSAIDs (Ibuprofen, Naproxen). Some combinations with caffeine help relieve tension headaches.',
        weights: { headache: 5, fatigue: 2, joint_stiffness: 1 }
    },
    {
        name: 'Migraine',
        description: 'A complex neurological headache condition causing intense throbbing, often with nausea and extreme sensitivity to light/sound.',
        symptoms: ['headache', 'nausea', 'dizziness', 'fatigue'],
        remedies: 'Immediately lie down in a dark, completely quiet room. Apply cold packs to temples or neck. Rest sleep.',
        otc: 'Combination migraine relievers (Acetaminophen + Aspirin + Caffeine) or Ibuprofen. Take at the first sign of aura or onset.',
        weights: { headache: 5, nausea: 3, dizziness: 2, fatigue: 1 }
    },
    {
        name: 'Acid Reflux / Heartburn',
        description: 'Occurs when stomach acid flows back into the tube connecting your mouth and stomach (esophagus), causing irritation.',
        symptoms: ['heartburn', 'stomach_ache', 'sore_throat', 'cough'],
        remedies: 'Eat smaller meals. Avoid trigger foods (fried foods, citrus, onions, chocolate, caffeine). Remain upright for at least 2 hours after meals.',
        otc: 'Antacids (Tums, Mylanta) for fast temporary relief. H2 Blockers (Famotidine) or Proton Pump Inhibitors (Omeprazole) for longer prevention.',
        weights: { heartburn: 5, stomach_ache: 2, sore_throat: 1, cough: 1 }
    },
    {
        name: 'Eczema / Contact Dermatitis',
        description: 'An inflammatory skin reaction causing itchy, dry, cracked skin. Can be triggered by soaps, cosmetics, or allergens.',
        symptoms: ['skin_rash', 'itchy_skin'],
        remedies: 'Apply heavy, fragrance-free moisturizer creams twice daily. Bathe in warm (not hot) water. Avoid scratching or picking skin.',
        otc: 'Hydrocortisone cream (0.5% - 1%) to reduce redness and itching. Oral antihistamines for severe nocturnal itching.',
        weights: { itchy_skin: 4, skin_rash: 4 }
    },
    {
        name: 'Muscle Strain / Overexertion',
        description: 'An injury to muscle fibers or tendons caused by stretching too far, overuse, or heavy physical tasks.',
        symptoms: ['body_aches', 'joint_stiffness', 'fatigue'],
        remedies: 'Apply the RICE protocol: Rest the muscle group, Ice for 15 mins at a time, Compress lightly, and Elevate the limb if possible.',
        otc: 'Oral anti-inflammatories (Ibuprofen or Naproxen) to ease swelling. Topical creams or patches (Menthol, Methyl Salicylate).',
        weights: { body_aches: 4, joint_stiffness: 3, fatigue: 1 }
    }
];

const RED_FLAGS = {
    fever: 'High fever (over 103°F / 39.4°C) or fever lasting more than 3 consecutive days.',
    cough: 'Difficulty breathing, wheezing, coughing up pink/bloody mucus, or chest tightness.',
    dizziness: 'Fainting, numbness on one side of the face/body, slurred speech, or double vision.',
    stomach_ache: 'Severe, localized abdominal pain (especially bottom right side), persistent vomiting, or inability to keep liquids down.',
    headache: 'A sudden, explosive headache (the "worst headache of your life"), stiff neck, or fever alongside headache.',
    diarrhea: 'Signs of severe dehydration, blood in stools, or fever exceeding 102°F.'
};

const CLINICS_DATABASE = [
    { name: 'SymptomSage Urgent Care Centre', address: '452 Wellness Way, Suite 100', phone: '(555) 123-4560', hours: '8:00 AM - 10:00 PM', distance: '1.2 miles' },
    { name: 'Downtown Community Health Clinic', address: '120 Health Plaza Ave', phone: '(555) 789-0120', hours: '9:00 AM - 6:00 PM', distance: '2.5 miles' },
    { name: 'Metro Health Immediate Care', address: '88 Care Drive', phone: '(555) 345-6789', hours: '24 Hours Open', distance: '3.8 miles' },
    { name: 'CareFirst Family Practice & Clinic', address: '304 Beacon St', phone: '(555) 901-2345', hours: '8:00 AM - 5:00 PM (Closed Weekends)', distance: '4.1 miles' }
];

// ==========================================
// 2. STATE MANAGER
// ==========================================

const State = {
    selectedSymptoms: new Set(),
    activeCategory: 'all',
    searchQuery: '',
    severity: 1, // 1: Mild, 2: Moderate, 3: Severe
    duration: 'few-days',
    analysisResults: []
};

// ==========================================
// 3. UI ELEMENT REFERENCES
// ==========================================

const DOM = {
    symptomsGrid: document.getElementById('symptoms-grid'),
    selectedChips: document.getElementById('selected-chips'),
    clearSelectedBtn: document.getElementById('clear-selected-btn'),
    symptomSearch: document.getElementById('symptom-search'),
    categoryTabs: document.getElementById('category-tabs'),
    severityRange: document.getElementById('severity-range'),
    severityDisplay: document.getElementById('severity-display'),
    symptomDuration: document.getElementById('symptom-duration'),
    analyzeBtn: document.getElementById('analyze-btn'),
    
    // States
    emptyState: document.getElementById('workbench-empty'),
    loadingState: document.getElementById('workbench-loading'),
    resultsState: document.getElementById('workbench-results'),
    
    // Results details
    diagnosticSummary: document.getElementById('diagnostic-summary'),
    redFlagsContainer: document.getElementById('red-flags-container'),
    redFlagsList: document.getElementById('red-flags-list'),
    conditionsList: document.getElementById('conditions-list'),
    btnSaveReport: document.getElementById('btn-save-report'),
    btnStartOver: document.getElementById('btn-start-over'),
    
    // Tabs & Extra widgets
    tabTriggers: document.querySelectorAll('.tab-trigger'),
    widgetPanels: document.querySelectorAll('.widget-panel'),
    medicationSelect: document.getElementById('medication-select'),
    userAgeGroup: document.getElementById('user-age-group'),
    patientWeight: document.getElementById('patient-weight'),
    weightGroup: document.getElementById('weight-group'),
    dosageOutput: document.getElementById('dosage-output'),
    dosageScheduleOutput: document.getElementById('dosage-schedule-output'),
    
    // Clinics
    zipSearchInput: document.getElementById('zip-search-input'),
    btnFindClinics: document.getElementById('btn-find-clinics'),
    clinicListContainer: document.getElementById('clinic-list-container')
};

// ==========================================
// 4. SYMPTOM RENDERER & INTERACTION
// ==========================================

function initSymptoms() {
    renderSymptomsGrid();
    setupEventListeners();
    updateSelectedChips();
    calculateDosage();
    simulateClinicSearch();
}

function renderSymptomsGrid() {
    DOM.symptomsGrid.innerHTML = '';
    
    const filteredSymptoms = SYMPTOMS.filter(sym => {
        const matchesCategory = State.activeCategory === 'all' || sym.category === State.activeCategory;
        const matchesSearch = sym.name.toLowerCase().includes(State.searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filteredSymptoms.length === 0) {
        DOM.symptomsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 2rem 0;">No symptoms found matching your search.</div>`;
        return;
    }

    filteredSymptoms.forEach(sym => {
        const card = document.createElement('div');
        card.className = `symptom-card ${State.selectedSymptoms.has(sym.id) ? 'selected' : ''}`;
        card.dataset.id = sym.id;
        card.innerHTML = `
            <span class="icon">${sym.icon}</span>
            <span>${sym.name}</span>
        `;
        
        card.addEventListener('click', () => toggleSymptom(sym.id));
        DOM.symptomsGrid.appendChild(card);
    });
}

function toggleSymptom(id) {
    if (State.selectedSymptoms.has(id)) {
        State.selectedSymptoms.delete(id);
        showToast(`Removed symptom: ${getSymptomName(id)}`, 'info');
    } else {
        State.selectedSymptoms.add(id);
        showToast(`Added symptom: ${getSymptomName(id)}`, 'success');
    }
    
    renderSymptomsGrid();
    updateSelectedChips();
}

function getSymptomName(id) {
    const sym = SYMPTOMS.find(s => s.id === id);
    return sym ? sym.name : id;
}

function updateSelectedChips() {
    DOM.selectedChips.innerHTML = '';
    
    if (State.selectedSymptoms.size === 0) {
        DOM.selectedChips.innerHTML = `<span class="empty-chips-msg">No symptoms selected. Click on symptoms above to add them.</span>`;
        DOM.clearSelectedBtn.style.display = 'none';
        DOM.analyzeBtn.disabled = true;
        return;
    }
    
    DOM.clearSelectedBtn.style.display = 'block';
    DOM.analyzeBtn.disabled = false;

    State.selectedSymptoms.forEach(id => {
        const chip = document.createElement('div');
        chip.className = 'symptom-chip';
        chip.innerHTML = `
            <span>${getSymptomName(id)}</span>
            <button class="remove-btn" aria-label="Remove">&times;</button>
        `;
        
        chip.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSymptom(id);
        });
        
        DOM.selectedChips.appendChild(chip);
    });
}

function clearAllSelected() {
    if (State.selectedSymptoms.size === 0) return;
    State.selectedSymptoms.clear();
    showToast('Cleared all selected symptoms', 'info');
    renderSymptomsGrid();
    updateSelectedChips();
}

// ==========================================
// 5. TOAST SYSTEM
// ==========================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" color="#10b981"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'danger') {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" color="#ef4444"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>`;
    } else {
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" color="#3b82f6"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }
    
    toast.innerHTML = `
        ${iconSvg}
        <span class="toast-message">${message}</span>
    `;
    
    document.getElementById('toast-container').appendChild(toast);
    
    // Fade out and remove
    setTimeout(() => {
        toast.style.animation = 'fade-out var(--transition-normal) forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2800);
}

// ==========================================
// 6. MEDICAL DIAGNOSTIC MATCHING ENGINE
// ==========================================

function runAnalysis() {
    if (State.selectedSymptoms.size === 0) return;
    
    // Switch to loading state
    switchWorkbenchState('loading');
    
    setTimeout(() => {
        performDiagnosticMath();
        switchWorkbenchState('results');
        showToast('Analysis complete!', 'success');
    }, 1100);
}

function performDiagnosticMath() {
    const selectedArray = Array.from(State.selectedSymptoms);
    const results = [];
    
    CONDITIONS.forEach(cond => {
        let matchScore = 0;
        let maxPossibleScore = 0;
        let matchedSymptomsCount = 0;
        
        // Calculate maximum possible weight for the condition
        cond.symptoms.forEach(symId => {
            maxPossibleScore += cond.weights[symId] || 1;
        });
        
        // Calculate score of matched symptoms
        selectedArray.forEach(symId => {
            if (cond.symptoms.includes(symId)) {
                matchScore += cond.weights[symId] || 1;
                matchedSymptomsCount++;
            }
        });
        
        // Ratio of match score out of total condition weight
        let matchPercentage = maxPossibleScore > 0 ? (matchScore / maxPossibleScore) * 100 : 0;
        
        // Scale/adjust matching percentage based on duration/severity compatibility
        // Tension headache/Migraine gets mild boost if duration is short, whereas allergies get boost if weeks.
        if (matchedSymptomsCount > 0) {
            results.push({
                name: cond.name,
                description: cond.description,
                matchPercentage: Math.round(matchPercentage),
                remedies: cond.remedies,
                otc: cond.otc,
                matchCount: matchedSymptomsCount
            });
        }
    });
    
    // Sort conditions by match percentage descending
    results.sort((a, b) => b.matchPercentage - a.matchPercentage);
    State.analysisResults = results;
    
    // Render Results HTML
    renderResultsUI();
}

function renderResultsUI() {
    const selectedCount = State.selectedSymptoms.size;
    DOM.diagnosticSummary.innerHTML = `Based on your selection of <strong>${selectedCount} symptom${selectedCount > 1 ? 's' : ''}</strong>, here is a match analysis of potential minor issues.`;
    
    // Handle red flags warning block
    const isSevere = State.severity === 3;
    const isChronic = State.duration === 'weeks' || State.duration === 'week';
    
    // Filter red flags relevant to selected symptoms
    const activeRedFlags = [];
    State.selectedSymptoms.forEach(symId => {
        if (RED_FLAGS[symId]) activeRedFlags.push(RED_FLAGS[symId]);
    });
    
    if (isSevere || isChronic || activeRedFlags.length > 0) {
        DOM.redFlagsContainer.style.display = 'block';
        DOM.redFlagsList.innerHTML = '';
        
        // If no symptom specific flags, add default severe warnings
        if (activeRedFlags.length === 0) {
            activeRedFlags.push('High, unrelenting fever or severe localized pain.');
            activeRedFlags.push('Symptom progression or lack of improvement over several weeks.');
            activeRedFlags.push('Difficulty breathing, chest pressure, or cognitive confusion.');
        }
        
        activeRedFlags.forEach(flag => {
            const li = document.createElement('li');
            li.textContent = flag;
            DOM.redFlagsList.appendChild(li);
        });
        
        // Add a general warning if severity is Severe
        if (isSevere) {
            DOM.redFlagsContainer.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            DOM.redFlagsContainer.querySelector('.red-flags-title').innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" color="#ef4444"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/></svg>
                High Severity Warning
            `;
        } else {
            DOM.redFlagsContainer.style.borderColor = 'rgba(245, 158, 11, 0.4)';
            DOM.redFlagsContainer.querySelector('.red-flags-title').innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" color="#f59e0b"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Prolonged Duration Alert
            `;
        }
    } else {
        DOM.redFlagsContainer.style.display = 'none';
    }
    
    // Render Conditions list
    DOM.conditionsList.innerHTML = '';
    
    if (State.analysisResults.length === 0) {
        DOM.conditionsList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 2rem 0;">No matching minor conditions found in our database for these symptoms.</div>`;
        return;
    }
    
    State.analysisResults.forEach(res => {
        let confidenceClass = 'low';
        if (res.matchPercentage >= 70) confidenceClass = 'high';
        else if (res.matchPercentage >= 40) confidenceClass = 'medium';
        
        const card = document.createElement('div');
        card.className = 'condition-card';
        card.innerHTML = `
            <div class="condition-main">
                <div class="condition-title-block">
                    <h4>${res.name}</h4>
                </div>
                <div class="match-percentage-badge ${confidenceClass}">
                    <span>${res.matchPercentage}% Match</span>
                </div>
            </div>
            
            <div class="confidence-bar-container">
                <div class="confidence-bar ${confidenceClass}" style="width: ${res.matchPercentage}%"></div>
            </div>
            
            <p class="condition-description">${res.description}</p>
            
            <div class="remedy-section">
                <div class="remedy-col">
                    <h5>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        Home Care Remedies
                    </h5>
                    <p>${res.remedies}</p>
                </div>
                <div class="remedy-col otc">
                    <h5>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                        Common OTC Support
                    </h5>
                    <p>${res.otc}</p>
                </div>
            </div>
        `;
        
        DOM.conditionsList.appendChild(card);
    });
}

function switchWorkbenchState(stateName) {
    DOM.emptyState.classList.remove('active');
    DOM.loadingState.classList.remove('active');
    DOM.resultsState.classList.remove('active');
    
    if (stateName === 'empty') DOM.emptyState.classList.add('active');
    else if (stateName === 'loading') DOM.loadingState.classList.add('active');
    else if (stateName === 'results') DOM.resultsState.classList.add('active');
}

// ==========================================
// 7. REPORTS GENERATION
// ==========================================

function downloadReport() {
    if (State.selectedSymptoms.size === 0 || State.analysisResults.length === 0) return;
    
    const dateStr = new Date().toLocaleString();
    const symptomsList = Array.from(State.selectedSymptoms).map(s => getSymptomName(s)).join(', ');
    
    let text = `==================================================\n`;
    text += `             SYMPTOMSAGE HEALTH REPORT             \n`;
    text += `==================================================\n`;
    text += `Date Generated: ${dateStr}\n\n`;
    text += `PATIENT ASSESSMENT SUMMARY\n`;
    text += `--------------------------------------------------\n`;
    text += `Selected Symptoms : ${symptomsList}\n`;
    text += `Overall Severity  : ${State.severity === 3 ? 'Severe' : State.severity === 2 ? 'Moderate' : 'Mild'}\n`;
    text += `Duration          : ${DOM.symptomDuration.options[DOM.symptomDuration.selectedIndex].text}\n\n`;
    
    text += `POTENTIAL MINOR MATCHES\n`;
    text += `--------------------------------------------------\n`;
    
    State.analysisResults.forEach((res, i) => {
        text += `${i + 1}. ${res.name} (${res.matchPercentage}% Match)\n`;
        text += `   Description: ${res.description}\n`;
        text += `   Home Care  : ${res.remedies}\n`;
        text += `   OTC Support: ${res.otc}\n\n`;
    });
    
    text += `MEDICAL WARNINGS & ADVISORIES\n`;
    text += `--------------------------------------------------\n`;
    text += `* WARNING: If symptoms persist, worsen, or include shortness of breath,\n`;
    text += `  severe localized chest/abdomen pain, stiff neck, or high fever,\n`;
    text += `  consult a qualified clinical physician immediately.\n`;
    text += `* DISCLAIMER: This is a diagnostic simulation and guidelines reference.\n`;
    text += `  It does not constitute professional medical advice.\n\n`;
    text += `==================================================\n`;
    
    // Create File Blob & Download
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `symptomsage-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Report downloaded successfully!', 'success');
}

// ==========================================
// 8. OTC DOSAGE CALCULATOR WIDGET
// ==========================================

function calculateDosage() {
    const med = DOM.medicationSelect.value;
    const age = DOM.userAgeGroup.value;
    const weight = parseFloat(DOM.patientWeight.value) || 120;
    
    // Hide weight input for toddlers/infants where pediatrician review is required
    if (age === 'toddler') {
        DOM.weightGroup.style.display = 'none';
        DOM.dosageOutput.textContent = "Consult Doctor";
        DOM.dosageScheduleOutput.textContent = "Infants & toddlers require custom prescription doses based on exact medical evaluations.";
        return;
    }
    
    DOM.weightGroup.style.display = 'flex';
    
    let dosage = "";
    let schedule = "";
    
    if (med === 'acetaminophen') {
        if (age === 'adult') {
            dosage = "325mg - 650mg (1-2 Tablets)";
            schedule = "Take every 4 to 6 hours as needed. Maximum: 3,000mg per 24 hours.";
        } else if (age === 'child-8') {
            dosage = "320mg";
            schedule = "Take every 4 to 6 hours as needed. Do not exceed 5 doses in 24 hours.";
        } else { // child-6
            dosage = "240mg";
            schedule = "Take every 4 to 6 hours as needed. Do not exceed 5 doses in 24 hours.";
        }
    } else if (med === 'ibuprofen') {
        if (age === 'adult') {
            dosage = "200mg - 400mg (1-2 Tablets)";
            schedule = "Take every 4 to 6 hours with food as needed. Maximum: 1,200mg per 24 hours.";
        } else if (age === 'child-8') {
            dosage = "150mg - 200mg";
            schedule = "Take every 6 to 8 hours with food as needed. Maximum: 4 doses in 24 hours.";
        } else { // child-6
            dosage = "100mg - 150mg";
            schedule = "Take every 6 to 8 hours with food as needed. Maximum: 4 doses in 24 hours.";
        }
    } else if (med === 'diphenhydramine') {
        if (age === 'adult') {
            dosage = "25mg - 50mg (1-2 capsules)";
            schedule = "Take every 4 to 6 hours as needed. Caution: May cause severe drowsiness.";
        } else if (age === 'child-8') {
            dosage = "12.5mg - 25mg";
            schedule = "Take every 4 to 6 hours as needed. Do not use to make child sleepy.";
        } else { // child-6
            dosage = "12.5mg";
            schedule = "Take every 4 to 6 hours as needed.";
        }
    } else if (med === 'cetirizine') {
        if (age === 'adult') {
            dosage = "10mg (1 Tablet)";
            schedule = "Take once daily. Do not exceed 10mg in 24 hours.";
        } else if (age === 'child-8') {
            dosage = "5mg - 10mg";
            schedule = "Take once daily (either 5mg or 10mg depending on symptoms).";
        } else { // child-6
            dosage = "5mg";
            schedule = "Take 5mg once daily.";
        }
    }
    
    // Scale or adjust dosage visually based on weight if user modifies it
    if (weight < 70 && age === 'adult') {
        schedule += " *Lower dose recommended due to patient weight below 70 lbs.";
    }
    
    DOM.dosageOutput.textContent = dosage;
    DOM.dosageScheduleOutput.textContent = schedule;
}

// ==========================================
// 9. CLINIC FINDER SEARCH SIMULATION
// ==========================================

function simulateClinicSearch() {
    const zip = DOM.zipSearchInput.value.trim() || "Local Area";
    DOM.clinicListContainer.innerHTML = '';
    
    showToast(`Searching medical clinics near "${zip}"...`, 'info');
    
    CLINICS_DATABASE.forEach((clinic, index) => {
        const isOpen = index !== 3; // Mock clinic closed status
        
        const card = document.createElement('div');
        card.className = 'clinic-card';
        card.innerHTML = `
            <div class="clinic-name">${clinic.name}</div>
            <div class="clinic-info-row">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>${clinic.address} (${clinic.distance})</span>
            </div>
            <div class="clinic-info-row">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>${clinic.phone}</span>
            </div>
            <div class="clinic-info-row">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Hours: ${clinic.hours}</span>
            </div>
            <div class="clinic-status ${isOpen ? '' : 'closed'}">${isOpen ? 'Open Now' : 'Closed'}</div>
        `;
        
        DOM.clinicListContainer.appendChild(card);
    });
}

// ==========================================
// 10. EVENT LISTENERS SETUP
// ==========================================

function setupEventListeners() {
    // Search input
    DOM.symptomSearch.addEventListener('input', (e) => {
        State.searchQuery = e.target.value;
        renderSymptomsGrid();
    });
    
    // Category tabs
    DOM.categoryTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.cat-tab');
        if (!tab) return;
        
        // Update active class
        DOM.categoryTabs.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        State.activeCategory = tab.dataset.category;
        renderSymptomsGrid();
    });
    
    // Clear Selected Button
    DOM.clearSelectedBtn.addEventListener('click', clearAllSelected);
    
    // Severity slider
    DOM.severityRange.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        State.severity = val;
        
        // Update labels
        if (val === 1) {
            DOM.severityDisplay.textContent = 'Mild';
            DOM.severityDisplay.className = 'severity-label';
        } else if (val === 2) {
            DOM.severityDisplay.textContent = 'Moderate';
            DOM.severityDisplay.className = 'severity-label moderate';
        } else {
            DOM.severityDisplay.textContent = 'Severe';
            DOM.severityDisplay.className = 'severity-label severe';
        }
    });
    
    // Duration dropdown
    DOM.symptomDuration.addEventListener('change', (e) => {
        State.duration = e.target.value;
    });
    
    // Submit action
    DOM.analyzeBtn.addEventListener('click', runAnalysis);
    
    // Result actions
    DOM.btnStartOver.addEventListener('click', () => {
        clearAllSelected();
        switchWorkbenchState('empty');
        showToast('Reset completed.', 'info');
    });
    
    DOM.btnSaveReport.addEventListener('click', downloadReport);
    
    // Extra Widget Tabs Interaction
    DOM.tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            DOM.tabTriggers.forEach(t => t.classList.remove('active'));
            DOM.widgetPanels.forEach(p => p.classList.remove('active'));
            
            trigger.classList.add('active');
            const targetId = trigger.dataset.tab;
            document.getElementById(targetId).classList.add('active');
        });
    });
    
    // Dosage controls change
    DOM.medicationSelect.addEventListener('change', calculateDosage);
    DOM.userAgeGroup.addEventListener('change', calculateDosage);
    DOM.patientWeight.addEventListener('input', calculateDosage);
    
    // Clinic Search
    DOM.btnFindClinics.addEventListener('click', simulateClinicSearch);
    DOM.zipSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            simulateClinicSearch();
        }
    });
}

// Start application logic when loaded
document.addEventListener('DOMContentLoaded', initSymptoms);
// Fallback if DOMContentLoaded already fired
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initSymptoms();
}
