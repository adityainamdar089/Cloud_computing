import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  workoutPlan: null,
  startDate: null,
  duration: null,
  frequency: null,
  weeklySchedule: null, // Array of workout days
  completedDays: [], // Array of day numbers that are completed
  currentDay: 1,
};

export const workoutPlanSlice = createSlice({
  name: "workoutPlan",
  initialState,
  reducers: {
    setWorkoutPlan: (state, action) => {
      state.workoutPlan = action.payload.plan;
      state.startDate = action.payload.startDate || new Date().toISOString();
      state.duration = action.payload.duration;
      state.frequency = action.payload.frequency;
      state.weeklySchedule = action.payload.weeklySchedule;
      state.completedDays = [];
      state.currentDay = 1;
    },
    markDayComplete: (state, action) => {
      const day = action.payload;
      if (!state.completedDays.includes(day)) {
        state.completedDays.push(day);
      }
    },
    setCurrentDay: (state, action) => {
      state.currentDay = action.payload;
    },
    clearWorkoutPlan: (state) => {
      state.workoutPlan = null;
      state.startDate = null;
      state.duration = null;
      state.frequency = null;
      state.weeklySchedule = null;
      state.completedDays = [];
      state.currentDay = 1;
    },
  },
});

export const { setWorkoutPlan, markDayComplete, setCurrentDay, clearWorkoutPlan } =
  workoutPlanSlice.actions;

export default workoutPlanSlice.reducer;

