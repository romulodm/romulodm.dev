import { apiRequest } from "./config";

export const googleAuth = async (data) => {
  try {
    return await apiRequest.post("/auth/google-auth", data);
  } catch (err) {
    return err
  }
};