import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setWorkoutPlan } from "../redux/reducers/workoutPlanSlice";

const Page = styled.div`
  width: 100%;
  height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  padding: 32px 16px 48px;
  overflow-y: auto;
  background: ${({ theme }) => theme.bgLight};
`;

const Content = styled.div`
  width: 100%;
  max-width: 820px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: ${({ theme }) => theme.card};
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 16px 40px ${({ theme }) => theme.shadow};

  @media screen and (max-width: 640px) {
    padding: 24px 20px;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: ${({ theme }) => theme.text_primary};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 16px;
  color: ${({ theme }) => theme.text_secondary};
  line-height: 1.6;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media screen and (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.text_primary};
`;

const Input = styled.input`
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.text_secondary + "40"};
  background: ${({ theme }) => theme.bg};
  padding: 12px 16px;
  font-size: 15px;
  color: ${({ theme }) => theme.text_primary};
  outline: none;
  transition: border 0.2s ease;

  &:focus {
    border-color: ${({ theme }) => theme.primary};
  }
`;

const Select = styled.select`
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.text_secondary + "40"};
  background: ${({ theme }) => theme.bg};
  padding: 12px 16px;
  font-size: 15px;
  color: ${({ theme }) => theme.text_primary};
  outline: none;
  transition: border 0.2s ease;
  cursor: pointer;

  &:focus {
    border-color: ${({ theme }) => theme.primary};
  }
`;

const Actions = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 12px;

  @media screen and (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Button = styled.button`
  padding: 14px 26px;
  border-radius: 16px;
  border: none;
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.white};
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: transform 0.2s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ResponseWrapper = styled.div`
  background: ${({ theme }) => theme.bgLight};
  border-radius: 20px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.text_secondary + "30"};
  height: 1000px;
  overflow-y: auto;
  white-space: pre-wrap;
  color: ${({ theme }) => theme.text_primary};
  font-size: 15px;
//   line-height: 1.7;
`;

const CopyButton = styled(Button)`
  background: ${({ theme }) => theme.secondary};
  margin-top: 16px;
`;

const ErrorBanner = styled.div`
  padding: 12px 16px;
  border-radius: 14px;
  background: ${({ theme }) => theme.red + "15"};
  color: ${({ theme }) => theme.red};
  font-weight: 500;
`;

const InfoBanner = styled.div`
  padding: 16px 20px;
  border-radius: 14px;
  background: ${({ theme }) => theme.primary + "15"};
  border: 1px solid ${({ theme }) => theme.primary + "40"};
  color: ${({ theme }) => theme.text_primary};
  font-size: 14px;
  line-height: 1.6;
`;

const FormatExample = styled.pre`
  margin: 12px 0 0 0;
  padding: 12px;
  background: ${({ theme }) => theme.bg};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.text_secondary + "30"};
  font-size: 13px;
  color: ${({ theme }) => theme.text_primary};
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const GeminiSuggestions = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [age, setAge] = useState("");
  const [bodyWeight, setBodyWeight] = useState("");
  const [target, setTarget] = useState("");
  const [height, setHeight] = useState("");
  const [duration, setDuration] = useState("30");
  const [frequency, setFrequency] = useState("3");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const apiKey = useMemo(
    () => process.env.REACT_APP_GEMINI_API_KEY?.trim() || "AIzaSyAUZzvL_0s4qJk-b5QjzGs66pqKuB_LnZY"?.trim(),
    []
  );

  const genAI = useMemo(
    () => (apiKey ? new GoogleGenerativeAI(apiKey) : null),
    [apiKey]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validate inputs
    if (!age || !bodyWeight || !target || !height || !duration || !frequency) {
      setError("Please fill in all fields.");
      return;
    }

    const ageNum = parseInt(age);
    const weightNum = parseFloat(bodyWeight);
    const heightNum = parseFloat(height);

    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setError("Please enter a valid age (1-120).");
      return;
    }

    if (isNaN(weightNum) || weightNum < 1 || weightNum > 500) {
      setError("Please enter a valid body weight (1-500 kg).");
      return;
    }

    if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
      setError("Please enter a valid height (50-300 cm).");
      return;
    }

    if (!apiKey || !genAI) {
      setError(
        "Missing Gemini API key. Please set REACT_APP_GEMINI_API_KEY in your .env file or environment variables."
      );
      return;
    }

    // Validate API key format
    if (!apiKey.startsWith("AIza")) {
      setError(
        "Invalid API key format. Gemini API keys should start with 'AIza'. Please check your API key."
      );
      return;
    }

    setLoading(true);
    setResponse("");
    setError("");

    const durationNum = parseInt(duration);
    const frequencyNum = parseInt(frequency);

    if (![30, 45, 60].includes(durationNum)) {
      setError("Please select a valid duration (30, 45, or 60 days).");
      return;
    }

    if (frequencyNum < 1 || frequencyNum > 7) {
      setError("Please enter a valid workout frequency (1-7 times per week).");
      return;
    }

    const prompt = `You are a professional fitness coach. Create a personalized ${durationNum}-day workout and diet plan based on the following user profile:

Age: ${ageNum} years
Body Weight: ${weightNum} kg
Height: ${heightNum} cm
Fitness Goal: ${target}
Program Duration: ${durationNum} days
Workout Frequency: ${frequencyNum} times per week

IMPORTANT: You need to create a WEEKLY workout schedule that repeats over ${durationNum} days. Since the user can workout ${frequencyNum} times per week, create ${frequencyNum} different workout days that will be rotated throughout the program.

For example, if the user works out 3 times per week, create 3 workout days (Day 1, Day 2, Day 3) that will be used throughout the ${durationNum}-day program.

CRITICAL FORMATTING REQUIREMENT: For the workout plan, you MUST format each workout exercise in this EXACT format. Each workout must have exactly 5 lines in this order:
1. #Category (e.g., #Legs, #Chest, #Back, #Arms, #Shoulders, #Cardio)
2. -Workout Name (e.g., -Back Squat, -Bench Press)
3. -X sets Y reps (e.g., -5 sets 15 reps OR -4 setsX 12 reps - note: "setsX" means "sets ×")
4. -Weight kg (e.g., -30 kg, -60 kg, or -Bodyweight if no weight)
5. -Duration min (e.g., -10 min, -15 min)

When you have multiple workouts, separate them with a semicolon and space (; ) like this:

#Legs
-Back Squat
-5 sets 15 reps
-30 kg
-10 min; #Chest
-Bench Press
-4 sets 12 reps
-60 kg
-15 min; #Back
-Deadlift
-3 setsX 8 reps
-80 kg
-12 min

IMPORTANT RULES:
- Each workout MUST start with #Category on its own line
- Each workout MUST have exactly 4 lines starting with "-" (dash)
- Do NOT add any extra text, descriptions, or explanations between the format lines
- Do NOT use bullet points or other formatting - only use # and - as shown
- The format must be: #Category, -Workout Name, -Sets reps, -Weight kg, -Duration min

Based on the user's profile, create a comprehensive ${frequencyNum}-day weekly workout schedule. Each workout day should have 4-6 exercises that are appropriate for their age, weight, height, and fitness goal (${target}). Adjust the weights, sets, reps, and duration based on their current fitness level and goal.

Structure your response as follows:
1. "Weekly Workout Schedule" section - List each workout day (Day 1, Day 2, etc.) with the exercises in the EXACT format above
2. "Program Overview" section - Explain how the ${frequencyNum} workout days will be rotated over ${durationNum} days
3. "Diet Plan" section - Provide nutrition guidance for the ${durationNum}-day program

For the workout days, label them clearly as "Day 1:", "Day 2:", etc., and ensure each day's workouts follow the EXACT format (no deviations).`;

    // Retry logic with exponential backoff and model fallback
    const maxRetries = 3;
    const modelsToTry = [ "gemini-2.5-pro", "gemini-2.5-flash"];
    let retryCount = 0;
    let lastError = null;
    let modelIndex = 0;

    while (retryCount <= maxRetries && modelIndex < modelsToTry.length) {
      try {
        // Try different models in order
        const modelName = modelsToTry[modelIndex];
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text && text.trim().length > 0) {
          const responseText = text.trim();
          setResponse(responseText);
          
          // Parse and store the workout plan
          const weeklySchedule = parseWeeklySchedule(responseText);
          if (weeklySchedule.length > 0) {
            dispatch(setWorkoutPlan({
              plan: responseText,
              startDate: new Date().toISOString(),
              duration: durationNum,
              frequency: frequencyNum,
              weeklySchedule: weeklySchedule,
            }));
          }
          
          setLoading(false);
          return; // Success, exit the function
        } else {
          throw new Error("Empty response from API");
        }
      } catch (err) {
        console.error(`Error with model ${modelsToTry[modelIndex]} (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
        lastError = err;

        // Handle different error object structures
        const errorMessage = err.message || err.error?.message || err.response?.data?.message || JSON.stringify(err);
        const errorStatus = err.status || err.code || err.error?.code || err.response?.status;
        const errorStatusText = err.error?.status || err.statusText;
        
        // Check if it's a 404 error (model not found) - try next model
        const isModelNotFound = 
          errorMessage?.includes("404") ||
          errorMessage?.includes("not found") ||
          errorMessage?.includes("is not found") ||
          errorStatus === 404 ||
          errorStatusText === "NOT_FOUND";

        // Check if it's a 503 error (overloaded) or rate limit error
        const isOverloaded = 
          errorMessage?.includes("503") ||
          errorMessage?.includes("overloaded") ||
          errorMessage?.includes("UNAVAILABLE") ||
          errorStatus === 503 ||
          errorStatusText === "UNAVAILABLE";

        // If model not found, try next model
        if (isModelNotFound && modelIndex < modelsToTry.length - 1) {
          console.log(`Model ${modelsToTry[modelIndex]} not found. Trying next model...`);
          modelIndex++;
          retryCount = 0; // Reset retry count for new model
          setError(`Trying alternative model...`);
          continue;
        }

        // If overloaded, retry with exponential backoff
        if (isOverloaded && retryCount < maxRetries) {
          // Exponential backoff: wait 2^retryCount seconds (2s, 4s, 8s)
          const delay = Math.pow(2, retryCount) * 1000;
          const delaySeconds = delay / 1000;
          const secondsText = delaySeconds === 1 ? "second" : "seconds";
          console.log(`Model overloaded. Retrying in ${delaySeconds} ${secondsText}...`);
          setError(`Model is busy. Retrying in ${delaySeconds} ${secondsText}... (Attempt ${retryCount + 1}/${maxRetries + 1})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          retryCount++;
        } else {
          // Not a retryable error or max retries reached
          break;
        }
      }
    }

    // If we get here, all retries failed
    if (lastError) {
      const errorMessage = 
        lastError.message || 
        lastError.error?.message || 
        lastError.response?.data?.message || 
        "Something went wrong. Please try again later.";
      
      if (errorMessage.includes("503") || 
          errorMessage.includes("overloaded") || 
          errorMessage.includes("UNAVAILABLE") ||
          lastError.status === 503 ||
          lastError.code === 503 ||
          lastError.error?.code === 503) {
        setError("The AI model is currently overloaded. Please wait a moment and try again.");
      } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        setError(
          `Unable to access Gemini models. Tried: ${modelsToTry.join(", ")}.\n\n` +
          `Possible solutions:\n` +
          `1. Verify your API key is valid and active at https://makersuite.google.com/app/apikey\n` +
          `2. Ensure your API key has access to Gemini models\n` +
          `3. Check if your API key has quota/usage limits\n` +
          `4. Try regenerating your API key\n\n` +
          `Current API key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`
        );
      } else if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
        setError(
          `API key permission denied. Please check:\n` +
          `1. Your API key is valid and not revoked\n` +
          `2. The API key has the necessary permissions\n` +
          `3. You haven't exceeded your quota limits`
        );
      } else if (errorMessage.includes("401") || errorMessage.includes("UNAUTHENTICATED")) {
        setError(
          `Invalid API key. Please verify your REACT_APP_GEMINI_API_KEY is correct.\n` +
          `Get a new key at: https://makersuite.google.com/app/apikey`
        );
      } else {
        setError(errorMessage);
      }
    } else {
      setError(`Failed to get response after trying all models (${modelsToTry.join(", ")}). Please try again later.`);
    }
    setLoading(false);
  };

  const parseWeeklySchedule = (text) => {
    // Parse the AI response to extract weekly workout schedule
    const weeklySchedule = [];
    const lines = text.split('\n');
    let currentDay = null;
    let currentWorkouts = [];
    let currentWorkout = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) {
        continue;
      }

      // Check if this is a day header (e.g., "Day 1:", "Day 1", etc.)
      const dayMatch = line.match(/^Day\s+(\d+)[:.]?/i);
      if (dayMatch) {
        // Save previous day if exists
        if (currentDay !== null && currentWorkouts.length > 0) {
          weeklySchedule.push({
            day: currentDay,
            workouts: currentWorkouts,
          });
        }
        currentDay = parseInt(dayMatch[1]);
        currentWorkouts = [];
        currentWorkout = [];
        continue;
      }

      // If we're in a day section, parse workouts
      if (currentDay !== null) {
        if (line.startsWith('#')) {
          // Start of a new workout
          if (currentWorkout.length === 5) {
            currentWorkouts.push(currentWorkout.join('\n'));
          }
          currentWorkout = [line];
        } else if (line.startsWith('-') && currentWorkout.length > 0) {
          currentWorkout.push(line);
          if (currentWorkout.length === 5) {
            currentWorkouts.push(currentWorkout.join('\n'));
            currentWorkout = [];
          }
        }
      }
    }

    // Save the last day
    if (currentDay !== null && currentWorkouts.length > 0) {
      weeklySchedule.push({
        day: currentDay,
        workouts: currentWorkouts,
      });
    }

    return weeklySchedule;
  };

  const extractWorkoutFormat = (text) => {
    // Extract workout blocks that match the format #Category followed by workout details
    // Expected format: #Category, -Workout Name, -X sets Y reps, -Weight kg, -Duration min
    const lines = text.split('\n');
    const workouts = [];
    let currentWorkout = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) {
        continue;
      }
      
      // Start of a workout block - line starting with #
      if (line.startsWith('#')) {
        // If we have a complete previous workout (1 category + 4 detail lines), save it
        if (currentWorkout.length === 5) {
          workouts.push(currentWorkout.join('\n'));
        }
        // Start a new workout block
        currentWorkout = [line];
      } 
      // Continue building current workout - line starting with -
      else if (currentWorkout.length > 0 && line.startsWith('-')) {
        currentWorkout.push(line);
        
        // If we have a complete workout (1 category + 4 detail lines)
        if (currentWorkout.length === 5) {
          workouts.push(currentWorkout.join('\n'));
          currentWorkout = []; // Reset for next workout
        }
      }
      // If we encounter a non-matching line while building a workout, reset
      else if (currentWorkout.length > 0 && currentWorkout.length < 5) {
        // Incomplete workout, reset
        currentWorkout = [];
      }
    }
    
    // Add the last workout if complete
    if (currentWorkout.length === 5) {
      workouts.push(currentWorkout.join('\n'));
    }
    
    return workouts.length > 0 ? workouts.join('; ') : null;
  };

  const handleCopyWorkouts = () => {
    const workoutFormat = extractWorkoutFormat(response);
    if (workoutFormat) {
      navigator.clipboard.writeText(workoutFormat);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert("No properly formatted workouts found in the response.\n\nExpected format:\n#Category\n-Workout Name\n-X sets Y reps\n-Weight kg\n-Duration min\n\nPlease ensure the AI response follows this exact format.");
    }
  };

  const workoutFormat = extractWorkoutFormat(response);

  return (
    <Page>
      <Content>
        <div>
          <Title>AI Fitness Coach</Title>
          <Subtitle>
            Enter your details below and the Gemini-powered coach will create a
            personalized workout and nutrition plan tailored to you.
          </Subtitle>
        </div>

        <InfoBanner>
          <strong>📋 Expected Workout Format:</strong>
          <br />
          Workouts will be generated in this format (you can copy them for easy import):
          <FormatExample>{`#Category
-Workout Name
-X sets Y reps (or X setsX Y reps)
-Weight kg
-Duration min

Example:
#Legs
-Back Squat
-5 sets 15 reps
-30 kg
-10 min; #Chest
-Bench Press
-4 sets 12 reps
-60 kg
-15 min`}</FormatExample>
        </InfoBanner>

        <Form onSubmit={handleSubmit}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 25"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="bodyWeight">Body Weight (kg)</Label>
              <Input
                id="bodyWeight"
                type="number"
                min="1"
                max="500"
                step="0.1"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value)}
                placeholder="e.g., 70"
                required
              />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                min="50"
                max="300"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 175"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label htmlFor="target">Fitness Goal</Label>
              <Select
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
              >
                <option value="">Select your goal</option>
                <option value="Weight Loss / Fat Loss">Weight Loss / Fat Loss</option>
                <option value="Muscle Gain / Bulking">Muscle Gain / Bulking</option>
                <option value="Strength Building">Strength Building</option>
                <option value="Endurance / Cardio">Endurance / Cardio</option>
                <option value="General Fitness / Maintenance">General Fitness / Maintenance</option>
                <option value="Athletic Performance">Athletic Performance</option>
                <option value="Toning / Body Recomposition">Toning / Body Recomposition</option>
              </Select>
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label htmlFor="duration">Program Duration (days)</Label>
              <Select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              >
                <option value="30">30 days</option>
                <option value="45">45 days</option>
                <option value="60">60 days</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label htmlFor="frequency">Workout Frequency (times per week)</Label>
              <Input
                id="frequency"
                type="number"
                min="1"
                max="7"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="e.g., 3"
                required
              />
            </FormGroup>
          </FormRow>

          <Actions>
            <Button type="submit" disabled={loading}>
              {loading ? "Generating plan..." : "Get My Plan"}
            </Button>
          </Actions>
        </Form>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        {response && !workoutFormat && (
          <InfoBanner>
            <strong>⚠️ Workout Format Required:</strong>
            <br />
            The AI response should include workouts in this exact format:
            <FormatExample>{`#Category
-Workout Name
-X sets Y reps (or X setsX Y reps)
-Weight kg
-Duration min

Example:
#Legs
-Back Squat
-5 sets 15 reps
-30 kg
-10 min`}</FormatExample>
            Please regenerate the plan to get properly formatted workouts.
          </InfoBanner>
        )}

        {response && (
          <>
            <ResponseWrapper>
              {response}
            </ResponseWrapper>
            <Actions>
              {workoutFormat && (
                <CopyButton onClick={handleCopyWorkouts}>
                  {copied ? "✓ Copied!" : "Copy Workout Format"}
                </CopyButton>
              )}
              <Button
                onClick={() => navigate("/your-workout")}
                style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
              >
                View Your Workout Plan →
              </Button>
            </Actions>
          </>
        )}

        {!apiKey && !response && !error && (
          <InfoBanner>
            <strong>🔑 API Key Setup Required:</strong>
            <br />
            To use the AI Fitness Coach, you need a Gemini API key:
            <ol style={{ marginTop: "12px", paddingLeft: "20px" }}>
              <li>Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: "#667eea", textDecoration: "underline" }}>Google AI Studio</a></li>
              <li>Create a <code>.env</code> file in the <code>client</code> directory</li>
              <li>Add: <code>REACT_APP_GEMINI_API_KEY=your-api-key-here</code></li>
              <li>Restart your development server</li>
            </ol>
          </InfoBanner>
        )}
      </Content>
    </Page>
  );
};

export default GeminiSuggestions;
