import React, { memo } from "react";
import OtpInput from "react18-input-otp";
import { Typography } from "antd";

function OtpInputComponent(props: any) {
  return (
    <>
      <Typography.Title level={4} style={{ margin: "20px 0" }}>
        One-time Password
      </Typography.Title>
      <OtpInput
        value={props.otp}
        onChange={(e: any) => {
          props.onChange(e);
        }}
        numInputs={6}
        separator={<span> </span>}
        containerStyle={{ justifyContent: "center", margin: "0 0 36px 0", width: "100%" }}
        inputStyle={{
          width: 50,
          height: 50,
          border: "1px solid lightgrey",
          margin: "0 10px",
          backgroundColor: "#f4f0f0",
          // borderBottom: "1px solid",
        }}
      />
    </>
  );
}

export default memo(OtpInputComponent);
