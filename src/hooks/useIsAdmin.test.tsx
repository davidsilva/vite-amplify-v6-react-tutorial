import { renderHook, waitFor } from "@testing-library/react";
import { fetchAuthSession } from "aws-amplify/auth";
import useIsAdmin from "./useIsAdmin";
import { describe, test, expect, vi } from "vitest";
import { AsyncProcessStatus } from "../types";

vi.mock("aws-amplify/auth");

describe("useIsAdmin", () => {
  test("should set adminCheck to SUCCESS, with isAdmin to true", async () => {
    vi.mocked(fetchAuthSession).mockResolvedValueOnce({
      tokens: {
        accessToken: {
          payload: {
            "cognito:groups": ["adminUsers"],
          },
        },
      },
    });

    const { result } = renderHook(() => useIsAdmin());

    await waitFor(() =>
      expect(result.current.adminCheck).toEqual({
        status: AsyncProcessStatus.SUCCESS,
        value: { isAdmin: true },
      })
    );
  });

  test("should set adminCheck to SUCCESS, with isAdmin to false", async () => {
    vi.mocked(fetchAuthSession).mockResolvedValueOnce({
      tokens: {
        accessToken: {
          payload: {
            "cognito:groups": [],
          },
        },
      },
    });

    const { result } = renderHook(() => useIsAdmin());

    await waitFor(() =>
      expect(result.current.adminCheck).toEqual({
        status: AsyncProcessStatus.SUCCESS,
        value: { isAdmin: false },
      })
    );
  });

  test("should set adminCheck to SUCCESS and isAdmin to false if user is not signed in", async () => {
    vi.mocked(fetchAuthSession).mockRejectedValueOnce(
      new Error("User is not signed in")
    );

    const { result } = renderHook(() => useIsAdmin());

    await waitFor(() =>
      expect(result.current.adminCheck).toEqual({
        status: AsyncProcessStatus.SUCCESS,
        value: { isAdmin: false },
      })
    );
  });
});
