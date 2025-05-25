import axios from "axios";

const CLIENT_ID = process.env.OAUTH_GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_GITHUB_CLIENT_SECRET;
const REDIRECT_URI =
  "https://auth-provider-bribella-pls-projects.vercel.app/api/oauth";
const ALLOWED_USER = process.env.ALLOWED_GITHUB_USER;

export default async function handler(req, res) {
  const { provider, code, state } = req.query;

  if (provider === "github" && !code) {
    const authUrl =
      "https://github.com/login/oauth/authorize" +
      `?client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=repo`;

    console.log("Redirecting to:", authUrl);
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
        console.warn("Token exchange failed", tokenResponse);
        return res.status(401).json({ error: "Token exchange failed" });
      }

      const userResponse = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${accessToken}` },
      });

      const login = userResponse.data.login;
      if (login !== ALLOWED_USER) {
        console.warn("User not allowed", userResponse);
        return res
          .status(403)
          .send(`<p>Unauthorized: ${login} is not allowed</p>`);
      }

      return res.status(200).setHeader("Content-Type", "text/html")
        .send(`<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><title>Authorize Complete</title></head>
  <body>
    <script>
      window.opener.postMessage(
        {
          type: "authorization_response",
          data: { token: "{{token}}" }
        },
        "*"
      );
      window.close();
    </script>
    <p>Logowanie zakończone. Możesz zamknąć to okno.</p>
  </body>
</html>`);
    } catch (err) {
      console.warn("400", err);

      return res
        .status(500)
        .json({ error: "OAuth exchange failed", details: err.message });
    }
  } else {
    console.warn("400", res);
    return res
      .status(400)
      .json({ error: "Missing code or unsupported provider" });
  }
}
