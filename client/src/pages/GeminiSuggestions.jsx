// client/src/components/GeminiSuggestions.jsx
import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setWorkoutPlan } from "../redux/reducers/workoutPlanSlice";

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

  // server endpoint -- ensure your server is running and exposes /api/generate
  const API_ENDPOINT = useMemo(() => "/api/generate", []);

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
      // POST to our server endpoint. The server should call Gemini with the API key.
      const resp = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          model: "gemini-2.5-flash", // server side will use this model name to call the Google API
          maxOutputTokens: 1200,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        // surface useful message if possible
        const err = data?.error || data;
        throw new Error(err?.message || JSON.stringify(err));
      }

      // Handle server response format
      const generatedText = data.text || extractTextFromApiResponse(data);
      setResponse(generatedText);

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
      setError(err.message || String(err));
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
    const lines = text.split("\n");
    const workouts = [];
    let currentWorkout = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith("#")) {
        if (currentWorkout.length === 5) {
          workouts.push(currentWorkout.join("\n"));
        }
        currentWorkout = [line];
      } else if (currentWorkout.length > 0 && line.startsWith("-")) {
        currentWorkout.push(line);
        if (currentWorkout.length === 5) {
          workouts.push(currentWorkout.join("\n"));
          currentWorkout = [];
        }
      } else if (currentWorkout.length > 0 && currentWorkout.length < 5) {
        // invalid block encountered — reset
        currentWorkout = [];
      }
    }

    if (currentWorkout.length === 5) workouts.push(currentWorkout.join("\n"));

    return workouts.length > 0 ? workouts.join("; ") : null;
  };

  const handleCopyWorkouts = () => {
    const workoutFormat = extractWorkoutFormat(response);
    if (workoutFormat) {
      navigator.clipboard.writeText(workoutFormat);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert(
        "No properly formatted workouts found in the response.\n\nExpected format:\n#Category\n-Workout Name\n-X sets Y reps\n-Weight kg\n-Duration min\n\nPlease regenerate the plan to get properly formatted workouts."
      );
    }
  };

  const workoutFormat = extractWorkoutFormat(response);

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
            <ResponseWrapper>{response}</ResponseWrapper>
            <Actions>
              {workoutFormat && (
                <CopyButton onClick={handleCopyWorkouts}>{copied ? "✓ Copied!" : "Copy Workout Format"}</CopyButton>
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
      </Content>
    </Page>
  );
};

export default GeminiSuggestions;
