import * as jwt from "jsonwebtoken";

import metrics from "../metrics";

/**
 * Function to get the token from the header
 * @param req - Express Request Object
 * @returns token
 */
export async function getTokenFromHeader(req: any) {
  const tsStart = Date.now();
  metrics.increment("functions.jwt.getTokenFromHeader");

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const tsEnd = Date.now();
  metrics.timing("functions.jwt.getTokenFromHeader", tsEnd - tsStart);

  return token;
}

/**
 * Function to authenticate the token
 * @param req - Express Request Object
 * @param res - Express Response Object
 * @param next - Express Next Function
 * @returns void
 */
export async function authenticateToken(req: any, res: any, next: any) {
  const tsStart = Date.now();
  metrics.increment("functions.jwt.authenticateToken");

  const token = await getTokenFromHeader(req);
  if (token == null) return res.sendStatus(401);

  jwt.verify(
    token,
    process.env.JWT_SECRET! as string,
    (err: any, user: any) => {
      if (err) {
        console.log(err);
        return res.sendStatus(403);
      }

      req.user = user;

      const tsEnd = Date.now();
      metrics.timing("functions.jwt.authenticateToken", tsEnd - tsStart);
      next();
    },
  );
}

/**
 * Function to generate an access token
 * @param user - User object
 * @returns token
 */
export async function generateAccessToken(user: any) {
  const tsStart = Date.now();
  metrics.increment("functions.jwt.generateAccessToken");

  let token = jwt.sign(
    {
      id: user.id,
      uuid: user.uuid,
    },
    process.env.JWT_SECRET!,
  );
  const tsEnd = Date.now();
  metrics.timing("functions.jwt.generateAccessToken", tsEnd - tsStart);
  return token;
}

/**
 * Function to get the user info
 * @param prisma - Prisma Client
 * @param res - Express Response Object
 * @param req - Express Request Object
 * @returns user
 */
export async function getUserInfo(prisma: any, res: any, req: any) {
  const tsStart = Date.now();
  metrics.increment("functions.jwt.getUserInfo");

  const token = await getTokenFromHeader(req);

  // decode the token
  let decoded = jwt.decode(token);
  // @ts-expect-error
  let id = decoded!.id;
  id = id as string;

  let user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  const tsEnd = Date.now();
  metrics.timing("functions.jwt.getUserInfo", tsEnd - tsStart);

  return user;
}
