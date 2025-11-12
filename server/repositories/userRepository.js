import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import docClient from "../lib/dynamoClient.js";

const USERS_TABLE = process.env.USERS_TABLE;
const USER_EMAIL_INDEX = process.env.USER_EMAIL_INDEX || "email-index";

const normalizeUserItem = (item) => {
  if (!item) return null;
  const {
    userId,
    name,
    email,
    img,
    passwordHash,
    createdAt,
    updatedAt,
    status = "active",
  } = item;

  return {
    _id: userId,
    userId,
    name,
    email,
    img,
    passwordHash,
    createdAt,
    updatedAt,
    status,
  };
};

export const createUser = async ({ name, email, passwordHash, img }) => {
  const timestamp = new Date().toISOString();
  const userId = uuid();

  const item = {
    userId,
    name,
    email: email.toLowerCase(),
    img,
    passwordHash,
    status: "active",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await docClient.send(
    new PutCommand({
      TableName: USERS_TABLE,
      Item: item,
      ConditionExpression: "attribute_not_exists(userId)",
    })
  );

  return normalizeUserItem(item);
};

export const getUserById = async (userId) => {
  const response = await docClient.send(
    new GetCommand({
      TableName: USERS_TABLE,
      Key: { userId },
    })
  );
  return normalizeUserItem(response.Item);
};

export const getUserByEmail = async (email) => {
  const response = await docClient.send(
    new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: USER_EMAIL_INDEX,
      Limit: 1,
      KeyConditionExpression: "#email = :email",
      ExpressionAttributeNames: {
        "#email": "email",
      },
      ExpressionAttributeValues: {
        ":email": email.toLowerCase(),
      },
    })
  );
  return normalizeUserItem(response.Items?.[0]);
};

