import React, { cloneElement } from "react";
import { Col, Layout, Row } from "antd";
import { Link } from "react-router-dom";
import _ from "lodash";
import "./index.css";

const { Header, Content, Footer } = Layout;

const NonAuth: React.FC<any> = (props) => {
  return (
    <Layout className="layout">
      <Header>
        <Row
          justify="space-between"
          align="middle"
          style={{ width: "100%", height: "64px" }}
        >
          <Col sm={4} style={{ height: "inherit" }}>
            <Link to="/">
              <img
                style={{ width: "64px", height: "64px", padding: "5px" }}
                src="/logo512.png"
                alt="logo"
              />
            </Link>
          </Col>
        </Row>

        {/*  */}
      </Header>
      <Content className="non_auth_content">
        <div className="site-layout-content">
          {cloneElement(props.children, { ..._.omit(props, "children") })}
        </div>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        Ant Design ©2023 Created by Ant UED
      </Footer>
    </Layout>
  );
};

export default NonAuth;
