import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseClient } from "layouts/dashboard/data/supabaseclient";

function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const doLogout = async () => {
      try {
        // 1. Sign out from Supabase (destroys session)
        await supabaseClient.auth.signOut();

        // 2. (Optional) Clear any of your own stored stuff
        // localStorage.removeItem("role");
        // localStorage.removeItem("whatever");

        // 3. Redirect to sign-in
        navigate("/authentication/sign-in", { replace: true });
      } catch (error) {
        console.error("Error during logout:", error);
        navigate("/authentication/sign-in", { replace: true });
      }
    };

    doLogout();
  }, [navigate]);

  // You can return a small loader if you like
  return null;
}

export default Logout;
