import { UserLog } from "../models/index.js";
export function userActionLogger(actionName) {
  return async (req, res, next) => {
    res.on("finish", async () => {
      try {
        if (req.user) {
          await UserLog.create({
            userId: req.user.id,
            action: actionName,
            metadata: {
              path: req.path,
              method: req.method,
              status: res.statusCode,
            },
          });
        }
      } catch {}
    });
    next();
  };
}
