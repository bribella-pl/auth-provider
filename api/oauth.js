import axios from "axios";

export default async function handler(req, res) {
  console.log("func start");

  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.OAUTH_GITHUB_CLIENT_ID,
        client_secret: process.env.OAUTH_GITHUB_CLIENT_SECRET,
        code,
        state,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const token = response.data.access_token;
    if (!token) {
      return res.status(401).json({ error: "Token exchange failed" });
    }

    res.status(200).json({ token });
  } catch (err) {
    res
      .status(500)
      .json({ error: "OAuth exchange failed", details: err.message });
  }
}
