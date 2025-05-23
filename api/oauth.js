import axios from "axios";

const CLIENT_ID = process.env.OAUTH_GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_GITHUB_CLIENT_SECRET;
const REDIRECT_URI =
  "https://auth-provider-bribella-pls-projects.vercel.app/api/oauth";

export default async function handler(req, res) {
  const { provider, scope, code, state } = req.query;

  if (provider === "github" && !code) {
    const authUrl =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(scope)}`;

    return res.redirect(authUrl);
  }

  if (code) {
    try {
      const tokenRes = await axios.post(
        "https://github.com/login/oauth/access_token",
        { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, state },
        { headers: { Accept: "application/json" } }
      );
      const accessToken = tokenRes.data.access_token;
      if (!accessToken) {
        return res.status(401).json({ error: "Token exchange failed" });
      }
      return res.status(200).json({ token: accessToken });
    } catch (err) {
      return res
        .status(500)
        .json({ error: "OAuth exchange failed", details: err.message });
    }
  }

  return res
    .status(400)
    .json({ error: "Missing code or unsupported provider" });
}
