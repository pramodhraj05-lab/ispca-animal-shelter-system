/**
 * UNIT TEST — backend/middleware/auth.js
 * Tests authMiddleware in isolation (no DB or HTTP server).
 */

const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../backend/middleware/auth");

const SECRET = "pawhaven_secret_2024";

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("authMiddleware", () => {
  test("calls next() and sets req.user when a valid token is provided", () => {
    const token = jwt.sign({ id: 1, email: "user@ispca.ie", role: "customer" }, SECRET, { expiresIn: "1h" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.email).toBe("user@ispca.ie");
    expect(res.status).not.toHaveBeenCalled();
  });

  test("returns 401 when no Authorization header is present", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
