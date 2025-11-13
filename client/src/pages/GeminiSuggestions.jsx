// client/src/components/GeminiSuggestions.jsx
import React, { useMemo, useState, useEffect } from "react";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setWorkoutPlan } from "../redux/reducers/workoutPlanSlice";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ---------------------- Styled components (unchanged) --------------------- */
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

/* ----------------------- Component ----------------------- */
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
  const [chatHistory, setChatHistory] = useState([]);

  // Gemini API Key - stored in localStorage or use default
  const GEMINI_API_KEY = useMemo(() => {
    const storedKey = localStorage.getItem("gemini-api-key");
    return storedKey || "AIzaSyBmG5wnTaCvjOB-jM5iUlY5UlECKyNwg8k";
  }, []);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const storedChats = localStorage.getItem("fittrack-chat-history");
    if (storedChats) {
      try {
        const parsedChats = JSON.parse(storedChats);
        setChatHistory(parsedChats);
        // Load the most recent response if available
        if (parsedChats.length > 0) {
          const lastChat = parsedChats[parsedChats.length - 1];
          setResponse(lastChat.response || "");
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    }
  }, []);

  // Save chat to localStorage
  const saveChatToLocalStorage = (prompt, responseText, userData) => {
    const chatEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      prompt,
      response: responseText,
      userData: {
        age: userData.age,
        weight: userData.weight,
        height: userData.height,
        target: userData.target,
        duration: userData.duration,
        frequency: userData.frequency,
      },
    };

    const updatedHistory = [...chatHistory, chatEntry];
    setChatHistory(updatedHistory);
    
    // Keep only last 50 chats to avoid localStorage size limits
    const historyToSave = updatedHistory.slice(-50);
    localStorage.setItem("fittrack-chat-history", JSON.stringify(historyToSave));
  };

  const validateInputs = () => {
    setError("");
    if (!age || !bodyWeight || !target || !height || !duration || !frequency) {
      setError("Please fill in all fields.");
      return false;
    }

    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(bodyWeight);
    const heightNum = parseFloat(height);
    const durationNum = parseInt(duration, 10);
    const frequencyNum = parseInt(frequency, 10);

    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setError("Please enter a valid age (1-120).");
      return false;
    }
    if (isNaN(weightNum) || weightNum < 1 || weightNum > 500) {
      setError("Please enter a valid body weight (1-500 kg).");
      return false;
    }
    if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
      setError("Please enter a valid height (50-300 cm).");
      return false;
    }
    if (![30, 45, 60].includes(durationNum)) {
      setError("Please select a valid duration (30, 45, or 60 days).");
      return false;
    }
    if (frequencyNum < 1 || frequencyNum > 7) {
      setError("Please enter a valid workout frequency (1-7 times per week).");
      return false;
    }
    return true;
  };

  const buildPrompt = (ageNum, weightNum, heightNum, targetText, durationNum, frequencyNum) => {
    return `You are a professional fitness coach. Create a personalized ${durationNum}-day workout and diet plan based on the following user profile:

Age: ${ageNum} years
Body Weight: ${weightNum} kg
Height: ${heightNum} cm
Fitness Goal: ${targetText}
Program Duration: ${durationNum} days
Workout Frequency: ${frequencyNum} times per week

IMPORTANT: You need to create a WEEKLY workout schedule that repeats over ${durationNum} days. Since the user can workout ${frequencyNum} times per week, create ${frequencyNum} different workout days that will be rotated throughout the program.

For example, if the user works out 3 times per week, create 3 workout days (Day 1, Day 2, Day 3) that will be used throughout the ${durationNum}-day program.

CRITICAL FORMATTING REQUIREMENT: For the workout plan, you MUST format each workout exercise in this EXACT format. Each workout must have exactly 5 lines in this order:
1. #Category (e.g., #Legs, #Chest, #Back, #Arms, #Shoulders, #Cardio)
2. -Workout Name (e.g., -Back Squat, -Bench Press)
3. -X sets Y reps (e.g., -5 sets 15 reps OR -4 setsX 12 reps - note: \"setsX\" means \"sets ×\")
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
- Each workout MUST have exactly 4 lines starting with \"-\" (dash)
- Do NOT add any extra text, descriptions, or explanations between the format lines
- Do NOT use bullet points or other formatting - only use # and - as shown
- The format must be: #Category, -Workout Name, -Sets reps, -Weight kg, -Duration min

Based on the user's profile, create a comprehensive ${frequencyNum}-day weekly workout schedule. Each workout day should have 4-6 exercises that are appropriate for their age, weight, height, and fitness goal (${targetText}). Adjust the weights, sets, reps, and duration based on their current fitness level and goal.

Structure your response as follows:
1. \"Weekly Workout Schedule\" section - List each workout day (Day 1, Day 2, etc.) with the exercises in the EXACT format above
2. \"Program Overview\" section - Explain how the ${frequencyNum} workout days will be rotated over ${durationNum} days
3. \"Diet Plan\" section - Provide nutrition guidance for the ${durationNum}-day program

For the workout days, label them clearly as \"Day 1:\", \"Day 2:\", etc., and ensure each day's workouts follow the EXACT format (no deviations).`;
  };

  const extractTextFromApiResponse = (data) => {
    // Try several common shapes returned by different generations of GL APIs / SDKs
    try {
      // 1) data.candidates[0].output[...] -> find text
      const candidates = data?.candidates;
      if (Array.isArray(candidates) && candidates.length > 0) {
        const cand = candidates[0];
        // candidate may have output array with content
        const outputs = (cand.output || cand.outputs || cand.result || cand.output) ?? null;
        if (Array.isArray(outputs)) {
          for (const out of outputs) {
            const contents = (out?.content || out?.contents || out?.content) ?? null;
            if (Array.isArray(contents)) {
              for (const c of contents) {
                // some items are {type:'text', text: '...'}
                if ((c.type === "message" || c.type === "text" || c.type === "output_text") && c.text) {
                  return c.text;
                }
                if (c.type === "text" && c.text) return c.text;
                if (typeof c === "string") return c;
                if (c?.text) return c.text;
              }
            }
            // fallback: out.text
            if (out?.text) return out.text;
          }
        }
        // fallback: candidate.outputText or candidate.content
        if (cand.outputText) return cand.outputText;
        if (cand.text) return cand.text;
      }

      // 2) older shape: data.outputText
      if (data?.outputText) return data.outputText;

      // 3) some SDKs return data.result or data.text or data.content
      if (data?.result?.output_text) return data.result.output_text;
      if (data?.text) return data.text;
      if (data?.content) return data.content;
    } catch (e) {
      // ignore and fallback to JSON stringify
      console.warn("Error extracting text from response shape", e);
    }
    // final fallback
    return JSON.stringify(data, null, 2);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setResponse("");
    setError("");
    if (!validateInputs()) return;

    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(bodyWeight);
    const heightNum = parseFloat(height);
    const durationNum = parseInt(duration, 10);
    const frequencyNum = parseInt(frequency, 10);

    const prompt = buildPrompt(ageNum, weightNum, heightNum, target, durationNum, frequencyNum);

    setLoading(true);

    try {
      // Initialize Gemini API client
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      
      // Try models in order: gemini-2.5-flash, then gemini-2.5-pro
      const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-pro"];
      let lastError = null;
      let generatedText = "";

      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting to use model: ${modelName}`);
          const model = genAI.getGenerativeModel({ model: modelName });
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          generatedText = response.text();

          if (generatedText && generatedText.trim().length > 0) {
            console.log(`Successfully generated content with ${modelName}`);
            break;
          }
        } catch (modelError) {
          lastError = modelError;
          const errorMessage = modelError.message || String(modelError);
          console.error(`Error with model ${modelName}:`, errorMessage);
          
          // If it's a 404 (model not found), try next model
          if (errorMessage.includes("404") || errorMessage.includes("not found")) {
            continue;
          }
          
          // If it's quota/rate limit, try next model
          if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
            if (modelsToTry.indexOf(modelName) < modelsToTry.length - 1) {
              continue;
            }
          }
          
          // For other errors, break and use the error
          break;
        }
      }

      if (!generatedText && lastError) {
        throw lastError;
      }

      if (!generatedText) {
        throw new Error("Failed to generate content from Gemini API");
      }

      setResponse(generatedText);

      // Save chat to localStorage
      saveChatToLocalStorage(prompt, generatedText, {
        age: ageNum,
        weight: weightNum,
        height: heightNum,
        target,
        duration: durationNum,
        frequency: frequencyNum,
      });

      // parse and save weekly schedule if possible
      const weeklySchedule = parseWeeklySchedule(generatedText);
      if (weeklySchedule.length > 0) {
        dispatch(
          setWorkoutPlan({
            plan: generatedText,
            startDate: new Date().toISOString(),
            duration: durationNum,
            frequency: frequencyNum,
            weeklySchedule: weeklySchedule,
          })
        );
      }
    } catch (err) {
      console.error("Error generating content:", err);
      console.error("Full error object:", err);
      
      // Provide more helpful error messages
      let errorMessage = err.message || String(err);
      
      // Check for specific error types
      if (errorMessage.includes("429") || errorMessage.includes("quota exceeded")) {
        errorMessage = "Gemini API quota exceeded. Please check your API quota and billing. Please wait before retrying or upgrade your plan.";
      } else if (errorMessage.includes("401") || errorMessage.includes("API key")) {
        errorMessage = "Invalid or missing Gemini API key. Please check your API key configuration.";
      } else if (errorMessage.includes("503") || errorMessage.includes("overloaded")) {
        errorMessage = "Server temporarily unavailable. The Gemini API models may be overloaded. Please try again in a moment.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const parseWeeklySchedule = (text) => {
    const weeklySchedule = [];
    const lines = text.split("\n");
    let currentDay = null;
    let currentWorkouts = [];
    let currentWorkout = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      const dayMatch = line.match(/^Day\s+(\d+)[:.]?/i);
      if (dayMatch) {
        if (currentDay !== null && currentWorkouts.length > 0) {
          weeklySchedule.push({
            day: currentDay,
            workouts: currentWorkouts,
          });
        }
        currentDay = parseInt(dayMatch[1], 10);
        currentWorkouts = [];
        currentWorkout = [];
        continue;
      }

      if (currentDay !== null) {
        if (line.startsWith("#")) {
          if (currentWorkout.length === 5) {
            currentWorkouts.push(currentWorkout.join("\n"));
          }
          currentWorkout = [line];
        } else if (line.startsWith("-") && currentWorkout.length > 0) {
          currentWorkout.push(line);
          if (currentWorkout.length === 5) {
            currentWorkouts.push(currentWorkout.join("\n"));
            currentWorkout = [];
          }
        }
      }
    }

    if (currentDay !== null && currentWorkouts.length > 0) {
      weeklySchedule.push({
        day: currentDay,
        workouts: currentWorkouts,
      });
    }

    return weeklySchedule;
  };

  const extractWorkoutFormat = (text) => {
    if (!text) return null;
    
    const lines = text.split("\n");
    const workouts = [];
    let currentWorkout = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith("#")) {
        // If we have a complete workout (5 lines), save it
        if (currentWorkout.length === 5) {
          workouts.push(currentWorkout.join("\n"));
        }
        // Start new workout
        currentWorkout = [line];
      } else if (currentWorkout.length > 0 && line.startsWith("-")) {
        currentWorkout.push(line);
        // If we have 5 lines (category + 4 details), save the workout
        if (currentWorkout.length === 5) {
          workouts.push(currentWorkout.join("\n"));
          currentWorkout = [];
        }
      } else if (currentWorkout.length > 0 && currentWorkout.length < 5) {
        // If we encounter a non-dash line while building a workout, it might be invalid
        // But let's be more lenient - only reset if we have very few lines
        if (currentWorkout.length === 1 && !line.startsWith("#")) {
          // Only reset if we just started and hit something unexpected
          currentWorkout = [];
        }
      }
    }

    // Save any remaining complete workout
    if (currentWorkout.length === 5) {
      workouts.push(currentWorkout.join("\n"));
    }

    return workouts.length > 0 ? workouts.join("; ") : null;
  };

  const handleCopyWorkouts = async () => {
    try {
      // First try to extract formatted workouts
      let textToCopy = extractWorkoutFormat(response);
      
      // If extraction fails, try to extract just the workout sections from the response
      if (!textToCopy) {
        // Look for workout sections in the response
        const workoutSectionMatch = response.match(/Weekly Workout Schedule[\s\S]*?(?=Program Overview|Diet Plan|$)/i);
        if (workoutSectionMatch) {
          // Extract just the workout lines (lines starting with # or -)
          const workoutLines = workoutSectionMatch[0]
            .split("\n")
            .filter(line => line.trim().startsWith("#") || line.trim().startsWith("-"))
            .join("\n");
          
          if (workoutLines.trim().length > 0) {
            textToCopy = workoutLines;
          }
        }
      }
      
      // If still nothing, copy the entire response
      if (!textToCopy) {
        textToCopy = response;
      }
      
      // Copy to clipboard
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      // Fallback: try using a temporary textarea
      try {
        const textarea = document.createElement("textarea");
        textarea.value = extractWorkoutFormat(response) || response;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        alert("Failed to copy to clipboard. Please select and copy the text manually.");
      }
    }
  };


  return (
    <Page>
      <Content>
        <div>
          <Title>AI Fitness Coach</Title>
          <Subtitle>
            Enter your details below and the server-side Gemini-powered coach will create a personalized workout and nutrition
            plan tailored to you.
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
              <Select id="target" value={target} onChange={(e) => setTarget(e.target.value)} required>
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
              <Select id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} required>
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

        {response && !extractWorkoutFormat(response) && (
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
            <ResponseWrapper>{response}</ResponseWrapper>
            <Actions>
              <CopyButton onClick={handleCopyWorkouts}>{copied ? "✓ Copied!" : "Copy Workout Format"}</CopyButton>
            </Actions>
          </>
        )}
      </Content>
    </Page>
  );
};

export default GeminiSuggestions;
