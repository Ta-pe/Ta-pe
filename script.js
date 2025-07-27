// ======================
// DOM Elements
// ======================
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');
const themeToggle = document.getElementById('themeToggle');
const simulateForm = document.getElementById('simulate-form');
const resultBox = document.getElementById('resultBox');
const plantTypeInput = document.getElementById('plantType');
const plantVarietyInput = document.getElementById('plantVariety');
const plantVarietyContainer = plantVarietyInput.parentElement;
const diseaseForm = document.getElementById('disease-form');
const plantImageInput = document.getElementById('plantImage');
const diseaseResultBox = document.getElementById('diseaseResultBox');
const plantTypeDiseaseInput = document.getElementById('plantTypeDisease');
const symptomsInput = document.getElementById('symptoms');
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotContainer = document.getElementById('chatbotContainer');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSend = document.getElementById('chatbotSend');

// ======================
// Constants
// ======================
const OPENROUTER_API_URL = '/api/openrouter';
const SIMULATION_COOLDOWN = 10000; // 10 seconds
const DISEASE_COOLDOWN = 15000; // 15 seconds
const CHATBOT_COOLDOWN = 2000; // 2 seconds
let lastSimulationTime = 0;
let lastDiseaseAnalysisTime = 0;
let lastChatbotTime = 0;

// ======================
// Core Functions
// ======================

function setActiveSection(sectionId) {
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        }
    });

    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `${sectionId}-section`) {
            section.classList.add('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    const icon = themeToggle.querySelector('i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

function formatSimulationResult(rawText) {
    const summary = rawText.split('\n\n')[0] || rawText.substring(0, 150) + '...';
    const details = rawText;
    
    return `
        <div class="result-summary">
            <h4>Quick Summary</h4>
            <p>${summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</p>
            <button class="btn btn-read-more">Read More <i class="fas fa-chevron-down"></i></button>
        </div>
        <div class="result-details" style="display:none;">
            ${rawText
                .replace(/## (.*?)\n/g, '<h4>$1</h4>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^- (.*?)(\n|$)/gm, '<li>$1</li>')
                .replace(/\n/g, '<br>')
                .replace(/! (.*?)(\n|$)/g, '<div class="warning"><i class="fas fa-exclamation-triangle"></i> $1</div>')}
            <button class="btn btn-read-less">Show Less <i class="fas fa-chevron-up"></i></button>
        </div>
    `;
}

function formatDiseaseResult(rawText) {
    let formattedText = rawText
        .replace(/\*\*Plant Identification\*\*: (.*?)(\n|$)/g, '<h4>Plant Identified: $1</h4>')
        .replace(/\*\*Diagnosis\*\*: (.*?) \(Confidence: (.*?)\)/g, '<h4>Diagnosis: $1 <span class="disease-confidence">$2 Confidence</span></h4>')
        .replace(/\*\*Symptoms\*\*:(\n|$)/g, '<h4>Symptoms Observed:</h4><ul>')
        .replace(/\*\*Treatment\*\*:(\n|$)/g, '</ul><h4>Recommended Treatment:</h4><ul>')
        .replace(/\*\*Prevention\*\*:(\n|$)/g, '</ul><h4>Prevention Measures:</h4><ul>')
        .replace(/\*\*Severity\*\*: (.*?)(\n|$)/g, '</ul><h4>Severity: <span class="severity-$1">$1</span></h4>')
        .replace(/\*\*Additional Notes\*\*: (.*?)(\n|$)/g, '<div class="notes"><h4>Additional Notes:</h4><p>$1</p></div>')
        .replace(/^- (.*?)(\n|$)/gm, '<li>$1</li>')
        .replace(/\n/g, '<br>');

    formattedText += '</ul>';

    return `
        <div class="disease-result">
            ${formattedText}
            <button class="btn" onclick="window.print()"><i class="fas fa-print"></i> Print Report</button>
        </div>
    `;
}

function saveSimulation(data) {
    const history = JSON.parse(localStorage.getItem('simulationHistory') || '[]');
    history.unshift({
        timestamp: new Date().toISOString(),
        ...data
    });
    localStorage.setItem('simulationHistory', JSON.stringify(history.slice(0, 5)));
}

function validateInputs(formData) {
    if (!/^\d+-\d+$/.test(formData.temperature)) {
        return 'Please enter temperature as "min-max" (e.g., 18-24)';
    }
    if (!/^\d+%?$/.test(formData.humidity)) {
        return 'Enter humidity as number (e.g., 60 or 60%)';
    }
    if (!formData.plantType.trim()) {
        return 'Plant type is required';
    }
    return null;
}

function debounce(func, timeout = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

// ======================
// Plant Variety Functions
// ======================

async function fetchPlantVarieties(plantName) {
    if (!plantName || plantName.length < 3) {
        return ["Standard"];
    }

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "anthropic/claude-3-sonnet",
                messages: [
                    {
                        role: "system",
                        content: `You are a botanical database API. Return ONLY a JSON array of 3-5 common varieties for the requested plant. Example: ["Variety A", "Variety B"]. If the plant has no common varieties or is unknown, return ["Standard"]. Always return valid JSON.`
                    },
                    {
                        role: "user",
                        content: `List varieties for: ${plantName}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 100
            })
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) return ["Standard"];
        
        const cleanedContent = content.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanedContent) || ["Standard"];
    } catch (error) {
        console.error('Variety fetch error:', error);
        return ["Standard"];
    }
}

function createVarietyDropdown(varieties) {
    const existingDropdown = plantVarietyContainer.querySelector('select');
    if (existingDropdown) existingDropdown.remove();

    plantVarietyInput.style.display = 'none';

    const dropdown = document.createElement('select');
    dropdown.id = 'plantVarietyDropdown';
    dropdown.innerHTML = `
        <option value="" selected disabled>Select variety</option>
        ${varieties.map(v => `<option value="${v}">${v}</option>`).join('')}
        <option value="Other">Other (specify)</option>
    `;

    plantVarietyContainer.appendChild(dropdown);

    dropdown.addEventListener('change', (e) => {
        if (e.target.value === 'Other') {
            dropdown.remove();
            plantVarietyInput.style.display = 'block';
            plantVarietyInput.value = '';
            plantVarietyInput.focus();
        }
    });
}

// ======================
// Disease Analysis Functions
// ======================

async function analyzePlantDisease(imageFile, plantType, symptoms) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const base64String = event.target.result;
                const result = await analyzeWithQwenVL(base64String, plantType, symptoms);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(imageFile);
    });
}

async function analyzeWithQwenVL(imageBase64, plantType, symptoms) {
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "qwen/qwen-vl-plus",
                messages: [
                    {
                        role: "system",
                        content: `You are a plant pathologist AI. Analyze the plant image and provide diagnosis.`
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `Analyze this ${plantType || 'plant'} image. ${symptoms ? 'Symptoms: ' + symptoms : ''}` },
                            { type: "image_url", image_url: imageBase64 }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No analysis results returned";
    } catch (error) {
        throw new Error(`Analysis failed: ${error.message}`);
    }
}

// ======================
// Plant Simulation Function
// ======================

async function runPlantSimulation(formData) {
    resultBox.innerHTML = `
        <div class="simulation-loading">
            <i class="fas fa-seedling pulse"></i>
            <p>Simulating ${formData.plantType}'s growth patterns...</p>
            <small>Analyzing ${formData.soilType} soil with ${formData.sunlight} light</small>
        </div>
    `;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a plant growth simulation AI. Provide detailed, scientifically accurate predictions."
                    },
                    {
                        role: "user",
                        content: `Simulate growth for: ${JSON.stringify(formData)}`
                    }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        const simulationResult = data.choices?.[0]?.message?.content;
        
        if (!simulationResult) throw new Error('No simulation results returned');
        
        resultBox.innerHTML = `
            <div class="simulation-result">
                <div class="result-header">
                    <h3><i class="fas fa-chart-line"></i> ${formData.plantType} ${formData.plantVariety || 'Standard'} Growth Simulation</h3>
                    <small>Generated at ${new Date().toLocaleTimeString()}</small>
                </div>
                ${formatSimulationResult(simulationResult)}
                <button class="btn" onclick="window.print()"><i class="fas fa-print"></i> Print Report</button>
            </div>
        `;

        saveSimulation({
            plant: `${formData.plantType} ${formData.plantVariety || 'Standard'}`,
            conditions: `${formData.temperature}°C, ${formData.humidity}% humidity`,
            summary: simulationResult.substring(0, 150) + '...'
        });
    } catch (error) {
        console.error('Simulation error:', error);
        resultBox.innerHTML = `
            <div class="simulation-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Simulation Failed</p>
                <small>${error.message}</small>
                <button class="btn" onclick="location.reload()"><i class="fas fa-sync-alt"></i> Try Again</button>
            </div>
        `;
    }
}

// ======================
// Chatbot Functions
// ======================

async function sendChatbotMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    const now = Date.now();
    if (now - lastChatbotTime < CHATBOT_COOLDOWN) {
        addMessage(`Please wait ${Math.ceil((CHATBOT_COOLDOWN - (now - lastChatbotTime)) / 1000)} seconds before sending another message.`, 'bot');
        return;
    }
    lastChatbotTime = now;

    addMessage(message, 'user');
    chatbotInput.value = '';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `<span></span><span></span><span></span>`;
    chatbotMessages.appendChild(typingIndicator);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "anthropic/claude-3-sonnet",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful plant care assistant. Provide concise, accurate advice about plant care."
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.5,
                max_tokens: 300
            })
        });

        const data = await response.json();
        const botMessage = data.choices?.[0]?.message?.content || "I couldn't process that request.";

        typingIndicator.remove();
        addMessage(botMessage, 'bot');

        // Save to chat history
        const conversation = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        conversation.push({ timestamp: new Date().toISOString(), user: message, bot: botMessage });
        localStorage.setItem('chatHistory', JSON.stringify(conversation.slice(-10)));
    } catch (error) {
        console.error('Chatbot error:', error);
        typingIndicator.remove();
        addMessage("Sorry, I'm having trouble responding right now. Please try again later.", 'bot');
    }
}

function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${sender}`;
    messageDiv.innerHTML = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*?)(\n|$)/gm, '<li>$1</li>')
        .replace(/\n/g, '<br>');
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// ======================
// Event Listeners
// ======================

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Load chat history
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    chatHistory.forEach(msg => {
        addMessage(msg.user, 'user');
        addMessage(msg.bot, 'bot');
    });

    // Set initial section
    setActiveSection('home');
});

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveSection(link.dataset.section);
    });
});

// Theme toggle
themeToggle.addEventListener('click', toggleTheme);

// Plant variety dropdown
plantTypeInput.addEventListener('input', debounce(async (e) => {
    const plantName = e.target.value.trim();
    if (plantName.length < 3) return;

    const loadingSpan = document.createElement('span');
    loadingSpan.className = 'loading-text';
    loadingSpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading varieties...';
    plantVarietyContainer.appendChild(loadingSpan);

    try {
        const varieties = await fetchPlantVarieties(plantName);
        createVarietyDropdown(varieties);
    } catch (error) {
        console.error('Failed to load varieties:', error);
    } finally {
        loadingSpan.remove();
    }
}));

// Forms
simulateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastSimulationTime < SIMULATION_COOLDOWN) {
        resultBox.innerHTML = `<div class="simulation-warning">
            <i class="fas fa-clock"></i>
            <p>Please wait ${Math.ceil((SIMULATION_COOLDOWN - (now - lastSimulationTime)) / 1000)} seconds</p>
        </div>`;
        return;
    }
    lastSimulationTime = now;

    const formData = {
        plantType: plantTypeInput.value.trim(),
        plantVariety: document.getElementById('plantVarietyDropdown')?.value || plantVarietyInput.value.trim(),
        placement: document.getElementById('placement').value,
        soilType: document.getElementById('soilType').value,
        watering: document.getElementById('watering').value.trim(),
        sunlight: document.getElementById('sunlight').value.trim(),
        temperature: document.getElementById('temperature').value.trim(),
        humidity: document.getElementById('humidity').value.trim(),
        growthStage: document.getElementById('growthStage').value || 'not specified',
        notes: document.getElementById('notes').value.trim() || 'None'
    };

    const error = validateInputs(formData);
    if (error) {
        resultBox.innerHTML = `<div class="simulation-error"><i class="fas fa-exclamation-triangle"></i><p>${error}</p></div>`;
        return;
    }

    await runPlantSimulation(formData);
});

diseaseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastDiseaseAnalysisTime < DISEASE_COOLDOWN) {
        diseaseResultBox.innerHTML = `<div class="simulation-warning">
            <i class="fas fa-clock"></i>
            <p>Please wait ${Math.ceil((DISEASE_COOLDOWN - (now - lastDiseaseAnalysisTime)) / 1000)} seconds</p>
        </div>`;
        return;
    }
    lastDiseaseAnalysisTime = now;

    const imageFile = plantImageInput.files[0];
    if (!imageFile) {
        diseaseResultBox.innerHTML = `<div class="simulation-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Please select an image</p>
        </div>`;
        return;
    }

    diseaseResultBox.innerHTML = `
        <div class="simulation-loading">
            <i class="fas fa-microscope pulse"></i>
            <p>Analyzing plant health...</p>
        </div>
    `;

    try {
        const result = await analyzePlantDisease(
            imageFile,
            plantTypeDiseaseInput.value.trim(),
            symptomsInput.value.trim()
        );
        diseaseResultBox.innerHTML = `
            <div class="simulation-result">
                <div class="result-header">
                    <h3><i class="fas fa-diagnoses"></i> Plant Health Analysis</h3>
                    <small>Analyzed at ${new Date().toLocaleTimeString()}</small>
                </div>
                ${formatDiseaseResult(result)}
            </div>
        `;
    } catch (error) {
        diseaseResultBox.innerHTML = `
            <div class="simulation-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Analysis Failed</p>
                <small>${error.message}</small>
            </div>
        `;
    }
});

// Chatbot
chatbotToggle.addEventListener('click', () => {
    chatbotContainer.classList.toggle('active');
    if (chatbotContainer.classList.contains('active')) {
        chatbotInput.focus();
    }
});

chatbotClose.addEventListener('click', () => {
    chatbotContainer.classList.remove('active');
});

chatbotSend.addEventListener('click', sendChatbotMessage);
chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatbotMessage();
});

// Read more/less buttons
document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-read-more')) {
        const btn = e.target.closest('.btn-read-more');
        btn.parentElement.nextElementSibling.style.display = 'block';
        btn.parentElement.style.display = 'none';
    }
    if (e.target.closest('.btn-read-less')) {
        const btn = e.target.closest('.btn-read-less');
        btn.parentElement.previousElementSibling.style.display = 'block';
        btn.parentElement.style.display = 'none';
    }
});
