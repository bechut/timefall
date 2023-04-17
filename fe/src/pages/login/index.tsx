import { Button, Form, Input, Typography, Divider, notification } from "antd";
import React, { FC, memo, useState } from "react";
import "./index.css";
import { reduxConfig, store } from "services/redux";
import { helpers } from "helpers";
import { Props } from "routers";
import { Link } from "react-router-dom";
import { phases, onVerify, onResend } from "pages/sign_up";
import OtpInput from "components/OtpInput";
import { ReduxDispatchHelper, TRDHResponse } from "helpers/reduxDispatch";

type TPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
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

export default memo(SignUp);
