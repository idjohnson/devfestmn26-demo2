const crypto = require('crypto');
const cookie = require('cookie');

const GOOGLE_CLIENT_ID = () => process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = () => process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = () => process.env.GOOGLE_REDIRECT_URI || '';
const SESSION_SECRET = () => process.env.SESSION_SECRET || 'dev-insecure-session-secret-change-in-prod';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

function signSession(data, secret = SESSION_SECRET()) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifySession(token, secret = SESSION_SECRET()) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (signature.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function getRedirectUri(req) {
  if (GOOGLE_REDIRECT_URI()) return GOOGLE_REDIRECT_URI();
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host');
  return `${protocol}://${host}/auth/google/callback`;
}

function getUserFromRequest(req) {
  const header = req.headers.cookie;
  if (!header) return null;
  const cookies = cookie.parse(header);
  if (!cookies.session) return null;
  return verifySession(cookies.session);
}

function attachAuthRoutes(app) {
  // Return current user status
  app.get('/api/auth/me', (req, res) => {
    const user = getUserFromRequest(req);
    res.json({
      authenticated: Boolean(user),
      user: user || null,
      idpConfigured: Boolean(GOOGLE_CLIENT_ID() && GOOGLE_CLIENT_SECRET()),
    });
  });

  // Initiate Google OIDC Flow
  app.get('/auth/google', (req, res) => {
    const clientId = GOOGLE_CLIENT_ID();
    const clientSecret = GOOGLE_CLIENT_SECRET();

    if (!clientId || !clientSecret) {
      return res.redirect('/?auth_error=idp_not_configured');
    }

    const state = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');
    const redirectUri = getRedirectUri(req);

    // Save state in signed cookie
    const stateCookie = signSession({ state, nonce });
    res.setHeader('Set-Cookie', cookie.serialize('oauth_state', stateCookie, {
      httpOnly: true,
      maxAge: 300, // 5 minutes
      path: '/',
      sameSite: 'lax',
    }));

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      nonce,
      access_type: 'online',
      prompt: 'select_account',
    });

    res.redirect(`${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
  });

  // Google OIDC Callback
  app.get('/auth/google/callback', async (req, res) => {
    const { code, state, error } = req.query;
    if (error) {
      console.error('Google auth error:', error);
      return res.redirect(`/?auth_error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return res.redirect('/?auth_error=missing_code_or_state');
    }

    // Verify state cookie
    const rawCookies = cookie.parse(req.headers.cookie || '');
    const stateData = verifySession(rawCookies.oauth_state);
    if (!stateData || stateData.state !== state) {
      return res.redirect('/?auth_error=invalid_state');
    }

    try {
      const redirectUri = getRedirectUri(req);
      const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID(),
          client_secret: GOOGLE_CLIENT_SECRET(),
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenRes.json();
      if (!tokenRes.ok || !tokens.access_token) {
        console.error('Token exchange failed:', tokens);
        return res.redirect('/?auth_error=token_exchange_failed');
      }

      // Fetch user profile from OIDC userinfo endpoint
      const userRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await userRes.json();

      if (!userRes.ok || !profile.sub) {
        console.error('UserInfo failed:', profile);
        return res.redirect('/?auth_error=userinfo_failed');
      }

      const sessionToken = signSession({
        sub: profile.sub,
        name: profile.name || profile.email || 'Clinician',
        email: profile.email || '',
        picture: profile.picture || '',
      });

      res.setHeader('Set-Cookie', [
        cookie.serialize('session', sessionToken, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60, // 7 days
          path: '/',
          sameSite: 'lax',
        }),
        cookie.serialize('oauth_state', '', {
          httpOnly: true,
          maxAge: 0,
          path: '/',
        }),
      ]);

      res.redirect('/');
    } catch (err) {
      console.error('OAuth callback processing error:', err);
      res.redirect('/?auth_error=auth_failed');
    }
  });

  // Demo / Dev Mode Login (when Google credentials are not yet configured)
  app.post('/auth/dev-login', (req, res) => {
    const name = (req.body && req.body.name) || 'Dr. Isaac Johnson, MD';
    const email = (req.body && req.body.email) || 'isaac.johnson@hospital.org';

    const sessionToken = signSession({
      sub: 'dev-user-123',
      name,
      email,
      picture: '',
      isDev: true,
    });

    res.setHeader('Set-Cookie', cookie.serialize('session', sessionToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    }));

    res.json({ status: 'ok', user: { name, email } });
  });

  // Logout
  app.all('/auth/logout', (req, res) => {
    res.setHeader('Set-Cookie', cookie.serialize('session', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    }));
    res.redirect('/');
  });
}

module.exports = {
  signSession,
  verifySession,
  getUserFromRequest,
  attachAuthRoutes,
  GOOGLE_AUTH_ENDPOINT,
  GOOGLE_TOKEN_ENDPOINT,
  GOOGLE_USERINFO_ENDPOINT,
};
