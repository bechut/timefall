import {
  Button,
  Form,
  Input,
  Typography,
  Divider,
  notification,
  Row,
} from "antd";
import React, { FC, memo, useEffect, useState } from "react";
import "./index.css";
import { helpers } from "helpers";
import { Props } from "routers";
import { Link } from "react-router-dom";
import { phases, onVerify, onResend } from "pages/sign_up";
import OtpInput from "components/OtpInput";
import { ReduxDispatchHelper, TRDHResponse } from "helpers/reduxDispatch";
import { GoogleLogin } from "@react-oauth/google";
import { TOKEN_NAME } from "services/api";
import cookie from "react-cookies";

interface TPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  headers?: {
    Authorization: string;
  };
}

export enum LinkGoogleType {
  NO_LINK,
  NO_LINK_NO_CREATED,
  LINKED,
}

const LogIn: FC<Props> = (props) => {
  const [form] = Form.useForm();
  const [phase, setPhase] = useState<string>(phases[1]);
  const [otp, setOtp] = useState<string>("");
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    setToken("");
  }, []);

  const onFinish = (values: TPayload) => {
    values = token
      ? // login to linked with google account
        {
          ...values,
          password: helpers.encrypt_AES(values.password),
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : // normal login
        {
          ...values,
          password: helpers.encrypt_AES(values.password),
        };
    new ReduxDispatchHelper<{ email: string; password: string }>(
      "login",
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

  const onGoogleLogin = (token: string) => {
    new ReduxDispatchHelper<{ headers: { Authorization: string } }>(
      "login_with_google",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (payload: TRDHResponse) => {
        console.log(payload)
        setToken(payload.data.token);
        if (payload.data.type === LinkGoogleType.NO_LINK_NO_CREATED) {
          setPhase(phases[2]);
        } else if (payload.data.type === LinkGoogleType.LINKED) {
          cookie.save(TOKEN_NAME.timeFallAccessToken, token, {
            maxAge: 60 * payload.data.expired,
            path: "/",
          });
          setTimeout(() => {
            props.navigate("/");
          }, 1000);
        }
        notification.success({ message: payload.message });
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
      >
        <Typography.Title level={2}>Log In</Typography.Title>

        <Form.Item label="Email" name="email">
          <Input autoComplete="off" autoCorrect="off" />
        </Form.Item>

        <Form.Item label="Password" name="password">
          <Input.Password autoComplete="off" autoCorrect="off" />
        </Form.Item>

        <Button
          style={{ padding: "0", margin: "0 0 12px 0" }}
          type="link"
          htmlType="button"
        >
          Forgot your password?
        </Button>

        <Button
          loading={props.states.login.loading}
          block
          type="primary"
          htmlType="submit"
        >
          Log In
        </Button>

        <Divider style={{ margin: "32px 0" }}> OR </Divider>
        <div>
          <Link to="/sign_up">
            <Button
              style={{ padding: "0", margin: "0 0 12px 0" }}
              type="link"
              htmlType="button"
              block
            >
              Don't have an account? Create one
            </Button>
          </Link>
        </div>
        <Row justify="center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              onGoogleLogin(credentialResponse.credential || "");
            }}
            onError={() => {
              console.log("Login Failed");
            }}
          />
        </Row>
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

  return component;
};

export default memo(LogIn);
