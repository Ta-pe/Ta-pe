# TAPE - Technology Assisted Plant Emulator
Grades 9 
Names-Rajbin Karki, Abhigya Bhandari , Adiksh Silwal

TAPE is an AI-powered web application that helps users simulate plant growth and detect plant diseases. It provides personalized recommendations for plant care based on environmental factors and visual symptoms.

## Features

- **Plant Growth Simulation**: Predicts growth patterns and survival probabilities based on:
  - Plant type and variety
  - Environmental conditions (temperature, humidity)
  - Care routines (watering, sunlight)
  - Soil type and placement

- **Disease Detection**: Analyzes uploaded plant images to:
  - Identify potential diseases
  - Provide treatment recommendations
  - Suggest prevention measures
  - Assess disease severity

- **Interactive Chatbot**: "Fellow Farmer" assistant that answers plant care questions

- **Visual Analytics**: 
  - Growth stage probability charts
  - Projected timeline visualizations
  - Risk assessment indicators

## Technologies Used

- **Frontend**:
  - HTML5, CSS3, JavaScript
  - Font Awesome for icons
  - Google Fonts (Inter, Fredoka, Montserrat, Roboto)

- **APIs**:
  - OpenRouter API for AI completions (using Claude-3-Sonnet and Qwen-VL models)
  - Local storage for saving simulation history and chat conversations

## Installation

No installation required! TAPE runs directly in modern web browsers.

To run locally:
1. Clone this repository
2. Open `TAPE.html` in your browser

## Usage

1. **Plant Simulation**:
   - Navigate to the "Simulate" section
   - Fill in your plant's details and environmental conditions
   - Click "Run Simulation" to get growth predictions

2. **Disease Detection**:
   - Navigate to the "Disease Detection" section
   - Upload an image of your plant
   - Provide any observed symptoms
   - Click "Analyze Plant Health" for diagnosis

3. **Chatbot**:
   - Click the robot icon in the bottom right
   - Ask any plant-related questions

## Project Structure

- `TAPE.html`: Main HTML file with application structure
- `style.css`: All styling for the application
- `script.js`: Core functionality including:
  - Navigation and theme toggling
  - Form handling and API calls
  - Data visualization
  - Chatbot interaction

## API Keys

Note: The application includes test API keys for OpenRouter. For production use, you should:
1. Replace the keys in `script.js` (TEXT_API_KEY and IMAGE_API_KEY)
2. Consider implementing proper key management

## Limitations

- Simulation accuracy depends on input data quality
- Disease detection works best with clear, well-lit images
- API calls have rate limits (10s cooldown for simulations, 15s for disease analysis)

## Contributing

Contributions are welcome! Please fork the repository and submit pull requests.

## Contact

For questions or support:
- Twitter: [@Ta_pe_official](https://x.com/Ta_pe_official)
- Instagram: [@tape.vercel](https://www.instagram.com/tape.vercel/)
