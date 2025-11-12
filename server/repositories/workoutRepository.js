import { BatchWriteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import docClient from "../lib/dynamoClient.js";

const WORKOUTS_TABLE = process.env.WORKOUTS_TABLE;
const MAX_BATCH_WRITE = 25;

const normalizeWorkoutItem = (item) => {
  if (!item) return null;
  return {
    workoutId: item.workoutId,
    userId: item.userId,
    workoutName: item.workoutName,
    category: item.category,
    sets: item.sets,
    reps: item.reps,
    weight: item.weight,
    duration: item.duration,
    caloriesBurned: item.caloriesBurned,
    createdAt: item.createdAt,
  };
};

export const putWorkouts = async (userId, workouts) => {
  if (!workouts.length) return [];

  const timestamp = new Date().toISOString();
  const items = workouts.map((workout) => ({
    PutRequest: {
      Item: {
        workoutId: uuid(),
        userId,
        workoutName: workout.workoutName,
        category: workout.category,
        sets: workout.sets,
        reps: workout.reps,
        weight: workout.weight,
        duration: workout.duration,
        caloriesBurned: workout.caloriesBurned,
        createdAt: workout.createdAt || timestamp,
      },
    },
  }));

  for (let i = 0; i < items.length; i += MAX_BATCH_WRITE) {
    const chunk = items.slice(i, i + MAX_BATCH_WRITE);
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [WORKOUTS_TABLE]: chunk,
        },
      })
    );
  }

  return items.map((entry) => normalizeWorkoutItem(entry.PutRequest.Item));
};

export const getWorkoutsWithinRange = async (userId, startISO, endISO) => {
  const response = await docClient.send(
    new QueryCommand({
      TableName: WORKOUTS_TABLE,
      KeyConditionExpression:
        "#userId = :userId AND #createdAt BETWEEN :start AND :end",
      ExpressionAttributeNames: {
        "#userId": "userId",
        "#createdAt": "createdAt",
      },
      ExpressionAttributeValues: {
        ":userId": userId,
        ":start": startISO,
        ":end": endISO,
      },
    })
  );
  return response.Items?.map(normalizeWorkoutItem) || [];
};

export const getWorkoutsForDay = async (userId, startISO, endISO) => {
  return getWorkoutsWithinRange(userId, startISO, endISO);
};

