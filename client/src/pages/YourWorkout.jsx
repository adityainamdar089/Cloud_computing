import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { markDayComplete, setCurrentDay } from "../redux/reducers/workoutPlanSlice";
import { CheckCircle, Circle, CalendarToday, TrendingUp } from "@mui/icons-material";

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
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 16px 40px ${({ theme }) => theme.shadow};
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.text_primary};
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 8px;
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.bgLight};
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid ${({ theme }) => theme.text_secondary + "20"};
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text_secondary};
  font-weight: 500;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.primary};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: ${({ theme }) => theme.text_secondary + "20"};
  border-radius: 6px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, ${({ theme }) => theme.primary} 0%, ${({ theme }) => theme.secondary} 100%);
  border-radius: 6px;
  transition: width 0.3s ease;
  width: ${({ progress }) => progress}%;
`;

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const DayCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 24px ${({ theme }) => theme.shadow};
  border: 2px solid ${({ isActive, isComplete, theme }) => 
    isActive ? theme.primary : isComplete ? theme.secondary : theme.text_secondary + "20"};
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px ${({ theme }) => theme.shadow};
  }
`;

const DayHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const DayTitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.text_primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DayStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${({ isComplete, theme }) => isComplete ? theme.secondary : theme.text_secondary};
  font-weight: 500;
`;

const WorkoutList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const WorkoutItem = styled.div`
  background: ${({ theme }) => theme.bgLight};
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid ${({ theme }) => theme.primary};
`;

const WorkoutLine = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text_primary};
  line-height: 1.6;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
`;

const EmptyState = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 24px;
  padding: 64px 32px;
  text-align: center;
  box-shadow: 0 16px 40px ${({ theme }) => theme.shadow};
`;

const EmptyTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.text_primary};
  margin-bottom: 12px;
`;

const EmptyText = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.text_secondary};
  margin-bottom: 24px;
`;

const Button = styled.button`
  padding: 14px 28px;
  border-radius: 16px;
  border: none;
  background: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.white};
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const YourWorkout = () => {
  const dispatch = useDispatch();
  const { workoutPlan, startDate, duration, frequency, weeklySchedule, completedDays, currentDay } = 
    useSelector((state) => state.workoutPlan);

  const [selectedDay, setSelectedDay] = useState(currentDay || 1);

  // Calculate progress
  const progress = useMemo(() => {
    if (!duration) return 0;
    return Math.round((completedDays.length / duration) * 100);
  }, [completedDays.length, duration]);

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (!duration) return 0;
    return duration - completedDays.length;
  }, [duration, completedDays.length]);

  // Get workout for a specific day
  const getWorkoutForDay = useMemo(() => {
    return (dayNumber) => {
      if (!weeklySchedule || weeklySchedule.length === 0) return null;
      // Rotate through weekly schedule
      const dayIndex = ((dayNumber - 1) % weeklySchedule.length);
      return weeklySchedule[dayIndex];
    };
  }, [weeklySchedule]);

  // Generate all days for the program
  const allDays = useMemo(() => {
    if (!duration || !weeklySchedule) return [];
    const days = [];
    for (let i = 1; i <= duration; i++) {
      const workout = getWorkoutForDay(i);
      days.push({
        day: i,
        workout: workout,
        isComplete: completedDays.includes(i),
        isActive: i === selectedDay,
      });
    }
    return days;
  }, [duration, weeklySchedule, completedDays, selectedDay, getWorkoutForDay]);

  // Get selected workout - must be before early return
  const selectedWorkout = useMemo(() => {
    return getWorkoutForDay(selectedDay);
  }, [selectedDay, getWorkoutForDay]);

  const handleDayClick = (day) => {
    setSelectedDay(day);
    dispatch(setCurrentDay(day));
  };

  const handleToggleComplete = (day, e) => {
    e.stopPropagation();
    if (!completedDays.includes(day)) {
      dispatch(markDayComplete(day));
    }
  };

  if (!workoutPlan || !weeklySchedule || weeklySchedule.length === 0) {
    return (
      <Page>
        <Content>
          <EmptyState>
            <EmptyTitle>No Workout Plan Found</EmptyTitle>
            <EmptyText>
              Generate a personalized workout plan using the AI Fitness Coach to get started!
            </EmptyText>
            <Button onClick={() => window.location.href = "/gemini-suggestions"}>
              Create Workout Plan
            </Button>
          </EmptyState>
        </Content>
      </Page>
    );
  }

  return (
    <Page>
      <Content>
        <Header>
          <Title>Your Workout Plan</Title>
          <StatsRow>
            <StatCard>
              <StatLabel>
                <CalendarToday style={{ fontSize: 18, marginRight: 8 }} />
                Program Duration
              </StatLabel>
              <StatValue>{duration} days</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>
                <TrendingUp style={{ fontSize: 18, marginRight: 8 }} />
                Days Completed
              </StatLabel>
              <StatValue>{completedDays.length} / {duration}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Days Remaining</StatLabel>
              <StatValue>{daysRemaining}</StatValue>
            </StatCard>
            <StatCard>
              <StatLabel>Progress</StatLabel>
              <StatValue>{progress}%</StatValue>
              <ProgressBar>
                <ProgressFill progress={progress} />
              </ProgressBar>
            </StatCard>
          </StatsRow>
        </Header>

        <DayCard style={{ marginBottom: 0 }}>
          <DayHeader>
            <DayTitle>
              Day {selectedDay} - Workout Details
            </DayTitle>
            <DayStatus
              isComplete={completedDays.includes(selectedDay)}
              onClick={(e) => handleToggleComplete(selectedDay, e)}
              style={{ cursor: "pointer" }}
            >
              {completedDays.includes(selectedDay) ? (
                <>
                  <CheckCircle style={{ color: "#4caf50" }} />
                  Completed
                </>
              ) : (
                <>
                  <Circle />
                  Mark as Complete
                </>
              )}
            </DayStatus>
          </DayHeader>
          {selectedWorkout && selectedWorkout.workouts && selectedWorkout.workouts.length > 0 ? (
            <WorkoutList>
              {selectedWorkout.workouts.map((workout, index) => (
                <WorkoutItem key={index}>
                  <WorkoutLine>{workout}</WorkoutLine>
                </WorkoutItem>
              ))}
            </WorkoutList>
          ) : (
            <div style={{ color: "#999", textAlign: "center", padding: "20px" }}>
              Rest Day - No workouts scheduled
            </div>
          )}
        </DayCard>

        <div>
          <Title style={{ fontSize: 24, marginBottom: 20 }}>All Days</Title>
          <DaysGrid>
            {allDays.map((dayData) => (
              <DayCard
                key={dayData.day}
                isActive={dayData.isActive}
                isComplete={dayData.isComplete}
                onClick={() => handleDayClick(dayData.day)}
              >
                <DayHeader>
                  <DayTitle>Day {dayData.day}</DayTitle>
                  <DayStatus isComplete={dayData.isComplete}>
                    {dayData.isComplete ? (
                      <CheckCircle style={{ color: "#4caf50" }} />
                    ) : (
                      <Circle />
                    )}
                  </DayStatus>
                </DayHeader>
                {dayData.workout && dayData.workout.workouts ? (
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {dayData.workout.workouts.length} workout{dayData.workout.workouts.length !== 1 ? 's' : ''}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#999" }}>Rest Day</div>
                )}
              </DayCard>
            ))}
          </DaysGrid>
        </div>
      </Content>
    </Page>
  );
};

export default YourWorkout;

