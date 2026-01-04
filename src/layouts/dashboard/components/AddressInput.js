import Card from "@mui/material/Card";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDInput from "components/MDInput";
import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { getAddress } from "../data/user";
import PropTypes from "prop-types";
import "./list.css";

function AddressInput({ type, label, data, returnaddresstype, disabled }, ref) {
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  let columnCode, columnName;

  switch (type) {
    case "region":
      columnCode = "regCode";
      columnName = "regDesc";
      break;
    case "province":
      columnCode = "provCode";
      columnName = "provDesc";
      break;
    case "city":
      columnCode = "citymunCode";
      columnName = "citymunDesc";
      break;
    case "barangay":
      columnCode = "brgyCode";
      columnName = "brgyDesc";
      break;
    case "":
      columnCode = "";
      columnName = "";
      break;
  }
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    focusInput() {
      inputRef.current.focus();
    },
    getValue() {
      if (!input) {
        setError(true);
      } else {
        setError(false);
      }
      return input;
    },
    clearInput() {
      setInput("");
    },
  }));

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    if (value && data != null) {
      const filtered = data.filter((item) => {
        return item[columnName].toLowerCase().includes(value.toLowerCase());
      });
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion[columnName]);
    setFilteredSuggestions([]);
    if (returnaddresstype) {
      returnaddresstype(type, suggestion[columnCode]);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <MDInput
        value={input}
        variant="outlined"
        label={label}
        onChange={handleInputChange}
        ref={inputRef}
        error={error}
        disabled={disabled}
      />

      {filteredSuggestions.length > 0 && (
        <Card
          style={{
            position: "absolute",
            top:
              inputRef.current?.offsetTop + inputRef.current?.offsetHeight + 5, // Position below the input
            left: inputRef.current?.offsetLeft,
            width: inputRef.current?.offsetWidth + 100, // Same width as the input field
            maxHeight: 200,
            overflow: "auto",
            zIndex: 1000,
          }}
        >
          <ul style={{ margin: 0, padding: 0 }}>
            {filteredSuggestions.map((suggestion) => (
              <li
                key={suggestion[columnCode]}
                className="recommendation-list"
                style={{
                  fontSize: 14,
                  paddingLeft: 10,
                  paddingTop: 10,
                  paddingBottom: 10,
                  cursor: "pointer",
                }}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion[columnName]}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

// AddressInput.propTypes = {
//   type: PropTypes.string.isRequired,
//   label: PropTypes.string.isRequired,
//   data: PropTypes.object.isRequired,
//   returnaddresstype: PropTypes.func,
// };

export default forwardRef(AddressInput);
