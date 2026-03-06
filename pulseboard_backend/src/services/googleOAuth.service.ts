import { getGoogleClient } from "../utils/googleClient";

/**
 * Verifies a Google id_token (from Expo mobile OAuth implicit/token flow).
 * Mobile apps (Expo Go) get an id_token directly and pass it here.
 */
export const getGoogleUserFromIdToken = async (idToken: string) => {
  const client = getGoogleClient();

  const ticket = await client.verifyIdToken({
    idToken,
    audience: [
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_MOBILE_CLIENT_ID!
    ].filter(Boolean),
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error("Invalid Google token");

  return payload;
};

/**
 * Exchanges an authorization code for tokens, then verifies the id_token.
 * Used for server-side / web OAuth flows.
 */
export const getGoogleUser = async (code: string) => {
  const client = getGoogleClient();

  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error("Invalid Google token");

  return payload;
};