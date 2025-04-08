/**
 * Common page navigation and interaction functionality
 */

// Create a namespace for page navigation functions
const PageNavigation = (function() {
    // Private variable for conditional steps
    let currentConditionalStep = 1;
    const totalConditionalSteps = 3;

    // When the document is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Tab switching functionality
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', function() {
                const tab = this.getAttribute('data-tab');
                
                // Remove active class from all buttons and tabs
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Add active class to selected button and tab
                this.classList.add('active');
                document.getElementById(tab).classList.add('active');
            });
        });
    });

    // ASCII art editor output
    function showAsciiOutput(inputId, outputId) {
        const codeInput = document.getElementById(inputId);
        const outputElement = document.getElementById(outputId);
        
        try {
            // Extract the string content from the print statement
            let code = codeInput.value.trim();
            
            // Simple regex to extract the content inside the triple quotes
            let match = code.match(/print\s*\(\s*"""\s*([\s\S]*?)\s*"""\s*\)/);
            
            if (match && match[1]) {
                outputElement.textContent = match[1];
            } else {
                outputElement.textContent = "Error: Make sure your code uses print() with triple quotes!";
            }
            
            outputElement.style.display = 'block';
        } catch (e) {
            outputElement.textContent = "Error: " + e.message;
            outputElement.style.display = 'block';
        }
    }

    // Fix code challenge
    function checkFix(fixNum) {
        const inputElement = document.getElementById(`fix${fixNum}`);
        const feedbackElement = document.getElementById(`fix${fixNum}-feedback`);
        let solution = inputElement.value.trim();
        let isCorrect = false;
        
        // Check each fix solution
        if (fixNum === 1 && (solution.includes('print("Hello world!")') || solution.includes(`print('Hello world!')`))) {
            isCorrect = true;
        } else if (fixNum === 2 && (solution.includes('print("This is a test")') || solution.includes(`print('This is a test')`) || solution.includes('print("This is a test")'))) {
            isCorrect = true;
        } else if (fixNum === 3 && (solution.includes('print("Can you spot the error?")') || solution.includes(`print('Can you spot the error?')`))) {
            isCorrect = true;
        }
        
        // Show feedback
        if (isCorrect) {
            feedbackElement.innerHTML = '<i class="fas fa-check-circle" style="color: var(--good-color); margin-right: 10px;"></i> Correct! You fixed the bug!';
            feedbackElement.className = 'feedback correct';
        } else {
            feedbackElement.innerHTML = '<i class="fas fa-times-circle" style="color: var(--bad-color); margin-right: 10px;"></i> Not quite right. Try again!';
            feedbackElement.className = 'feedback incorrect';
        }
        
        feedbackElement.style.display = 'block';
    }

    // Check error type
    function checkErrorType(questionNum, answer) {
        const answerElement = document.getElementById(`error-answer${questionNum}`);
        let isCorrect = false;
        
        // Define correct answers
        if (questionNum === 1 && answer === 'A') isCorrect = true;  // Missing closing quotation mark
        if (questionNum === 2 && answer === 'B') isCorrect = true;  // Missing quotation marks
        if (questionNum === 3 && answer === 'A') isCorrect = true;  // Capitalization error
        
        if (isCorrect) {
            answerElement.innerHTML = '<i class="fas fa-check-circle" style="color: var(--good-color); margin-right: 10px;"></i> Correct!';
            answerElement.style.color = 'var(--good-color)';
        } else {
            answerElement.innerHTML = '<i class="fas fa-times-circle" style="color: var(--bad-color); margin-right: 10px;"></i> Try again!';
            answerElement.style.color = 'var(--bad-color)';
        }
        
        answerElement.style.display = 'block';
    }

    // Function to toggle answer visibility
    function toggleAnswer(id) {
        const element = document.getElementById(id);
        if (element.style.display === 'none') {
            element.style.display = 'block';
            
            // If it's a flowchart example, render it
            if (id === 'flowchart-example1') {
                setTimeout(function() {
                    document.getElementById('flowchart1').innerHTML = '';
                    renderFlowchart('flowchart1', ifElseFlowchartCode);
                }, 100);
            } else if (id === 'flowchart-example2') {
                setTimeout(function() {
                    document.getElementById('flowchart2').innerHTML = '';
                    renderFlowchart('flowchart2', ifElifElseFlowchartCode);
                }, 100);
            }
        } else {
            element.style.display = 'none';
        }
    }

    // Function to change score in the grading example
    function changeScore(amount) {
        const scoreElement = document.getElementById('test-score');
        const codeScoreElement = document.getElementById('code-score');
        const gradeOutputElement = document.getElementById('grade-output');
        
        let score = parseInt(scoreElement.innerText);
        score += amount;
        
        // Keep score between 0 and 100
        if (score < 0) score = 0;
        if (score > 100) score = 100;
        
        // Update displayed score
        scoreElement.innerText = score;
        codeScoreElement.innerText = score;
        
        // Update grade
        let result = '';
        if (score >= 60) {
            result = 'Pass';
            gradeOutputElement.style.color = '#52c41a';
        } else {
            result = 'Fail';
            gradeOutputElement.style.color = '#ff4d4f';
        }
        
        gradeOutputElement.innerText = result;
    }

    // Function to change temperature in the weather app example
    function changeTemperature(amount) {
        const tempElement = document.getElementById('weather-temp');
        const codeTempElement = document.getElementById('code-temp');
        const clothingOutputElement = document.getElementById('clothing-output');
        
        let temp = parseInt(tempElement.innerText);
        temp += amount;
        
        // Keep temperature in a reasonable range
        if (temp < -10) temp = -10;
        if (temp > 40) temp = 40;
        
        // Update displayed temperature
        tempElement.innerText = temp;
        codeTempElement.innerText = temp;
        
        // Update clothing recommendation
        let clothing = '';
        if (temp > 25) {
            clothing = 'T-shirt and shorts';
            clothingOutputElement.style.color = '#fa8c16';
        } else if (temp > 15) {
            clothing = 'Light jacket';
            clothingOutputElement.style.color = '#52c41a';
        } else if (temp > 5) {
            clothing = 'Warm coat';
            clothingOutputElement.style.color = '#1890ff';
        } else {
            clothing = 'Heavy winter coat and hat';
            clothingOutputElement.style.color = '#722ed1';
        }
        
        clothingOutputElement.innerText = clothing;
    }

    // Function for conditional next step navigation
    function nextConditionalStep() {
        if (currentConditionalStep < totalConditionalSteps) {
            // Hide current step
            document.getElementById(`conditional-step-${currentConditionalStep}`).classList.remove('active');
            
            // Show next step
            currentConditionalStep++;
            document.getElementById(`conditional-step-${currentConditionalStep}`).classList.add('active');
            
            // Update indicator and buttons
            document.getElementById('conditional-indicator').textContent = `Step ${currentConditionalStep} of ${totalConditionalSteps}`;
            document.getElementById('prev-conditional-btn').disabled = false;
            
            if (currentConditionalStep === totalConditionalSteps) {
                document.getElementById('next-conditional-btn').disabled = true;
            }
        }
    }

    function prevConditionalStep() {
        if (currentConditionalStep > 1) {
            // Hide current step
            document.getElementById(`conditional-step-${currentConditionalStep}`).classList.remove('active');
            
            // Show previous step
            currentConditionalStep--;
            document.getElementById(`conditional-step-${currentConditionalStep}`).classList.add('active');
            
            // Update indicator and buttons
            document.getElementById('conditional-indicator').textContent = `Step ${currentConditionalStep} of ${totalConditionalSteps}`;
            document.getElementById('next-conditional-btn').disabled = false;
            
            if (currentConditionalStep === 1) {
                document.getElementById('prev-conditional-btn').disabled = true;
            }
        }
    }

    // Initialize flowcharts with better styling
    function renderFlowchart(containerId, code) {
        try {
            const diagram = flowchart.parse(code);
            
            // Clear any existing content
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
                
                // Get container width to scale appropriately
                const containerWidth = container.offsetWidth || 600;
                const scale = containerWidth > 500 ? 1.0 : containerWidth / 500;
                
                diagram.drawSVG(containerId, {
                    'line-width': 2,
                    'line-length': 50,
                    'text-margin': 10,
                    'font-size': 14,
                    'font-color': '#333',
                    'line-color': '#002654',
                    'element-color': '#002654',
                    'fill': 'white',
                    'yes-text': 'True',
                    'no-text': 'False',
                    'arrow-end': 'block',
                    'scale': scale,
                    'flowstate': {
                        'past': { 'fill': '#CFCFCF', 'font-size': 12 },
                        'current': { 'fill': '#008489', 'font-color': 'white', 'font-weight': 'bold' },
                        'future': { 'fill': '#FFFF99' },
                        'request': { 'fill': '#999999' },
                        'invalid': { 'fill': '#FFCCCC' },
                        'approved': { 'fill': '#CCFFCC', 'font-color': '#006600', 'border-color': '#006600' },
                        'rejected': { 'fill': '#FFCCCC', 'font-color': '#CC0000', 'border-color': '#CC0000' }
                    },
                    'symbols': {
                        'start': {
                            'font-color': 'green',
                            'element-color': '#002654',
                            'fill': '#002654'
                        },
                        'end': {
                            'font-color': 'red',
                            'element-color': '#002654',
                            'fill': '#002654'
                        },
                        'condition': {
                            'element-color': '#002654',
                            'fill': 'white'
                        },
                        'operation': {
                            'element-color': '#002654',
                            'fill': 'white'
                        }
                    }
                });
                
                // Ensure SVG fits container height
                const svg = container.querySelector('svg');
                if (svg) {
                    svg.style.maxWidth = '100%';
                    svg.style.height = '100%';
                    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                }
            }
        } catch (error) {
            console.error('Error rendering flowchart:', error);
            document.getElementById(containerId).innerHTML = 
                '<div style="color:red; padding:20px;">Error rendering flowchart. Please check the console for details.</div>';
        }
    }

    // Flowchart code for if-else sections
    const ifElseFlowchartCode = `
st=>start: Start
cond=>condition: Condition
True or False?
if_block=>operation: Run 'if' code block
else_block=>operation: Run 'else' code block
end=>end: Continue program

st->cond
cond(yes, right)->if_block->end
cond(no, bottom)->else_block(right)->end
`;

    const ifElifElseFlowchartCode = `
st=>start: Start
init=>operation: grade = 75
cond1=>condition: grade >= 90?
cond2=>condition: grade >= 80?
cond3=>condition: grade >= 70?
op1=>operation: Print "A grade"
op2=>operation: Print "B grade"
op3=>operation: Print "C grade"
op4=>operation: Print "F grade"
end=>end: End

st->init->cond1
cond1(yes, right)->op1->end
cond1(no, bottom)->cond2
cond2(yes, right)->op2->end
cond2(no, bottom)->cond3
cond3(yes, right)->op3->end
cond3(no, bottom)->op4(right)->end
`;

    // Return public API
    return {
        showAsciiOutput: showAsciiOutput,
        checkFix: checkFix,
        checkErrorType: checkErrorType,
        toggleAnswer: toggleAnswer,
        changeScore: changeScore,
        changeTemperature: changeTemperature,
        nextConditionalStep: nextConditionalStep,
        prevConditionalStep: prevConditionalStep,
        renderFlowchart: renderFlowchart,
        ifElseFlowchartCode: ifElseFlowchartCode,
        ifElifElseFlowchartCode: ifElifElseFlowchartCode
    };
})();

// Expose the public API to the window
window.showAsciiOutput = PageNavigation.showAsciiOutput;
window.checkFix = PageNavigation.checkFix;
window.checkErrorType = PageNavigation.checkErrorType;
window.toggleAnswer = PageNavigation.toggleAnswer;
window.changeScore = PageNavigation.changeScore;
window.changeTemperature = PageNavigation.changeTemperature;
window.nextConditionalStep = PageNavigation.nextConditionalStep;
window.prevConditionalStep = PageNavigation.prevConditionalStep;
window.renderFlowchart = PageNavigation.renderFlowchart;
window.ifElseFlowchartCode = PageNavigation.ifElseFlowchartCode;
window.ifElifElseFlowchartCode = PageNavigation.ifElifElseFlowchartCode;