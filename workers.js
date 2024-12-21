export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/login") {
      return handleLogin();
    } else if (url.pathname === "/callback") {
      return handleCallback(request);
    } else {
      return new Response("Not Found", { status: 404 });
    }
  },
};

const DISCORD_CLIENT_ID = "Clientid";
const DISCORD_CLIENT_SECRET = "Secret";
const DISCORD_REDIRECT_URI = "URI";
const DISCORD_GUILD_ID = "SERVERID";
const DISCORD_ROLE_ID = "Roleid";
const DISCORD_BOT_TOKEN = "Tokn";

async function handleLogin() {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify guilds.join",
  });

  return Response.redirect(`https://discord.com/api/oauth2/authorize?${params}`, 302);
}

async function handleCallback(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing code parameter", { status: 400 });
  }

  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: DISCORD_REDIRECT_URI,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!tokenResponse.ok) {
    const errorDetails = await tokenResponse.text();
    console.error("Token request failed:", errorDetails);
    return new Response(`Failed to fetch access token: ${errorDetails}`, { status: tokenResponse.status });
  }

  const tokenData = await tokenResponse.json();
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!userResponse.ok) {
    return new Response("Failed to fetch user data", { status: userResponse.status });
  }

  const userData = await userResponse.json();

   const roleResponse = await fetch(
    `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userData.id}/roles/${DISCORD_ROLE_ID}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!roleResponse.ok) {
    const errorDetails = await roleResponse.text();
    console.error("Role assignment failed:", errorDetails);
    return new Response(`Failed to assign role: ${errorDetails}`, { status: roleResponse.status });
  }

  return new Response("Role assigned successfully!");
}
