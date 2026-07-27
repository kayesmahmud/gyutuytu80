declare global {
  namespace Express {
    interface User {
      userId: number;
      email: string;
      role?: string;
      /**
       * Set by the Google OAuth strategy when this callback created the
       * account rather than logging an existing user back in. Propagated to
       * the frontend so a sign_up conversion fires only for real registrations.
       */
      isNewUser?: boolean;
    }

    interface Request {
      user?: User;
      admin?: {
        id: number;
        email: string;
        role: string;
      };
      editor?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

export {};
