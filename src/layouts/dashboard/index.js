import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import Card from "@mui/material/Card";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
// import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import { getData, getAsfLocations, getRedTideLocations } from "./data/user";
import MDButton from "components/MDButton";
import { Icon, Typography } from "@mui/material";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { supabaseClient } from "./data/supabaseclient";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

// Leaflet / react-leaflet (v4)
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ---------------- Leaflet helpers ----------------

// Fix Leaflet's default icon paths (needed in many bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Helper to imperatively control map from React state
const MapController = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
};

// Rough bounding box of the Philippines
const PHILIPPINES_BOUNDS = [
  [4.2158, 116.1473], // SW
  [21.3218, 126.8073], // NE
];

function Dashboard() {
  const supabase = supabaseClient;

  const [getUser, setGetUser] = useState(null);
  const [asfLocations, setAsfLocations] = useState([]);
  const [redTideLocations, setRedTideLocations] = useState([]);

  // Map & selection state
  const [mapCenter, setMapCenter] = useState([12.8797, 121.774]); // Center of PH
  const [mapZoom, setMapZoom] = useState(5);
  const [mapSearch, setMapSearch] = useState("");

  const [selectedCoords, setSelectedCoords] = useState(null); // { lat, lng }
  const [selectedLocationName, setSelectedLocationName] = useState("");
  const [boundingBox, setBoundingBox] = useState([]);

  const dateNow = format(new Date(), "MMMM dd yyyy");

  // -------------- Supabase: Delete location --------------
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
          const { error } = await supabase
            .from(table)
            .delete()
            .eq("id", id)
            .select();

          if (error) {
            console.error(error);
            return toast.error("An error occured, please try again!");
          }

          if (table === "asf") {
            setAsfLocations((prev) => prev.filter((item) => item.id !== id));
          } else if (table === "redTide") {
            setRedTideLocations((prev) =>
              prev.filter((item) => item.id !== id)
            );
          }

          toast.success("Location removed!");
        }
      });
  };

  // -------------- Add location using map selection --------------
  const addLocation = async (e) => {
    const type = e.currentTarget.value; // "asf" or "redTide"

    if (!selectedCoords) {
      toast.error("Please select a location on the map first.");
      return;
    }

    const { lat, lng } = selectedCoords;
    const label =
      selectedLocationName ||
      `Selected location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;

    const tableName = type === "asf" ? "asf" : "redTide";

    try {
      // Store label including coordinates in the 'location' field
      const locationValue = `${label} [${lat.toFixed(5)}, ${lng.toFixed(5)}]`;

      const { data, error } = await supabase
        .from(tableName)
        .insert([
          {
            location: label,
            coordinates: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            bounding_box: JSON.stringify(boundingBox),
          },
        ])
        .select();

      if (error) {
        console.error(error);
        toast.error("An error occured, please try again!");
        return;
      }

      if (type === "asf") {
        setAsfLocations((prev) => [...prev, ...data]);
        toast.success("ASF location added!");
      } else {
        setRedTideLocations((prev) => [...prev, ...data]);
        toast.success("Red Tide location added!");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occured, please try again!");
    }
  };

  // -------------- Map search (PH-only) --------------
  const handleMapSearch = async (e) => {
    e.preventDefault();
    const query = mapSearch.trim();

    if (!query) {
      toast.error("Please enter a location.");
      return;
    }

    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: query,
            format: "json",
            addressdetails: 1,
            limit: 1,
          },
          headers: {
            "Accept-Language": "en",
            "User-Agent": "PH-Map-Dashboard/1.0",
          },
        }
      );

      const data = response.data;

      if (!data || data.length === 0) {
        toast.error("Location is not in the Philippines.");
        return;
      }

      const result = data[0];
      const { lat, lon, display_name, address, boundingbox } = result;
      const countryCode = address?.country_code;

      // Enforce PH only
      if (countryCode !== "ph") {
        toast.error("Location is not in the Philippines.");
        return;
      }

      if (!boundingbox) {
        toast.error("Please select specific location.");
        return;
      }

      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      const newCenter = [latNum, lonNum];

      setMapCenter(newCenter);
      setMapZoom(13);
      setSelectedCoords({ lat: latNum, lng: lonNum });
      setSelectedLocationName(display_name);
      setBoundingBox(boundingbox);
    } catch (error) {
      toast.error("Something went wrong while searching. Please try again.");
    }
  };

  // -------------- Marker drag handler --------------
  const handleMarkerDragEnd = (event) => {
    const marker = event.target;
    const position = marker.getLatLng();
    const lat = position.lat;
    const lng = position.lng;

    setSelectedCoords({ lat, lng });
    setMapCenter([lat, lng]);
    setSelectedLocationName(
      `Custom marker at (${lat.toFixed(5)}, ${lng.toFixed(5)})`
    );
  };

  // -------------- Initial data fetch --------------
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await getData();
        const asfLocs = await getAsfLocations();
        const redLocs = await getRedTideLocations();

        if (!isMounted) return;

        setGetUser(response || []);
        setAsfLocations(asfLocs || []);
        setRedTideLocations(redLocs || []);
      } catch (error) {
        console.log(error);
        toast.error("Failed to load data.");
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

      {/* Total users */}
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

      {/* Map search + map */}
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card
              sx={{
                padding: 2,
              }}
            >
              <MDBox
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 2,
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Typography fontWeight="bold">
                  Map Search (Philippines Only)
                </Typography>
                <form
                  onSubmit={handleMapSearch}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <input
                    type="text"
                    value={mapSearch}
                    onChange={(e) => setMapSearch(e.target.value)}
                    placeholder="Search a location in the Philippines..."
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: 4,
                      padding: "6px 8px",
                      minWidth: 260,
                      fontSize: 14,
                    }}
                  />
                  <MDButton
                    variant="contained"
                    color="info"
                    type="submit"
                    sx={{ minWidth: 90 }}
                  >
                    <Icon sx={{ mr: 0.5 }}>search</Icon>
                    Search
                  </MDButton>
                </form>
              </MDBox>

              <MDBox
                sx={{
                  height: "400px",
                  width: "100%",
                  borderRadius: 2,
                  overflow: "hidden",
                  marginBottom: 2,
                }}
              >
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: "100%", width: "100%" }}
                  maxBounds={PHILIPPINES_BOUNDS}
                  maxBoundsViscosity={0.9}
                  scrollWheelZoom={true}
                >
                  <MapController center={mapCenter} zoom={mapZoom} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {selectedCoords && (
                    <Marker
                      position={[selectedCoords.lat, selectedCoords.lng]}
                      draggable={true}
                      eventHandlers={{
                        dragend: handleMarkerDragEnd,
                      }}
                    >
                      <Popup>
                        {selectedLocationName || "Selected location"}
                        <br />
                        Lat: {selectedCoords.lat.toFixed(5)}, Lng:{" "}
                        {selectedCoords.lng.toFixed(5)}
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </MDBox>

              <MDBox
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <Typography fontSize={14}>
                  <b>Selected location:</b>{" "}
                  {selectedLocationName || "None selected yet"}
                </Typography>
                <Typography fontSize={14}>
                  <b>Coordinates:</b>{" "}
                  {selectedCoords
                    ? `${selectedCoords.lat.toFixed(
                        5
                      )}, ${selectedCoords.lng.toFixed(5)}`
                    : "N/A"}
                </Typography>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* Add Location (uses selected map point) */}
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card
              sx={{
                paddingTop: 3,
                paddingRight: 5,
                paddingLeft: 5,
                paddingBottom: 3,
              }}
            >
              <Typography mb={1} fontWeight={"bold"}>
                Add Location from Map
              </Typography>
              <Typography mb={2} fontSize={12} color="text.secondary">
                Use the map above to search for a place in the Philippines or
                drag the marker. Then select whether it is a location for ASF or
                Red Tide.
              </Typography>

              <MDBox
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                  marginBottom: 2,
                }}
              >
                <Typography fontSize={14}>
                  <b>Selected location:</b>{" "}
                  {selectedLocationName || "None selected yet"}
                </Typography>
                <Typography fontSize={14}>
                  <b>Coordinates:</b>{" "}
                  {selectedCoords
                    ? `${selectedCoords.lat.toFixed(
                        5
                      )}, ${selectedCoords.lng.toFixed(5)}`
                    : "N/A"}
                </Typography>
              </MDBox>

              <MDBox
                mt={2}
                sx={{
                  display: "flex",
                  justifyContent: "end",
                  borderTop: "1px solid #D3D3D3",
                  gap: 3,
                  paddingTop: 2,
                }}
              >
                <MDButton
                  variant="contained"
                  color="success"
                  onClick={addLocation}
                  value="asf"
                >
                  <Icon sx={{ marginRight: 0.5 }}>savings</Icon>
                  Add Location for ASF
                </MDButton>
                <MDButton
                  variant="contained"
                  color="error"
                  onClick={addLocation}
                  value="redTide"
                >
                  <Icon sx={{ marginRight: 0.5 }}>tsunami</Icon>
                  Add Location for Red Tide
                </MDButton>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>

      {/* ASF / Red Tide Lists */}
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
                    Locations with African Swine Fever as of <b>{dateNow}</b>
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
                  {asfLocations.map((element) => (
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
                    Locations with Red Tide as of <b>{dateNow}</b>
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
                  {redTideLocations.map((element) => (
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
                        value="redTide"
                        onClick={(e) => deleteData(e, "redTide", element.id)}
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
