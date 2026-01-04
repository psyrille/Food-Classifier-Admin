import React, { useState } from "react";
import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import PropTypes from "prop-types";

const MySelectComponent = ({ data, type, label }) => {
  const [selectedValue, setSelectedValue] = useState("");

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };

  return (
    <FormControl fullWidth variant="outlined">
      <InputLabel>{label}</InputLabel>
      <Select
        value={selectedValue}
        onChange={handleChange}
        label={label}
        sx={{ padding: 1.5 }}
        data={data}
      >
        <MenuItem value="region1">Region 1</MenuItem>
        <MenuItem value="region2">Region 2</MenuItem>
        <MenuItem value="region3">Region 3</MenuItem>
      </Select>
    </FormControl>
  );
};

MySelectComponent.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  type: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

export default MySelectComponent;
