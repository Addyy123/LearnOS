import crypto from "crypto"

export function generateToken(): string {
  // Generates a random secure hex string to serve as our token
  return crypto.randomBytes(32).toString("hex")
}
