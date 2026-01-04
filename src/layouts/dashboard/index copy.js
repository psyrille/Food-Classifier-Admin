import { useEffect, useState, useRef } from "react";
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import Card from "@mui/material/Card";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import {
  getData,
  getAddress,
  subscribeToProfiles,
  getAsfLocations,
  getRedTideLocations,
} from "./data/user";
import MDButton from "components/MDButton";
import AddressInput from "./components/AddressInput";
import { Icon, Typography } from "@mui/material";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { createClient } from "@supabase/supabase-js";
import { supabaseClient } from "./data/supabaseclient";
import DefaultProjectCard from "examples/Cards/ProjectCards/DefaultProjectCard";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

function Dashboard() {
  const supabase = supabaseClient;
  const [getUser, setGetUser] = useState(null);
  const [regionData, setRegionData] = useState([]);
  const [provinceData, setProvinceData] = useState([]);
  const [cityData, setCityData] = useState([]);
  const [barangayData, setBarangayData] = useState([]);
  const [asfLocations, setAsfLocations] = useState([]);
  const [redTideLocations, setRedTideLocations] = useState([]);

  const [disabledRegion, setDisabledRegion] = useState(true);
  const [disabledProvince, setDisabledProvince] = useState(true);
  const [disabledCity, setDisabledCity] = useState(true);
  const [disabledBarangay, setDisabledBarangay] = useState(true);

  const [addresType, setAddressType] = useState("");

  const regionRef = useRef("");
  const provinceRef = useRef("");
  const cityRef = useRef("");
  const barangayRef = useRef("");

  const dateNow = format(new Date(), "MMMM dd yyyy");

  const getReturnAddressType = async (type, code) => {
    if (type == "region") {
      const provinceData = await getAddress("province", code, true);
      setProvinceData(provinceData);
      if (provinceData.length > 0) {
        setDisabledProvince(false);
      }
    } else if (type == "province") {
      const cityData = await getAddress("city", code, true);
      setCityData(cityData);
      if (cityData.length > 0) {
        setDisabledCity(false);
      }
    } else if (type == "city") {
      const barangayData = await getAddress("barangay", code, true);
      setBarangayData(barangayData);
      if (barangayData.length > 0) {
        setDisabledBarangay(false);
      }
    }
  };

  const addLocationToDb = async ({
    region,
    province,
    city,
    barangay,
    type,
  }) => {
    let message = type == "asf" ? "ASF" : "Red Tide";
    const location = `${region}  ${barangay}, ${city}, ${province}`;
    withReactContent(Swal)
      .fire({
        text: "",
        html: `
        <h4>ADD ${location}</h4>
        <p style="font-size: 16px; margin-top: 14px;">Location will be added to the list of location that has ${message}.</p>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Add",
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          const queryLocation = `${barangay} ${city.replaceAll(
            " ",
            ""
          )} ${province.replaceAll(" ", "")} Philippines`;
          console.log(encodeURIComponent(queryLocation));
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            queryLocation
          )}&format=json`;

          const response = await fetch(url, {
            headers: {
              "User-Agent": "Food Scanner",
            },
          });

          const data = await response.json();
          console.log("Raw result:", data);

          // const { data, error } = await supabase
          //   .from(type)
          //   .insert({ location: location })
          //   .select();
          // if (error) return toast.error("An error occured, please try again!");
          // if (type == "asf") setAsfLocations((prev) => [...prev, data[0]]);
          // if (type == "redTide")
          //   setRedTideLocations((prev) => [...prev, data[0]]);
          // toast.success("Location added");
          // doneAdd();
        }
      });
  };

  const deleteData = async (e, table, id) => {
    withReactContent(Swal)
      .fire({
        text: "",
        html: `
        <h4>Remove location?</h4>
        <p style="font-size: 16px; margin-top: 14px;">Location will be removed</p>
        `,
        icon: "question",
        showCancelButton: true,
        cancelButtonColor: "#868686ff",
        confirmButtonColor: "#d33",
        confirmButtonText: "Delete",
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          const { data, error } = await supabase
            .from(table)
            .delete()
            .eq("id", id)
            .select();

          if (error) return toast.error("An error occured, please try again!");
          setAsfLocations((prev) => prev.filter((item) => item.id !== id));
          toast.success("Location removed!");
        }
      });
  };

  const doneAdd = async () => {
    await regionRef.current.clearInput();
    await provinceRef.current.clearInput();
    await cityRef.current.clearInput();
    await barangayRef.current.clearInput();
    setDisabledProvince(true);
    setDisabledCity(true);
    setDisabledBarangay(true);
  };

  const addLocation = async (e) => {
    const type = e.target.value;
    const regionValue = await regionRef.current.getValue();
    const provinceValue = await provinceRef.current.getValue();
    const cityValue = await cityRef.current.getValue();
    const barangayValue = await barangayRef.current.getValue();

    if (!regionValue || !provinceValue || !cityValue || !barangayValue) {
      return withReactContent(Swal).fire({
        position: "center",
        icon: "error",
        title: "All fields are required",
        text: "It seems that some fields are empty!",
        showConfirmButton: false,
        timer: 1500,
      });
    }

    addLocationToDb({
      region: regionValue,
      province: provinceValue,
      city: cityValue,
      barangay: barangayValue,
      type: type,
    });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await getData();
        const address = await getAddress("region");
        const asfLocations = await getAsfLocations();
        const redTideLocations = await getRedTideLocations();

        if (!isMounted) return;
        if (!asfLocations)
          return toast.error("An error occured, please try again!");

        setGetUser(response);
        setRegionData(address);
        setAsfLocations(asfLocations);
        setRedTideLocations(redTideLocations);

        if (address.length > 0) {
          setDisabledRegion(false);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardLayout>
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
      {/* <DashboardNavbar /> */}
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12} lg={12}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="dark"
                icon="person"
                title="Total users"
                count={Array.isArray(getUser) ? getUser.length : 0}
              />
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12} lg={12}>
            <MDBox mb={1.5}>
              <Card
                sx={{
                  paddingTop: 3,
                  paddingRight: 5,
                  paddingLeft: 5,
                  paddingBottom: 3,
                }}
              >
                <Typography mb={2} fontWeight={"bold"}>
                  Add Location
                </Typography>
                <MDBox
                  sx={{ display: "flex", justifyContent: "space-between" }}
                >
                  <AddressInput
                    type="region"
                    label="Region"
                    data={regionData}
                    returnaddresstype={getReturnAddressType}
                    ref={regionRef}
                    disabled={disabledRegion}
                  />
                  <AddressInput
                    type="province"
                    label="Province"
                    data={provinceData}
                    returnaddresstype={getReturnAddressType}
                    ref={provinceRef}
                    disabled={disabledProvince}
                  />
                  <AddressInput
                    type="city"
                    label="City/Municipality"
                    data={cityData}
                    returnaddresstype={getReturnAddressType}
                    ref={cityRef}
                    disabled={disabledCity}
                  />
                  <AddressInput
                    type="barangay"
                    label="Barangay"
                    data={barangayData}
                    returnaddresstype={getReturnAddressType}
                    ref={barangayRef}
                    disabled={disabledBarangay}
                  />
                </MDBox>
                <MDBox
                  mt={2}
                  sx={{
                    display: "flex",
                    justifyContent: "end",
                    borderTop: "1px solid #D3D3D3",
                    gap: 3,
                  }}
                >
                  <MDButton
                    variant="contained"
                    color="success"
                    onClick={addLocation}
                    value="asf"
                    sx={{ marginTop: 2 }}
                  >
                    <Icon sx={{ marginRight: 0.5 }}>savings</Icon>
                    Add Location for ASF
                  </MDButton>
                  <MDButton
                    variant="contained"
                    color="error"
                    onClick={addLocation}
                    sx={{ marginTop: 2 }}
                    value="redTide"
                  >
                    <Icon sx={{ marginRight: 0.5 }}>tsunami</Icon>
                    Add Location for Red Tide
                  </MDButton>
                </MDBox>
              </Card>
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={6}>
            <Card
              sx={{
                padding: 0,
              }}
            >
              <MDBox
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  borderBottom: "1px solid #D3D3D3",
                  padding: 2,
                }}
              >
                <MDBox
                  variant="gradient"
                  bgColor="info"
                  borderRadius="xl"
                  display="flex"
                  color="light"
                  justifyContent="center"
                  alignItems="center"
                  width="4rem"
                  height="4rem"
                  mt={-3}
                  sx={{
                    marginTop: 1,
                    color: "white",
                  }}
                >
                  <Icon fontSize="medium" sx={{ color: "white" }}>
                    savings
                  </Icon>
                </MDBox>
                <MDBox>
                  <Typography fontWeight={"bold"}>
                    African Swine Fever
                  </Typography>
                  <Typography fontSize={10}>
                    Locations with African Swine Fever as of <b>{dateNow}</b>{" "}
                  </Typography>
                </MDBox>
              </MDBox>
              <MDBox
                sx={{
                  paddingLeft: 2,
                  paddingTop: 1,
                  height: "25vh",
                  maxHeight: "25vh",
                  overflow: "auto",
                }}
              >
                <ul>
                  {asfLocations.map((element, i) => (
                    <li
                      key={element.id}
                      style={{
                        fontSize: 14,
                        textWrap: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        marginBottom: 12,
                      }}
                    >
                      {element.location}
                      <Icon
                        sx={{ color: "tomato", cursor: "pointer" }}
                        value="asf"
                        onClick={(e) => deleteData(e, "asf", element.id)}
                      >
                        delete
                      </Icon>
                    </li>
                  ))}
                </ul>
              </MDBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={6} lg={6}>
            <Card
              sx={{
                padding: 0,
              }}
            >
              <MDBox
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  borderBottom: "1px solid #D3D3D3",
                  padding: 2,
                }}
              >
                <MDBox
                  variant="gradient"
                  bgColor="error"
                  borderRadius="xl"
                  display="flex"
                  color="light"
                  justifyContent="center"
                  alignItems="center"
                  width="4rem"
                  height="4rem"
                  mt={-3}
                  sx={{
                    marginTop: 1,
                    color: "white",
                  }}
                >
                  <Icon fontSize="medium" sx={{ color: "white" }}>
                    tsunami
                  </Icon>
                </MDBox>
                <MDBox>
                  <Typography fontWeight={"bold"}>Red Tide</Typography>
                  <Typography fontSize={10}>
                    Locations with Red Tide as of <b>{dateNow}</b>{" "}
                  </Typography>
                </MDBox>
              </MDBox>
              <MDBox
                sx={{
                  paddingLeft: 2,
                  paddingTop: 1,
                  height: "25vh",
                  maxHeight: "25vh",
                  overflow: "auto",
                }}
              >
                <ul>
                  {redTideLocations.map((element, i) => (
                    <li
                      key={element.id}
                      style={{
                        fontSize: 14,
                        textWrap: "nowrap",
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        marginBottom: 12,
                      }}
                    >
                      {element.location}
                      <Icon
                        sx={{ color: "tomato", cursor: "pointer" }}
                        value="asf"
                        onClick={(e) => deleteData(e, "asf", element.id)}
                      >
                        delete
                      </Icon>
                    </li>
                  ))}
                </ul>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Dashboard;
