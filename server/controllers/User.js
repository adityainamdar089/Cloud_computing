import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createError } from "../error.js";
import {
  createUser,
  getUserByEmail,
  getUserById,
} from "../repositories/userRepository.js";
import {
  getWorkoutsForDay,
  getWorkoutsWithinRange,
  putWorkouts,
} from "../repositories/workoutRepository.js";

dotenv.config();

const JWT_SECRET = 
  (process.env.JWT_SECRET && process.env.JWT_SECRET !== "change-me") 
    ? process.env.JWT_SECRET 
    : (process.env.JWT && process.env.JWT !== "change-me")
      ? process.env.JWT
      : "suraASDjgaKSADFJBAitte6708";

const signToken = (user) =>
  jwt.sign(
    {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        img: user.img,
        status: user.status,
      },
    },
    JWT_SECRET,
    { expiresIn: "365d" }
  );

const normaliseUserForResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  img: user.img,
  status: user.status,
});

export const UserRegister = async (req, res, next) => {
  try {
    const { email, password, name, img } = req.body;

    if (!email || !password || !name) {
      return next(createError(400, "Name, email and password are required."));
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return next(createError(409, "Email is already in use."));
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({
      email,
      name,
      img,
      passwordHash,
    });

    const token = signToken(user);
    return res.status(200).json({ token, user: normaliseUserForResponse(user) });
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

export const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(createError(400, "Email and password are required."));
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return next(createError(403, "Incorrect password"));
    }

    const token = signToken(user);

    return res.status(200).json({ token, user: normaliseUserForResponse(user) });
  } catch (error) {
    console.error(error);
    return next(error);
  }
};

export const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.userId;
    if (!userId) {
      return next(createError(401, "User context missing"));
    }

    const user = await getUserById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endToday = new Date(startToday);
    endToday.setDate(endToday.getDate() + 1);

    const todaysWorkouts = await getWorkoutsForDay(
      user._id,
      startToday.toISOString(),
      endToday.toISOString()
    );

    const totalCaloriesBurnt = todaysWorkouts.reduce(
      (total, workout) => total + (Number(workout.caloriesBurned) || 0),
      0
    );

    const totalWorkouts = todaysWorkouts.length;
    const avgCaloriesBurntPerWorkout =
      totalWorkouts > 0 ? totalCaloriesBurnt / totalWorkouts : 0;

    const categoryCaloriesMap = todaysWorkouts.reduce((acc, workout) => {
      if (!workout.category) return acc;
      const calories = Number(workout.caloriesBurned) || 0;
      acc[workout.category] = (acc[workout.category] || 0) + calories;
      return acc;
    }, {});

    const pieChartData = Object.entries(categoryCaloriesMap).map(
      ([label, value], index) => ({
        id: index,
        value,
        label,
      })
    );

    const weekStart = new Date(startToday);
    weekStart.setDate(weekStart.getDate() - 6);

    const weeklyWorkouts = await getWorkoutsWithinRange(
      user._id,
      weekStart.toISOString(),
      endToday.toISOString()
    );

    const weeklyTotals = weeklyWorkouts.reduce((acc, workout) => {
      const dayKey = workout.createdAt?.slice(0, 10);
      const calories = Number(workout.caloriesBurned) || 0;
      if (!dayKey) return acc;
      acc[dayKey] = (acc[dayKey] || 0) + calories;
      return acc;
    }, {});

    const weeks = [];
    const caloriesBurned = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(startToday);
      date.setDate(startToday.getDate() - i);
      const dayKey = date.toISOString().slice(0, 10);
      const label = `${date.getDate()}${getOrdinalSuffix(date.getDate())}`;
      weeks.push(label);
      caloriesBurned.push(weeklyTotals[dayKey] || 0);
    }

    return res.status(200).json({
      totalCaloriesBurnt,
      totalWorkouts,
      avgCaloriesBurntPerWorkout,
      totalWeeksCaloriesBurnt: {
        weeks,
        caloriesBurned,
      },
      pieChartData,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const getWorkoutsByDate = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.userId;
    if (!userId) {
      return next(createError(401, "User context missing"));
    }

    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    if (Number.isNaN(targetDate.getTime())) {
      return next(createError(400, "Invalid date supplied."));
    }

    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todaysWorkouts = await getWorkoutsForDay(
      userId,
      startOfDay.toISOString(),
      endOfDay.toISOString()
    );

    const totalCaloriesBurnt = todaysWorkouts.reduce(
      (total, workout) => total + (Number(workout.caloriesBurned) || 0),
      0
    );

    return res
      .status(200)
      .json({ todaysWorkouts, totalCaloriesBurnt });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const addWorkout = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.userId;
    if (!userId) {
      return next(createError(401, "User context missing"));
    }

    const { workoutString } = req.body;
    if (!workoutString) {
      return next(createError(400, "Workout string is missing"));
    }

    const parsedWorkouts = parseWorkoutBlocks(workoutString);
    if (!parsedWorkouts.length) {
      return next(createError(400, "Unable to parse workouts from input."));
    }

    const workoutsWithCalories = parsedWorkouts.map((workout) => ({
      ...workout,
      caloriesBurned: calculateCaloriesBurnt(workout),
      createdAt: new Date().toISOString(),
    }));

    await putWorkouts(userId, workoutsWithCalories);

    return res.status(201).json({
      message: "Workouts added successfully",
      workouts: workoutsWithCalories,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const parseWorkoutBlocks = (raw) => {
  const blocks = raw
    .split(";")
    .map((block) => block.trim())
    .filter(Boolean);

  const workouts = [];
  blocks.forEach((block, index) => {
    if (!block.startsWith("#")) {
      throw createError(
        400,
        `Workout string is missing for ${index + 1}th workout`
      );
    }

    const parts = block
      .split("\n")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length < 5) {
      throw createError(
        400,
        `Workout string is missing for ${index + 1}th workout`
      );
    }

    const category = parts[0].slice(1).trim();
    const workoutDetails = parseWorkoutLine(parts);
    if (!workoutDetails) {
      console.error(`Failed to parse workout block ${index + 1}:`, parts);
      throw createError(
        400,
        `Please enter workouts in the correct format. Expected: #Category, -Workout Name, -X sets Y reps (or X setsX Y reps), -Weight kg, -Duration min`
      );
    }

    workouts.push({
      ...workoutDetails,
      category,
    });
  });

  return workouts;
};

const parseWorkoutLine = (parts) => {
  try {
    const workoutName = parts[1].replace(/^-/, "").trim();
    const setsLine = parts[2].replace(/^-/, "").trim();
    const weightLine = parts[3].replace(/^-/, "").trim();
    const durationLine = parts[4].replace(/^-/, "").trim();

    // Updated regex to handle both "5 sets 15 reps" and "5 setsX15 reps" formats
    // Also handles variations like "5 sets x 15 reps", "5 setsX 15 reps", etc.
    const setsMatch = setsLine.match(/(\d+)\s*sets?\s*[xX]?\s*(\d+)\s*reps?/i);
    if (!setsMatch) return null;

    const weightMatch = weightLine.match(/([\d.]+)\s*kg/i);
    const durationMatch = durationLine.match(/([\d.]+)\s*min/i);

    return {
      workoutName,
      sets: Number(setsMatch[1]),
      reps: Number(setsMatch[2]),
      weight: weightMatch ? Number(weightMatch[1]) : 0,
      duration: durationMatch ? Number(durationMatch[1]) : 0,
    };
  } catch (err) {
    console.error("Failed to parse workout line", err);
    return null;
  }
};

const calculateCaloriesBurnt = (workoutDetails) => {
  const durationInMinutes = Number(workoutDetails.duration) || 0;
  const weightInKg = Number(workoutDetails.weight) || 0;
  const caloriesBurntPerMinute = 5;
  return durationInMinutes * caloriesBurntPerMinute * weightInKg;
};

const getOrdinalSuffix = (day) => {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};
