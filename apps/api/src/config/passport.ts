import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '@thulobazaar/database';
import config from './index.js';
import { generateShopSlug } from '../utils/shopSlug.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: `${config.BACKEND_URL}/api/auth/callback/google`,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('Email not found in Google profile'), undefined);
        }

        // Get profile picture from Google
        const avatar = profile.photos?.[0]?.value || null;

        console.log('🔐 [Passport] Google OAuth - Processing user:', email);
        console.log('🔐 [Passport] Profile picture:', avatar);

        let user = await prisma.users.findUnique({
          where: { email },
        });

        // Google OAuth registers on first login, so the frontend cannot tell a
        // signup from a returning login without being told. Counting returning
        // logins as signups would inflate the conversion ad platforms bid on.
        const isNewUser = !user;

        if (!user) {
          // Create new user with avatar
          user = await prisma.users.create({
            data: {
              email,
              full_name: profile.displayName,
              password_hash: '', // OAuth users don't have passwords
              avatar: avatar,
              oauth_provider: 'google',
              oauth_provider_id: profile.id,
              is_active: true,
              role: 'user',
              account_type: 'individual',
            },
          });

          // Update with shop_slug that includes user ID
          user = await prisma.users.update({
            where: { id: user.id },
            data: { shop_slug: generateShopSlug(profile.displayName, user.id) },
          });

          console.log('🔐 [Passport] New user created:', user.id);
        } else {
          // Update existing user - update avatar if not set, and oauth_provider if not linked
          const updateData: any = {
            last_login: new Date(),
          };

          // Update avatar if user doesn't have one
          if (!user.avatar && avatar) {
            updateData.avatar = avatar;
          }

          // Set oauth_provider if not set (link Google account to existing user)
          if (!user.oauth_provider) {
            updateData.oauth_provider = 'google';
            updateData.oauth_provider_id = profile.id;
          }

          user = await prisma.users.update({
            where: { id: user.id },
            data: updateData,
          });

          console.log('🔐 [Passport] Existing user updated:', user.id);
        }

        // Transform Prisma user to Express.User format
        return done(null, {
          userId: user.id,
          email: user.email,
          role: user.role || 'user',
          isNewUser,
        });
      } catch (error) {
        console.error('🔐 [Passport] OAuth error:', error);
        return done(error, undefined);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, user.userId);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const dbUser = await prisma.users.findUnique({ where: { id } });
    if (dbUser) {
      done(null, {
        userId: dbUser.id,
        email: dbUser.email,
        role: dbUser.role || 'user',
      });
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

export default passport;
