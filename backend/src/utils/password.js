import bcrypt from "bcrypt";

/**
 * Password hashing lives on its own so that services which need to *verify* a
 * password, without owning the hashing policy, do not have to reach for bcrypt.
 * userService uses this for admin re-authentication and never imports bcrypt.
 *
 * Cost 12 is deliberate. Each verification takes roughly a quarter of a second,
 * which is imperceptible for a person signing in and ruinous for an attacker
 * attempting thousands of guesses per second. A fast hash such as SHA-256 is a
 * liability for passwords, which is exactly why it is not used here.
 */
const BCRYPT_COST = 12;

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_COST);

export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);
