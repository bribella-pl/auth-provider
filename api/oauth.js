import axios from "axios";

const CLIENT_ID = process.env.OAUTH_GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_GITHUB_CLIENT_SECRET;
const REDIRECT_URI =
  "https://auth-provider-bribella-pls-projects.vercel.app/api/oauth";
const ALLOWED_USER = process.env.ALLOWED_GITHUB_USER;

export default async function handler(req, res) {
  console.log("OAuth callback hit, query:", req.query);
  const { provider, code, state } = req.query;

  if (provider === "github" && !code) {
    const authUrl =
      "https://github.com/login/oauth/authorize" +
      `?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=repo`;
    return res.redirect(authUrl);
  }

  if (code) {
    try {
      const tokenResponse = await axios.post(
        "https://github.com/login/oauth/access_token",
        { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code, state },
        { headers: { Accept: "application/json" } }
      );
      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        return res.status(401).json({ error: "Token exchange failed" });
      }

      const userResponse = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${accessToken}` },
      });

      const login = userResponse.data.login;
      if (login !== ALLOWED_USER) {
        return res
          .status(403)
          .send(`<p>Unauthorized: ${login} is not allowed</p>`);
      }

      return res
        .status(302)
        .setHeader(
          "Location",
          `https://bribella-pl.github.io/bribella-react/admin?token=${accessToken}`
        )
        .end();
    } catch (err) {
      return res
        .status(500)
        .json({ error: "OAuth exchange failed", details: err.message });
    }
  } else {
    return res
      .status(400)
      .json({ error: "Missing code or unsupported provider" });
  }
}
