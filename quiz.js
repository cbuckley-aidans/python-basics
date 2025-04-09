/**
 * Improved Duolingo-style Quiz Implementation
 */

function getGlobalBuckles() {
    const totalBuckles = localStorage.getItem('totalPythonBuckles') || '0';
    return parseInt(totalBuckles);
}

function updateGlobalBuckles(amount) {
    let total = getGlobalBuckles();
    total += amount;
    localStorage.setItem('totalPythonBuckles', total.toString());
    
    // Update all buckle displays on the page
    document.querySelectorAll('[id$="buckle-score"]').forEach(el => {
        el.textContent = total;
    });
}


function initializeQuiz(quizQuestions) {
    const quizContainer = document.getElementById('quiz-container');
    let currentQuestionIndex = 0;
    let userScore = 0;
    let attemptedQuestions = new Set();
    let mainContainer = null;
    
    function loadSavedProgress() {
        userScore = getGlobalBuckles();
        
        const completedQuestions = localStorage.getItem('completedQuestions');
        if (completedQuestions) {
            attemptedQuestions = new Set(JSON.parse(completedQuestions));
        }
    }
    
    // Save score and progress to local storage
    function saveProgress() {
        localStorage.setItem('completedQuestions', JSON.stringify([...attemptedQuestions]));
    }
    
    // Build the quiz HTML
    function buildQuiz() {
        loadSavedProgress();
        
        let html = `
            <div class="exercise-header">
                <h3>Practice Exercises</h3>
                <div class="buckle-counter">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='16' fill='%23FFD700' stroke='%23DAA520' stroke-width='2'/%3E%3Ctext x='18' y='24' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='%23000'%3EB%3C/text%3E%3C/svg%3E" 
                         alt="Buckle" style="width: 30px; height: 30px; vertical-align: middle;">
                    <span id="buckle-score">${userScore}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-bar" style="width: ${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%;"></div>
                </div>
            </div>
            
            <div class="single-quiz-frame" id="single-quiz-frame">
                <div class="exercise-content" id="exercise-container">
                    <div class="question-container" id="question-container">
                        ${buildQuestionHTML(quizQuestions[currentQuestionIndex])}
                        <div class="feedback-message" id="feedback"></div>
                    </div>
                </div>
            </div>
            
            <div class="buckle-animation" id="buckle-animation" style="display: none;">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='16' fill='%23FFD700' stroke='%23DAA520' stroke-width='2'/%3E%3Ctext x='18' y='24' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='%23000'%3EB%3C/text%3E%3C/svg%3E" 
                     alt="Buckle" id="buckle-img">
                <div class="shine"></div>
            </div>
            
            <div class="exercise-nav" id="exercise-nav" style="display: none; justify-content: space-between;">
                <button id="prev-btn" class="prev-btn" ${currentQuestionIndex === 0 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-left"></i> Previous
                </button>
                <button id="next-btn" class="next-btn" ${currentQuestionIndex >= quizQuestions.length - 1 ? 'disabled' : ''}>
                    Next <i class="fas fa-arrow-right"></i>
                </button>
            </div>`;
        
        quizContainer.innerHTML = html;
        mainContainer = document.getElementById('single-quiz-frame');
        
        // Attach event listeners to navigation buttons
        document.getElementById('prev-btn').addEventListener('click', function() {
            prevQuestion();
        });
        
        document.getElementById('next-btn').addEventListener('click', function() {
            nextQuestion();
        });
        
        // Attach event listeners to interactive elements
        attachEventListeners();
    }
    
    // Build HTML for a question
    function buildQuestionHTML(question) {
        if (question.type === "true-false") {
            return buildTrueFalseHTML(question);
        } else if (question.type === "drag-drop") {
            return buildDragDropHTML(question);
        }
        return '';
    }
    
    // Build HTML for true/false question
    function buildTrueFalseHTML(question) {
        return `
            <div class="true-false-exercise">
                <p>${question.question}</p>
                <div class="true-false-options">
                    <div class="true-false-option" data-value="true">True</div>
                    <div class="true-false-option" data-value="false">False</div>
                </div>
            </div>
        `;
    }
    
    // Build HTML for drag-drop question
    function buildDragDropHTML(question) {
        let html = `
            <div class="drag-drop-exercise">
                <h4>${question.question}</h4>
                <div class="drag-pieces">
        `;
        
        // Add drag pieces
        question.pieces.forEach(piece => {
            const escapedPiece = piece
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
            
            // Determine appropriate syntax highlighting class
            let highlightClass = '';
            if (piece === 'print') {
                highlightClass = 'highlight-variable';
            } else if (piece === '(' || piece === ')' || piece === ',' || piece === '+' || 
                       piece === '[' || piece === ']') {
                highlightClass = 'highlight-operator';
            } else if (piece.includes('"') || !isNaN(piece)) {
                highlightClass = 'highlight-value';
            } else if (piece === 'def' || piece === 'if' || piece === 'else') {
                highlightClass = 'highlight-keyword';
            }
            
            html += `<div class="drag-piece ${highlightClass}" data-piece="${escapedPiece}">${piece}</div>`;
        });
        
        html += `
                </div>
                <div class="drag-target">`;
        
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
    
    // Attach event listeners to elements
    function attachEventListeners() {
        // True/false options
        document.querySelectorAll('.true-false-option').forEach(option => {
            option.addEventListener('click', function() {
                selectTrueFalseOption(this);
            });
        });
        
        // Click to place for drag pieces
        document.querySelectorAll('.drag-piece').forEach(piece => {
            piece.addEventListener('click', function() {
                addPieceToTarget(this);
            });
        });
    }
    
    // Handle true/false option selection
    function selectTrueFalseOption(option) {
        // Remove selected class from all options
        document.querySelectorAll('.true-false-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Check the answer immediately - no delay
        checkAnswer(option.getAttribute('data-value'));
    }
    
    // Add drag piece to target when clicked
    function addPieceToTarget(piece) {
        const target = document.querySelector('.drag-target');
        const question = quizQuestions[currentQuestionIndex];
        
        // Create a new element to represent the dropped piece
        const droppedPiece = document.createElement('div');
        droppedPiece.className = 'dropped-piece slide-animation';
        droppedPiece.textContent = piece.textContent;
        droppedPiece.dataset.piece = piece.dataset.piece;
        
        // Transfer highlighting classes
        if (piece.classList.contains('highlight-variable')) {
            droppedPiece.classList.add('highlight-variable');
        } else if (piece.classList.contains('highlight-operator')) {
            droppedPiece.classList.add('highlight-operator');
        } else if (piece.classList.contains('highlight-value')) {
            droppedPiece.classList.add('highlight-value');
        } else if (piece.classList.contains('highlight-keyword')) {
            droppedPiece.classList.add('highlight-keyword');
        }
        
        // Add a click event to remove the piece
        droppedPiece.addEventListener('click', function() {
            this.remove();
            
            // Check if we should clear feedback message
            const feedback = document.getElementById('feedback');
            if (feedback.className.includes('correct') || feedback.className.includes('incorrect')) {
                // Don't clear feedback if it's already showing a result
            } else {
                feedback.innerHTML = '';
                feedback.className = 'feedback-message';
            }
        });
        
        // Add the piece to the target
        target.appendChild(droppedPiece);
        
        // Check if we should evaluate the answer
        const droppedPieces = target.querySelectorAll('.dropped-piece');
        
        // Only check when we have exactly the expected number of pieces
        if (question.type === "drag-drop") {
            const expectedPieces = question.correctAnswer.split(' ').length;
            if (droppedPieces.length === expectedPieces) {
                // Get all dropped pieces
                let answer = Array.from(droppedPieces).map(p => p.textContent).join(' ');
                checkAnswer(answer);
            }
        }
    }
    
    // Check the user's answer
    function checkAnswer(userAnswer) {
        const question = quizQuestions[currentQuestionIndex];
        let isCorrect = false;
        
        // Check if this is the first attempt for this question
        const isFirstAttempt = !localStorage.getItem(`attempted_q${currentQuestionIndex}`);
        
        // Mark as attempted immediately on first try (regardless of correctness)
        if (isFirstAttempt) {
            localStorage.setItem(`attempted_q${currentQuestionIndex}`, 'true');
        }
        
        if (question.type === "true-false") {
            isCorrect = userAnswer === question.correctAnswer;
        } else if (question.type === "drag-drop") {
            // Normalize spaces for comparison
            const normalizedUser = userAnswer.replace(/\s+/g, ' ').trim();
            const normalizedCorrect = question.correctAnswer.replace(/\s+/g, ' ').trim();
            isCorrect = normalizedUser === normalizedCorrect;
        }
        
        // Show feedback
        const feedbackElement = document.getElementById('feedback');
        feedbackElement.innerHTML = isCorrect ? question.feedbackCorrect : question.feedbackIncorrect;
        feedbackElement.className = isCorrect ? 'feedback-message correct' : 'feedback-message incorrect';
        
        // If correct, show navigation and award buckle only on first attempt
        if (isCorrect) {
            // Show the navigation buttons
            document.getElementById('exercise-nav').style.display = 'flex';
            
            // Award buckle if first time correct AND first attempt
            if (!attemptedQuestions.has(currentQuestionIndex) && isFirstAttempt) {
                attemptedQuestions.add(currentQuestionIndex);
                updateGlobalBuckles(1);
                showBuckleAnimation();
                saveProgress();
            }
        } else if (question.type === "drag-drop") {
            // For incorrect drag-drop, show correct answer
            setTimeout(() => {
                const target = document.querySelector('.drag-target');
                
                // Clear the target (except error code)
                Array.from(target.children).forEach(child => {
                    if (!child.classList.contains('error-code')) {
                        child.remove();
                    }
                });
                
                // Show correct answer with proper syntax highlighting
                const correctPieces = question.correctAnswer.split(' ');
                correctPieces.forEach(piece => {
                    const correctPiece = document.createElement('div');
                    correctPiece.className = 'dropped-piece';
                    correctPiece.style.backgroundColor = 'rgba(82, 196, 26, 0.2)';
                    correctPiece.style.borderColor = '#52c41a';
                    correctPiece.textContent = piece;
                    
                    // Apply syntax highlighting
                    if (piece === 'print') {
                        correctPiece.classList.add('highlight-variable');
                    } else if (piece === '(' || piece === ')' || piece === ',' || piece === '+' ||
                              piece === '[' || piece === ']') {
                        correctPiece.classList.add('highlight-operator');
                    } else if (piece.includes('"') || !isNaN(piece)) {
                        correctPiece.classList.add('highlight-value');
                    } else if (piece === 'def' || piece === 'if' || piece === 'else') {
                        correctPiece.classList.add('highlight-keyword');
                    }
                    
                    target.appendChild(correctPiece);
                });
                
                // Show navigation
                document.getElementById('exercise-nav').style.display = 'flex';
            }, 1500);
        }
    }
    
    // Show buckle animation
    function showBuckleAnimation() {
        const animation = document.getElementById('buckle-animation');
        animation.style.display = 'block';
        
        // Play animation and then hide
        setTimeout(() => {
            animation.style.display = 'none';
        }, 2000);
    }
    
    // Navigation - next question
    function nextQuestion() {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            currentQuestionIndex++;
            
            // Add transition class to fade out
            mainContainer.classList.add('fade-change');
            
            setTimeout(() => {
                // Update the quiz with the new question
                const questionContainer = document.getElementById('question-container');
                questionContainer.innerHTML = 
                    buildQuestionHTML(quizQuestions[currentQuestionIndex]) + 
                    '<div class="feedback-message" id="feedback"></div>';
                
                // Update progress bar
                document.getElementById('progress-bar').style.width = 
                    `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`;
                
                // Update navigation buttons
                document.getElementById('prev-btn').disabled = false;
                document.getElementById('next-btn').disabled = currentQuestionIndex >= quizQuestions.length - 1;
                
                // Hide navigation until answered
                document.getElementById('exercise-nav').style.display = 'none';
                
                // Attach event listeners for the new question
                attachEventListeners();
                
                // Remove transition class
                mainContainer.classList.remove('fade-change');
            }, 250); // Half the animation time
        }
    }
    
    // Navigation - previous question
    function prevQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            
            // Add transition class to fade out
            mainContainer.classList.add('fade-change');
            
            setTimeout(() => {
                // Update the quiz with the new question
                const questionContainer = document.getElementById('question-container');
                questionContainer.innerHTML = 
                    buildQuestionHTML(quizQuestions[currentQuestionIndex]) + 
                    '<div class="feedback-message" id="feedback"></div>';
                
                // Update progress bar
                document.getElementById('progress-bar').style.width = 
                    `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`;
                
                // Update navigation buttons
                document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;
                document.getElementById('next-btn').disabled = false;
                
                // Show navigation if question was already answered
                document.getElementById('exercise-nav').style.display = 
                    attemptedQuestions.has(currentQuestionIndex) ? 'flex' : 'none';
                
                // Attach event listeners for the new question
                attachEventListeners();
                
                // Remove transition class
                mainContainer.classList.remove('fade-change');
            }, 250); // Half the animation time
        }
    }
    
    // Make navigation functions available globally
    window.nextQuestion = nextQuestion;
    window.prevQuestion = prevQuestion;
    
    // Initialize the quiz
    buildQuiz();
}

/**
 * Print Statement Builder Activity
 * Interactive activity for building Python print statements
 */
function initPrintStatementBuilder() {
    // Define the correct answers for each statement
    const correctStatements = {
        "statement1": ["print", "(", '"Hello, Python!"', ")"],
        "statement2": ["print", "(", "100", ")"],
        "statement3": ["print", "(", '"Name:"', ",", '"Alice"', ")"]
    };
    
    // Load saved score from local storage
    let userScore = 0;
    const savedScore = localStorage.getItem('printBuilderBuckles');
    if (savedScore) {
        userScore = parseInt(savedScore);
    }
    
    // Initialize buckle counter if it exists
    const buckleCounter = document.querySelector('.print-builder-buckle-counter');
    if (buckleCounter) {
        const scoreSpan = buckleCounter.querySelector('span');
        if (scoreSpan) {
            scoreSpan.textContent = userScore;
        }
    }
    
    // Add buckle counter if it doesn't exist
    if (!buckleCounter) {
        const firstActivity = document.querySelector('.interactive-activity');
        if (firstActivity) {
            const buckleDiv = document.createElement('div');
            buckleDiv.className = 'print-builder-buckle-counter buckle-counter';
            buckleDiv.innerHTML = `
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='16' fill='%23FFD700' stroke='%23DAA520' stroke-width='2'/%3E%3Ctext x='18' y='24' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='%23000'%3EB%3C/text%3E%3C/svg%3E" 
                     alt="Buckle" style="width: 30px; height: 30px; vertical-align: middle;">
                <span id="print-builder-buckle-score">${userScore}</span>
            `;
            firstActivity.appendChild(buckleDiv);
        }
    }
    
    // Create buckle animation container if it doesn't exist
    if (!document.getElementById('print-builder-buckle-animation')) {
        const animDiv = document.createElement('div');
        animDiv.className = 'buckle-animation';
        animDiv.id = 'print-builder-buckle-animation';
        animDiv.style.display = 'none';
        animDiv.innerHTML = `
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='16' fill='%23FFD700' stroke='%23DAA520' stroke-width='2'/%3E%3Ctext x='18' y='24' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='%23000'%3EB%3C/text%3E%3C/svg%3E" 
                 alt="Buckle" id="print-builder-buckle-img">
            <div class="shine"></div>
        `;
        document.body.appendChild(animDiv);
    }
    
    // Apply syntax highlighting to all sentence parts
    applySyntaxHighlightingToSentenceParts();
    
    // Add click event handlers to the sentence parts
    document.querySelectorAll('.sentence-part').forEach(part => {
        part.addEventListener('click', function() {
            const statementId = this.parentElement.id.split('-')[0];
            const resultContainer = document.getElementById(`${statementId}-result`);
            
            // Create a result part element
            const resultPart = document.createElement('div');
            resultPart.className = 'result-part';
            resultPart.textContent = this.textContent;
            resultPart.dataset.value = this.dataset.value;
            
            // Transfer the highlighting classes
            if (this.classList.contains('highlight-variable')) {
                resultPart.classList.add('highlight-variable');
            } else if (this.classList.contains('highlight-operator')) {
                resultPart.classList.add('highlight-operator');
            } else if (this.classList.contains('highlight-value')) {
                resultPart.classList.add('highlight-value');
            } else if (this.classList.contains('highlight-keyword')) {
                resultPart.classList.add('highlight-keyword');
            }
            
            // Add click event to remove the part when clicked
            resultPart.addEventListener('click', function() {
                this.remove();
                checkStatement(statementId);
            });
            
            // Add the animation class
            resultPart.classList.add('slide-animation');
            
            // Append the result part to the result container
            resultContainer.appendChild(resultPart);
            
            // Check if the statement is correct
            checkStatement(statementId);
        });
    });
    
    // Function to apply syntax highlighting to all sentence parts
    function applySyntaxHighlightingToSentenceParts() {
        document.querySelectorAll('.sentence-part').forEach(part => {
            // Reset any existing highlight classes
            part.classList.remove('highlight-variable', 'highlight-operator', 'highlight-value', 'highlight-keyword');
            
            // Apply appropriate class based on content
            if (part.textContent === 'print') {
                part.classList.add('highlight-variable');
            } else if (part.textContent === '(' || part.textContent === ')' || 
                       part.textContent === ',' || part.textContent === '+' ||
                       part.textContent === '[' || part.textContent === ']') {
                part.classList.add('highlight-operator');
            } else if (part.textContent.includes('"') || !isNaN(part.textContent)) {
                part.classList.add('highlight-value');
            } else if (part.textContent === 'def' || part.textContent === 'if' || 
                      part.textContent === 'else' || part.textContent === 'for' ||
                      part.textContent === 'while' || part.textContent === 'return') {
                part.classList.add('highlight-keyword');
            }
        });
    }
    
    // Function to check if the statement is correct
    function checkStatement(statementId) {
        const resultContainer = document.getElementById(`${statementId}-result`);
        const feedbackContainer = document.getElementById(`${statementId}-feedback`);
        const resultParts = Array.from(resultContainer.children);
        
        // Get the current statement as an array of values
        const currentStatement = resultParts.map(part => part.dataset.value);
        
        // Get the expected statement length
        const expectedLength = correctStatements[statementId].length;
        
        // Check if the statement matches the correct answer
        const correct = arraysEqual(currentStatement, correctStatements[statementId]);
        
        // Check if this is the first attempt
        const attemptKey = `attempted_${statementId}`;
        const isFirstAttempt = !localStorage.getItem(attemptKey);
        
        // Mark as attempted on first evaluation (when we have the exact required number of parts)
        if (isFirstAttempt && resultParts.length === expectedLength) {
            localStorage.setItem(attemptKey, 'true');
        }
        
        // Only check for correctness if we have the exact required number of parts
        if (resultParts.length === expectedLength) {
            if (correct) {
                feedbackContainer.className = 'feedback-area correct';
                feedbackContainer.innerHTML = `
                    <h4><i class="fas fa-check-circle" style="color: #52c41a; margin-right: 10px;"></i> Correct!</h4>
                    <p>You've created a valid print statement: <code>${currentStatement.join(' ')}</code></p>
                `;
                
                // Award buckle only on first attempt
                const completedKey = `completed_${statementId}`;
                if (!localStorage.getItem(completedKey) && isFirstAttempt) {
                    // Increment score
                    updateGlobalBuckles(1);
                    localStorage.setItem(completedKey, 'true');
                    
                    // Show buckle animation
                    showBuckleAnimation();
                }
                
                // Show the next statement container after a delay
                setTimeout(() => {
                    const nextNumber = parseInt(statementId.replace('statement', '')) + 1;
                    const nextStatementId = `statement${nextNumber}-container`;
                    const nextStatementContainer = document.getElementById(nextStatementId);
                    
                    if (nextStatementContainer) {
                        nextStatementContainer.style.display = 'block';
                    }
                }, 1000);
            } else {
                feedbackContainer.className = 'feedback-area incorrect';
                feedbackContainer.innerHTML = `
                    <h4><i class="fas fa-times-circle" style="color: #ff4d4f; margin-right: 10px;"></i> Not Quite Right</h4>
                    <p>Try again! The correct statement would be: <code>${correctStatements[statementId].join(' ')}</code></p>
                `;
            }
        } else {
            // Clear feedback if not the exact number of parts needed
            feedbackContainer.className = 'feedback-area';
            feedbackContainer.innerHTML = '';
        }
    }
    
    // Show buckle animation
    function showBuckleAnimation() {
        const animation = document.getElementById('print-builder-buckle-animation');
        if (animation) {
            animation.style.display = 'block';
            
            // Play animation and then hide
            setTimeout(() => {
                animation.style.display = 'none';
            }, 2000);
        }
    }
    
    // Helper function to compare arrays
    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
}

/**
 * Function to show ASCII art output
 * Used in CHEW 3 section
 */
function showAsciiOutput(codeId, outputId) {
    const code = document.getElementById(codeId).value;
    let output = code;
    
    // Extract content between triple quotes
    const tripleQuoteRegex = /"""([\s\S]*?)"""/;
    const match = code.match(tripleQuoteRegex);
    
    if (match && match[1]) {
        output = match[1];
    }
    
    document.getElementById(outputId).textContent = output;
    document.getElementById(outputId).style.display = 'block';
}

/**
 * Function to check fixed code examples
 */
function checkFix(bugNumber) {
    const inputElement = document.getElementById(`fix${bugNumber}`);
    const feedbackElement = document.getElementById(`fix${bugNumber}-feedback`);
    
    let userFix = inputElement.value.trim();
    let correctFix = '';
    let feedbackText = '';
    
    switch(bugNumber) {
        case 1:
            correctFix = 'print("Hello world!")';
            break;
        case 2:
            correctFix = 'print("This is a test")';
            break;
        case 3:
            correctFix = 'print("Can you spot the error?")';
            break;
    }
    
    if (userFix === correctFix) {
        feedbackElement.innerHTML = 'Correct! You fixed the error.';
        feedbackElement.className = 'feedback correct';
    } else {
        feedbackElement.innerHTML = `Not quite right. The fixed code should be: <code>${correctFix}</code>`;
        feedbackElement.className = 'feedback incorrect';
    }
}

/**
 * Function to check error type identification
 */
function checkErrorType(questionNumber, answer) {
    const feedbackElement = document.getElementById(`error-answer${questionNumber}`);
    let correct = false;
    let explanation = '';
    
    switch(questionNumber) {
        case 1:
            correct = (answer === 'A');
            explanation = 'This error is missing a closing quotation mark after "Hello".';
            break;
        case 2:
            correct = (answer === 'B');
            explanation = 'This error is missing quotation marks around the text "My name is Alice".';
            break;
        case 3:
            correct = (answer === 'A');
            explanation = 'In Python, function names are case-sensitive. The print function should be lowercase.';
            break;
    }
    
    if (correct) {
        feedbackElement.innerHTML = `<i class="fas fa-check-circle" style="color: var(--good-color);"></i> Correct! ${explanation}`;
        feedbackElement.className = 'matching-feedback correct';
    } else {
        feedbackElement.innerHTML = `<i class="fas fa-times-circle" style="color: var(--bad-color);"></i> Incorrect. ${explanation}`;
        feedbackElement.className = 'matching-feedback incorrect';
    }
    
    feedbackElement.style.display = 'block';
}

// Make functions available globally
window.initializeQuiz = initializeQuiz;
window.initPrintStatementBuilder = initPrintStatementBuilder;
window.showAsciiOutput = showAsciiOutput;
window.checkFix = checkFix;
window.checkErrorType = checkErrorType;
window.nextQuestion = function() { 
    if (typeof nextQuestion === 'function') {
        nextQuestion();
    } else {
        console.error('nextQuestion function not available');
    }
};
window.prevQuestion = function() {
    if (typeof prevQuestion === 'function') {
        prevQuestion(); 
    } else {
        console.error('prevQuestion function not available');
    }
};