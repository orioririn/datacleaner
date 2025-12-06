// Global variables
let originalData = [];
let currentData = [];
let displayedData = [];
let dataHistory = [];
let actionHistory = [];
let columns = [];
let charts = [];
let filterGroups = [];
let sortGroups = [];
let chartConfigs = [];
let currentPage = 1;
let rowsPerPage = 100;
let highlightedErrors = { nulls: false, duplicates: false, duplicateFields: [] };
let pendingChanges = [];
let fileName = '';

// Gender standardization mapping
const genderMapping = {
    'm': 'M',
    'male': 'M',
    'man': 'M',
    'boy': 'M',
    'f': 'F',
    'female': 'F',
    'woman': 'F',
    'girl': 'F',
    'fem': 'F',
    'w': 'F'
};

// Vibrant color palette for charts
const vibrantColors = [
    'rgba(255, 99, 132, 0.8)',   // Vibrant Pink/Red
    'rgba(54, 162, 235, 0.8)',   // Bright Blue
    'rgba(255, 206, 86, 0.8)',   // Sunny Yellow
    'rgba(75, 192, 192, 0.8)',   // Turquoise
    'rgba(153, 102, 255, 0.8)',  // Purple
    'rgba(255, 159, 64, 0.8)',   // Orange
    'rgba(255, 99, 255, 0.8)',   // Magenta
    'rgba(99, 255, 132, 0.8)',   // Lime Green
    'rgba(255, 50, 50, 0.8)',    // Red
    'rgba(50, 255, 50, 0.8)',    // Green
    'rgba(50, 50, 255, 0.8)',    // Blue
    'rgba(255, 215, 0, 0.8)',    // Gold
    'rgba(0, 255, 255, 0.8)',    // Cyan
    'rgba(255, 0, 255, 0.8)',    // Fuchsia
    'rgba(128, 0, 128, 0.8)',    // Purple
    'rgba(255, 165, 0, 0.8)',    // Orange
    'rgba(220, 20, 60, 0.8)',    // Crimson
    'rgba(30, 144, 255, 0.8)',   // Dodger Blue
    'rgba(255, 20, 147, 0.8)',   // Deep Pink
    'rgba(0, 206, 209, 0.8)'     // Dark Turquoise
];

const vibrantBorderColors = [
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 192, 192, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(255, 99, 255, 1)',
    'rgba(99, 255, 132, 1)',
    'rgba(255, 50, 50, 1)',
    'rgba(50, 255, 50, 1)',
    'rgba(50, 50, 255, 1)',
    'rgba(255, 215, 0, 1)',
    'rgba(0, 255, 255, 1)',
    'rgba(255, 0, 255, 1)',
    'rgba(128, 0, 128, 1)',
    'rgba(255, 165, 0, 1)',
    'rgba(220, 20, 60, 1)',
    'rgba(30, 144, 255, 1)',
    'rgba(255, 20, 147, 1)',
    'rgba(0, 206, 209, 1)'
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Hamburger menu
    document.getElementById('hamburgerMenu').addEventListener('click', toggleHistory);

    // Block headers
    document.querySelectorAll('.block-header').forEach(header => {
        header.addEventListener('click', () => {
            const blockType = header.getAttribute('data-block');
            toggleDropdown(header, blockType);
        });
    });

    // File upload
    const fileDropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('fileInput');
    
    fileDropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.classList.add('drag-over');
    });
    
    fileDropZone.addEventListener('dragleave', () => {
        fileDropZone.classList.remove('drag-over');
    });
    
    fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.classList.remove('drag-over');
        handleFile(e.dataTransfer.files[0]);
    });

    // Clean data actions
    document.querySelectorAll('[data-clean]').forEach(item => {
        item.addEventListener('click', (e) => {
            const cleanType = e.target.getAttribute('data-clean');
            handleCleanAction(cleanType);
        });
    });
    document.getElementById('applyStandardize').addEventListener('click', applyStandardization);

    // Organize/Sort
    document.getElementById('addSortBtn').addEventListener('click', addSortGroup);
    document.getElementById('applySortBtn').addEventListener('click', applySorting);

    // Filter
    document.getElementById('addFilterBtn').addEventListener('click', addFilterGroup);
    document.getElementById('applyFilterBtn').addEventListener('click', applyFilters);
    document.getElementById('clearFilterBtn').addEventListener('click', clearFilters);

    // Visualization
    document.querySelectorAll('[data-chart]').forEach(item => {
        item.addEventListener('click', (e) => {
            const chartType = e.target.getAttribute('data-chart');
            handleVisualizationAction(chartType);
        });
    });

    // Undo and Download
    document.getElementById('undoButton').addEventListener('click', undoAction);
    document.getElementById('downloadButton').addEventListener('click', downloadData);

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            closeModal(e.target.closest('.modal').id);
        });
    });

    // Highlight errors modal
    document.getElementById('highlight-duplicates').addEventListener('change', function() {
        document.getElementById('duplicateFieldsSection').style.display = 
            this.checked ? 'block' : 'none';
    });
    document.getElementById('highlightCancel').addEventListener('click', () => closeModal('highlightErrorsModal'));
    document.getElementById('highlightApply').addEventListener('click', applyHighlighting);

    // Auto correct modal
    document.getElementById('autoCorrectCancel').addEventListener('click', () => closeModal('autoCorrectModal'));
    document.getElementById('autoCorrectApply').addEventListener('click', applyAutoCorrect);

    // Duplicates modal
    document.getElementById('duplicatesCancel').addEventListener('click', () => closeModal('duplicatesModal'));
    document.getElementById('duplicatesFind').addEventListener('click', findDuplicates);
    document.getElementById('duplicatesRemove').addEventListener('click', removeDuplicates);

    // Review modal
    document.getElementById('modalCancel').addEventListener('click', () => closeModal('reviewModal'));
    document.getElementById('modalApply').addEventListener('click', applyModalChanges);

    // Chart modal
    document.getElementById('chartCancel').addEventListener('click', () => closeModal('chartModal'));
    document.getElementById('chartCreate').addEventListener('click', createChart);

    // Multi chart modal
    document.getElementById('multiChartCancel').addEventListener('click', () => closeModal('multiChartModal'));
    document.getElementById('addChartConfig').addEventListener('click', addChartConfig);
    document.getElementById('multiChartCreate').addEventListener('click', createMultipleCharts);

    // Stats modal
    document.getElementById('statsCancel').addEventListener('click', () => closeModal('statsModal'));
    document.getElementById('statsCalculate').addEventListener('click', calculateStats);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

// File Handling
function handleFile(file) {
    if (!file) return;
    
    fileName = file.name;
    document.querySelector('.file-drop-zone p').textContent = fileName;
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (fileExt === 'csv') {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                processData(results.data);
            }
        });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            processData(jsonData);
        };
        reader.readAsArrayBuffer(file);
    } else if (fileExt === 'json') {
        const reader = new FileReader();
        reader.onload = (e) => {
            const jsonData = JSON.parse(e.target.result);
            processData(Array.isArray(jsonData) ? jsonData : [jsonData]);
        };
        reader.readAsText(file);
    }
}

function processData(data) {
    originalData = data.filter(row => Object.keys(row).length > 0);
    currentData = JSON.parse(JSON.stringify(originalData));
    displayedData = JSON.parse(JSON.stringify(currentData));
    columns = Object.keys(originalData[0] || {});
    
    dataHistory = [JSON.parse(JSON.stringify(currentData))];
    actionHistory = [];
    currentPage = 1;
    
    displayData();
    updateColumnSelectors();
    addToHistory('File uploaded', 'upload');
}

// Display Data
function displayData() {
    if (!displayedData || displayedData.length === 0) {
        document.getElementById('displayContent').innerHTML = '<p style="text-align: center; color: #666; margin-top: 100px;">No data to display</p>';
        return;
    }

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = displayedData.slice(start, end);
    const cols = Object.keys(displayedData[0]);
    
    let html = '<div class="data-table-container"><table class="data-table"><thead><tr>';
    
    cols.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    pageData.forEach((row, rowIndex) => {
        const actualRowIndex = start + rowIndex;
        html += '<tr>';
        cols.forEach(col => {
            const value = row[col];
            const isEmpty = value === null || value === undefined || value === '';
            let cellClass = '';
            
            if (highlightedErrors.nulls && isEmpty) {
                cellClass = 'highlight-null';
            }
            
            if (highlightedErrors.duplicates && highlightedErrors.duplicateFields.length > 0) {
                if (isDuplicateRow(actualRowIndex, highlightedErrors.duplicateFields)) {
                    cellClass = 'highlight-duplicate';
                }
            }
            
            const displayValue = isEmpty ? '' : value;
            html += `<td class="${cellClass}">${displayValue}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    // Add pagination
    const totalPages = Math.ceil(displayedData.length / rowsPerPage);
    html += `
        <div class="pagination">
            <button onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>First</button>
            <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
            <span>Page ${currentPage} of ${totalPages} (${displayedData.length} total rows)</span>
            <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
            <button onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>Last</button>
        </div>
    `;
    html += '</div>';
    
    document.getElementById('displayContent').innerHTML = html;
}

function goToPage(page) {
    const totalPages = Math.ceil(displayedData.length / rowsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayData();
    }
}

function isDuplicateRow(rowIndex, fields) {
    const currentRow = displayedData[rowIndex];
    
    for (let i = 0; i < displayedData.length; i++) {
        if (i !== rowIndex) {
            const compareRow = displayedData[i];
            let allFieldsMatch = true;
            
            for (const field of fields) {
                if (currentRow[field] !== compareRow[field]) {
                    allFieldsMatch = false;
                    break;
                }
            }
            
            if (allFieldsMatch) {
                return true;
            }
        }
    }
    
    return false;
}

// Toggle Functions
function toggleHistory() {
    const sidebar = document.getElementById('historySidebar');
    const hamburger = document.getElementById('hamburgerMenu');
    const mainContent = document.getElementById('mainContent');
    
    sidebar.classList.toggle('active');
    hamburger.classList.toggle('active');
    mainContent.classList.toggle('history-open');
}

function toggleDropdown(header, blockType) {
    const dropdown = header.nextElementSibling;
    const isActive = dropdown.classList.contains('active');
    
    // Close all dropdowns
    document.querySelectorAll('.dropdown-content').forEach(d => {
        d.classList.remove('active');
    });
    document.querySelectorAll('.sub-dropdown').forEach(s => {
        s.classList.remove('active');
    });
    document.querySelectorAll('.block-header').forEach(h => {
        h.classList.remove('active');
    });
    
    // Toggle current dropdown
    if (!isActive) {
        dropdown.classList.add('active');
        header.classList.add('active');
    }
}

// Update Column Selectors
function updateColumnSelectors() {
    const selects = ['standardizeColumn'];
    
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="">Select Column</option>';
            columns.forEach(col => {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                select.appendChild(option);
            });
        }
    });
    
    filterGroups = [];
    sortGroups = [];
    addFilterGroup();
    addSortGroup();
}

// History Functions
function addToHistory(action, type) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    actionHistory.push({
        action: action,
        type: type,
        time: timeStr,
        data: JSON.parse(JSON.stringify(currentData)),
        displayed: JSON.parse(JSON.stringify(displayedData))
    });
    
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyContent = document.getElementById('historyContent');
    if (actionHistory.length === 0) {
        historyContent.innerHTML = '<p style="color: #666; font-size: 13px;">No actions yet...</p>';
        return;
    }
    
    let html = '';
    actionHistory.slice().reverse().forEach((item, index) => {
        html += `
            <div class="history-item" onclick="restoreFromHistory(${actionHistory.length - 1 - index})">
                <div class="history-item-title">${item.action}</div>
                <div class="history-item-time">${item.time}</div>
            </div>
        `;
    });
    historyContent.innerHTML = html;
}

function restoreFromHistory(index) {
    currentData = JSON.parse(JSON.stringify(actionHistory[index].data));
    displayedData = JSON.parse(JSON.stringify(actionHistory[index].displayed));
    currentPage = 1;
    displayData();
}

// CLEAN DATA FUNCTIONS

function handleCleanAction(cleanType) {
    document.querySelectorAll('.sub-dropdown').forEach(s => {
        s.classList.remove('active');
    });
    
    switch(cleanType) {
        case 'highlight':
            openHighlightErrorsModal();
            break;
        case 'autocorrect':
            openAutoCorrectModal();
            break;
        case 'duplicates':
            openDuplicatesModal();
            break;
        case 'empty':
            removeEmptyRows();
            break;
        case 'standardize':
            document.getElementById('standardizeOptions').classList.add('active');
            break;
    }
}

function openHighlightErrorsModal() {
    if (currentData.length === 0) {
        alert('No data available. Please upload a file first.');
        return;
    }
    
    const duplicatesList = document.getElementById('duplicateFieldsList');
    duplicatesList.innerHTML = columns.map(col => `
        <div class="checkbox-item">
            <input type="checkbox" id="dup-field-${col}" value="${col}">
            <label>${col}</label>
        </div>
    `).join('');
    
    openModal('highlightErrorsModal');
}

function applyHighlighting() {
    const highlightNulls = document.getElementById('highlight-nulls').checked;
    const highlightDuplicates = document.getElementById('highlight-duplicates').checked;
    
    highlightedErrors.nulls = highlightNulls;
    highlightedErrors.duplicates = highlightDuplicates;
    
    if (highlightDuplicates) {
        const selectedFields = [];
        columns.forEach(col => {
            const checkbox = document.getElementById(`dup-field-${col}`);
            if (checkbox && checkbox.checked) {
                selectedFields.push(col);
            }
        });
        
        if (selectedFields.length === 0) {
            alert('Please select at least one field to check for duplicates');
            return;
        }
        
        highlightedErrors.duplicateFields = selectedFields;
    }
    
    displayData();
    closeModal('highlightErrorsModal');
    addToHistory('Applied error highlighting', 'clean');
}

function openAutoCorrectModal() {
    if (currentData.length === 0) {
        alert('No data available. Please upload a file first.');
        return;
    }
    
    openModal('autoCorrectModal');
}

function applyAutoCorrect() {
    const replacementValue = document.getElementById('autoCorrectValue').value;
    
    if (!replacementValue) {
        alert('Please enter a replacement value');
        return;
    }
    
    dataHistory.push(JSON.parse(JSON.stringify(currentData)));
    
    displayedData = displayedData.map(row => {
        const newRow = {};
        Object.keys(row).forEach(key => {
            let value = row[key];
            if (value === null || value === undefined || value === '') {
                value = replacementValue;
            }
            newRow[key] = value;
        });
        return newRow;
    });
    
    currentData = JSON.parse(JSON.stringify(displayedData));
    displayData();
    closeModal('autoCorrectModal');
    addToHistory(`Auto-corrected nulls with "${replacementValue}"`, 'clean');
    showSuccessMessage(`Successfully replaced null values with "${replacementValue}"`);
}

function openDuplicatesModal() {
    if (currentData.length === 0) {
        alert('No data available. Please upload a file first.');
        return;
    }
    
    const columnsList = document.getElementById('duplicateColumnsList');
    columnsList.innerHTML = columns.map(col => `
        <div class="checkbox-item">
            <input type="checkbox" id="dup-col-${col}" value="${col}" checked>
            <label>${col}</label>
        </div>
    `).join('');
    
    document.getElementById('duplicatesResults').style.display = 'none';
    document.getElementById('duplicatesRemove').style.display = 'none';
    
    openModal('duplicatesModal');
}

function findDuplicates() {
    const selectedColumns = [];
    columns.forEach(col => {
        const checkbox = document.getElementById(`dup-col-${col}`);
        if (checkbox && checkbox.checked) {
            selectedColumns.push(col);
        }
    });
    
    if (selectedColumns.length === 0) {
        alert('Please select at least one column to check for duplicates');
        return;
    }
    
    const duplicateGroups = {};
    const duplicateIndices = new Set();
    
    displayedData.forEach((row, index) => {
        const key = selectedColumns.map(col => row[col]).join('|||');
        
        if (!duplicateGroups[key]) {
            duplicateGroups[key] = [];
        }
        duplicateGroups[key].push({ index, row });
    });
    
    const duplicates = [];
    Object.values(duplicateGroups).forEach(group => {
        if (group.length > 1) {
            group.forEach((item, i) => {
                if (i > 0) {
                    duplicates.push(item);
                    duplicateIndices.add(item.index);
                }
            });
        }
    });
    
    document.getElementById('duplicateCount').textContent = duplicates.length;
    
    if (duplicates.length === 0) {
        document.getElementById('duplicatesResults').style.display = 'block';
        document.getElementById('duplicatesList').innerHTML = '<p style="color: #666;">No duplicates found!</p>';
        document.getElementById('duplicatesRemove').style.display = 'none';
        return;
    }
    
    let html = '';
    duplicates.forEach((dup, index) => {
        const rowData = selectedColumns.map(col => `${col}: ${dup.row[col]}`).join(', ');
        html += `
            <div class="duplicate-row-item">
                <div class="duplicate-row-info">
                    <strong>Row ${dup.index + 1}</strong>
                    <div class="duplicate-row-data">${rowData}</div>
                </div>
                <div class="duplicate-row-checkbox">
                    <input type="checkbox" checked data-row-index="${dup.index}">
                </div>
            </div>
        `;
    });
    
    document.getElementById('duplicatesList').innerHTML = html;
    document.getElementById('duplicatesResults').style.display = 'block';
    document.getElementById('duplicatesRemove').style.display = 'inline-block';
}

function removeDuplicates() {
    const checkboxes = document.querySelectorAll('#duplicatesList input[type="checkbox"]:checked');
    const indicesToRemove = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-row-index')));
    
    if (indicesToRemove.length === 0) {
        alert('No duplicates selected for removal');
        return;
    }
    
    dataHistory.push(JSON.parse(JSON.stringify(currentData)));
    
    indicesToRemove.sort((a, b) => b - a).forEach(index => {
        displayedData.splice(index, 1);
    });
    
    currentData = JSON.parse(JSON.stringify(displayedData));
    currentPage = 1;
    displayData();
    closeModal('duplicatesModal');
    addToHistory(`Removed ${indicesToRemove.length} duplicate row(s)`, 'clean');
    showSuccessMessage(`Successfully removed ${indicesToRemove.length} duplicate row(s)`);
}

function removeEmptyRows() {
    if (!currentData || currentData.length === 0) {
        alert('No data to process');
        return;
    }
    
    dataHistory.push(JSON.parse(JSON.stringify(currentData)));
    
    const cleanedData = displayedData.filter(row => {
        return Object.values(row).some(value => 
            value !== null && value !== undefined && value.toString().trim() !== ''
        );
    });
    
    const emptyRowsCount = displayedData.length - cleanedData.length;
    
    if (emptyRowsCount > 0) {
        displayedData = cleanedData;
        currentData = JSON.parse(JSON.stringify(displayedData));
        currentPage = 1;
        displayData();
        addToHistory(`Removed ${emptyRowsCount} empty row(s)`, 'clean');
        showSuccessMessage(`Successfully removed ${emptyRowsCount} empty row(s)`);
    } else {
        showSuccessMessage('No empty rows found');
    }
}

function applyStandardization() {
    const column = document.getElementById('standardizeColumn').value;
    const type = document.getElementById('standardizeType').value;
    
    if (!column) {
        alert('Please select a column');
        return;
    }
    
    if (!currentData || currentData.length === 0) {
        alert('No data to process');
        return;
    }
    
    pendingChanges = [];
    
    currentData.forEach((row, index) => {
        const originalValue = row[column];
        let standardizedValue = originalValue;
        
        if (!originalValue || originalValue.toString().trim() === '') {
            return;
        }
        
        switch(type) {
            case 'gender':
                standardizedValue = standardizeGender(originalValue);
                break;
            case 'date':
                standardizedValue = standardizeDate(originalValue);
                break;
            case 'phone':
                standardizedValue = standardizePhone(originalValue);
                break;
            case 'case':
                standardizedValue = standardizeCase(originalValue);
                break;
        }
        
        if (standardizedValue !== originalValue && standardizedValue !== null) {
            pendingChanges.push({
                rowIndex: index,
                column: column,
                oldValue: originalValue,
                newValue: standardizedValue
            });
        }
    });
    
    if (pendingChanges.length > 0) {
        showReviewModal(`Standardization: ${type}`, pendingChanges);
    } else {
        showSuccessMessage('No changes needed - data is already standardized');
    }
}

function standardizeGender(value) {
    const normalized = value.toString().toLowerCase().trim();
    return genderMapping[normalized] || value;
}

function standardizeDate(value) {
    const dateStr = value.toString().trim();
    
    const format1 = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const format2 = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
    const format3 = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i;
    const format4 = /^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i;
    
    const months = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12',
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09',
        'oct': '10', 'nov': '11', 'dec': '12'
    };
    
    if (format1.test(dateStr)) {
        const match = dateStr.match(format1);
        return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
    } else if (format2.test(dateStr)) {
        const match = dateStr.match(format2);
        return `${match[3].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[1]}`;
    } else if (format3.test(dateStr)) {
        const match = dateStr.match(format3);
        const month = months[match[2].toLowerCase()];
        if (month) {
            return `${match[1].padStart(2, '0')}/${month}/${match[3]}`;
        }
    } else if (format4.test(dateStr)) {
        const match = dateStr.match(format4);
        const month = months[match[1].toLowerCase()];
        if (month) {
            return `${match[2].padStart(2, '0')}/${month}/${match[3]}`;
        }
    }
    
    return value;
}

function standardizePhone(value) {
    const digits = value.toString().replace(/\D/g, '');
    
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    return value;
}

function standardizeCase(value) {
    return value.toString()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// MODAL FUNCTIONS

function showReviewModal(title, changes) {
    document.getElementById('modalTitle').textContent = title;
    const modalBody = document.getElementById('modalBody');
    
    let html = `
        <div class="summary-stats">
            <div class="summary-stat">
                <div class="summary-stat-value">${changes.length}</div>
                <div class="summary-stat-label">Changes Found</div>
            </div>
        </div>
        <div class="review-list">
    `;
    
    changes.forEach((change, index) => {
        html += `
            <div class="review-item">
                <div class="review-item-content">
                    <div class="review-item-row">Row ${change.rowIndex + 1} - Column: ${change.column}</div>
                    <div class="review-item-change">
                        <span class="review-old">${change.oldValue}</span>
                        <span class="review-arrow">→</span>
                        <span class="review-new">${change.newValue}</span>
                    </div>
                </div>
                <div class="review-item-checkbox">
                    <input type="checkbox" checked data-change-index="${index}">
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    modalBody.innerHTML = html;
    
    openModal('reviewModal');
}

function applyModalChanges() {
    const checkboxes = document.querySelectorAll('#modalBody input[type="checkbox"]');
    const selectedChanges = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const index = parseInt(checkbox.getAttribute('data-change-index'));
            selectedChanges.push(pendingChanges[index]);
        }
    });
    
    if (selectedChanges.length === 0) {
        alert('No changes selected');
        return;
    }
    
    dataHistory.push(JSON.parse(JSON.stringify(currentData)));
    
    selectedChanges.forEach(change => {
        currentData[change.rowIndex][change.column] = change.newValue;
    });
    
    displayedData = JSON.parse(JSON.stringify(currentData));
    displayData();
    closeModal('reviewModal');
    addToHistory(`Applied ${selectedChanges.length} change(s)`, 'standardize');
    showSuccessMessage(`Successfully applied ${selectedChanges.length} change(s)`);
}

// ORGANIZE/SORT FUNCTIONS

function addSortGroup() {
    const container = document.getElementById('sortContainer');
    const groupIndex = sortGroups.length;
    
    const groupHTML = `
        <div class="sort-group" id="sort-group-${groupIndex}">
            <label>Column ${groupIndex + 1}:</label>
            <select class="filter-input" id="sort-column-${groupIndex}">
                <option value="">Select column</option>
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <label>Order:</label>
            <select class="filter-input" id="sort-order-${groupIndex}">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
            </select>
            ${groupIndex > 0 ? `<button class="add-filter-btn" style="background: #d32f2f;" onclick="removeSortGroup(${groupIndex})">Remove</button>` : ''}
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', groupHTML);
    sortGroups.push(groupIndex);
}

function removeSortGroup(index) {
    document.getElementById(`sort-group-${index}`).remove();
    sortGroups = sortGroups.filter(i => i !== index);
}

function applySorting() {
    const sortCriteria = [];
    
    sortGroups.forEach(index => {
        const column = document.getElementById(`sort-column-${index}`).value;
        const order = document.getElementById(`sort-order-${index}`).value;
        
        if (column) {
            sortCriteria.push({ column, order });
        }
    });
    
    if (sortCriteria.length === 0) {
        alert('Please select at least one column to sort');
        return;
    }
    
    dataHistory.push(JSON.parse(JSON.stringify(currentData)));
    
    displayedData.sort((a, b) => {
        for (const criteria of sortCriteria) {
            let valA = a[criteria.column];
            let valB = b[criteria.column];
            
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            
            let comparison = 0;
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;
            
            if (comparison !== 0) {
                return criteria.order === 'asc' ? comparison : -comparison;
            }
        }
        return 0;
    });
    
    currentData = JSON.parse(JSON.stringify(displayedData));
    currentPage = 1;
    displayData();
    
    const sortDesc = sortCriteria.map(c => `${c.column} (${c.order})`).join(', then ');
    addToHistory(`Sorted by ${sortDesc}`, 'sort');
}

// FILTER FUNCTIONS

function addFilterGroup() {
    const container = document.getElementById('filterContainer');
    const groupIndex = filterGroups.length;
    
    const groupHTML = `
        <div class="filter-group" id="filter-group-${groupIndex}">
            <label>Column:</label>
            <select class="filter-input" id="filter-column-${groupIndex}">
                <option value="">Select column</option>
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <label>Condition:</label>
            <select class="filter-input" id="filter-condition-${groupIndex}">
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="not_contains">Does Not Contain</option>
                <option value="greater">Greater Than</option>
                <option value="less">Less Than</option>
                <option value="greater_equal">Greater or Equal</option>
                <option value="less_equal">Less or Equal</option>
            </select>
            <label>Value:</label>
            <input type="text" class="filter-input" id="filter-value-${groupIndex}" placeholder="Enter value">
            ${groupIndex > 0 ? `<button class="add-filter-btn" style="background: #d32f2f;" onclick="removeFilterGroup(${groupIndex})">Remove</button>` : ''}
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', groupHTML);
    filterGroups.push(groupIndex);
}

function removeFilterGroup(index) {
    document.getElementById(`filter-group-${index}`).remove();
    filterGroups = filterGroups.filter(i => i !== index);
}

function applyFilters() {
    if (filterGroups.length === 0) return;
    
    dataHistory.push(JSON.parse(JSON.stringify(currentData)));
    
    let filteredData = JSON.parse(JSON.stringify(currentData));
    
    filterGroups.forEach(index => {
        const column = document.getElementById(`filter-column-${index}`).value;
        const condition = document.getElementById(`filter-condition-${index}`).value;
        const value = document.getElementById(`filter-value-${index}`).value;
        
        if (!column || !value) return;
        
        filteredData = filteredData.filter(row => {
            const cellValue = String(row[column] || '').toLowerCase();
            const filterValue = String(value).toLowerCase();
            
            switch(condition) {
                case 'equals':
                    return cellValue === filterValue;
                case 'not_equals':
                    return cellValue !== filterValue;
                case 'contains':
                    return cellValue.includes(filterValue);
                case 'not_contains':
                    return !cellValue.includes(filterValue);
                case 'greater':
                    return parseFloat(row[column]) > parseFloat(value);
                case 'less':
                    return parseFloat(row[column]) < parseFloat(value);
                case 'greater_equal':
                    return parseFloat(row[column]) >= parseFloat(value);
                case 'less_equal':
                    return parseFloat(row[column]) <= parseFloat(value);
                default:
                    return true;
            }
        });
    });
    
    displayedData = filteredData;
    currentPage = 1;
    displayData();
    addToHistory(`Applied ${filterGroups.length} filter(s)`, 'filter');
}

function clearFilters() {
    displayedData = JSON.parse(JSON.stringify(currentData));
    currentPage = 1;
    displayData();
    addToHistory('Cleared all filters', 'clear');
}

// VISUALIZATION FUNCTIONS

function handleVisualizationAction(chartType) {
    if (displayedData.length === 0) {
        alert('No data available. Please upload a file first.');
        return;
    }
    
    switch(chartType) {
        case 'multiple':
            openMultiChartModal();
            break;
        case 'stats':
            openStatsModal();
            break;
        default:
            openChartModal(chartType);
            break;
    }
}

function openChartModal(chartType) {
    const content = document.getElementById('chartModalContent');
    const title = document.getElementById('chartModalTitle');
    
    title.textContent = `Create ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`;
    
    let html = '<div class="filter-inputs">';
    
    if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
        html += `
            <label>Label Column:</label>
            <select id="chart-label-column" class="filter-input">
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <label>Value Column:</label>
            <select id="chart-value-column" class="filter-input">
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
        `;
    } else {
        html += `
            <label>X-Axis Column:</label>
            <select id="chart-x-column" class="filter-input">
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <label>Y-Axis Column:</label>
            <select id="chart-y-column" class="filter-input">
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <label>Chart Title:</label>
            <input type="text" id="chart-title" class="filter-input" placeholder="Enter chart title">
        `;
    }
    
    html += '</div>';
    content.innerHTML = html;
    
    const modal = document.getElementById('chartModal');
    modal.dataset.chartType = chartType;
    openModal('chartModal');
}

function createChart() {
    const modal = document.getElementById('chartModal');
    const chartType = modal.dataset.chartType;
    
    let xColumn, yColumn, labelColumn, valueColumn, title;
    
    if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
        labelColumn = document.getElementById('chart-label-column').value;
        valueColumn = document.getElementById('chart-value-column').value;
        
        if (!labelColumn || !valueColumn) {
            alert('Please select both label and value columns');
            return;
        }
    } else {
        xColumn = document.getElementById('chart-x-column').value;
        yColumn = document.getElementById('chart-y-column').value;
        title = document.getElementById('chart-title').value || `${yColumn} vs ${xColumn}`;
        
        if (!xColumn || !yColumn) {
            alert('Please select both X and Y axis columns');
            return;
        }
    }
    
    ensureVisualizationSection();
    renderChart(chartType, xColumn, yColumn, labelColumn, valueColumn, title);
    closeModal('chartModal');
    addToHistory(`Created ${chartType} chart`, 'visualization');
}

function openMultiChartModal() {
    chartConfigs = [];
    document.getElementById('multiChartContent').innerHTML = '';
    addChartConfig();
    openModal('multiChartModal');
}

function addChartConfig() {
    const container = document.getElementById('multiChartContent');
    const index = chartConfigs.length;
    
    const html = `
        <div class="filter-group" style="margin-bottom: 20px;">
            <h4>Chart ${index + 1}</h4>
            <label>Chart Type:</label>
            <select class="filter-input" id="multi-chart-type-${index}">
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="scatter">Scatter Plot</option>
                <option value="doughnut">Doughnut Chart</option>
                <option value="radar">Radar Chart</option>
            </select>
            <label>X-Axis Column:</label>
            <select class="filter-input" id="multi-chart-x-${index}">
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <label>Y-Axis Column:</label>
            <select class="filter-input" id="multi-chart-y-${index}">
                ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <label>Title:</label>
            <input type="text" class="filter-input" id="multi-chart-title-${index}" placeholder="Chart title">
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
    chartConfigs.push(index);
}

function createMultipleCharts() {
    ensureVisualizationSection();
    
    chartConfigs.forEach(index => {
        const chartType = document.getElementById(`multi-chart-type-${index}`).value;
        const xColumn = document.getElementById(`multi-chart-x-${index}`).value;
        const yColumn = document.getElementById(`multi-chart-y-${index}`).value;
        const title = document.getElementById(`multi-chart-title-${index}`).value || `${yColumn} vs ${xColumn}`;
        
        renderChart(chartType, xColumn, yColumn, null, null, title);
    });
    
    closeModal('multiChartModal');
    addToHistory(`Created ${chartConfigs.length} charts`, 'visualization');
}

function ensureVisualizationSection() {
    let vizSection = document.querySelector('.visualization-section');
    if (!vizSection) {
        vizSection = document.createElement('div');
        vizSection.className = 'visualization-section';
        vizSection.innerHTML = '<h2 style="margin-bottom: 15px; color: #1a237e;">Visualizations</h2>';
        document.getElementById('displayContent').appendChild(vizSection);
    }
}

function renderChart(chartType, xColumn, yColumn, labelColumn, valueColumn, title) {
    const chartId = 'chart-' + Date.now();
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.setAttribute('data-chart-id', chartId);
    container.innerHTML = `
        <div class="chart-actions">
            <button class="chart-action-btn download-chart-btn" onclick="downloadChart('${chartId}')">Download</button>
            <button class="chart-action-btn delete-chart-btn" onclick="deleteChart('${chartId}')">Delete</button>
        </div>
        <h3>${title || chartType.charAt(0).toUpperCase() + chartType.slice(1) + ' Chart'}</h3>
        <canvas id="${chartId}" class="chart-canvas"></canvas>
    `;
    
    document.querySelector('.visualization-section').appendChild(container);
    
    const ctx = document.getElementById(chartId).getContext('2d');
    
    let chartData, chartConfig;
    
    if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
        const labels = displayedData.map(row => row[labelColumn]);
        const data = displayedData.map(row => parseFloat(row[valueColumn]) || 0);
        
        chartData = {
            labels: labels,
            datasets: [{
                label: valueColumn,
                data: data,
                backgroundColor: generateVibrantColors(data.length),
                borderColor: generateVibrantBorderColors(data.length),
                borderWidth: 2
            }]
        };
        
        chartConfig = {
            type: chartType,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        position: 'right',
                        labels: {
                            font: { size: 12 },
                            padding: 10
                        }
                    },
                    title: { 
                        display: true, 
                        text: title || `${valueColumn} Distribution`,
                        font: { size: 16, weight: 'bold' }
                    }
                }
            }
        };
    } else {
        const xData = displayedData.map(row => row[xColumn]);
        const yData = displayedData.map(row => parseFloat(row[yColumn]) || 0);
        
        // Use vibrant colors for different chart types
        let backgroundColor, borderColor;
        
        if (chartType === 'bar') {
            backgroundColor = generateVibrantColors(yData.length);
            borderColor = generateVibrantBorderColors(yData.length);
        } else if (chartType === 'scatter') {
            backgroundColor = vibrantColors[0];
            borderColor = vibrantBorderColors[0];
        } else {
            backgroundColor = vibrantColors[1];
            borderColor = vibrantBorderColors[1];
        }
        
        chartData = {
            labels: xData,
            datasets: [{
                label: yColumn,
                data: yData,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 3,
                tension: 0.4,
                pointRadius: chartType === 'scatter' ? 6 : 3,
                pointHoverRadius: chartType === 'scatter' ? 8 : 5,
                pointBackgroundColor: borderColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        };
        
        chartConfig = {
            type: chartType,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        display: true,
                        labels: {
                            font: { size: 12 },
                            padding: 10
                        }
                    },
                    title: { 
                        display: true, 
                        text: title,
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    x: { 
                        title: { 
                            display: true, 
                            text: xColumn,
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: { 
                        title: { 
                            display: true, 
                            text: yColumn,
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            }
        };
    }
    
    const chart = new Chart(ctx, chartConfig);
    charts.push({ id: chartId, chart: chart });
}

function downloadChart(chartId) {
    const chartObj = charts.find(c => c.id === chartId);
    if (!chartObj) return;
    
    const canvas = document.getElementById(chartId);
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `chart_${chartId}.png`;
    link.href = url;
    link.click();
    
    addToHistory('Downloaded chart as image', 'download');
    showSuccessMessage('Chart downloaded successfully!');
}

function deleteChart(chartId) {
    const chartObj = charts.find(c => c.id === chartId);
    if (chartObj) {
        chartObj.chart.destroy();
        charts = charts.filter(c => c.id !== chartId);
    }
    
    const container = document.querySelector(`[data-chart-id="${chartId}"]`);
    if (container) {
        container.remove();
    }
    
    if (document.querySelectorAll('.chart-container').length === 0) {
        const vizSection = document.querySelector('.visualization-section');
        if (vizSection) vizSection.remove();
    }
    
    addToHistory('Deleted chart', 'visualization');
}

function generateVibrantColors(count) {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(vibrantColors[i % vibrantColors.length]);
    }
    return result;
}

function generateVibrantBorderColors(count) {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(vibrantBorderColors[i % vibrantBorderColors.length]);
    }
    return result;
}

// STATISTICS FUNCTIONS

function openStatsModal() {
    const content = document.getElementById('statsModalContent');
    
    const numericColumns = columns.filter(col => {
        return displayedData.some(row => !isNaN(parseFloat(row[col])));
    });
    
    let html = `
        <div class="filter-inputs">
            <label>Primary Column (Required):</label>
            <select id="stats-primary-column" class="filter-input">
                <option value="">Select column</option>
                ${numericColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <label>Secondary Column (Optional):</label>
            <select id="stats-secondary-column" class="filter-input">
                <option value="">None</option>
                ${numericColumns.map(col => `<option value="${col}">${col}</option>`).join('')}
            </select>
            <label style="margin-top: 15px;">Statistics to Calculate:</label>
            <div class="checkbox-group">
                <div class="checkbox-item"><input type="checkbox" id="stat-mean" checked> <label>Mean</label></div>
                <div class="checkbox-item"><input type="checkbox" id="stat-median" checked> <label>Median</label></div>
                <div class="checkbox-item"><input type="checkbox" id="stat-mode"> <label>Mode</label></div>
                <div class="checkbox-item"><input type="checkbox" id="stat-sum" checked> <label>Sum</label></div>
                <div class="checkbox-item"><input type="checkbox" id="stat-min" checked> <label>Minimum</label></div>
                <div class="checkbox-item"><input type="checkbox" id="stat-max" checked> <label>Maximum</label></div>
                <div class="checkbox-item"><input type="checkbox" id="stat-std"> <label>Standard Deviation</label></div>
                <div class="checkbox-item"><input type="checkbox" id="stat-variance"> <label>Variance</label></div>
                <div class="checkbox-item"><input type="checkbox" id="stat-q25"> <label>First Quartile (Q25)</label></div>
                <div class="checkbox-item"><input type="checkbox" id="stat-q75"> <label>Third Quartile (Q75)</label></div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    openModal('statsModal');
}

function calculateStats() {
    const primaryColumn = document.getElementById('stats-primary-column').value;
    const secondaryColumn = document.getElementById('stats-secondary-column').value;
    
    if (!primaryColumn) {
        alert('Please select a primary column');
        return;
    }
    
    const selectedStats = {
        mean: document.getElementById('stat-mean').checked,
        median: document.getElementById('stat-median').checked,
        mode: document.getElementById('stat-mode').checked,
        sum: document.getElementById('stat-sum').checked,
        min: document.getElementById('stat-min').checked,
        max: document.getElementById('stat-max').checked,
        std: document.getElementById('stat-std').checked,
        variance: document.getElementById('stat-variance').checked,
        q25: document.getElementById('stat-q25').checked,
        q75: document.getElementById('stat-q75').checked
    };
    
    ensureVisualizationSection();
    displayStatistics(primaryColumn, secondaryColumn, selectedStats);
    closeModal('statsModal');
    addToHistory(`Calculated statistics for ${primaryColumn}`, 'analysis');
}

function displayStatistics(primaryColumn, secondaryColumn, selectedStats) {
    const primaryValues = displayedData.map(row => parseFloat(row[primaryColumn])).filter(v => !isNaN(v));
    const secondaryValues = secondaryColumn ? displayedData.map(row => parseFloat(row[secondaryColumn])).filter(v => !isNaN(v)) : null;
    
    const container = document.createElement('div');
    container.className = 'stats-container';
    
    let html = `<h3>Statistics for ${primaryColumn}</h3><div class="stats-grid">`;
    
    if (selectedStats.mean) html += createStatItem('Mean', calculateMean(primaryValues).toFixed(2));
    if (selectedStats.median) html += createStatItem('Median', calculateMedian(primaryValues).toFixed(2));
    if (selectedStats.mode) html += createStatItem('Mode', calculateMode(primaryValues));
    if (selectedStats.sum) html += createStatItem('Sum', calculateSum(primaryValues).toFixed(2));
    if (selectedStats.min) html += createStatItem('Minimum', Math.min(...primaryValues).toFixed(2));
    if (selectedStats.max) html += createStatItem('Maximum', Math.max(...primaryValues).toFixed(2));
    if (selectedStats.std) html += createStatItem('Std Deviation', calculateStdDev(primaryValues).toFixed(2));
    if (selectedStats.variance) html += createStatItem('Variance', calculateVariance(primaryValues).toFixed(2));
    if (selectedStats.q25) html += createStatItem('Q25', calculateQuartile(primaryValues, 0.25).toFixed(2));
    if (selectedStats.q75) html += createStatItem('Q75', calculateQuartile(primaryValues, 0.75).toFixed(2));
    
    html += '</div>';
    
    if (secondaryValues) {
        html += `<h3 style="margin-top: 20px;">Statistics for ${secondaryColumn}</h3><div class="stats-grid">`;
        if (selectedStats.mean) html += createStatItem('Mean', calculateMean(secondaryValues).toFixed(2));
        if (selectedStats.median) html += createStatItem('Median', calculateMedian(secondaryValues).toFixed(2));
        if (selectedStats.sum) html += createStatItem('Sum', calculateSum(secondaryValues).toFixed(2));
        if (selectedStats.min) html += createStatItem('Minimum', Math.min(...secondaryValues).toFixed(2));
        if (selectedStats.max) html += createStatItem('Maximum', Math.max(...secondaryValues).toFixed(2));
        html += '</div>';
    }
    
    container.innerHTML = html;
    document.querySelector('.visualization-section').appendChild(container);
}

function createStatItem(label, value) {
    return `<div class="stat-item"><div class="stat-label">${label}</div><div class="stat-value">${value}</div></div>`;
}

// Statistical Calculation Functions
function calculateMean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function calculateMode(values) {
    const freq = {};
    values.forEach(v => freq[v] = (freq[v] || 0) + 1);
    const maxFreq = Math.max(...Object.values(freq));
    const modes = Object.keys(freq).filter(k => freq[k] === maxFreq);
    return modes.length === values.length ? 'No mode' : modes.join(', ');
}

function calculateSum(values) {
    return values.reduce((a, b) => a + b, 0);
}

function calculateVariance(values) {
    const mean = calculateMean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

function calculateStdDev(values) {
    return Math.sqrt(calculateVariance(values));
}

function calculateQuartile(values, q) {
    const sorted = [...values].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    return sorted[base + 1] !== undefined 
        ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
        : sorted[base];
}

// UNDO FUNCTION

function undoAction() {
    if (dataHistory.length > 1) {
        dataHistory.pop();
        currentData = JSON.parse(JSON.stringify(dataHistory[dataHistory.length - 1]));
        displayedData = JSON.parse(JSON.stringify(currentData));
        currentPage = 1;
        displayData();
        
        if (actionHistory.length > 0) {
            actionHistory.pop();
            updateHistoryDisplay();
        }
        
        addToHistory('Undo action', 'undo');
    } else {
        alert('No actions to undo');
    }
}

// DOWNLOAD FUNCTION

function downloadData() {
    if (currentData.length === 0) {
        alert('No data to download');
        return;
    }
    
    const wb = XLSX.utils.book_new();
    
    const ws = XLSX.utils.json_to_sheet(displayedData);
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    const chartElements = document.querySelectorAll('.chart-container');
    if (chartElements.length > 0) {
        const chartData = [];
        charts.forEach((chartObj, index) => {
            chartData.push({
                'Chart': `Chart ${index + 1}`,
                'Type': chartObj.chart.config.type,
                'Created': new Date().toLocaleString()
            });
        });
        const chartWs = XLSX.utils.json_to_sheet(chartData);
        XLSX.utils.book_append_sheet(wb, chartWs, 'Charts Info');
    }
    
    const statsElements = document.querySelectorAll('.stats-container');
    if (statsElements.length > 0) {
        const statsData = [];
        statsElements.forEach(container => {
            const statItems = container.querySelectorAll('.stat-item');
            statItems.forEach(item => {
                const label = item.querySelector('.stat-label').textContent;
                const value = item.querySelector('.stat-value').textContent;
                statsData.push({ 'Statistic': label, 'Value': value });
            });
        });
        if (statsData.length > 0) {
            const statsWs = XLSX.utils.json_to_sheet(statsData);
            XLSX.utils.book_append_sheet(wb, statsWs, 'Statistics');
        }
    }
    
    const newFileName = fileName.replace(/\.[^/.]+$/, '') + '_processed.xlsx';
    XLSX.writeFile(wb, newFileName);
    
    addToHistory('Downloaded processed data', 'download');
    showSuccessMessage('Data downloaded successfully!');
}

// MODAL HELPER FUNCTIONS

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// MESSAGE FUNCTIONS

function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.innerHTML = `<strong>Success!</strong> ${message}`;
    
    const displayArea = document.getElementById('displayContent');
    displayArea.insertBefore(messageDiv, displayArea.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.innerHTML = `<strong>Error!</strong> ${message}`;
    
    const displayArea = document.getElementById('displayContent');
    displayArea.insertBefore(messageDiv, displayArea.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}