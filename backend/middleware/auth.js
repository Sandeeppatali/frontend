import jwt from "jsonwebtoken";

export default function auth(roles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ msg: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "Invalid token format" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
      req.user = decoded;

      // ✅ role check
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ msg: "Forbidden" });
      }

      next();
    } catch (err) {
      res.status(401).json({ msg: "Token is invalid or expired" });
    }
  };
}

