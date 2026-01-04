import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabaseClient } from "./supabaseclient";

const supabase = supabaseClient;

export const getData = async () => {
  try {
    const { data, error } = await supabase.from("profiles").select();
    if (error) {
      return false;
    }
    return data;
  } catch (error) {
    return false;
  }
};

export const getAsfLocations = async () => {
  try {
    const { data, error } = await supabase.from("asf").select();
    if (error) {
      return false;
    }
    return data;
  } catch (error) {
    return false;
  }
};

export const getRedTideLocations = async () => {
  try {
    const { data, error } = await supabase.from("redTide").select();
    if (error) {
      return false;
    }
    return data;
  } catch (error) {
    return false;
  }
};

// export const getRedTideLocations = async () => {
//   try {
//     const { data, error } = await supabase.from("asf").select();
//     if (error) {
//       return false;
//     }
//     return data;
//   } catch (error) {
//     return false;
//   }
// };

export const subscribeToProfiles = (onChange) => {
  const channel = supabase
    .channel("profiles-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "profiles",
      },
      (payload) => {
        onChange(payload);
      }
    )
    .subscribe();

  return channel;
};

export const getAddress = async (type, code = "", withRule = false) => {
  try {
    let columnCode;
    switch (type.toLowerCase().trim()) {
      case "region":
        columnCode = "regCode";
        break;
      case "province":
        columnCode = "regCode";
        break;
      case "city":
        columnCode = "provCode";
        break;
      case "barangay":
        columnCode = "citymunCode";
        break;
    }

    if (withRule) {
      const { data, error } = await supabase
        .from(type)
        .select()
        .eq(columnCode, code);
      return data;
    } else {
      const { data, error } = await supabase.from(type).select();
      return data;
    }
  } catch (error) {
    return false;
  }
};
