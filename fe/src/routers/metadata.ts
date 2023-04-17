export type TRouterMetadata = {
  page: string;
  path: string;
  layout: string;
  auth: boolean;
};

const metadata: TRouterMetadata[] = [
  {
    page: "sign_up",
    path: "/sign_up",
    layout: "non_auth",
    auth: false,
  },
  {
    page: "login",
    path: "/login",
    layout: "non_auth",
    auth: false,
  },
];

export default metadata;
