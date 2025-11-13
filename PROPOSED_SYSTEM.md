# III. PROPOSED SYSTEM

## A. System Architecture Overview

FitnessTrack employs a three-tier architecture consisting of a client-side React frontend, a serverless Node.js/Express backend deployed on AWS Lambda, and Amazon DynamoDB for persistent data storage. The system architecture is illustrated in Figure 1, demonstrating the flow of data from user input through AI processing to structured workout plan generation.

The frontend layer handles user interface rendering, input validation, and client-side state management using Redux with localStorage persistence. The backend layer, deployed as serverless functions on AWS Lambda, processes user requests, interfaces with the Google Gemini API for AI-powered plan generation, and manages data persistence operations. The database layer utilizes DynamoDB's NoSQL structure to store user profiles, authentication tokens, workout histories, and generated fitness plans.

This architecture design provides several advantages: (1) automatic scaling through serverless infrastructure, enabling the system to handle variable workloads without manual intervention, (2) cost-effectiveness through pay-per-request pricing models for both compute and database resources, (3) separation of concerns allowing independent development and deployment of frontend and backend components, and (4) enhanced security through server-side API key management and JWT-based authentication.

## B. Frontend Architecture

The frontend is built using React 18.2.0 with functional components and hooks for state management. The application employs React Router for navigation, providing five main routes: authentication, dashboard, workouts, tutorials, and AI-powered suggestions. The user interface is styled using styled-components, enabling theme-based customization and responsive design across different device sizes.

State management is implemented using Redux Toolkit with redux-persist, allowing application state to persist across browser sessions through localStorage. This approach enables users to maintain their workout plans and progress data locally, reducing server load and improving offline accessibility. The Redux store manages two primary slices: user authentication state and workout plan state, including weekly schedules, completed days, and current program progress.

The GeminiSuggestions component serves as the primary interface for AI-powered plan generation. Users input their profile parameters including age, body weight, height, fitness goal, program duration (30, 45, or 60 days), and workout frequency (1-7 times per week). Input validation ensures data integrity before submission, checking for valid ranges and required fields. Upon form submission, the component constructs a prompt using the buildPrompt function and sends it to the backend API endpoint.

## C. Backend Architecture

The backend is implemented as a serverless application using the Serverless Framework, deployed on AWS Lambda with Node.js 18.x runtime. The Express.js framework handles HTTP request routing and middleware processing. The application exposes RESTful API endpoints for user authentication, workout management, and AI-powered plan generation.

Authentication is implemented using JSON Web Tokens (JWT), with tokens stored in localStorage on the client side and validated through middleware on protected routes. The verifyToken middleware extracts the token from the Authorization header, validates its signature and expiration, and attaches user information to the request object for downstream processing.

The Gemini API integration is handled through a dedicated controller that manages communication with Google's Generative AI service. The controller implements a fallback mechanism, attempting multiple Gemini model variants (gemini-pro, gemini-1.5-pro, gemini-1.5-flash) in sequence if the requested model is unavailable, ensuring system resilience. API responses are processed to extract text content, handling various response formats from different Gemini API versions.

## D. AI-Powered Plan Generation

The core innovation of FitnessTrack lies in its approach to generating structured fitness plans using large language models. The system employs sophisticated prompt engineering to guide the Gemini model toward producing consistently formatted output. The prompt construction process incorporates user-specific parameters and enforces strict formatting requirements through explicit instructions and examples.

The buildPrompt function dynamically constructs prompts that include: (1) user profile information (age, weight, height, fitness goal), (2) program parameters (duration, workout frequency), (3) explicit formatting rules specifying the exact structure required for workout entries, and (4) example outputs demonstrating the expected format. The prompt emphasizes that each workout must follow a five-line structure: category (prefixed with #), workout name, sets and reps, weight, and duration (each prefixed with -).

This prompt engineering approach eliminates the need for model fine-tuning while ensuring output consistency. The model is instructed to generate workouts in a specific text format that can be reliably parsed by the backend processing algorithms. The prompt also includes instructions for generating comprehensive diet plans and program overviews, providing users with holistic fitness guidance beyond exercise routines alone.

## E. Parsing and Normalization Algorithm

The system implements a multi-stage parsing algorithm to extract structured data from AI-generated text responses. The parsing process begins with the parseWorkoutBlocks function, which splits the input text by semicolon delimiters to separate individual workout entries. Each block is then validated to ensure it starts with a category marker (#) and contains the required five-line structure.

The parseWorkoutLine function employs regex-based pattern matching to extract structured data from each workout entry. The algorithm uses regular expressions to identify: (1) sets and reps information, handling variations such as "5 sets 15 reps" and "5 setsX 15 reps", (2) weight values in kilograms, (3) duration in minutes, and (4) workout names and categories. The regex patterns are designed to be flexible, accommodating minor formatting variations while maintaining strict validation requirements.

Normalization occurs through the normalizeWorkoutItem function, which ensures consistent data structure for database storage. The normalization process converts parsed workout data into a standardized format with fields for workoutId, userId, workoutName, category, sets, reps, weight, duration, and caloriesBurned. Calorie calculation is performed using a formula based on workout duration and weight, providing users with estimated energy expenditure metrics.

## F. Data Storage and Management

User data is stored in DynamoDB using a pay-per-request billing model, eliminating the need for capacity planning and enabling automatic scaling. The database schema consists of two primary tables: Users and Workouts. The Users table stores authentication credentials, user profiles, and email addresses, with a Global Secondary Index on email for efficient lookup operations. The Workouts table stores individual workout entries with a composite key consisting of userId (hash key) and createdAt (range key), enabling efficient querying of workouts by user and date range.

Client-side data persistence is managed through localStorage, storing JWT authentication tokens and Redux state snapshots. This approach enables offline access to workout plans and maintains user sessions across browser restarts. The redux-persist library handles automatic serialization and deserialization of application state, ensuring seamless state restoration when users return to the application.

Workout data synchronization occurs through RESTful API calls, with the frontend sending workout entries to the backend for persistence. The backend implements batch write operations for efficient database insertion, processing up to 25 items per batch write operation as per DynamoDB limitations. This approach minimizes API calls and reduces latency when users add multiple workouts simultaneously.

## G. System Workflow

The complete system workflow for generating a personalized fitness plan proceeds as follows: (1) User accesses the GeminiSuggestions interface and inputs profile parameters, (2) Frontend validates input data and constructs a formatted prompt, (3) Prompt is sent to the backend API endpoint via HTTPS POST request, (4) Backend receives the request, validates authentication if required, and forwards the prompt to the Gemini API, (5) Gemini API generates a text response containing workout and diet plan information, (6) Backend receives the response and returns it to the frontend, (7) Frontend displays the generated plan and optionally parses it to extract structured workout data, (8) User can save the plan to their account, which triggers backend processing to parse and store workout entries in DynamoDB, (9) Parsed workouts are normalized and stored with calculated calorie information, (10) User can view their saved workouts on the dashboard, which queries DynamoDB for workout history and displays analytics including total calories burned and workout frequency.

This workflow demonstrates the integration of client-side processing, cloud-based AI inference, and serverless data persistence, creating a seamless user experience while maintaining scalability and cost-effectiveness.

