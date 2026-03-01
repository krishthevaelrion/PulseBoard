import fetch from "node-fetch";

export async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data: any = {}
) {
  const message = {
    to: token,
    sound: "default",
    title,
    body,
    data,
  };

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  return response.json();
}