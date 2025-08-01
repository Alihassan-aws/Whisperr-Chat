import React from "react";
import { SettingsPage as SettingsPageComponent } from "@/components/SettingsPage";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

  return <SettingsPageComponent onBack={() => navigate("/")} />;
}
