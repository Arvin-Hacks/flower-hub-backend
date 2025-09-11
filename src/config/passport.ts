import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../database';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error';

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
      scope: ['openid', 'profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.info('Google OAuth callback received', { 
          profileId: profile.id,
          email: profile.emails?.[0]?.value 
        });

        const email = profile.emails?.[0]?.value;
        const firstName = profile.name?.givenName || '';
        const lastName = profile.name?.familyName || '';
        const avatar = profile.photos?.[0]?.value || '';
        const googleId = profile.id;

        if (!email) {
          return done(new AppError('No email found in Google profile', 400), undefined);
        }

        // Check if user exists with this email
        let user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isEmailVerified: true,
            avatar: true,
            provider: true,
            providerId: true,
          },
        });

        if (user) {
          // User exists - update Google info if needed
          if (user.provider === 'LOCAL') {
            // Link Google account to existing local account
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                provider: 'GOOGLE',
                providerId: googleId,
                avatar: avatar || user.avatar,
                isEmailVerified: true, // Google emails are verified
              },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isEmailVerified: true,
                avatar: true,
                provider: true,
                providerId: true,
              },
            });
            
            logger.info('Linked Google account to existing user', { userId: user.id });
          } else if (user.provider === 'GOOGLE') {
            // Update existing Google user info
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                firstName: firstName || user.firstName,
                lastName: lastName || user.lastName,
                avatar: avatar || user.avatar,
                providerId: googleId,
              },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isEmailVerified: true,
                avatar: true,
                provider: true,
                providerId: true,
              },
            });
            
            logger.info('Updated existing Google user', { userId: user.id });
          }
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              firstName,
              lastName,
              role: 'USER',
              provider: 'GOOGLE',
              providerId: googleId,
              avatar,
              isEmailVerified: true, // Google emails are verified
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isEmailVerified: true,
              avatar: true,
              provider: true,
              providerId: true,
            },
          });
          
          logger.info('Created new Google user', { userId: user.id, email: user.email });
        }

        return done(null, user);
      } catch (error) {
        logger.error('Google OAuth error', { error: (error as Error).message });
        return done(error, undefined);
      }
    }
  )
);

// Serialize user for session (not used in JWT setup, but required by passport)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
        avatar: true,
        provider: true,
        providerId: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
