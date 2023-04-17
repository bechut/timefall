import { Button, Form, Input, Typography, Divider, notification } from "antd";
import React, { FC, memo, useState } from "react";
import "./index.css";
import { helpers } from "helpers";
import { Props } from "routers";
import { Link, NavigateFunction } from "react-router-dom";
import OtpInput from "components/OtpInput";
import { ReduxDispatchHelper, TRDHResponse } from "helpers/reduxDispatch";
import cookie from "react-cookies";
import { TOKEN_NAME } from "services/api";

type TPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export const phases = {
  1: "sign_up",
  2: "verify",
};

export const onVerify = (
  otp: string,
  token: string,
  navigate: NavigateFunction
) => {
  const payload = {
    otp,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  new ReduxDispatchHelper<{
    otp: string;
    headers: { Authorization: string };
  }>(
    "verify",
    payload,
    (payload: TRDHResponse) => {
      notification.success({ message: payload.message });
      const { token, expired } = payload.data;
      if (token) {
        cookie.save(TOKEN_NAME.timeFallAccessToken, token, {
          maxAge: 60 * expired,
          path: "/",
        });
        setTimeout(() => navigate("/"), 1000);
      } else {
        setTimeout(() => navigate("/login"), 1000);
      }
    },
    (errors: TRDHResponse) => {
      return notification.error({
        message: errors.message || "Something went wrong. Please try again",
      });
    }
  ).do();
};

export const onResend = (token: string, setToken: any) => {
  const payload = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  new ReduxDispatchHelper<{
    headers: { Authorization: string };
  }>(
    "resend",
    payload,
    (payload: TRDHResponse) => {
      notification.success({ message: payload.message });
      setToken(payload.data.token);
    },
    (errors: TRDHResponse) => {
      return notification.error({
        message: errors.message || "Something went wrong. Please try again",
      });
    }
  ).do();
};

const SignUp: FC<Props> = (props) => {
  const [form] = Form.useForm();
  const [phase, setPhase] = useState<string>(phases[1]);
  const [otp, setOtp] = useState<string>("");
  const [token, setToken] = useState<string>("");

  const onFinish = (values: TPayload) => {
    values = {
      ...values,
      password: helpers.encrypt_AES(values.password),
    };
    new ReduxDispatchHelper<{ email: string; password: string }>(
      "sign_up",
      values,
      (payload: TRDHResponse) => {
        setPhase(phases[2]);
        setToken(payload.data.token);
        form.resetFields();
        return notification.success({ message: payload.message });
      },
      (errors: TRDHResponse) => {
        return notification.error({
          message: errors.message || "Something went wrong. Please try again",
        });
      }
    ).do();
  };

  let component = <div />;

  if (phase === phases[1])
    component = (
      <Form
        onFinish={onFinish}
        colon={false}
        labelAlign="left"
        labelCol={{ sm: 5 }}
        form={form}
        requiredMark={false}
      >
        <Typography.Title level={2}>Sign up</Typography.Title>

        <Form.Item
          rules={[{ type: "email" }, { required: true }]}
          label="Email"
          name="email"
        >
          <Input autoComplete="off" autoCorrect="off" />
        </Form.Item>

        <Form.Item
          rules={[{ required: true }]}
          label="Password"
          name="password"
        >
          <Input.Password autoComplete="off" autoCorrect="off" />
        </Form.Item>

        <Form.Item
          rules={[{ required: true }]}
          label="First name"
          name="first_name"
        >
          <Input />
        </Form.Item>

        <Form.Item
          rules={[{ required: true }]}
          label="Last name"
          name="last_name"
        >
          <Input />
        </Form.Item>

        <Button
          style={{ padding: "0", margin: "0 0 12px 0" }}
          type="link"
          htmlType="button"
        >
          Forgot your password?
        </Button>

        <Button
          loading={props.states.sign_up.loading}
          block
          type="primary"
          htmlType="submit"
        >
          Continue
        </Button>

        <Divider style={{ margin: "32px 0" }}> OR </Divider>
        <div>
          <Link to="/login">
            <Button
              style={{ padding: "0", margin: "0 0 12px 0" }}
              type="link"
              htmlType="button"
              block
              loading={props.states.verify.loading}
            >
              Already have an account? Sign In
            </Button>
          </Link>
        </div>
      </Form>
    );

  if (phase === phases[2])
    component = (
      <>
        <OtpInput onChange={setOtp} otp={otp} />
        <Button
          loading={props.states.verify.loading}
          block
          type="primary"
          htmlType="button"
          onClick={() => onVerify(otp, token, props.navigate)}
        >
          Verify
        </Button>
        <Button
          style={{ margin: "7px 0" }}
          loading={props.states.resend.loading}
          block
          type="link"
          htmlType="button"
          onClick={() => onResend(token, setToken)}
        >
          Don't receive the otp? Resend
        </Button>
      </>
    );

  return <>{component}</>;
};

export default memo(SignUp);
