import "@testing-library/jest-dom/vitest";

process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:5000";
process.env.PORT ??= "4000";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
