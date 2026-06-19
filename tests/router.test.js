import { expect, test, describe } from "bun:test";
import Router from "../core/Router.js";

describe("Router", () => {
  test("static route match", () => {
    const router = new Router();
    router.get("/contact", () => new Response("contact!"));

    const match = router.match("GET", "/contact");
    expect(match).not.toBeNull();
  });

  test("dynamic route match", () => {
    const router = new Router();
    router.get("/user/:id", (params) => new Response(`User ${params.id}`));

    const match = router.match("GET", "/user/42");
    expect(match).not.toBeNull();
    expect(match.params.id).toBe("42");
  });

  test("no match returns notFound", () => {
    const router = new Router();
    router.notFound(() => new Response("404"));

    const match = router.match("GET", "/random");
    expect(match).not.toBeNull();
    expect(match.handler()).toBeInstanceOf(Response);
  });
});
