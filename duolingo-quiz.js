/**
 * Duolingo-style Quiz Module
 * Modular quiz functionality for educational pages
 * Integrated with the unified BucklesSystem
 */

// Create a namespace to avoid global variable conflicts
const DuolingoQuiz = (function() {
    // Private variables for tracking exercise state
    let currentExercise = 1;
    let totalExercises = 0;
    let userAnswers = {};
    let quizContainer = null;
    let attemptedExercises = new Set();
    let pageIdentifier = 'duolingo-quiz';
    
    /**
     * Initialize the quiz with given questions
     * @param {string} containerId - The ID of the container element
     * @param {Array} questions - Array of question objects
     * @param {string} pageName - Optional identifier for the current page
     */
    function initQuiz(containerId, questions, pageName = 'duolingo-quiz') {
        // Store questions count
        totalExercises = questions.length;
        
        // Set page identifier
        pageIdentifier = pageName;
        
        // Get the container
        quizContainer = document.getElementById(containerId);
        if (!quizContainer) return;
        
        // Reset state
        currentExercise = 1;
        userAnswers = {};
        
        // Load user progress
        loadUserProgress();
        
        // Store questions in window scope for access by event handlers
        window.quizQuestions = questions;
        
        // Build quiz HTML
        buildQuizHtml(questions);
        
        // Initialize drag and drop functionality
        initDragAndDrop();

        updateAllBuckleCounters();

    }
    
    /**
     * Load user progress from local storage
     */
    function loadUserProgress() {
        // Find previously completed exercises for this page
        attemptedExercises = new Set();
        for (let i = 1; i <= totalExercises; i++) {
            if (BucklesSystem.isActivityCompleted(pageIdentifier, `exercise_${i}`)) {
                attemptedExercises.add(i);
            }
        }
    }

    function updateAllBuckleCounters() {
        const buckleCount = BucklesSystem.getBuckles();
        
        // Update the quiz's internal buckle counter
        const internalCounter = document.getElementById('buckle-score');
        if (internalCounter) {
            internalCounter.textContent = buckleCount;
        }
        
        // Update all external buckle counters
        document.querySelectorAll('[id$="-buckle-container"] .buckles-counter-value').forEach(counter => {
            counter.textContent = buckleCount;
        });
        
        // Also update any counters with specific class names
        document.querySelectorAll('.buckle-count, .buckles-count').forEach(counter => {
            counter.textContent = buckleCount;
        });
    }
    
    /**
     * Build the HTML structure for the quiz
     * @param {Array} questions - Array of question objects
     */
    function buildQuizHtml(questions) {
        let html = `
            <div class="exercise-header">
                <h3>Practice Exercises</h3>
                <div class="buckle-counter">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='16' fill='%23FFD700' stroke='%23DAA520' stroke-width='2'/%3E%3Ctext x='18' y='24' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='%23000'%3EB%3C/text%3E%3C/svg%3E" 
                         alt="Buckle" style="width: 30px; height: 30px; vertical-align: middle;">
                    <span id="buckle-score">${BucklesSystem.getBuckles()}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-bar" style="width: 0%;"></div>
                </div>
            </div>
            
            <div class="exercise-content" id="exercise-container">
        `;
        
        // Add each exercise
        questions.forEach((question, index) => {
            const exerciseNum = index + 1;
            const display = exerciseNum === 1 ? 'block' : 'none';
            
            html += `<div class="exercise" id="exercise-${exerciseNum}" style="display: ${display};">`;
            
            if (question.type === "true-false") {
                html += buildTrueFalseExercise(question, exerciseNum);
            } else if (question.type === "drag-drop") {
                html += buildDragDropExercise(question, exerciseNum);
            }
            
            html += `
                <div class="feedback-message" id="feedback-${exerciseNum}"></div>
                <div class="exercise-footer">
                    <button class="check-btn" id="check-btn-${exerciseNum}" onclick="DuolingoQuiz.checkAnswer(${exerciseNum})" disabled>Check</button>
                    <button class="reset-btn" id="reset-btn-${exerciseNum}" onclick="DuolingoQuiz.resetCurrentExercise(${exerciseNum})">Reset</button>
                </div>
            </div>`;
        });
        
        // Add completion screen
        html += `
            <div id="exercise-complete" style="display: none; text-align: center; padding: 30px;">
                <i class="fas fa-trophy" style="font-size: 5em; color: #ffc107; margin-bottom: 20px;"></i>
                <h2>Great Job!</h2>
                <p style="font-size: 1.2em; margin-bottom: 30px;">You've completed all the exercises!</p>
                <button class="check-btn" onclick="DuolingoQuiz.resetExercises()">Start Again</button>
            </div>
        </div>
        
        <div class="exercise-nav" id="exercise-nav" style="display: none;">
            <button id="prev-btn" onclick="DuolingoQuiz.prevExercise()" disabled>
                <i class="fas fa-arrow-left"></i> Previous
            </button>
            <button id="next-btn" onclick="DuolingoQuiz.nextExercise()" disabled>
                Next <i class="fas fa-arrow-right"></i>
            </button>
        </div>`;
        
        // Add styles for reset button
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .reset-btn {
                background-color: #f8f9fa;
                color: #333;
                border: 2px solid #dee2e6;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s;
            }
            
            .reset-btn:hover {
                background-color: #e9ecef;
            }
        `;
        document.head.appendChild(styleElement);
        
        // Set the HTML to the container
        quizContainer.innerHTML = html;
        
        // Update the score display
        document.getElementById('buckle-score').textContent = BucklesSystem.getBuckles();
    }
    
    /**
     * Build HTML for a true/false exercise
     */
    function buildTrueFalseExercise(question, exerciseNum) {
        return `
            <div class="true-false-exercise">
                <p>${question.question}</p>
                <div class="true-false-options">
                    <div class="true-false-option" data-value="true" onclick="DuolingoQuiz.selectTrueFalse(this, ${exerciseNum})">True</div>
                    <div class="true-false-option" data-value="false" onclick="DuolingoQuiz.selectTrueFalse(this, ${exerciseNum})">False</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Build HTML for a drag and drop exercise
     */
    function buildDragDropExercise(question, exerciseNum) {
        let html = `
            <div class="drag-drop-exercise">
                <h4>${question.question}</h4>
                <div class="drag-pieces" id="pieces-${exerciseNum}">
        `;
        
        // Add drag pieces
        question.pieces.forEach(piece => {
            // Properly escape HTML attributes by converting quotes to entities
            const escapedPiece = piece
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
            
            html += `<div class="drag-piece" draggable="true" data-piece="${escapedPiece}">${piece}</div>`;
        });
        
        html += `
                </div>
                <div class="drag-target" id="target-${exerciseNum}">`;
        
        // Add error code if provided
        if (question.errorCode) {
            html += `<div class="error-code">${question.errorCode}</div>`;
        }
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Initialize drag and drop functionality
     */
    function initDragAndDrop() {
        // Get all drag pieces
        const dragPieces = document.querySelectorAll('.drag-piece');
        
        // Get all drag targets
        const dragTargets = document.querySelectorAll('.drag-target');
        
        // Add event listeners to drag pieces
        dragPieces.forEach(piece => {
            piece.addEventListener('dragstart', dragStart);
            piece.addEventListener('dragend', dragEnd);
            piece.addEventListener('touchstart', touchStart, {passive: false});
            piece.addEventListener('touchend', touchEnd);
            piece.addEventListener('touchmove', touchMove, {passive: false});
        });
        
        // Add event listeners to drag targets
        dragTargets.forEach(target => {
            target.addEventListener('dragover', dragOver);
            target.addEventListener('dragenter', dragEnter);
            target.addEventListener('dragleave', dragLeave);
            target.addEventListener('drop', drop);
        });
    }
    
    // Drag and drop functions
    function dragStart(e) {
        // Use the unescaped version for data transfer
        const pieceValue = e.target.textContent;
        e.dataTransfer.setData('text/plain', pieceValue);
        e.target.classList.add('dragging');
    }
    
    function dragEnd(e) {
        e.target.classList.remove('dragging');
    }
    
    function dragOver(e) {
        e.preventDefault();
    }
    
    function dragEnter(e) {
        e.preventDefault();
        e.target.classList.add('highlight');
    }
    
    function dragLeave(e) {
        e.target.classList.remove('highlight');
    }
    
    function drop(e) {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        
        // If target already has an error-code div, remove it first
        const errorCode = e.target.querySelector('.error-code');
        if (errorCode) {
            errorCode.remove();
        }
        
        // Create a new element to represent the dropped piece
        const droppedPiece = document.createElement('div');
        droppedPiece.className = 'dropped-piece';
        droppedPiece.textContent = data;
        
        // Store the data in a data attribute, properly escaped
        const escapedData = data
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        droppedPiece.setAttribute('data-piece', escapedData);
        
        // Add a click event to remove the piece
        droppedPiece.addEventListener('click', function() {
            this.remove();
            updateCheckButton();
        });
        
        // Add the piece to the target
        e.target.appendChild(droppedPiece);
        e.target.classList.remove('highlight');
        
        // Update the check button state
        updateCheckButton();
    }
    
    // Touch event handlers for mobile
    function touchStart(e) {
        e.preventDefault();
        const touch = e.targetTouches[0];
        const piece = e.target;
        
        // Store initial touch position and piece info
        piece.initialX = touch.clientX;
        piece.initialY = touch.clientY;
        piece.classList.add('dragging');
        
        // Create a ghost element for visual feedback
        const ghost = piece.cloneNode(true);
        ghost.style.position = 'fixed';
        ghost.style.opacity = '0.5';
        ghost.style.zIndex = '1000';
        ghost.style.pointerEvents = 'none';
        ghost.id = 'drag-ghost';
        document.body.appendChild(ghost);
        
        // Position the ghost
        updateGhostPosition(touch.clientX, touch.clientY, ghost);
    }
    
    function touchMove(e) {
        e.preventDefault();
        const touch = e.targetTouches[0];
        const ghost = document.getElementById('drag-ghost');
        
        if (ghost) {
            updateGhostPosition(touch.clientX, touch.clientY, ghost);
        }
        
        // Check if we're over a valid drop target
        const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
        if (targetElement && targetElement.classList.contains('drag-target')) {
            targetElement.classList.add('highlight');
        }
    }
    
    function updateGhostPosition(x, y, ghost) {
        ghost.style.left = `${x - ghost.offsetWidth / 2}px`;
        ghost.style.top = `${y - ghost.offsetHeight / 2}px`;
    }
    
    function touchEnd(e) {
        const piece = e.target;
        const ghost = document.getElementById('drag-ghost');
        
        if (ghost) {
            const x = parseInt(ghost.style.left) + ghost.offsetWidth / 2;
            const y = parseInt(ghost.style.top) + ghost.offsetHeight / 2;
            const targetElement = document.elementFromPoint(x, y);
            
            if (targetElement && targetElement.classList.contains('drag-target')) {
                // Remove error code if it exists
                const errorCode = targetElement.querySelector('.error-code');
                if (errorCode) {
                    errorCode.remove();
                }
                
                // Create a new element to represent the dropped piece
                const droppedPiece = document.createElement('div');
                droppedPiece.className = 'dropped-piece';
                droppedPiece.textContent = piece.textContent;
                
                // Store the data in a data attribute, properly escaped
                const escapedData = piece.textContent
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;");
                droppedPiece.setAttribute('data-piece', escapedData);
                
                // Add a click event to remove the piece
                droppedPiece.addEventListener('click', function() {
                    this.remove();
                    updateCheckButton();
                });
                
                // Add the piece to the target
                targetElement.appendChild(droppedPiece);
                targetElement.classList.remove('highlight');
                
                // Update the check button state
                updateCheckButton();
            }
            
            // Remove the ghost
            ghost.remove();
        }
        
        piece.classList.remove('dragging');
        
        // Remove highlight from all drop targets
        document.querySelectorAll('.drag-target').forEach(target => {
            target.classList.remove('highlight');
        });
    }
    
    // True/False selection
    function selectTrueFalse(element, exerciseNum) {
        // Remove selected class from all options
        const options = element.parentElement.querySelectorAll('.true-false-option');
        options.forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        element.classList.add('selected');
        
        // Store the answer
        userAnswers[exerciseNum] = element.getAttribute('data-value');
        
        // Enable check button
        document.getElementById(`check-btn-${exerciseNum}`).disabled = false;
    }
    
    // Check if drag target has content to enable check button
    function updateCheckButton() {
        const exerciseNum = currentExercise;
        const target = document.getElementById(`target-${exerciseNum}`);
        
        if (target) {
            const checkButton = document.getElementById(`check-btn-${exerciseNum}`);
            // If there's an error-code div, only enable if there are other pieces
            const errorCode = target.querySelector('.error-code');
            if (errorCode && target.children.length <= 1) {
                checkButton.disabled = true;
            } else {
                checkButton.disabled = target.children.length === 0;
            }
            
            // Store the answer if there are pieces
            if (target.children.length > 0) {
                let answerPieces = [];
                Array.from(target.children)
                    .filter(child => child.classList.contains('dropped-piece'))
                    .forEach(piece => {
                        answerPieces.push(piece.textContent);
                    });
                userAnswers[exerciseNum] = answerPieces.join(' ');
            } else {
                delete userAnswers[exerciseNum];
            }
        }
    }
    
    // Reset current exercise
    function resetCurrentExercise(exerciseNum) {
        const target = document.getElementById(`target-${exerciseNum}`);
        
        if (target) {
            // Keep any error-code elements, remove dropped pieces
            Array.from(target.children).forEach(child => {
                if (!child.classList.contains('error-code')) {
                    child.remove();
                }
            });
        }
        
        // Reset true/false selection if applicable
        const options = document.querySelectorAll(`#exercise-${exerciseNum} .true-false-option`);
        options.forEach(option => {
            option.classList.remove('selected');
        });
        
        // Reset feedback
        const feedbackElement = document.getElementById(`feedback-${exerciseNum}`);
        if (feedbackElement) {
            feedbackElement.style.display = 'none';
        }
        
        // Disable check button
        document.getElementById(`check-btn-${exerciseNum}`).disabled = true;
        
        // Delete the answer
        delete userAnswers[exerciseNum];
    }
    
    // Check answers
    function checkAnswer(exerciseNum) {
        let isCorrect = false;
        let feedback = '';
        
        // Get the question for this exercise
        const question = window.quizQuestions[exerciseNum - 1];
        
        // Check if this is the first attempt
        const isFirstAttempt = !BucklesSystem.isActivityAttempted(pageIdentifier, `exercise_${exerciseNum}`);
        
        // Mark as attempted
        if (isFirstAttempt) {
            BucklesSystem.markActivityAttempted(pageIdentifier, `exercise_${exerciseNum}`);
        }
        
        if (question.type === "true-false") {
            isCorrect = userAnswers[exerciseNum] === question.correctAnswer;
            feedback = isCorrect ? question.feedbackCorrect : question.feedbackIncorrect;
        } 
        else if (question.type === "drag-drop") {
            // For drag and drop, normalize spaces and compare
            const normalized = userAnswers[exerciseNum].replace(/\s+/g, ' ').trim();
            const correctNormalized = question.correctAnswer.replace(/\s+/g, ' ').trim();
            isCorrect = normalized === correctNormalized;
            feedback = isCorrect ? question.feedbackCorrect : question.feedbackIncorrect;
        }
        
        // Show feedback
        const feedbackElement = document.getElementById(`feedback-${exerciseNum}`);
        feedbackElement.innerHTML = feedback;
        feedbackElement.className = isCorrect ? 'feedback-message correct' : 'feedback-message incorrect';
        feedbackElement.style.display = 'block';
        
        // If correct, show celebration and award points
        if (isCorrect) {
            // Show confetti animation
            showConfetti();
            
            // Show the navigation buttons
            document.getElementById('exercise-nav').style.display = 'block';
            
            // Update progress bar
            updateProgress(exerciseNum);
            
            // Enable next button
            document.getElementById('next-btn').disabled = false;
            
            // Updated block to fix buckle counter update issue
            if (!attemptedExercises.has(exerciseNum) && isFirstAttempt) {
                // Update local tracking
                attemptedExercises.add(exerciseNum);
                
                // Award 1 buckle
                BucklesSystem.awardBuckles(pageIdentifier, `exercise_${exerciseNum}`, 1);
                
                // Call the updateAllBuckleCounters function to refresh all counters
                updateAllBuckleCounters();
            }
        }
    }
    
    // Update progress bar
    function updateProgress(exerciseNum) {
        const progressPercentage = (exerciseNum / totalExercises) * 100;
        document.getElementById('progress-bar').style.width = `${progressPercentage}%`;
    }
    
    // Navigation - next exercise
    function nextExercise() {
        // Hide current exercise
        document.getElementById(`exercise-${currentExercise}`).style.display = 'none';
        
        // Move to next exercise or show completion
        currentExercise++;
        
        if (currentExercise <= totalExercises) {
            document.getElementById(`exercise-${currentExercise}`).style.display = 'block';
            
            // Update buttons
            document.getElementById('prev-btn').disabled = false;
            document.getElementById('next-btn').disabled = true; // Disable until checking the answer
            
            // Initialize drag and drop for the new exercise
            initDragAndDrop();
            
            // Reset feedback
            const feedbackElement = document.getElementById(`feedback-${currentExercise}`);
            if (feedbackElement) {
                feedbackElement.style.display = 'none';
            }
        } else {
            // Show completion message
            document.getElementById('exercise-complete').style.display = 'block';
            document.getElementById('exercise-nav').style.display = 'none';
        }
    }
    
    // Navigation - previous exercise
    function prevExercise() {
        // Hide current exercise
        document.getElementById(`exercise-${currentExercise}`).style.display = 'none';
        
        // Move to previous exercise
        currentExercise--;
        
        if (currentExercise >= 1) {
            document.getElementById(`exercise-${currentExercise}`).style.display = 'block';
            
            // Update buttons
            document.getElementById('prev-btn').disabled = currentExercise === 1;
            
            // Next button is only enabled if the exercise has been correctly answered
            const hasBeenAnswered = attemptedExercises.has(currentExercise);
            document.getElementById('next-btn').disabled = !hasBeenAnswered;
            
            // Initialize drag and drop for the new exercise
            initDragAndDrop();
        }
    }
    
    // Reset exercises
    function resetExercises() {
        // Reset current exercise
        currentExercise = 1;
        
        // Hide completion message
        document.getElementById('exercise-complete').style.display = 'none';
        
        // Show first exercise
        for (let i = 1; i <= totalExercises; i++) {
            document.getElementById(`exercise-${i}`).style.display = i === 1 ? 'block' : 'none';
            
            // Reset feedback
            const feedbackElement = document.getElementById(`feedback-${i}`);
            if (feedbackElement) {
                feedbackElement.style.display = 'none';
            }
        }
        
        // Reset progress bar
        document.getElementById('progress-bar').style.width = '0%';
        
        // Reset navigation buttons
        document.getElementById('exercise-nav').style.display = 'none';
        document.getElementById('prev-btn').disabled = true;
        document.getElementById('next-btn').disabled = true;
        
        // Reset all true/false options
        document.querySelectorAll('.true-false-option').forEach(option => {
            option.classList.remove('selected', 'correct', 'incorrect');
        });
        
        // Reset all drag targets
        document.querySelectorAll('.drag-target').forEach(target => {
            // Keep any error-code elements, remove others
            Array.from(target.children).forEach(child => {
                if (!child.classList.contains('error-code')) {
                    child.remove();
                }
            });
        });
        
        // Reset all check buttons
        document.querySelectorAll('.check-btn').forEach(button => {
            button.disabled = true;
        });
        
        // Clear user answers
        for (let key in userAnswers) {
            delete userAnswers[key];
        }
        
        // Initialize drag and drop
        initDragAndDrop();
    }
    
    // Show confetti animation
    function showConfetti() {
        const container = document.getElementById('exercise-container');
        
        // Create confetti pieces
        for (let i = 0; i < 50; i++) {
            createConfettiPiece(container);
        }
    }
    
    // Create confetti piece
    function createConfettiPiece(container) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random confetti properties
        const colors = ['#58cc02', '#1cb0f6', '#ffc107', '#ff4b4b', '#ff9600'];
        const size = Math.floor(Math.random() * 10) + 5; // 5-15px
        const left = Math.floor(Math.random() * container.offsetWidth);
        const delay = Math.random() * 2; // 0-2s
        
        // Set confetti styles
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';
        confetti.style.left = left + 'px';
        confetti.style.top = '-20px';
        confetti.style.animationDelay = delay + 's';
        
        // Add to container
        container.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
            confetti.remove();
        }, 3000 + (delay * 1000));
    }
    
    // Public API
    return {
        initQuiz: initQuiz,
        selectTrueFalse: selectTrueFalse,
        checkAnswer: checkAnswer,
        nextExercise: nextExercise,
        prevExercise: prevExercise,
        resetExercises: resetExercises,
        resetCurrentExercise: resetCurrentExercise
    };
})();

// Expose the public API to the window
window.DuolingoQuiz = DuolingoQuiz;
window.initQuiz = function(containerId, questions, pageName) {
    DuolingoQuiz.initQuiz(containerId, questions, pageName);
};