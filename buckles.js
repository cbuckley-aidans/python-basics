/**
 * Buckles Reward System
 * A unified system for tracking, awarding, and displaying buckle rewards
 * across the Python Basics educational web project.
 */

// Create a namespace to avoid global variable conflicts
const BucklesSystem = (function() {
    // Private constants
    const STORAGE_KEY = 'pythonBuckles';
    const COMPLETED_PREFIX = 'completedActivity_';
    const ATTEMPTED_PREFIX = 'attemptedActivity_';
    
    // Private variables
    let buckleCounters = [];
    let isAnimating = false;
    
    /**
     * Initialize the buckles system
     */
    function init() {
        // Find all buckle counters on the page
        buckleCounters = document.querySelectorAll('[id$="buckle-score"]');
        
        // Update all counters with current value
        updateCounterDisplays();
        
        // Create buckle animation container if it doesn't exist
        createAnimationContainer();
    }
    
    /**
     * Get the current buckle count from localStorage
     * @returns {number} The current buckle count
     */
    function getBuckles() {
        let count = localStorage.getItem(STORAGE_KEY) || '0';
        return parseInt(count);
    }
    
    /**
     * Update the buckle count by a specific amount
     * @param {number} amount - The amount to change (positive or negative)
     * @returns {number} The new total buckle count
     */
    function updateBuckles(amount) {
        let total = getBuckles();
        total += amount;
        
        // Don't allow negative buckles
        if (total < 0) {
            total = 0;
        }
        
        localStorage.setItem(STORAGE_KEY, total.toString());
        
        // Update all buckle displays
        updateCounterDisplays();
        
        return total;
    }
    
    /**
     * Update all buckle counter displays on the page
     */
    function updateCounterDisplays() {
        const total = getBuckles();
        
        // Update all buckle counters
        buckleCounters.forEach(counter => {
            // Only update if the displayed value is different
            if (counter.textContent !== total.toString()) {
                counter.textContent = total.toString();
                
                // Add pulse animation class
                counter.classList.add('buckle-pulse');
                
                // Remove pulse class after animation completes
                setTimeout(() => {
                    counter.classList.remove('buckle-pulse');
                }, 1000);
            }
        });
    }
    
    /**
     * Check if an activity has been completed
     * @param {string} pageId - Identifier for the current page
     * @param {string} activityId - Identifier for the specific activity
     * @returns {boolean} Whether the activity has been completed
     */
    function isActivityCompleted(pageId, activityId) {
        const key = `${COMPLETED_PREFIX}${pageId}_${activityId}`;
        return localStorage.getItem(key) === 'true';
    }
    
    /**
     * Mark an activity as completed
     * @param {string} pageId - Identifier for the current page
     * @param {string} activityId - Identifier for the specific activity
     */
    function markActivityCompleted(pageId, activityId) {
        const key = `${COMPLETED_PREFIX}${pageId}_${activityId}`;
        localStorage.setItem(key, 'true');
    }
    
    /**
     * Check if an activity has been attempted
     * @param {string} pageId - Identifier for the current page
     * @param {string} activityId - Identifier for the specific activity
     * @returns {boolean} Whether the activity has been attempted
     */
    function isActivityAttempted(pageId, activityId) {
        const key = `${ATTEMPTED_PREFIX}${pageId}_${activityId}`;
        return localStorage.getItem(key) === 'true';
    }
    
    /**
     * Mark an activity as attempted (for first attempt tracking)
     * @param {string} pageId - Identifier for the current page
     * @param {string} activityId - Identifier for the specific activity
     */
    function markActivityAttempted(pageId, activityId) {
        const key = `${ATTEMPTED_PREFIX}${pageId}_${activityId}`;
        localStorage.setItem(key, 'true');
    }
    
    /**
     * Award buckles for completing an activity (only if first attempt)
     * @param {string} pageId - Identifier for the current page
     * @param {string} activityId - Identifier for the specific activity
     * @param {number} buckleAmount - Number of buckles to award (default: 1)
     * @returns {boolean} Whether buckles were awarded
     */
    function awardBuckles(pageId, activityId, buckleAmount = 1) {
        // Validate parameters
        if (!pageId || !activityId) {
            console.error('Invalid parameters for awardBuckles. pageId and activityId are required.');
            return false;
        }
        
        // Check if this activity has already been completed
        if (isActivityCompleted(pageId, activityId)) {
            return false; // No buckles awarded for repeat completions
        }
        
        // Mark activity as completed
        markActivityCompleted(pageId, activityId);
        
        // Award the buckles
        updateBuckles(buckleAmount);
        
        // Show animation
        showBuckleAnimation();
        
        return true; // Buckles were awarded
    }
    
    /**
     * Create the animation container if it doesn't exist
     */
    function createAnimationContainer() {
        if (!document.getElementById('buckle-animation')) {
            const animDiv = document.createElement('div');
            animDiv.className = 'buckle-animation';
            animDiv.id = 'buckle-animation';
            animDiv.style.display = 'none';
            animDiv.innerHTML = `
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='16' fill='%23FFD700' stroke='%23DAA520' stroke-width='2'/%3E%3Ctext x='18' y='24' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='%23000'%3EB%3C/text%3E%3C/svg%3E" 
                     alt="Buckle" id="buckle-img">
                <div class="shine"></div>
            `;
            document.body.appendChild(animDiv);
            
            // Add CSS for animation if not already present
            if (!document.getElementById('buckles-css')) {
                const styleElement = document.createElement('style');
                styleElement.id = 'buckles-css';
                styleElement.textContent = `
                    .buckle-animation {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        z-index: 1000;
                        pointer-events: none;
                    }
                    
                    #buckle-img {
                        width: 100px;
                        height: 100px;
                        filter: drop-shadow(0 0 10px gold);
                        animation: buckleGrow 1.5s ease-out;
                    }
                    
                    .shine {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
                        opacity: 0;
                        animation: shineEffect 1.5s ease-out;
                    }
                    
                    @keyframes buckleGrow {
                        0% { transform: scale(0); opacity: 0; }
                        50% { transform: scale(1.2); opacity: 1; }
                        70% { transform: scale(0.9); }
                        100% { transform: scale(1); }
                    }
                    
                    @keyframes shineEffect {
                        0% { opacity: 0; }
                        30% { opacity: 0; }
                        50% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    
                    .buckle-counter {
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background-color: rgba(0,0,0,0.05);
                        padding: 5px 10px;
                        border-radius: 20px;
                    }
                    
                    .buckle-pulse {
                        animation: buckle-pulse 1s cubic-bezier(0.4, 0, 0.6, 1);
                    }
                    
                    @keyframes buckle-pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.2); }
                    }
                `;
                document.head.appendChild(styleElement);
            }
        }
    }
    
    /**
     * Show the buckle animation
     */
    function showBuckleAnimation() {
        const animation = document.getElementById('buckle-animation');
        
        if (animation && !isAnimating) {
            isAnimating = true;
            animation.style.display = 'block';
            
            // Play animation and then hide
            setTimeout(() => {
                animation.style.display = 'none';
                isAnimating = false;
            }, 2000);
        }
    }
    
    /**
     * Create a standard buckle counter element
     * @param {string} containerId - ID of the container to add the counter to
     * @param {string} position - CSS position style (e.g., 'absolute', 'relative')
     * @returns {HTMLElement} The created counter element
     */
    function createBuckleCounter(containerId, position = 'relative') {
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error(`Container with ID ${containerId} not found`);
            return null;
        }
        
        const counterDiv = document.createElement('div');
        counterDiv.className = 'buckle-counter';
        counterDiv.style.position = position;
        
        if (position === 'absolute') {
            counterDiv.style.top = '20px';
            counterDiv.style.right = '20px';
        }
        
        counterDiv.innerHTML = `
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36' width='36' height='36'%3E%3Ccircle cx='18' cy='18' r='16' fill='%23FFD700' stroke='%23DAA520' stroke-width='2'/%3E%3Ctext x='18' y='24' font-family='Arial' font-size='20' font-weight='bold' text-anchor='middle' fill='%23000'%3EB%3C/text%3E%3C/svg%3E" 
                 alt="Buckle" style="width: 30px; height: 30px; vertical-align: middle;">
            <span id="buckle-score">${getBuckles()}</span>
        `;
        
        container.appendChild(counterDiv);
        
        // Update the buckleCounters array by finding all counters again
        buckleCounters = document.querySelectorAll('[id$="buckle-score"]');
        
        return counterDiv;
    }
    
    /**
     * Reset buckle scores and completed activities
     * For testing purposes
     */
    function resetAll() {
        localStorage.setItem(STORAGE_KEY, '0');
        
        // Clear all completed and attempted activities
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(COMPLETED_PREFIX) || key.startsWith(ATTEMPTED_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
        
        // Update all counters
        updateCounterDisplays();
        
        console.log('Buckle system reset');
    }
    
    /**
     * Get all completed activities
     * Useful for debugging and progress tracking
     * @returns {Object} Object with pageId as keys and arrays of completed activityIds as values
     */
    function getAllCompletedActivities() {
        const completed = {};
        
        // Scan localStorage for completion records
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(COMPLETED_PREFIX) && localStorage.getItem(key) === 'true') {
                // Extract the pageId and activityId from the key
                const activityInfo = key.substring(COMPLETED_PREFIX.length).split('_');
                const pageId = activityInfo[0];
                const activityId = activityInfo.slice(1).join('_'); // In case activityId contains underscores
                
                // Add to the completed object
                if (!completed[pageId]) {
                    completed[pageId] = [];
                }
                completed[pageId].push(activityId);
            }
        });
        
        return completed;
    }
    
    // Public API
    return {
        init: init,
        getBuckles: getBuckles,
        updateBuckles: updateBuckles,
        updateCounterDisplays: updateCounterDisplays,
        awardBuckles: awardBuckles,
        isActivityCompleted: isActivityCompleted,
        markActivityCompleted: markActivityCompleted,
        isActivityAttempted: isActivityAttempted,
        markActivityAttempted: markActivityAttempted,
        createBuckleCounter: createBuckleCounter,
        showBuckleAnimation: showBuckleAnimation,
        resetAll: resetAll,
        getAllCompletedActivities: getAllCompletedActivities
    };
})();

// Initialize the Buckles System when the page loads
document.addEventListener('DOMContentLoaded', function() {
    BucklesSystem.init();
});

// Make the API globally available
window.BucklesSystem = BucklesSystem;