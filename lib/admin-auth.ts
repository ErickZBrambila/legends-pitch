export {
  getAdminSession,
  createAdminSession,
  verifyAdminSessionToken,
  ADMIN_COOKIE as COOKIE_NAME,
  type AdminAccount,
  type AdminRole,
} from "./admin-accounts";

// Legacy export kept for any direct import of COOKIE_NAME
export { ADMIN_COOKIE } from "./admin-accounts";
