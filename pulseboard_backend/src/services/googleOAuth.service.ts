import { getGoogleClient } from "../utils/googleClient";

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