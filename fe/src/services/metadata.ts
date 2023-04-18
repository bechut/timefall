import { axiosCallee, timefallInstance } from "./api";

const metadata = [
  {
    root: "auth",
    instance: timefallInstance,
    child: [
      {
        method: axiosCallee("post"),
        uri: "/auth/sign_up",
        name: "sign_up",
      },
      {
        method: axiosCallee("post"),
        uri: "/auth/resend",
        name: "resend",
      },
      {
        method: axiosCallee("post"),
        uri: "/auth/verify",
        name: "verify",
      },
      {
        method: axiosCallee("post"),
        uri: "/auth/login",
        name: "login",
      },
      {
        method: axiosCallee("post"),
        uri: "/auth/login-with-google",
        name: "login_with_google",
      },
    ],
  },
  // {
  //   root: "workspace",
  //   instance: timefallInstance,
  //   child: [
  //     {
  //       method: axiosCallee("get"),
  //       uri: "/api/workspaces",
  //       name: "workspaces",
  //     }
  //   ]
  // }
];

export default metadata;
