import { Router } from "express";
import { authRouter } from "../auth/auth.router.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.router.js";
import { usersRouter } from "../modules/users/users.router.js";
import { locationsRouter } from "../modules/locations/locations.router.js";
import { vehiclesRouter } from "../modules/vehicles/vehicles.router.js";
import { reservationsRouter } from "../modules/reservations/reservations.router.js";
import { reservationRequestsRouter } from "../modules/reservationRequests/reservationRequests.router.js";
import { conflictsRouter } from "../modules/conflicts/conflicts.router.js";
import { infosRouter } from "../modules/infos/infos.router.js";
import { commentsRouter } from "../modules/comments/comments.router.js";
import { odometerRouter } from "../modules/odometer/odometer.router.js";
import { permissionsRouter } from "../modules/permissions/permissions.router.js";
import { notificationsRouter } from "../modules/notifications/notifications.router.js";
import { filesRouter } from "../modules/files/files.router.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/locations", locationsRouter);
apiRouter.use("/vehicles", vehiclesRouter);
apiRouter.use("/reservations", reservationsRouter);
apiRouter.use("/reservation-requests", reservationRequestsRouter);
apiRouter.use("/conflicts", conflictsRouter);
apiRouter.use("/infos", infosRouter);
apiRouter.use("/comments", commentsRouter);
apiRouter.use("/odometer", odometerRouter);
apiRouter.use("/permissions", permissionsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/files", filesRouter);
