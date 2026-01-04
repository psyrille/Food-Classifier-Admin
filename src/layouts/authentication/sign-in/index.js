/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState } from "react";

// react-router-dom components
import { Link } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Grid from "@mui/material/Grid";
import MuiLink from "@mui/material/Link";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

// Authentication layout components
import BasicLayout from "layouts/authentication/components/BasicLayout";

// Images
import bgImage from "assets/images/bg-sign-in-basic.jpeg";
import { Box, Typography } from "@mui/material";
import { supabaseClient } from "layouts/dashboard/data/supabaseclient";
import toast, { Toaster } from "react-hot-toast";
import data from "layouts/tables/data/authorsTableData";

function Basic() {
  const supabase = supabaseClient;
  const [rememberMe, setRememberMe] = useState(false);

  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = async () => {
    try {
      // 1. Sign in user
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (authError) {
        toast.error("Login failed: " + authError.message);
        return;
      }

      const user = authData.user;

      console.log(user.id);
      // 2. Get the user profile from your "profile" table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id) // match by user uuid
        .single();

      if (profileError || !profileData) {
        toast.error("Profile not found");
        return;
      }

      if (profileData.role !== 0) {
        toast.error("User is not allowed to login");
        // Optionally sign out immediately
        await supabase.auth.signOut();
        return;
      }

      // 4. Success
      toast.success("Login successful!");

      window.location.href = "/dashboard";
    } catch (error) {
      toast.error("Unexpected error: " + error.message);
    }
  };

  return (
    <BasicLayout>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          success: {
            style: {
              background: "#17ea17ca",
              color: "white",
            },
          },
          error: {
            style: {
              background: "tomato",
              color: "white",
            },
          },
        }}
      />
      <Card>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <MDTypography variant="h1" fontWeight="medium" color="black" mt={4}>
            Sign in
          </MDTypography>
        </Box>

        <MDBox pt={4} pb={3} px={3}>
          <MDBox component="form" role="form">
            <MDBox mb={2}>
              <MDInput
                type="email"
                label="Email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </MDBox>
            <MDBox mb={2}>
              <MDInput
                type="password"
                label="Password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </MDBox>
            <MDBox display="flex" alignItems="center" ml={-1}>
              <Switch checked={rememberMe} onChange={handleSetRememberMe} />
              <MDTypography
                variant="button"
                fontWeight="regular"
                color="text"
                onClick={handleSetRememberMe}
                sx={{ cursor: "pointer", userSelect: "none", ml: -1 }}
              >
                &nbsp;&nbsp;Remember me
              </MDTypography>
            </MDBox>
            <MDBox mt={4} mb={1}>
              <MDButton
                variant="gradient"
                color="info"
                fullWidth
                onClick={signIn}
              >
                Sign In
              </MDButton>
            </MDBox>
            <MDBox mt={3} mb={1} textAlign="center"></MDBox>
          </MDBox>
        </MDBox>
      </Card>
    </BasicLayout>
  );
}

export default Basic;
