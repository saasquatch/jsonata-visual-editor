// This file handles the global theme
// Any missing theme components should be added here for the program to detect
import React, { useState, useEffect } from "react";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import { Theme } from "../Theme";
import { MaterialUITheme } from "./MaterialUITheme";
import { DefaultTheme } from "./DefaultTheme";

type Props = {
  currentTheme: Theme;
  setCurrentTheme: (theme: Theme) => void;
};
export const ThemeSwitch = ({ setCurrentTheme }) => {
  const [checked, setChecked] = useState<boolean>(true);

  useEffect(() => {
    checked ? setCurrentTheme(MaterialUITheme) : setCurrentTheme(DefaultTheme);
  }, [checked]);

  return (
    <FormControlLabel
      control={
        <Switch
          checked={checked}
          onChange={() => setChecked(c => !c)}
          value="checked"
        />
      }
      label={checked ? "Material Design" : "Bootstrap 4"}
    />
  );
};
