-- Local credentials are optional so OAuth-only identities remain supported.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;
