import bcrypt from "bcryptjs";
export async function hashKey(key) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(key, salt);
}
export async function verifyKey(key, hash) {
  return bcrypt.compare(key, hash);
}
