/**
 * Educational Editor System - Modular JavaScript Framework
 * File: editor.js
 *
 * This module provides a reusable educational coding environment that can be
 * configured for any programming topic through pageConfig.
 */

const EducationalEditor = (function() {
    'use strict';

    // Private variables
    let config = {};
    let editors = {}; // Will store CodeMirror instances: editors['primary'], editors['secondary']
    let tours = {};

    // Core initialization function
    function initialize(pageConfig) {
        config = pageConfig;

        // Initialize all components based on config
        initializeNavigation();
        initializeExperimentPanels();
        initializePrimaryPlayground();
        
        initializeSecondaryPlayground();
        initializeSyntaxBreakdown();
        initializeQuiz();
        initializeStatementBuilding();
        initializeTracingChallenge();
                initializeSpotTheErrorQuiz(); // Add this call

        initializeTours();

        // Load and update progress
        updateExperimentTrackers();

        console.log('Educational Editor System initialized successfully');
    }

    function initializeNavigation() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const clickedTabId = this.getAttribute('data-tab'); // ID of the tab section to show

            // Deactivate all tabs and content
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Activate the clicked tab and its content
            this.classList.add('active');
            const activeTabContent = document.getElementById(clickedTabId);
            if (activeTabContent) {
                activeTabContent.classList.add('active');
            }

            // --- REFRESH LOGIC using parentTabId from pageConfig ---
            // Check for primary playground
            if (config.primaryPlayground && config.primaryPlayground.parentTabId === clickedTabId && editors['primary']) {
                setTimeout(() => {
                    if (editors['primary']) { // Double check editor instance exists
                        editors['primary'].refresh();
                        editors['primary'].focus();
                    }
                }, 10); // A small delay can help ensure the layout is complete
            }

            // Check for secondary playground
            if (config.secondaryPlayground && config.secondaryPlayground.parentTabId === clickedTabId && editors['secondary']) {
                setTimeout(() => {
                    if (editors['secondary']) { // Double check editor instance exists
                        editors['secondary'].refresh();
                        editors['secondary'].focus();
                    }
                }, 10);
            }
        });
    });

    // Set sidebar title from config
    if (config.topic && config.topic.sidebarTitle) {
        const sidebarLogo = document.querySelector('.sidebar-logo');
        if (sidebarLogo) {
            sidebarLogo.textContent = config.topic.sidebarTitle;
        }
    }
}

    // Experiment panels system
    function initializeExperimentPanels() {
        const container = document.getElementById('experiments-container');
        if (!container || !config.experiments) return;

        let panelsHTML = '';

        if (config.experiments.primary) {
            panelsHTML += createExperimentPanel('experiments-panel', config.experiments.primary, 'toggleExperimentsPanel');
        }

        if (config.experiments.secondary) {
            panelsHTML += createExperimentPanel('secondary-experiments-panel', config.experiments.secondary, 'toggleSecondaryExperimentsPanel');
        }

        container.innerHTML = panelsHTML;

        window.toggleExperimentsPanel = () => toggleExperimentPanel('experiments-panel', 'secondary-experiments-panel');
        window.toggleSecondaryExperimentsPanel = () => toggleExperimentPanel('secondary-experiments-panel', 'experiments-panel');

        window.startExperimentTour = (expId) => startExperimentTour(expId, 'primary');
        window.startSecondaryExperimentTour = (expId) => startExperimentTour(expId, 'secondary');
    }

        function createExperimentPanel(panelId, experimentConfig, toggleFunction) {
        const panelClass = panelId.includes('secondary') ? 'secondary-experiments-panel' : 'experiments-panel';
        const headerClass = panelId.includes('secondary') ? 'secondary-experiments-panel-header' : 'experiments-panel-header';

        let experimentsHTML = '';
        experimentConfig.experiments.forEach((exp, index) => {
            // Generate instructions HTML if detailedInstructions exist
            let instructionsHTML = '';
            if (exp.detailedInstructions && exp.detailedInstructions.length > 0) {
                instructionsHTML = `
                    <ul class="experiment-instructions-list">
                        ${exp.detailedInstructions.map(instr => `<li>${instr}</li>`).join('')}
                        <li>
                            <button class="experiment-hint-btn" onclick="${panelId.includes('secondary') ? 'startSecondaryExperimentTour' : 'startExperimentTour'}('${exp.id}')">
                                <i class="fas fa-lightbulb"></i> HINT / Guided Tour
                            </button>
                        </li>
                    </ul>
                `;
            }

            experimentsHTML += `
                <div class="experiment-item" id="${exp.id}-item">
                    <div class="experiment-item-header">
                        <div class="experiment-status" id="${exp.id}-status">${index + 1}</div>
                        <h4 class="experiment-title">${exp.title}</h4>
                    </div>
                    <p class="experiment-task-explanation">${exp.taskExplanation || exp.description || ''}</p>
                    
                    <details class="experiment-instructions-dropdown">
                        <summary>
                            <i class="fas fa-chevron-down"></i> View Instructions
                        </summary>
                        ${instructionsHTML}
                    </details>
                </div>
            `;
        });

        return `
            <div class="${panelClass}" id="${panelId}">
                <div class="${headerClass}">
                    <h3><i class="fas ${experimentConfig.icon}" style="margin-right: 10px;"></i>${experimentConfig.title}</h3>
                    <button class="close-experiments-btn" onclick="${toggleFunction}()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="experiments-list">
                    ${experimentsHTML}
                </div>
            </div>
        `;
    }

    function toggleExperimentPanel(panelToToggle, panelToClose) {
        const panel = document.getElementById(panelToToggle);
        const otherPanel = document.getElementById(panelToClose);

        if (otherPanel) otherPanel.classList.remove('open');
        if (panel) panel.classList.toggle('open');
    }

    // Playground systems
    function initializePrimaryPlayground() {
        if (!config.primaryPlayground) return;
        initializePlayground('primary', config.primaryPlayground, 'primary-playground-container');
    }

    function initializeSecondaryPlayground() {
        if (!config.secondaryPlayground) return;
        initializePlayground('secondary', config.secondaryPlayground, 'secondary-playground-container');
    }

    function initializePlayground(type, playgroundConfig, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const isSecondary = type === 'secondary';
        const playgroundClass = isSecondary ? 'secondary-playground' : 'coding-playground';
        const beakerClass = isSecondary ? 'secondary-experiments-beaker-btn' : 'experiments-beaker-btn';
        const beakerFunction = isSecondary ? 'toggleSecondaryExperimentsPanel' : 'toggleExperimentsPanel';

        const playgroundHTML = `
            <div class="interactive-card">
                <div class="element-header" style="margin: -35px -35px 30px -35px; padding: 20px 25px;">
                    <h3>${playgroundConfig.title} <i class="fas fa-play" style="margin-left: 10px;"></i></h3>
                </div>

                <div class="${playgroundClass}">
                    <button class="${beakerClass}" onclick="${beakerFunction}()">
                        <i class="fas ${playgroundConfig.icon}"></i>
                    </button>

                    <div class="playground-header">
                        <div>
                            <h4><i class="fas ${playgroundConfig.icon}" style="margin-right: 10px;"></i> ${playgroundConfig.title}</h4>
                            <div class="playground-subheader">${playgroundConfig.subtitle}</div>
                        </div>
                    </div>

                    <div class="playground-content">
                        <div class="code-panel">
                            <div class="panel-title">
                                <i class="fas fa-edit"></i> Code Editor
                            </div>
                            <textarea id="${type}-code-editor"></textarea>
                        </div>

                        <div class="output-panel">
                            <div class="panel-title">
                                <i class="fas fa-terminal"></i> Output Terminal
                            </div>
                            <div id="${type}-terminal" class="code-terminal">
                                <div class="terminal-prompt">${playgroundConfig.terminalReady}</div>
                                <div class="terminal-output">Click "${playgroundConfig.buttonText}" to execute your program...</div>
                            </div>
                        </div>
                    </div>

                    <div class="playground-controls">
                        <button id="run-${type}-btn" class="btn-playground btn-run">
                            <i class="fas fa-play"></i> ${playgroundConfig.buttonText}
                        </button>
                        <button id="clear-${type}-terminal-btn" class="btn-playground btn-clear">
                            <i class="fas fa-trash"></i> Clear Output
                        </button>

                        <div class="status-indicator" id="${type}-status">Ready</div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = playgroundHTML;
        initializeCodeEditor(type, playgroundConfig.initialCode);
    }

    function initializeCodeEditor(type, initialCode) {
        function waitForDependencies() {
            if (typeof CodeMirror === 'undefined' || typeof Sk === 'undefined') {
                setTimeout(waitForDependencies, 100);
                return;
            }

            const editorElement = document.getElementById(`${type}-code-editor`);
            if (!editorElement) return;

            editors[type] = CodeMirror.fromTextArea(editorElement, {
                mode: 'python',
                theme: 'default',
                lineNumbers: true,
                indentUnit: 4,
                indentWithTabs: false,
                lineWrapping: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                extraKeys: {
                    "Ctrl-Enter": () => runCode(type),
                    "Tab": function(cm) {
                        if (cm.somethingSelected()) {
                            cm.indentSelection("add");
                        } else {
                            cm.replaceSelection("    ", "end");
                        }
                    }
                }
            });

            // Enhanced Python 3 configuration for Skulpt
            Sk.configure({
                output: function(text) {
                    // Process the output to ensure Python 3 print behavior
                    const processedText = processPrintOutput(text);
                    addTerminalMessage(type, processedText, 'terminal-output');
                },
                read: function(x) {
                    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
                        throw "File not found: '" + x + "'";
                    }
                    return Sk.builtinFiles["files"][x];
                },
                __future__: Sk.python3,
                execLimit: 5000
            });

            document.getElementById(`run-${type}-btn`).addEventListener('click', () => runCode(type));
            document.getElementById(`clear-${type}-terminal-btn`).addEventListener('click', () => clearTerminal(type));

            // Set value and initial refresh. This is good if the editor is visible on load.
            editors[type].setValue(initialCode);
            editors[type].refresh();

            // Focus the editor if its tab is the active one on page load
            const parentTab = editorElement.closest('.tab-content');
            if (parentTab && parentTab.classList.contains('active')) {
                 setTimeout(() => { // Delay focus slightly
                     editors[type].focus();
                 }, 150);
            }
        }

        waitForDependencies();
    }

    // Process print output to ensure Python 3 behavior
    function processPrintOutput(text) {
        // Remove any tuple formatting that might appear from Python 2 behavior
        // This handles cases where print("text", variable) might show as ('text', value)
        text = text.replace(/^\s*\(\s*'([^']*)',\s*([^)]*)\s*\)\s*$/gm, '$1 $2');
        text = text.replace(/^\s*\(\s*"([^"]*)",\s*([^)]*)\s*\)\s*$/gm, '$1 $2');

        // Clean up any remaining tuple-like formatting
        text = text.replace(/^\s*\(\s*(.+?),\s*(.+?)\s*\)\s*$/gm, '$1 $2');

        return text;
    }

    async function runCode(type) {
        const editor = editors[type];
        if (!editor) return;

        const code = editor.getValue();
        if (!code.trim()) {
            addTerminalMessage(type, 'No code to execute!', 'terminal-error');
            return;
        }

        const runBtn = document.getElementById(`run-${type}-btn`);
        const statusIndicator = document.getElementById(`${type}-status`);
        const playgroundConfig = type === 'primary' ? config.primaryPlayground : config.secondaryPlayground;

        runBtn.innerHTML = '<span class="loading"></span> Running...';
        runBtn.disabled = true;
        statusIndicator.textContent = 'Executing...';
        statusIndicator.className = 'status-indicator running';

        clearTerminal(type);

        try {
            // Enhanced Skulpt configuration for each run
            Sk.configure({
                output: function(text) {
                    const processedText = processPrintOutput(text);
                    addTerminalMessage(type, processedText, 'terminal-output');
                },
                __future__: Sk.python3,
                execLimit: 5000
            });

            await Sk.misceval.asyncToPromise(function() {
                return Sk.importMainWithBody("<stdin>", false, code, true);
            });

            statusIndicator.textContent = 'Ready';
            statusIndicator.className = 'status-indicator';

            checkExperiments(type, code);

        } catch (error) {
            let errorMessage = error.toString();
            // Clean up common Python error messages for better educational experience
            errorMessage = errorMessage.replace(/Sk\.builtin\..*?:/g, 'Error:');
            errorMessage = errorMessage.replace(/line \d+/g, ''); // Consider keeping line numbers for debugging

            addTerminalMessage(type, `Error: ${errorMessage}`, 'terminal-error');
            statusIndicator.textContent = 'Error';
            statusIndicator.className = 'status-indicator error';
        }

        runBtn.innerHTML = `<i class="fas fa-play"></i> ${playgroundConfig.buttonText}`;
        runBtn.disabled = false;
    }

    function addTerminalMessage(type, message, className) {
        const terminal = document.getElementById(`${type}-terminal`);
        if (!terminal) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = className;
        messageDiv.textContent = message;
        terminal.appendChild(messageDiv);
        terminal.scrollTop = terminal.scrollHeight;
    }

        function clearTerminal(type) {
        const terminal = document.getElementById(`${type}-terminal`);
        if (!terminal) return;

        // Simply clear all child elements from the terminal
        terminal.innerHTML = '';

        // The status indicator should still be reset
        document.getElementById(`${type}-status`).textContent = 'Ready';
        document.getElementById(`${type}-status`).className = 'status-indicator';
    }

    // Experiment detection and tracking
    function checkExperiments(type, code) {
        const experimentType = type === 'primary' ? 'primary' : 'secondary';
        const experimentsConfig = config.experiments[experimentType]; // Changed variable name for clarity
        if (!experimentsConfig) return;

        const pageIdentifier = config.pageIdentifier || 'default-page';

        experimentsConfig.experiments.forEach(exp => {
            // Check if the pattern tests true AND the activity is not already completed
            if (exp.pattern.test(code) && !BucklesSystem.isActivityCompleted(pageIdentifier, exp.id)) {

                const experimentItem = document.getElementById(`${exp.id}-item`);
                const experimentStatus = document.getElementById(`${exp.id}-status`);
                if (experimentItem && experimentStatus) {
                    experimentItem.classList.add('completed');
                    experimentStatus.classList.add('completed');
                    experimentStatus.innerHTML = '<i class="fas fa-check"></i>';
                }

                BucklesSystem.awardBuckles(pageIdentifier, exp.id, 1); // Assuming 1 buckle per experiment for now
                showExperimentCompletion(exp.title);
            }
        });
    }

    function showExperimentCompletion(experimentTitle) {
    // Remove existing popup if any, to prevent multiple popups
    const existingPopup = document.querySelector('.experiment-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.className = 'experiment-popup'; // This class will be used for initial transform/opacity
    
    // Correctly URL-encoded SVG for the buckle icon
    // fill='#000' becomes fill='%23000'
    // stroke='#DAA520' becomes stroke='%23DAA520'
    // fill='#FFD700' becomes fill='%23FFD700'
    const buckleSVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' width='24' height='24'%3E%3Ccircle cx='18' cy='18' r='16' fill='%23FFD700' stroke='%23DAA520' stroke-width='2'/%3E%3Ctext x='18' y='24' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='%23000'%3EB%3C/text%3E%3C/svg%3E`;

    popup.innerHTML = `
        <div class="experiment-popup-content">
            <div class="experiment-icon">🎉</div>
            <h3>Experiment Complete!</h3>
            <p><strong>${experimentTitle}</strong></p>
            <p>Great work on this experiment!</p>
            <div class="buckle-award">
                <img src="${buckleSVG}" alt="Buckle">
                +1 Buckle Earned!
            </div>
        </div>
        <button class="popup-close-btn-simple">×</button>
    `;

    document.body.appendChild(popup);

    // Trigger the animation by adding a 'show' class after a brief delay
    setTimeout(() => {
        popup.classList.add('show');
    }, 50); // Small delay to allow the element to be in DOM for transition

    // Add event listener for the close button
    popup.querySelector('.popup-close-btn-simple').addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, 500); // Match transition duration
    });

    // Auto-close after a few seconds
    setTimeout(() => {
        if (popup.classList.contains('show')) { // Only remove if still shown
            popup.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(popup)) {
                    document.body.removeChild(popup);
                }
            }, 500); // Match transition duration
        }
    }, 4000); // Auto-close after 4 seconds
}

    // Syntax breakdown system
    function initializeSyntaxBreakdown() {
        if (!config.syntaxBreakdown) return;

        const container = document.getElementById('syntax-breakdown-container');
        if (!container) return;

        const syntaxHTML = `
            <div class="interactive-card">
                <div class="element-header" style="margin: -35px -35px 30px -35px; padding: 20px 25px;">
                    <h3>Interactive Syntax Breakdown <i class="fas fa-code" style="margin-left: 10px;"></i></h3>
                </div>

                <p style="font-size: 1.2em; text-align: center; font-weight: 600; margin-bottom: 20px;">Click on each part of the code to learn what it does:</p>

                <div class="syntax-breakdown">
                    <div class="syntax-code-container">
                        ${config.syntaxBreakdown.code}
                    </div>

                    <div class="syntax-explanation" id="syntax-explanation">
                        <div class="explanation-card">
                            <h4><i class="fas fa-hand-pointer"></i> Click on any part of the code above!</h4>
                            <p>Each part of the code has a specific purpose. Click on the highlighted parts to learn what they do.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = syntaxHTML;

        document.querySelectorAll('.syntax-part').forEach(part => {
            part.addEventListener('click', function() {
                const partType = this.getAttribute('data-part');
                const explanation = config.syntaxBreakdown.explanations[partType];

                if (explanation) {
                    document.querySelectorAll('.syntax-part').forEach(p => p.classList.remove('active'));
                    this.classList.add('active');

                    const explanationDiv = document.getElementById('syntax-explanation');
                    explanationDiv.innerHTML = `
                        <div class="explanation-card highlight">
                            <h4><i class="fas fa-lightbulb"></i> ${explanation.title}</h4>
                            <p>${explanation.text}</p>
                        </div>
                    `;
                }
            });
        });
    }

    // Quiz system
    function initializeQuiz() {
        if (!config.quiz) return;

        if (typeof window.initializeQuiz === 'function') {
            window.initializeQuiz(config.quiz.questions, config.pageIdentifier || 'default-page');
        }
    }

    // Statement building system
    function initializeStatementBuilding() {
        if (!config.statementBuilding) return;

        const container = document.getElementById('statement-building-container');
        if (!container) return;

        const statementHTML = `
            <div class="interactive-card" style="margin-top: 30px;">
                <div class="element-header" style="margin: -35px -35px 30px -35px; padding: 20px 25px;">
                    <h3>Build a Statement <i class="fas fa-puzzle-piece" style="margin-left: 10px;"></i></h3>
                </div>

                <p>Click on the pieces in the correct order to build a valid statement.</p>

                <div class="interactive-activity">
                    <h4>Challenge: ${config.statementBuilding.challenge}</h4>
                    <p>${config.statementBuilding.instruction}</p>

                    <div class="build-sentence" id="statement1-parts">
                        ${config.statementBuilding.parts.map(part =>
                            `<div class="sentence-part highlight-variable" data-value="${part}">${part}</div>`
                        ).join('')}
                    </div>

                    <p>Your statement:</p>
                    <div class="sentence-result" id="statement1-result"></div>

                    <div class="feedback-area" id="statement1-feedback"></div>
                </div>
            </div>
        `;

        container.innerHTML = statementHTML;
        initializeDragDropChallenge(); // Renamed for clarity, assuming it's not actual drag and drop but click-to-add
    }

    function initializeDragDropChallenge() { // Or click-to-add challenge
        if (!config.statementBuilding) return;

        const correctSequence = config.statementBuilding.correctSequence;
        const pageIdentifier = config.pageIdentifier || 'default-page';
        const activityId = 'statement-building'; // Consistent ID

        document.querySelectorAll('#statement1-parts .sentence-part').forEach(part => {
            part.addEventListener('click', function() {
                const resultContainer = document.getElementById('statement1-result');

                const resultPart = document.createElement('div');
                resultPart.className = 'result-part'; // Style this class for the chosen parts
                resultPart.textContent = this.textContent;
                resultPart.dataset.value = this.dataset.value;

                // Add click listener to remove part from result
                resultPart.addEventListener('click', function() {
                    this.remove();
                    checkSequence(); // Re-check after removal
                });

                resultContainer.appendChild(resultPart);
                checkSequence();
            });
        });

        function checkSequence() {
            const resultContainer = document.getElementById('statement1-result');
            const feedbackContainer = document.getElementById('statement1-feedback');
            const resultParts = Array.from(resultContainer.children);

            const currentSequence = resultParts.map(part => part.dataset.value);

            let correct = false; // Assume incorrect until proven
            if (currentSequence.length === correctSequence.length) {
                correct = currentSequence.every((val, index) => val === correctSequence[index]);
            }

            // Provide feedback only when the sequence length matches the target length
            if (resultParts.length === correctSequence.length) {
                if (correct) {
                    feedbackContainer.className = 'feedback-area correct';
                    feedbackContainer.innerHTML = `
                        <h4><i class="fas fa-check-circle" style="color: #52c41a; margin-right: 10px;"></i> Correct!</h4>
                        <p>You've created the correct sequence: <code>${config.statementBuilding.correctAnswer}</code></p>
                    `;
                    BucklesSystem.awardBuckles(pageIdentifier, activityId, 2); // Award buckles for correct sequence
                } else {
                    feedbackContainer.className = 'feedback-area incorrect';
                    feedbackContainer.innerHTML = `
                        <h4><i class="fas fa-times-circle" style="color: #ff4d4f; margin-right: 10px;"></i> Not Quite Right</h4>
                        <p>The correct statement should be: <code>${config.statementBuilding.correctAnswer}</code></p>
                    `;
                }
            } else {
                feedbackContainer.className = 'feedback-area'; // Clear feedback if sequence length is not final
                feedbackContainer.innerHTML = '';
            }
        }
    }

    // Tracing challenge system
    function initializeTracingChallenge() {
        if (!config.tracingChallenge) return;

        const container = document.getElementById('tracing-challenge-container');
        if (!container) return;

        const tracingHTML = `
            <div class="interactive-card" style="margin-top: 30px;">
                <div class="element-header" style="margin: -35px -35px 30px -35px; padding: 20px 25px;">
                    <h3>${config.tracingChallenge.title} <i class="fas fa-search" style="margin-left: 10px;"></i></h3>
                </div>

                <p>${config.tracingChallenge.instruction}</p>

                <div class="code-block">
${config.tracingChallenge.code}
                </div>

                <div class="multiple-choice-container">
                    <p style="font-weight: bold; margin-top: 20px; font-size: 1.2em;">${config.tracingChallenge.question}
                        <span style="color: var(--accent-color); background-color: rgba(255, 215, 0, 0.15); padding: 4px 8px; border-radius: 4px; margin-left: 5px; display: inline-flex; align-items: center;">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' width='24' height='24'%3E%3Ccircle cx='18' cy='18' r='16' fill='%2523FFD700' stroke='%2523DAA520' stroke-width='2'/%3E%3Ctext x='18' y='24' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='%2523000'%3EB%3C/text%3E%3C/svg%3E" alt="Buckle" style="width: 20px; height: 20px; margin-right: 5px;">
                            <strong>Worth ${config.tracingChallenge.buckles} buckles!</strong>
                        </span>
                    </p>
                    <div class="multiple-choice-options" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 15px;">
                        ${config.tracingChallenge.options.map(option => `
                            <div class="multiple-choice-option" data-value="${option.value}" style="background-color: #f5f5f5; border: 2px solid #ddd; border-radius: 8px; padding: 12px 15px; cursor: pointer; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <span style="font-weight: bold; color: var(--accent-color);">${option.value})</span> ${option.text}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div id="tracing-feedback" class="feedback-message"></div>
            </div>
        `;

        container.innerHTML = tracingHTML;
        initializeTracingQuiz();
    }

    function initializeTracingQuiz() {
        const pageIdentifier = config.pageIdentifier || 'default-page';
        const activityId = 'tracing-challenge'; // Consistent ID

        document.querySelectorAll('.multiple-choice-option').forEach(option => {
            option.addEventListener('click', function() {
                // Deselect other options visually
                document.querySelectorAll('.multiple-choice-option').forEach(opt => {
                    opt.classList.remove('selected'); // Define 'selected' style in CSS
                    opt.style.borderColor = '#ddd'; // Reset border
                });

                this.classList.add('selected');
                this.style.borderColor = 'var(--accent-color)'; // Highlight selected

                const answer = this.getAttribute('data-value');
                const feedback = document.getElementById('tracing-feedback');

                if (answer === config.tracingChallenge.correctAnswer) {
                    feedback.innerHTML = `<i class='fas fa-check-circle' style='color: #52c41a; margin-right: 8px;'></i> Correct! ${config.tracingChallenge.explanation}`;
                    feedback.className = 'feedback-message correct'; // Style 'correct' class
                    BucklesSystem.awardBuckles(pageIdentifier, activityId, config.tracingChallenge.buckles);
                } else {
                    feedback.innerHTML = `<i class='fas fa-times-circle' style='color: #ff4d4f; margin-right: 8px;'></i> Incorrect. Think about what happens step by step through the code.`;
                    feedback.className = 'feedback-message incorrect'; // Style 'incorrect' class
                }
            });
        });
    }

    // Tour system - builds tours from config data
    function initializeTours() {
        if (!config.tours || typeof Shepherd === 'undefined') return; // Ensure Shepherd is loaded

        Object.keys(config.tours).forEach(tourId => {
            const tourConfig = config.tours[tourId];
            tours[tourId] = createTourFromConfig(tourConfig);
        });
    }

    function createTourFromConfig(tourConfig) {
        const useModalOverlay = tourConfig.useModalOverlay !== undefined ?
                                tourConfig.useModalOverlay :
                                true; // Default to true if not specified

        const tour = new Shepherd.Tour({
            useModalOverlay: useModalOverlay,
            defaultStepOptions: {
                classes: 'shepherd-custom-theme', // Use a custom class for Shepherd styling
                scrollTo: true,
                cancelIcon: { enabled: true },
                ...tourConfig.defaultStepOptions
            }
        });

        tourConfig.steps.forEach(stepConfig => {
            const step = {
                title: stepConfig.title,
                text: stepConfig.text,
                buttons: stepConfig.buttons.map(btn => ({
                    text: btn.text,
                    action: btn.action === 'next' ? tour.next :
                           btn.action === 'complete' ? tour.complete :
                           btn.action === 'runCode' ? function() {
                               if (btn.codeType && editors[btn.codeType]) {
                                   runCode(btn.codeType);
                               }
                               tour.complete(); // Or tour.next() if there are more steps
                           } : tour.complete,
                    classes: btn.classes || 'shepherd-button-primary' // Use Shepherd's default or custom
                }))
            };

            if (stepConfig.attachTo) {
                step.attachTo = {
                    element: stepConfig.attachTo.element, // This should be a CSS selector string
                    on: stepConfig.attachTo.on || 'bottom'
                };
            }

            tour.addStep(step);
        });

        return tour;
    }

    function startExperimentTour(expId, type) {
        // Toggle panels appropriately
        if (type === 'primary' && document.getElementById('experiments-panel')) {
            toggleExperimentPanel('experiments-panel', 'secondary-experiments-panel');
        } else if (type === 'secondary' && document.getElementById('secondary-experiments-panel')) {
            toggleExperimentPanel('secondary-experiments-panel', 'experiments-panel');
        }

        const tour = tours[expId];
        if (tour) {
            tour.start();
        } else {
            console.warn(`Tour with ID "${expId}" not found.`);
        }
    }

    function initializeSpotTheErrorQuiz() {
        if (!config.spotTheErrorQuiz) return;

        const container = document.getElementById('spot-the-error-container');
        if (!container) return;

        const quizConfig = config.spotTheErrorQuiz;
        // Using similar HTML structure to Tracing Challenge for consistent styling
        const quizHTML = `
            <div class="interactive-card">
                <div class="element-header" style="margin: -35px -35px 30px -35px; padding: 20px 25px;">
                    <div class="element-number" style="display: flex; align-items: center; justify-content: center;"><i class="fas fa-search-dollar" style="font-size: 1em;"></i></div>
                    <h3>${quizConfig.title} <i class="fas fa-bug" style="margin-left: 10px;"></i></h3>
                </div>
                
                <p>${quizConfig.instruction}</p>
                
                <div class="code-block" style="background-color: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre;">
${quizConfig.code.replace(/</g, '<').replace(/>/g, '>')}
                </div>
                
                <div class="multiple-choice-container">
                    <p style="font-weight: bold; margin-top: 20px; font-size: 1.2em;">${quizConfig.question}
                        <span style="color: var(--accent-color); background-color: rgba(255, 215, 0, 0.15); padding: 4px 8px; border-radius: 4px; margin-left: 5px; display: inline-flex; align-items: center;">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' width='24' height='24'%3E%3Ccircle cx='18' cy='18' r='16' fill='%2523FFD700' stroke='%2523DAA520' stroke-width='2'/%3E%3Ctext x='18' y='24' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='%2523000'%3E${quizConfig.buckles}B%3C/text%3E%3C/svg%3E" alt="Buckle" style="width: 20px; height: 20px; margin-right: 5px;">
                            <strong>Worth ${quizConfig.buckles} buckle!</strong>
                        </span>
                    </p>
                    <div class="multiple-choice-options spot-error-options" style="display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 15px;">
                        ${quizConfig.options.map(option => `
                            <div class="multiple-choice-option spot-error-option" data-value="${option.value}" style="background-color: #f5f5f5; border: 2px solid #ddd; border-radius: 8px; padding: 12px 15px; cursor: pointer; font-weight: 500; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                <span style="font-weight: bold; color: var(--accent-color);">${option.value})</span> ${option.text} 
                                <span style="font-size:0.9em; color: #666; display: block; margin-left: 20px;"><em>${option.detail || ''}</em></span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div id="spot-error-feedback" class="feedback-message" style="margin-top: 15px;"></div>
            </div>
        `;

        container.innerHTML = quizHTML;

        // Event listeners (similar to initializeTracingQuiz)
        const pageIdentifier = config.pageIdentifier || 'default-page';
        const activityId = 'spot-the-error-quiz'; // Unique ID for BucklesSystem
        
        container.querySelectorAll('.spot-error-option').forEach(option => {
            option.addEventListener('click', function() {
                container.querySelectorAll('.spot-error-option').forEach(opt => {
                    opt.classList.remove('selected');
                    opt.style.borderColor = '#ddd'; // Reset border
                });
                
                this.classList.add('selected');
                this.style.borderColor = 'var(--accent-color)'; // Highlight selected
                
                const answer = this.getAttribute('data-value');
                const feedbackEl = document.getElementById('spot-error-feedback');
                
                if (answer === quizConfig.correctAnswer) {
                    feedbackEl.innerHTML = `<i class='fas fa-check-circle' style='color: #52c41a; margin-right: 8px;'></i> ${quizConfig.explanation}`;
                    feedbackEl.className = 'feedback-message correct';
                    BucklesSystem.awardBuckles(pageIdentifier, activityId, quizConfig.buckles);
                } else {
                    feedbackEl.innerHTML = `<i class='fas fa-times-circle' style='color: #ff4d4f; margin-right: 8px;'></i> Not quite. Remember to check for common Python syntax like colons and indentation!`;
                    feedbackEl.className = 'feedback-message incorrect';
                }
            });
        });
    }

    // Progress tracking
    function updateExperimentTrackers() {
        const pageIdentifier = config.pageIdentifier || 'default-page';

        function updateTrackerForType(experimentTypeKey) {
            if (config.experiments && config.experiments[experimentTypeKey]) {
                config.experiments[experimentTypeKey].experiments.forEach(exp => {
                    if (BucklesSystem.isActivityCompleted(pageIdentifier, exp.id)) {
                        const experimentItem = document.getElementById(`${exp.id}-item`);
                        const experimentStatus = document.getElementById(`${exp.id}-status`);
                        if (experimentItem && experimentStatus) {
                            experimentItem.classList.add('completed');
                            experimentStatus.classList.add('completed');
                            experimentStatus.innerHTML = '<i class="fas fa-check"></i>';
                        }
                    }
                });
            }
        }

        updateTrackerForType('primary');
        updateTrackerForType('secondary');
    }

    // Public API
    return {
        initialize: initialize,
        runCode: runCode, // Expose runCode if needed externally, though typically internal
        getEditor: (type) => editors[type], // Useful for debugging or external manipulation
        getConfig: () => config, // For debugging
        updateProgress: updateExperimentTrackers // If progress needs to be updated externally
    };

})();

// Make EducationalEditor available globally if it's not a module being imported elsewhere
window.EducationalEditor = EducationalEditor;