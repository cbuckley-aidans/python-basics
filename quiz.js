/**
 * Improved Duolingo-style Quiz Implementation
 * Integrated with the unified BucklesSystem
 */

function initializeQuiz(quizQuestions, pageIdentifier = 'default') {
    const quizContainer = document.getElementById('quiz-container');
    let currentQuestionIndex = 0;
    let attemptedQuestions = new Set();
    let mainContainer = null;
    
    function loadSavedProgress() {
        // Load previously completed questions for this page
        for (let i = 0; i < quizQuestions.length; i++) {
            if (BucklesSystem.isActivityCompleted(pageIdentifier, `question_${i}`)) {
                attemptedQuestions.add(i);
            }
        }
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
                    <span id="buckle-score">${BucklesSystem.getBuckles()}</span>
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
        const isFirstAttempt = !BucklesSystem.isActivityAttempted(pageIdentifier, `question_${currentQuestionIndex}`);
        
        // Mark as attempted immediately on first try (regardless of correctness)
        if (isFirstAttempt) {
            BucklesSystem.markActivityAttempted(pageIdentifier, `question_${currentQuestionIndex}`);
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
                // Update local tracking
                attemptedQuestions.add(currentQuestionIndex);
                
                // Award 1 buckle for this achievement
                BucklesSystem.awardBuckles(pageIdentifier, `question_${currentQuestionIndex}`);
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
 */
function initPrintStatementBuilder(pageIdentifier = 'intro') {
    // Define the correct answers for each statement
    const correctStatements = {
        "statement1": ["print", "(", '"Hello, Python!"', ")"],
        "statement2": ["print", "(", "100", ")"],
        "statement3": ["print", "(", '"Name:"', ",", '"Alice"', ")"]
    };
    
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
        const isFirstAttempt = !BucklesSystem.isActivityAttempted(pageIdentifier, `print_statement_${statementId}`);
        
        // Mark as attempted on first evaluation (when we have the exact required number of parts)
        if (isFirstAttempt && resultParts.length === expectedLength) {
            BucklesSystem.markActivityAttempted(pageIdentifier, `print_statement_${statementId}`);
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
                if (!BucklesSystem.isActivityCompleted(pageIdentifier, `print_statement_${statementId}`) && isFirstAttempt) {
                    BucklesSystem.awardBuckles(pageIdentifier, `print_statement_${statementId}`);
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
    const pageIdentifier = 'debug-practice';
    const activityId = `fix_code_${bugNumber}`;
    
    let userFix = inputElement.value.trim();
    let correctFix = '';
    
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
    
    // Check if this is the first attempt
    const isFirstAttempt = !BucklesSystem.isActivityAttempted(pageIdentifier, activityId);
    
    // Mark as attempted
    if (isFirstAttempt) {
        BucklesSystem.markActivityAttempted(pageIdentifier, activityId);
    }
    
    if (userFix === correctFix) {
        feedbackElement.innerHTML = 'Correct! You fixed the error.';
        feedbackElement.className = 'feedback correct';
        
        // Award buckle on first correct attempt
        if (isFirstAttempt && !BucklesSystem.isActivityCompleted(pageIdentifier, activityId)) {
            BucklesSystem.awardBuckles(pageIdentifier, activityId);
        }
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
    const pageIdentifier = 'error-identification';
    const activityId = `error_type_${questionNumber}`;
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
    
    // Check if this is the first attempt
    const isFirstAttempt = !BucklesSystem.isActivityAttempted(pageIdentifier, activityId);
    
    // Mark as attempted
    if (isFirstAttempt) {
        BucklesSystem.markActivityAttempted(pageIdentifier, activityId);
    }
    
    if (correct) {
        feedbackElement.innerHTML = `<i class="fas fa-check-circle" style="color: var(--good-color);"></i> Correct! ${explanation}`;
        feedbackElement.className = 'matching-feedback correct';
        
        // Award buckle on first correct attempt
        if (isFirstAttempt && !BucklesSystem.isActivityCompleted(pageIdentifier, activityId)) {
            BucklesSystem.awardBuckles(pageIdentifier, activityId);
        }
    } else {
        feedbackElement.innerHTML = `<i class="fas fa-times-circle" style="color: var(--bad-color);"></i> Incorrect. ${explanation}`;
        feedbackElement.className = 'matching-feedback incorrect';
    }
    
    feedbackElement.style.display = 'block';
}

// Check condition answers (used in conditional-statements.html)
function checkConditionAnswer(questionNumber, answer, sectionIdentifier) {
    const answerElement = document.getElementById(`condition-answer${questionNumber}`);
    const activityId = `condition_question_${questionNumber}`;
    let isCorrect = false;
    let feedback = '';

    // Set correct answers for each question
    const correctAnswers = {
        1: true,  // 5 + 5 == 10 is true
        2: false, // 7 < 3 is false
        3: true,  // 10 <= 10 is true
        4: false, // "Hello" == "hello" is false
        5: true,  // 20 != 15 is true
        6: false  // 5 * 2 >= 12 is false (10 >= 12)
    };

    // Check if this is the first attempt
    const isFirstAttempt = !BucklesSystem.isActivityAttempted(sectionIdentifier, activityId);
    
    // Mark as attempted
    if (isFirstAttempt) {
        BucklesSystem.markActivityAttempted(sectionIdentifier, activityId);
    }

    // Check if the answer is correct
    isCorrect = (answer === correctAnswers[questionNumber]);

    // Prepare feedback message
    if (isCorrect) {
        feedback = `<span style="color: #52c41a;"><i class="fas fa-check-circle"></i> Correct!</span> That's right.`;
        
        // Award a buckle using the unified buckles system (only on first attempt)
        if (isFirstAttempt && !BucklesSystem.isActivityCompleted(sectionIdentifier, activityId)) {
            BucklesSystem.awardBuckles(sectionIdentifier, activityId);
        }
    } else {
        feedback = `<span style="color: #ff4d4f;"><i class="fas fa-times-circle"></i> Incorrect.</span> Try again.`;
    }

    // Display feedback
    answerElement.innerHTML = feedback;
    answerElement.style.display = 'block';

    // Disable buttons to prevent multiple submissions if correct
    if (isCorrect) {
        const trueBtn = document.querySelectorAll(`.true-btn`)[questionNumber - 1];
        const falseBtn = document.querySelectorAll(`.false-btn`)[questionNumber - 1];
        
        if (trueBtn && falseBtn) {
            trueBtn.disabled = true;
            falseBtn.disabled = true;
        }
    }
}

// Multiple choice question checker (used in multiple pages)
function checkMultipleChoice(questionNumber, answer, sectionIdentifier) {
    const feedbackElement = document.getElementById(`feedback-q${questionNumber}`);
    const activityId = `quiz_question_${questionNumber}`;
    let correctAnswer = '';
    let isCorrect = false;
    
    // Set correct answers based on which section we're in
    if (sectionIdentifier === 'conditionals') {
        switch(questionNumber) {
            case 1: correctAnswer = 'D'; break; // No need for umbrella, not too hot
            case 2: correctAnswer = 'B'; break; // 12 - 2 = 10
            case 3: correctAnswer = 'B'; break; // Score 85 is >= 80 so "Very good!"
        }
    } else {
        // Default correct answers or other section-specific answers
        switch(questionNumber) {
            case 1: correctAnswer = 'C'; break;
            case 2: correctAnswer = 'A'; break;
            case 3: correctAnswer = 'B'; break;
        }
    }
    
    // Check if this is the first attempt
    const isFirstAttempt = !BucklesSystem.isActivityAttempted(sectionIdentifier, activityId);
    
    // Mark as attempted
    if (isFirstAttempt) {
        BucklesSystem.markActivityAttempted(sectionIdentifier, activityId);
    }
    
    // Check if answer is correct
    isCorrect = (answer === correctAnswer);
    
    // Style all choices to show the correct answer
    document.querySelectorAll(`.choice`).forEach(choice => {
        const choiceLetter = choice.querySelector('.choice-letter').textContent;
        if (choiceLetter === correctAnswer) {
            choice.classList.add('correct-choice');
        } else {
            choice.classList.remove('correct-choice');
        }
        choice.classList.remove('selected-choice');
    });
    
    // Style selected choice
    let selectedChoice = null;
    document.querySelectorAll('.choice').forEach(choice => {
        const letter = choice.querySelector('.choice-letter');
        if (letter && letter.textContent === answer) {
            selectedChoice = choice;
        }
    });
    if (selectedChoice) {
        selectedChoice.classList.add('selected-choice');
    }
    
    // Prepare feedback
    let feedback = '';
    if (isCorrect) {
        feedback = `<div class="feedback-correct"><i class="fas fa-check-circle"></i> Correct! Well done.</div>`;
        
        // Award buckle if first attempt
        if (isFirstAttempt && !BucklesSystem.isActivityCompleted(sectionIdentifier, activityId)) {
            // Award buckle with the unified system (typically 2 buckles for quiz questions)
            BucklesSystem.awardBuckles(sectionIdentifier, activityId, 2);
        }
    } else {
        feedback = `<div class="feedback-incorrect"><i class="fas fa-times-circle"></i> Incorrect. The correct answer is ${correctAnswer}.</div>`;
    }
    
    // Show feedback
    feedbackElement.innerHTML = feedback;
    feedbackElement.style.display = 'block';
    
    // Disable further selections if correct
    if (isCorrect) {
        document.querySelectorAll(`.choice`).forEach(choice => {
            choice.style.pointerEvents = 'none';
        });
    }
}

// Make functions available globally
window.initializeQuiz = initializeQuiz;
window.initPrintStatementBuilder = initPrintStatementBuilder;
window.showAsciiOutput = showAsciiOutput;
window.checkFix = checkFix;
window.checkErrorType = checkErrorType;
window.checkConditionAnswer = checkConditionAnswer;
window.checkMultipleChoice = checkMultipleChoice;
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